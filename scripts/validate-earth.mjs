import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import validator from 'gltf-validator'

const assetDirectory = new URL('../public/media/earth/', import.meta.url)
const sourceRevision = '7b7e533e587d4991c97b63259355d1a5e9141616'
// Verified through GitHub's directory/tree metadata at the pinned revision.
// These protect the original archive, not just the relationship of two local files.
const expectedSourceBlobs = {
  'earth.gltf': 'b6b4f0e0e5800e2e59ffaefca0e9fb31e616f1ce',
  'earth.bin': 'ec3f96c2e3945e55dabfaecf7200423d68d268d4',
  'textures/Scene_-_Root_baseColor.jpeg': '05dede73ba99f70be4ea4b87b22e167b5fbd840a',
  'license.txt': '49bf5fedbee90d87f4012440b4366666f8b80e51',
  'Earth.jsx': 'e2059bf0194ace086e0df3d3f83449b6768efda9',
}
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
// These are the component types present in the pinned Earth export.
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

function jpegDimensions(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'JPEG SOI marker')
  for (let offset = 2; offset < bytes.length;) {
    assert.equal(bytes[offset++], 0xff, 'JPEG segment marker')
    while (bytes[offset] === 0xff) offset++
    const marker = bytes[offset++]
    assert.ok(![0xda, 0xd9].includes(marker), 'JPEG frame header precedes scan data')
    const length = bytes.readUInt16BE(offset)
    assert.ok(length >= 2 && offset + length <= bytes.length, 'Complete JPEG segment')
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) }
    }
    offset += length
  }
  throw new Error('JPEG frame dimensions not found')
}

async function main() {
  const args = process.argv.slice(2)
  assert.ok(args.every(arg => arg === '--write-report'), 'Usage: node scripts/validate-earth.mjs [--write-report]')
  const files = [
    'earth.gltf', 'earth.bin', 'textures/Scene_-_Root_baseColor.jpeg', 'license.txt', 'Earth.jsx',
    'earth.glb', 'earth.glb.pack-report.json', 'earth-icon.glb', 'earth-icon.glb.pack-report.json',
    'icon/Scene_-_Root_baseColor.jpeg', 'icon/preparation-report.json',
  ]
  const loaded = await Promise.all(files.map(async file => [file, await readFile(new URL(file, assetDirectory))]))
  const resources = new Map(loaded)
  for (const [file, expected] of Object.entries(expectedSourceBlobs)) {
    assert.equal(gitBlob(resources.get(file)), expected, `${file}: byte-identical pinned source blob`)
  }
  const sourceBytes = resources.get('earth.gltf')
  const sourceBinary = resources.get('earth.bin')
  const sourceImage = resources.get('textures/Scene_-_Root_baseColor.jpeg')
  const convertedBytes = resources.get('earth.glb')
  const source = JSON.parse(sourceBytes.toString('utf8'))
  const converted = unpackGlb(convertedBytes)
  const iconBytes = resources.get('earth-icon.glb')
  const iconImage = resources.get('icon/Scene_-_Root_baseColor.jpeg')
  const icon = unpackGlb(iconBytes)
  const iconPackReport = JSON.parse(resources.get('earth-icon.glb.pack-report.json').toString('utf8'))
  const preparation = JSON.parse(resources.get('icon/preparation-report.json').toString('utf8'))
  const packReport = JSON.parse(resources.get('earth.glb.pack-report.json').toString('utf8'))
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
    uri: 'earth.gltf', format: 'gltf', writeTimestamp: false, maxIssues: 0,
    externalResourceFunction: async uri => {
      const decoded = decodeURIComponent(uri)
      // A fixed local whitelist prevents network access or path traversal.
      assert.ok(['earth.bin', 'textures/Scene_-_Root_baseColor.jpeg'].includes(decoded), `Unexpected external resource: ${uri}`)
      requestedResources.push(decoded)
      return new Uint8Array(resources.get(decoded))
    },
  })
  const convertedValidation = await validator.validateBytes(new Uint8Array(convertedBytes), {
    uri: 'earth.glb', format: 'glb', writeTimestamp: false, maxIssues: 0,
    externalResourceFunction: async uri => { throw new Error(`GLB must be self-contained: ${uri}`) },
  })
  const iconValidation = await validator.validateBytes(new Uint8Array(iconBytes), {
    uri: 'earth-icon.glb', format: 'glb', writeTimestamp: false, maxIssues: 0,
    externalResourceFunction: async uri => { throw new Error(`Icon GLB must be self-contained: ${uri}`) },
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

  const iconExternalUris = uriPaths(icon.document)
  assert.deepEqual(iconExternalUris, [], 'Icon GLB has no URI resource references')
  assert.equal(iconPackReport.source.sha256, sha256(sourceBytes), 'Icon staged JSON is the original JSON')
  assert.equal(iconPackReport.buffer.sha256, sha256(sourceBinary), 'Icon staged geometry is the original geometry')
  assert.equal(iconPackReport.image.sha256, sha256(iconImage), 'Icon pack report identifies the derivative JPEG')
  assert.equal(iconPackReport.output.sha256, sha256(iconBytes))
  assert.equal(iconPackReport.output.bytes, iconBytes.length)
  assert.equal(iconPackReport.packing.compression, 'none')
  assert.equal(iconPackReport.packing.transformsBaked, false)
  assert.equal(iconPackReport.packing.indexConversion, false)
  assert.deepEqual(iconPackReport.sourceMetadata, packReport.sourceMetadata, 'Icon source metadata remains original')
  const expectedIcon = structuredClone(expected)
  expectedIcon.buffers[0].byteLength = imageOffset + iconImage.length
  expectedIcon.bufferViews[imageView].byteLength = iconImage.length
  assert.deepEqual(icon.document, expectedIcon, 'Icon JSON changes only resource embedding lengths, not geometry/materials/transforms')
  assert.ok(icon.binary.subarray(0, sourceBinary.length).equals(sourceBinary), 'All original geometry bytes remain in icon')
  assert.ok(icon.binary.subarray(imageOffset, imageOffset + iconImage.length).equals(iconImage), 'Icon embeds exact prepared JPEG bytes')
  assert.ok(!iconImage.equals(sourceImage), 'Icon JPEG is explicitly a derivative, not the original JPEG')
  assert.equal(icon.binary.length, align4(expectedIcon.buffers[0].byteLength))
  assert.ok(icon.binary.subarray(expectedIcon.buffers[0].byteLength).every(byte => byte === 0), 'Zero icon binary padding')
  const iconDimensions = jpegDimensions(iconImage)
  assert.deepEqual(iconDimensions, { width: 1024, height: 512 })
  assert.equal(preparation.sourceImage.sha256, sha256(sourceImage))
  assert.equal(preparation.image.sha256, sha256(iconImage))
  assert.equal(preparation.output.sha256, sha256(iconBytes))
  assert.equal(preparation.resize.filter, 'LANCZOS')
  assert.equal(preparation.resize.jpegQuality, 90)
  assert.equal(preparation.resize.chromaSubsampling, '4:2:0')
  assert.equal(preparation.preservation.imageBytesIdenticalToOriginal, false)

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
    const packedIcon = decodeAccessor(icon.document, icon.binary, index)
    assert.deepEqual(packed, original, `${semantic}: all decoded values match`)
    assert.deepEqual(packedIcon, original, `${semantic}: all icon decoded values match`)
    accessors[semantic] = { count: original.count, components: original.components, decodedValuesIdentical: true }
    if (semantic === 'POSITION') positions = original.values
  }
  assert.equal(accessors.POSITION.count, 33708)
  assert.equal(accessors.INDICES.count, 190464)
  assert.equal(accessors.NORMAL.count, 33708)
  assert.equal(accessors.TEXCOORD_0.count, 33708)
  assert.equal(source.nodes.find(node => node.name === 'Object_4')?.mesh, 0)
  assert.equal(source.materials[primitive.material].name, 'Scene_-_Root')
  const textureDimensions = jpegDimensions(sourceImage)
  assert.deepEqual(textureDimensions, { width: 8192, height: 4096 })
  const bounds = positionBounds(positions)
  assert.deepEqual(bounds, { min: source.accessors[primitive.attributes.POSITION].min, max: source.accessors[primitive.attributes.POSITION].max })
  const originalPayloadBytes = sourceBytes.length + sourceBinary.length + sourceImage.length
  const report = {
    artifactStatus: 'final-local-packer',
    sourceRevision,
    sourceRepository: 'https://github.com/interfacethegreatest/Calendar4',
    originalSourceBlobsVerified: true,
    validatorVersion: validator.version(),
    files: Object.fromEntries(loaded.map(([file, bytes]) => [file, { bytes: bytes.length, sha256: sha256(bytes), gitBlob: gitBlob(bytes) }])),
    conversion: {
      tool: 'scripts/pack-moon-glb.mjs (existing locally implemented generic single-BIN/JPEG packer, reused unchanged for Earth)',
      originalPayloadBytes,
      glbBytes: convertedBytes.length,
      byteDifference: convertedBytes.length - originalPayloadBytes,
      compression: 'none; JSON minification and binary embedding only',
      externalUris,
      geometryBytesIdentical: true,
      imageBytesIdentical: true,
      jsonIdenticalExceptResourceEmbedding: true,
      imageMimeType: converted.document.images[0].mimeType,
      textureDimensions,
      textureRgba8BaseLevelBytes: textureDimensions.width * textureDimensions.height * 4,
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
      wrapperReference: {
        file: 'Earth.jsx',
        node: 'Object_4',
        material: 'Scene_-_Root',
        meshScale: 2.8,
        explicitMeshRotation: null,
        ancestorTransformsBaked: false,
        note: 'The archived wrapper directly uses node geometry; it does not mount the full glTF ancestor hierarchy or apply the Moon rotation.',
      },
    },
    original: { requestedLocalResources: [...new Set(requestedResources)].sort(), validation: originalValidation },
    converted: { validation: convertedValidation },
    icon: {
      intendedUse: 'Small Earth UI marks; the full original-quality GLB remains archived separately',
      glbBytes: iconBytes.length,
      glbSha256: sha256(iconBytes),
      geometryBytesIdentical: true,
      decodedGeometryValuesIdentical: true,
      jsonIdenticalExceptResourceEmbedding: true,
      imageBytesIdenticalToOriginal: false,
      imageBytesIdenticalToPreparedDerivative: true,
      imageSha256: sha256(iconImage),
      imageBytes: iconImage.length,
      textureDimensions: iconDimensions,
      textureRgba8BaseLevelBytes: iconDimensions.width * iconDimensions.height * 4,
      externalUris: iconExternalUris,
      preparation,
      validation: iconValidation,
    },
  }
  if (args.includes('--write-report')) {
    await writeFile(new URL('../docs/earth-glb-validation.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify({
    validatorVersion: report.validatorVersion,
    originalIssues: originalValidation.issues,
    convertedIssues: convertedValidation.issues,
    iconIssues: iconValidation.issues,
    glbBytes: convertedBytes.length,
    iconGlbBytes: iconBytes.length,
    externalUris,
    vertexCount: report.geometry.vertexCount,
    indexCount: report.geometry.indexCount,
    triangleCount: report.geometry.triangleCount,
    reportWritten: args.includes('--write-report'),
  }, null, 2))
  if (originalValidation.issues.numErrors || convertedValidation.issues.numErrors || iconValidation.issues.numErrors) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
