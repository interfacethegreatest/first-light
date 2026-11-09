import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, readFile, realpath, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Locally implemented from the user's pasted adaptation brief. The requested
// attachment/package was unavailable; this is not represented as supplied code.
const TOOL_ORIGIN = "Locally implemented from the user's pasted brief; no supplied adaptation-package scripts were available."
const align4 = value => Math.ceil(value / 4) * 4
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const gitBlob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
const identity = bytes => ({ bytes: bytes.length, sha256: sha256(bytes), gitBlob: gitBlob(bytes) })

function resourceUriPaths(value, path = '$', result = []) {
  if (!value || typeof value !== 'object') return result
  for (const [key, child] of Object.entries(value)) {
    if (key === 'uri') result.push(`${path}.${key}`)
    resourceUriPaths(child, `${path}.${key}`, result)
  }
  return result
}

function rejectExtensions(value) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (key === 'extensions' || key === 'extensionsUsed' || key === 'extensionsRequired') {
      assert.ok(child && typeof child === 'object' && Object.keys(child).length === 0,
        'Extensions are unsupported; do not pack compressed or extension-based resources')
    }
    rejectExtensions(child)
  }
}

async function readLocalResource(directory, uri) {
  assert.equal(typeof uri, 'string', 'Resources require a local URI')
  const decoded = decodeURIComponent(uri)
  assert.ok(decoded && !isAbsolute(decoded) && !/[\\\0?#]/.test(decoded)
    && !/^[a-z][a-z\d+.-]*:/i.test(decoded) && !decoded.split('/').includes('..'),
  `Only local resource paths without traversal are supported: ${uri}`)
  const path = await realpath(resolve(directory, decoded))
  const pathFromRoot = relative(directory, path)
  assert.ok(pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot),
    `Resource symlink escapes the input directory: ${uri}`)
  assert.ok((await stat(path)).isFile(), `Resource is not a file: ${uri}`)
  return { path, bytes: await readFile(path), uri }
}

async function protectOriginals(target, sourcePaths) {
  const targetInfo = await lstat(target).catch(error => {
    if (error.code === 'ENOENT') return undefined
    throw error
  })
  assert.ok(!targetInfo?.isSymbolicLink(), 'Output must not be a symlink')
  assert.ok(!targetInfo || targetInfo.isFile(), 'Output must be a regular file')
  assert.ok(!targetInfo || targetInfo.nlink === 1, 'Output must not be hard-linked')
  for (const path of sourcePaths) {
    assert.notEqual(resolve(target), resolve(path), 'Output must not overwrite original resources')
    if (targetInfo) {
      const sourceInfo = await stat(path)
      assert.ok(targetInfo.dev !== sourceInfo.dev || targetInfo.ino !== sourceInfo.ino,
        'Output must not overwrite a hard-linked original resource')
    }
  }
}

/** Pack the supported single external BIN + JPEG layout without optimization. */
export async function packMoonGlb(input, output) {
  const sourcePath = await realpath(resolve(input))
  const outputPath = resolve(output)
  const reportPath = `${outputPath}.pack-report.json`
  assert.equal(extname(sourcePath).toLowerCase(), '.gltf', 'Input must be JSON .gltf, not GLB')
  assert.equal(extname(outputPath).toLowerCase(), '.glb', 'Output must have a .glb extension')
  const sourceBytes = await readFile(sourcePath)
  const source = JSON.parse(sourceBytes.toString('utf8'))
  assert.equal(source.asset?.version, '2.0', 'Only glTF 2.0 is supported')
  assert.ok(source.asset.minVersion === undefined || source.asset.minVersion === '2.0', 'Unsupported minimum glTF version')
  rejectExtensions(source)
  assert.ok(Array.isArray(source.buffers) && source.buffers.length === 1, 'Exactly one source buffer is supported')
  assert.ok(Array.isArray(source.images) && source.images.length === 1, 'Exactly one external JPEG image is supported')
  assert.ok(Array.isArray(source.bufferViews), 'Source bufferViews are required')
  assert.equal(source.images[0].bufferView, undefined, 'Already embedded images are unsupported')
  assert.ok(source.images[0].mimeType === undefined || source.images[0].mimeType === 'image/jpeg', 'Only JPEG MIME type is supported')
  assert.deepEqual(resourceUriPaths(source).sort(), ['$.buffers.0.uri', '$.images.0.uri'],
    'Only the buffer and image may have resource URIs')

  const directory = dirname(sourcePath)
  const [geometry, image] = await Promise.all([
    readLocalResource(directory, source.buffers[0].uri),
    readLocalResource(directory, source.images[0].uri),
  ])
  assert.equal(extname(geometry.path).toLowerCase(), '.bin', 'Only an external .bin buffer is supported')
  assert.ok(['.jpg', '.jpeg'].includes(extname(image.path).toLowerCase()), 'Only external JPEG images are supported')
  assert.ok(Number.isSafeInteger(source.buffers[0].byteLength) && source.buffers[0].byteLength > 0,
    'Source buffer byteLength must be a positive integer')
  assert.equal(geometry.bytes.length, source.buffers[0].byteLength, 'Source buffer length differs from declared byteLength')
  assert.ok(image.bytes.length >= 4 && image.bytes[0] === 0xff && image.bytes[1] === 0xd8 && image.bytes[2] === 0xff
    && image.bytes.at(-2) === 0xff && image.bytes.at(-1) === 0xd9, 'Image does not have the supported JPEG signature')
  for (const view of source.bufferViews) {
    const offset = view.byteOffset ?? 0
    assert.equal(view.buffer, 0, 'Every bufferView must reference the sole source buffer')
    assert.ok(Number.isSafeInteger(offset) && offset >= 0 && Number.isSafeInteger(view.byteLength) && view.byteLength > 0
      && offset + view.byteLength <= geometry.bytes.length, 'Source bufferView is outside its buffer')
  }
  await protectOriginals(outputPath, [sourcePath, geometry.path, image.path])
  await protectOriginals(reportPath, [sourcePath, geometry.path, image.path])

  const document = structuredClone(source)
  const imageOffset = align4(geometry.bytes.length)
  const bufferLength = imageOffset + image.bytes.length
  const binaryChunk = Buffer.alloc(align4(bufferLength))
  geometry.bytes.copy(binaryChunk)
  image.bytes.copy(binaryChunk, imageOffset)
  document.buffers[0].byteLength = bufferLength
  delete document.buffers[0].uri
  const imageView = document.bufferViews.length
  document.bufferViews.push({ buffer: 0, byteOffset: imageOffset, byteLength: image.bytes.length })
  document.images[0].bufferView = imageView
  document.images[0].mimeType = 'image/jpeg'
  delete document.images[0].uri

  const jsonBytes = Buffer.from(JSON.stringify(document), 'utf8')
  const jsonChunk = Buffer.alloc(align4(jsonBytes.length), 0x20)
  jsonBytes.copy(jsonChunk)
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binaryChunk.length
  assert.ok(totalLength <= 0xffffffff, 'GLB is too large for its 32-bit header')
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(totalLength, 8)
  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(jsonChunk.length, 0)
  jsonHeader.writeUInt32LE(0x4e4f534a, 4)
  const binaryHeader = Buffer.alloc(8)
  binaryHeader.writeUInt32LE(binaryChunk.length, 0)
  binaryHeader.writeUInt32LE(0x004e4942, 4)
  const glb = Buffer.concat([header, jsonHeader, jsonChunk, binaryHeader, binaryChunk])
  assert.equal(glb.length, totalLength)
  assert.ok(binaryChunk.subarray(0, geometry.bytes.length).equals(geometry.bytes))
  assert.ok(binaryChunk.subarray(imageOffset, imageOffset + image.bytes.length).equals(image.bytes))
  assert.deepEqual(resourceUriPaths(document), [])

  const primitives = (source.meshes ?? []).flatMap(mesh => mesh.primitives ?? [])
  const positions = primitives.map(primitive => source.accessors?.[primitive.attributes?.POSITION])
  const report = {
    schemaVersion: 1,
    tool: { name: 'pack-moon-glb.mjs', origin: TOOL_ORIGIN },
    source: { file: basename(sourcePath), ...identity(sourceBytes) },
    buffer: { uri: geometry.uri, ...identity(geometry.bytes) },
    image: { uri: image.uri, mimeType: 'image/jpeg', ...identity(image.bytes) },
    output: { file: basename(outputPath), ...identity(glb) },
    packing: {
      originalPayloadBytes: sourceBytes.length + geometry.bytes.length + image.bytes.length,
      byteDifference: glb.length - sourceBytes.length - geometry.bytes.length - image.bytes.length,
      compression: 'none',
      imageOffset,
      imageAlignmentPaddingBytes: imageOffset - geometry.bytes.length,
      jsonPaddingBytes: jsonChunk.length - jsonBytes.length,
      binaryPaddingBytes: binaryChunk.length - bufferLength,
      externalUris: [],
      geometryBytesIdentical: true,
      imageBytesIdentical: true,
      transformsBaked: false,
      indexConversion: false,
    },
    geometry: {
      vertexCount: positions.reduce((sum, accessor) => sum + (accessor?.count ?? 0), 0),
      indexCount: primitives.reduce((sum, primitive) => sum + (source.accessors?.[primitive.indices]?.count ?? 0), 0),
      originalPositionAccessors: positions,
    },
    sourceMetadata: {
      asset: source.asset,
      scene: source.scene,
      scenes: source.scenes,
      nodes: source.nodes,
      meshes: source.meshes,
      accessors: source.accessors,
      materials: source.materials,
      samplers: source.samplers,
      textures: source.textures,
    },
  }
  await writeFile(outputPath, glb)
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  return report
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length !== 2) {
    console.error('Usage: node scripts/pack-moon-glb.mjs INPUT.gltf OUTPUT.glb')
    process.exitCode = 1
  } else {
    packMoonGlb(args[0], args[1]).then(report => {
      console.log(JSON.stringify({
        output: report.output.file,
        bytes: report.output.bytes,
        sha256: report.output.sha256,
        packReport: `${report.output.file}.pack-report.json`,
        origin: TOOL_ORIGIN,
      }, null, 2))
    }).catch(error => {
      console.error(error.message)
      process.exitCode = 1
    })
  }
}
