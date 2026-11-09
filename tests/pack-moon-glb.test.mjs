import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { link, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { packMoonGlb } from '../scripts/pack-moon-glb.mjs'

// Synthetic fixture tests establish packing mechanics and failure behavior.
// They are separate from official validation of the real downloaded Moon.
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'first-light-moon-pack-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await mkdir(join(directory, 'textures'))
  const binary = Buffer.alloc(49, 0xab)
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0]
  positions.forEach((value, index) => binary.writeFloatLE(value, index * 4))
  ;[0, 1, 2].forEach((value, index) => binary.writeUInt32LE(value, 36 + index * 4))
  // Deliberately tiny JPEG-signature bytes: tests compare byte preservation,
  // not image decoding or the validity of a synthetic rendered scene.
  const image = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 0xff, 0xd9])
  const source = {
    asset: { version: '2.0', generator: 'synthetic fixture', extras: { author: 'fixture author', license: 'fixture only' } },
    buffers: [{ uri: 'fixture.bin', byteLength: binary.length, name: 'keep buffer name' }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 },
      { buffer: 0, byteOffset: 36, byteLength: 12, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] },
      { bufferView: 1, componentType: 5125, count: 3, type: 'SCALAR' },
    ],
    images: [{ uri: 'textures/test.jpeg', name: 'keep image name', extras: { purpose: 'fixture' } }],
    materials: [{ name: 'Moon fixture', doubleSided: true, pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.85 } }],
    meshes: [{ name: 'keep mesh name', primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0, mode: 4 }] }],
    nodes: [{ mesh: 0, scale: [2.8, 2.8, 2.8], extras: { untouched: true } }],
    scenes: [{ nodes: [0], name: 'keep scene name' }],
    scene: 0,
  }
  const input = join(directory, 'fixture.gltf')
  const output = join(directory, 'fixture.glb')
  const save = () => writeFile(input, JSON.stringify(source, null, 2))
  await Promise.all([save(), writeFile(join(directory, 'fixture.bin'), binary), writeFile(join(directory, 'textures/test.jpeg'), image)])
  return { directory, input, output, binary, image, source, save }
}

function unpack(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67)
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  const jsonLength = bytes.readUInt32LE(12)
  assert.equal(jsonLength % 4, 0)
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a)
  const binHeader = 20 + jsonLength
  const binLength = bytes.readUInt32LE(binHeader)
  assert.equal(binLength % 4, 0)
  assert.equal(bytes.readUInt32LE(binHeader + 4), 0x004e4942)
  assert.equal(binHeader + 8 + binLength, bytes.length)
  return { document: JSON.parse(bytes.subarray(20, binHeader).toString()), binary: bytes.subarray(binHeader + 8), json: bytes.subarray(20, binHeader) }
}

test('self-contained GLB uses aligned headers, unchanged binary/JPEG and correct padding', async t => {
  const f = await fixture(t)
  const original = await readFile(f.input)
  const report = await packMoonGlb(f.input, f.output)
  const bytes = await readFile(f.output)
  const { document, binary, json } = unpack(bytes)
  assert.equal(document.buffers[0].uri, undefined)
  assert.equal(document.images[0].uri, undefined)
  assert.equal(document.images[0].mimeType, 'image/jpeg')
  const imageView = document.bufferViews[document.images[0].bufferView]
  assert.equal(imageView.byteOffset, 52)
  assert.equal(imageView.byteOffset % 4, 0)
  assert.ok(binary.subarray(0, f.binary.length).equals(f.binary))
  assert.deepEqual([...binary.subarray(49, 52)], [0, 0, 0])
  assert.ok(binary.subarray(imageView.byteOffset, imageView.byteOffset + imageView.byteLength).equals(f.image))
  assert.ok(binary.subarray(document.buffers[0].byteLength).every(byte => byte === 0))
  const jsonTextLength = Buffer.byteLength(JSON.stringify(document))
  assert.ok(json.subarray(jsonTextLength).every(byte => byte === 0x20))
  assert.ok((await readFile(f.input)).equals(original))
  assert.equal(report.output.sha256, createHash('sha256').update(bytes).digest('hex'))
  assert.equal(report.packing.originalPayloadBytes, original.length + f.binary.length + f.image.length)
})

test('retains source graph, transforms, materials, names, extras and accessor/index data', async t => {
  const f = await fixture(t)
  await packMoonGlb(f.input, f.output)
  const { document } = unpack(await readFile(f.output))
  for (const key of ['asset', 'nodes', 'scenes', 'scene', 'meshes', 'materials', 'accessors']) {
    assert.deepEqual(document[key], f.source[key])
  }
  assert.deepEqual(document.bufferViews.slice(0, 2), f.source.bufferViews)
  assert.equal(document.buffers[0].name, 'keep buffer name')
  assert.equal(document.images[0].name, 'keep image name')
  assert.deepEqual(document.images[0].extras, { purpose: 'fixture' })
})

test('repeated packing is byte-identical for both GLB and timestamp-free pack report', async t => {
  const f = await fixture(t)
  await packMoonGlb(f.input, f.output)
  const first = await readFile(f.output)
  const firstReport = await readFile(`${f.output}.pack-report.json`)
  await packMoonGlb(f.input, f.output)
  assert.ok((await readFile(f.output)).equals(first))
  assert.ok((await readFile(`${f.output}.pack-report.json`)).equals(firstReport))
  const report = JSON.parse(firstReport)
  assert.match(report.tool.origin, /Locally implemented/)
  assert.equal(report.packing.compression, 'none')
  assert.equal(report.packing.transformsBaked, false)
  assert.equal(report.packing.indexConversion, false)
  assert.deepEqual(report.geometry.originalPositionAccessors, [f.source.accessors[0]])
})

for (const [name, mutate, message] of [
  ['extensions', source => { source.extensionsUsed = ['KHR_draco_mesh_compression'] }, /Extensions/],
  ['nested extensions', source => { source.meshes[0].primitives[0].extensions = { KHR_draco_mesh_compression: {} } }, /Extensions/],
  ['multiple buffers', source => { source.buffers.push({ uri: 'second.bin', byteLength: 4 }) }, /Exactly one source buffer/],
  ['multiple images', source => { source.images.push({ uri: 'textures/second.jpeg' }) }, /Exactly one external JPEG/],
  ['wrong buffer length', source => { source.buffers[0].byteLength++ }, /buffer length differs/],
  ['bufferView outside binary', source => { source.bufferViews[0].byteLength = 999 }, /outside its buffer/],
  ['bufferView references another buffer', source => { source.bufferViews[0].buffer = 1 }, /sole source buffer/],
  ['unsupported glTF version', source => { source.asset.version = '1.0' }, /Only glTF 2.0/],
  ['unsupported minimum version', source => { source.asset.minVersion = '2.1' }, /Unsupported minimum glTF version/],
  ['already embedded image', source => { source.images[0].bufferView = 0 }, /Already embedded/],
  ['PNG MIME type', source => { source.images[0].mimeType = 'image/png' }, /Only JPEG MIME/],
  ['additional URI resource', source => { source.extras = { uri: 'https://example.test/other' } }, /Only the buffer and image/],
]) {
  test(`rejects ${name} without overwriting an existing output`, async t => {
    const f = await fixture(t)
    mutate(f.source)
    await f.save()
    await writeFile(f.output, 'unchanged sentinel')
    await assert.rejects(packMoonGlb(f.input, f.output), message)
    assert.equal((await readFile(f.output)).toString(), 'unchanged sentinel')
  })
}

for (const uri of ['../outside.bin', '%2e%2e/outside.bin', '/tmp/outside.bin', 'https://example.test/model.bin', 'data:application/octet-stream;base64,AAAA', '..\\outside.bin']) {
  test(`rejects nonlocal or escaping URI ${JSON.stringify(uri)}`, async t => {
    const f = await fixture(t)
    f.source.buffers[0].uri = uri
    await f.save()
    await assert.rejects(packMoonGlb(f.input, f.output), /local resource paths without traversal/)
  })
}

test('rejects a resource symlink escaping its source directory', async t => {
  const f = await fixture(t)
  const outside = await mkdtemp(join(tmpdir(), 'first-light-moon-outside-'))
  t.after(() => rm(outside, { recursive: true, force: true }))
  await writeFile(join(outside, 'foreign.bin'), f.binary)
  await symlink(join(outside, 'foreign.bin'), join(f.directory, 'escape.bin'))
  f.source.buffers[0].uri = 'escape.bin'
  await f.save()
  await assert.rejects(packMoonGlb(f.input, f.output), /symlink escapes/)
})

test('rejects an output symlink rather than overwriting its target', async t => {
  const f = await fixture(t)
  await symlink(join(f.directory, 'fixture.bin'), f.output)
  await assert.rejects(packMoonGlb(f.input, f.output), /Output must not be a symlink/)
  assert.ok((await readFile(join(f.directory, 'fixture.bin'))).equals(f.binary))
})

test('rejects a non-JPEG payload without rewriting it', async t => {
  const f = await fixture(t)
  await writeFile(join(f.directory, 'textures/test.jpeg'), 'not a JPEG')
  await assert.rejects(packMoonGlb(f.input, f.output), /JPEG signature/)
})

test('rejects an output hard link rather than changing an original resource', async t => {
  const f = await fixture(t)
  await link(join(f.directory, 'fixture.bin'), f.output)
  await assert.rejects(packMoonGlb(f.input, f.output), /hard-linked/)
  assert.ok((await readFile(join(f.directory, 'fixture.bin'))).equals(f.binary))
})

test('CLI requires explicit input/output and reports a usage failure', () => {
  const result = spawnSync(process.execPath, ['scripts/pack-moon-glb.mjs'], { cwd: new URL('../', import.meta.url), encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Usage:/)
})
