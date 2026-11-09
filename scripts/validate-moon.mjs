import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import validator from 'gltf-validator'

const assetDirectory = new URL('../public/media/moon/', import.meta.url)
const sourceRevision = '7b7e533e587d4991c97b63259355d1a5e9141616'
const align4 = value => Math.ceil(value / 4) * 4
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const gitBlob = bytes => createHash('sha1')
  .update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex')

function unpackGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'GLB magic')
  assert.equal(bytes.readUInt32LE(4), 2, 'GLB version')
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'GLB total length')
  const chunks = []
  for (let offset = 12; offset < bytes.length;) {
    assert.ok(offset + 8 <= bytes.length, 'Complete chunk header')
    const length = bytes.readUInt32LE(offset)
    assert.equal(length % 4, 0, 'Four-byte chunk alignment')
    assert.ok(offset + 8 + length <= bytes.length, 'Complete chunk payload')
    chunks.push({ type: bytes.readUInt32LE(offset + 4), bytes: bytes.subarray(offset + 8, offset + 8 + length) })
    offset += 8 + length
  }
  assert.equal(chunks.length, 2)
  assert.equal(chunks[0].type, 0x4e4f534a)
  assert.equal(chunks[1].type, 0x004e4942)
  return { document: JSON.parse(chunks[0].bytes.toString('utf8')), binary: chunks[1].bytes }
}

function uriPaths(value, path = '$', found = []) {
  if (!value || typeof value !== 'object') return found
  for (const [key, child] of Object.entries(value)) {
    if (key === 'uri') found.push(`${path}.${key}`)
    uriPaths(child, `${path}.${key}`, found)
  }
  return found
}

// Decode the real accessor stream, respecting accessor/view offsets and stride.
// These are the component types present in the pinned Moon export.
function decodeAccessor(document, binary, index) {
  const accessor = document.accessors[index]
  assert.ok(!accessor.sparse, 'Sparse accessor conversion was not requested')
  const view = document.bufferViews[accessor.bufferView]
  assert.equal(view.buffer, 0)
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type]
  assert.ok(components, `Supported accessor shape: ${accessor.type}`)
  const byteSize = { 5125: 4, 5126: 4 }[accessor.componentType]
  assert.ok(byteSize, `Supported source component type: ${accessor.componentType}`)
  const stride = view.byteStride ?? components * byteSize
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const values = new Array(accessor.count * components)
  for (let row = 0; row < accessor.count; row++) {
    for (let column = 0; column < components; column++) {
      const offset = start + row * stride + column * byteSize
      values[row * components + column] = accessor.componentType === 5126
        ? binary.readFloatLE(offset)
        : binary.readUInt32LE(offset)
    }
  }
  return { count: accessor.count, components, values }
}

function positionBounds(values) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let offset = 0; offset < values.length; offset += 3) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], values[offset + axis])
      max[axis] = Math.max(max[axis], values[offset + axis])
    }
  }
  return { min, max }
}

async function main() {
  const args = process.argv.slice(2)
  assert.ok(args.every(arg => arg === '--write-report'), 'Usage: node scripts/validate-moon.mjs [--write-report]')
  const files = ['moon.gltf', 'moon.bin', 'textures/Moon_baseColor.jpeg', 'license.txt', 'moon.glb', 'moon.glb.pack-report.json']
  const loaded = await Promise.all(files.map(async file => [file, await readFile(new URL(file, assetDirectory))]))
  const resources = new Map(loaded)
  const sourceBytes = resources.get('moon.gltf')
  const sourceBinary = resources.get('moon.bin')
  const sourceImage = resources.get('textures/Moon_baseColor.jpeg')
  const convertedBytes = resources.get('moon.glb')
  const source = JSON.parse(sourceBytes.toString('utf8'))
  const converted = unpackGlb(convertedBytes)
  const packReport = JSON.parse(resources.get('moon.glb.pack-report.json').toString('utf8'))
  assert.equal(packReport.source.sha256, sha256(sourceBytes), 'Pack report identifies the original JSON')
  assert.equal(packReport.buffer.sha256, sha256(sourceBinary), 'Pack report identifies the original geometry')
  assert.equal(packReport.image.sha256, sha256(sourceImage), 'Pack report identifies the original JPEG')
  assert.equal(packReport.output.sha256, sha256(convertedBytes), 'Pack report identifies the actual GLB')
  assert.equal(packReport.output.bytes, convertedBytes.length)
  assert.equal(packReport.packing.compression, 'none')
  assert.equal(packReport.packing.transformsBaked, false)
  assert.equal(packReport.packing.indexConversion, false)
  assert.deepEqual(packReport.sourceMetadata, Object.fromEntries(
    ['asset', 'scene', 'scenes', 'nodes', 'meshes', 'accessors', 'materials', 'samplers', 'textures']
      .filter(key => source[key] !== undefined).map(key => [key, source[key]]),
  ), 'Pack report preserves source coordinate and material metadata')
  const requestedResources = []
  const originalValidation = await validator.validateBytes(new Uint8Array(sourceBytes), {
    uri: 'moon.gltf', format: 'gltf', writeTimestamp: false, maxIssues: 0,
    externalResourceFunction: async uri => {
      const decoded = decodeURIComponent(uri)
      // A fixed local whitelist prevents network access or path traversal.
      assert.ok(['moon.bin', 'textures/Moon_baseColor.jpeg'].includes(decoded), `Unexpected external resource: ${uri}`)
      requestedResources.push(decoded)
      return new Uint8Array(resources.get(decoded))
    },
  })
  const convertedValidation = await validator.validateBytes(new Uint8Array(convertedBytes), {
    uri: 'moon.glb', format: 'glb', writeTimestamp: false, maxIssues: 0,
    externalResourceFunction: async uri => { throw new Error(`GLB must be self-contained: ${uri}`) },
  })

  const externalUris = uriPaths(converted.document)
  assert.deepEqual(externalUris, [], 'Converted GLB has no URI resource references')
  const imageOffset = align4(sourceBinary.length)
  const expected = structuredClone(source)
  expected.buffers[0].byteLength = imageOffset + sourceImage.length
  delete expected.buffers[0].uri
  const imageView = expected.bufferViews.length
  expected.bufferViews.push({ buffer: 0, byteOffset: imageOffset, byteLength: sourceImage.length })
  expected.images[0].bufferView = imageView
  expected.images[0].mimeType = 'image/jpeg'
  delete expected.images[0].uri
  assert.deepEqual(converted.document, expected, 'JSON differs only in resource embedding')
  assert.ok(converted.binary.subarray(0, sourceBinary.length).equals(sourceBinary), 'All original geometry bytes are preserved')
  const embeddedImage = converted.binary.subarray(imageOffset, imageOffset + sourceImage.length)
  assert.ok(embeddedImage.equals(sourceImage), 'JPEG bytes are unchanged')
  assert.equal(converted.binary.length, align4(expected.buffers[0].byteLength))
  assert.ok(converted.binary.subarray(expected.buffers[0].byteLength).every(byte => byte === 0), 'Zero binary padding')

  assert.equal(source.meshes.length, 1)
  assert.equal(source.meshes[0].primitives.length, 1)
  const primitive = source.meshes[0].primitives[0]
  assert.equal(primitive.mode, 4, 'Triangle primitive mode')
  const accessorIndices = { ...primitive.attributes, INDICES: primitive.indices }
  const accessors = {}
  let positions
  for (const [semantic, index] of Object.entries(accessorIndices)) {
    const original = decodeAccessor(source, sourceBinary, index)
    const packed = decodeAccessor(converted.document, converted.binary, index)
    assert.deepEqual(packed, original, `${semantic}: all decoded values match`)
    accessors[semantic] = { count: original.count, components: original.components, decodedValuesIdentical: true }
    if (semantic === 'POSITION') positions = original.values
  }
  assert.equal(accessors.POSITION.count, 36556)
  assert.equal(accessors.INDICES.count, 205824)
  const bounds = positionBounds(positions)
  assert.deepEqual(bounds, { min: source.accessors[primitive.attributes.POSITION].min, max: source.accessors[primitive.attributes.POSITION].max })
  const originalPayloadBytes = sourceBytes.length + sourceBinary.length + sourceImage.length
  const report = {
    artifactStatus: 'final-local-packer',
    sourceRevision,
    validatorVersion: validator.version(),
    files: Object.fromEntries(loaded.map(([file, bytes]) => [file, { bytes: bytes.length, sha256: sha256(bytes), gitBlob: gitBlob(bytes) }])),
    conversion: {
      tool: 'scripts/pack-moon-glb.mjs (locally implemented from the pasted brief; no supplied adaptation package was available)',
      originalPayloadBytes,
      glbBytes: convertedBytes.length,
      byteDifference: convertedBytes.length - originalPayloadBytes,
      compression: 'none; JSON minification and binary embedding only',
      externalUris,
      geometryBytesIdentical: true,
      imageBytesIdentical: true,
      jsonIdenticalExceptResourceEmbedding: true,
      imageMimeType: converted.document.images[0].mimeType,
    },
    geometry: {
      vertexCount: accessors.POSITION.count,
      indexCount: accessors.INDICES.count,
      triangleCount: accessors.INDICES.count / 3,
      positionBounds: bounds,
      accessors,
      meshNames: source.meshes.map(mesh => mesh.name),
      nodeNames: source.nodes.map(node => node.name),
      material: source.materials[primitive.material],
    },
    original: { requestedLocalResources: [...new Set(requestedResources)].sort(), validation: originalValidation },
    converted: { validation: convertedValidation },
  }
  if (args.includes('--write-report')) {
    await writeFile(new URL('../docs/moon-glb-validation.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify({
    validatorVersion: report.validatorVersion,
    originalIssues: originalValidation.issues,
    convertedIssues: convertedValidation.issues,
    glbBytes: convertedBytes.length,
    externalUris,
    vertexCount: report.geometry.vertexCount,
    indexCount: report.geometry.indexCount,
    triangleCount: report.geometry.triangleCount,
    reportWritten: args.includes('--write-report'),
  }, null, 2))
  if (originalValidation.issues.numErrors || convertedValidation.issues.numErrors) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
