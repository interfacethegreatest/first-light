import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { posix } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const targets = {
  markdown: 'docs/component-catalog.md',
  manifest: 'docs/component-catalog-manifest.json',
  zip: 'docs/component-source.zip',
}
const extraSourceFiles = ['public/media/moon/Moon.jsx', 'examples/glass-panel-3d/main.tsx']
const entryFiles = new Set(['src/main.tsx', 'examples/glass-panel-3d/main.tsx'])
const groups = [
  ['application', 'Application, workspace data and shared styles', ['src/App.', 'src/main.', 'src/index.', 'src/useWorkspace.', 'src/workspace', 'src/styles/']],
  ['header-hero', 'Header, hero and shared tile decoration', ['src/components/header/', 'src/components/hero/', 'src/components/decorations/']],
  ['sources', 'Source sections and reusable cards', ['src/components/sources/', 'src/components/cards/']],
  ['motion', 'Calendar motion and preferences', ['src/components/calendarMotion/']],
  ['moon', 'Moon mark and compatibility scene', ['src/components/misc/MoonMark/', 'src/components/react three fibre/moonScene/', 'public/media/moon/Moon.jsx']],
  ['sun', 'Calendar Sun scene', ['src/components/react three fibre/sunScene/']],
  ['stars', 'Star background', ['src/components/backgrounds/']],
  ['surfaces', 'Shared glass surfaces and panes', ['src/components/glass/', 'src/components/panes/']],
  ['glass-3d', 'Three.js glass panel and example', ['src/components/glass-panel-3d/', 'examples/glass-panel-3d/main.tsx']],
  ['html-glass', 'HTML glass card and scene helpers', ['src/components/html-glass-card/']],
  ['transmission', 'Transmission materials and scene cards', ['src/components/transmission/']],
  ['glass-objects', 'Isolated glass objects and rotation', ['src/components/glass-objects/']],
  ['input', 'Modal input container and outside-click hook', ['src/components/input/']],
  ['typography', '3D typography and footer scene', ['src/components/typography/']],
  ['other', 'Other supporting source', []],
]

function groupFor(path) {
  return groups.find(([, , prefixes]) => prefixes.some(prefix => path.startsWith(prefix))) ?? groups.at(-1)
}

async function sourcePaths(directory = 'src') {
  const entries = await readdir(new URL(`${directory}/`, root), { withFileTypes: true })
  const result = []
  for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const path = `${directory}/${entry.name}`
    assert.ok(!entry.isSymbolicLink(), `Source symlinks require explicit review: ${path}`)
    if (entry.isDirectory()) result.push(...await sourcePaths(path))
    else if (entry.isFile()) result.push(path)
  }
  return result
}

async function captureSource() {
  const selectedPaths = [...await sourcePaths(), ...extraSourceFiles]
  assert.equal(new Set(selectedPaths).size, selectedPaths.length, 'Selected source paths must be unique')
  return Promise.all(selectedPaths.map(async path => {
    const bytes = await readFile(new URL(path, root))
    const decoded = bytes.toString('utf8')
    const encoding = Buffer.from(decoded, 'utf8').equals(bytes) ? 'utf8' : 'base64'
    return { path, bytes, sha256: sha256(bytes), text: encoding === 'utf8' ? decoded : bytes.toString('base64'), encoding }
  }))
}

function literalImports(text) {
  const paths = new Set()
  for (const match of text.matchAll(/^\s*import\s+([^'";]+?)\s+from\s*['"]([^'"]+)['"]/gm)) {
    const head = match[1].trim()
    if (head.startsWith('type ')) continue
    if (head.startsWith('{') && head.endsWith('}') && head.slice(1, -1).split(',').filter(part => part.trim()).every(part => part.trim().startsWith('type '))) continue
    paths.add(match[2])
  }
  for (const pattern of [
    /^\s*import\s*['"]([^'"]+)['"]/gm,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    /^\s*export\s+(?:\*|\{[^}]*\})\s*from\s*['"]([^'"]+)['"]/gm,
  ]) {
    for (const match of text.matchAll(pattern)) paths.add(match[1])
  }
  return [...paths].filter(path => path.startsWith('.'))
}

function inventory(files) {
  const byPath = new Map(files.map(file => [file.path, file]))
  const resolveImport = (from, name) => {
    const base = posix.normalize(posix.join(posix.dirname(from), name))
    return [base, ...['.tsx', '.ts', '.jsx', '.js', '.css', '.json', '.html'].map(ext => base + ext), `${base}/index.tsx`, `${base}/index.ts`]
      .find(path => byPath.has(path))
  }
  const reachable = new Set()
  const visit = path => {
    if (reachable.has(path)) return
    reachable.add(path)
    const file = byPath.get(path)
    if (!file || !/\.[jt]sx?$/.test(path)) return
    for (const name of literalImports(file.text)) {
      const next = resolveImport(path, name)
      if (next) visit(next)
    }
  }
  visit('src/main.tsx')
  const components = [], hooks = [], templates = []
  for (const file of files) {
    const namedExports = [...file.text.matchAll(/^export\s+function\s+([A-Z]\w*)/gm)].map(match => match[1])
    const hookExports = [...file.text.matchAll(/^export\s+(?:default\s+)?function\s+(use[A-Z]\w*)/gm)].map(match => match[1])
    for (const name of hookExports) hooks.push({ name, file: file.path })
    for (const match of file.text.matchAll(/^export\s+const\s+(\w+Template)\s*=/gm)) templates.push({ name: match[1], file: file.path })
    if (!/\.[jt]sx$/.test(file.path) || entryFiles.has(file.path) || hookExports.length || /Template\.tsx$/.test(file.path)) continue
    const alias = /^export\s+\{\s*default\s*\}\s*from\s*['"]([^'"]+)['"]/m.exec(file.text)
    const primary = /export\s+default\s+function\s+(\w+)/.exec(file.text)?.[1]
      ?? /export\s+default\s+memo\(\s*(\w+)/.exec(file.text)?.[1]
      ?? (alias ? `default re-export of ${posix.basename(alias[1])}` : 'see full module')
    components.push({
      module: posix.basename(file.path, posix.extname(file.path)),
      primaryExport: primary,
      namedExports,
      file: file.path,
      category: groupFor(file.path)[1],
      kind: alias ? 'compatibility alias' : 'component-bearing module',
      importedFromMain: reachable.has(file.path),
      usage: reachable.has(file.path)
        ? 'Imported from application entry (including lazy/conditional paths)'
        : file.path.endsWith('/GlassPanelExample.tsx')
          ? 'Optional example; not imported from application entry'
          : 'Standalone/reusable; not imported from application entry',
    })
  }
  return { components, hooks, templates, reachable }
}

function anchor(path) {
  return `file-${path.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sha256(Buffer.from(path)).slice(0, 8)}`
}

function sourcebook(files, items, snapshotHash) {
  const lines = [
    '# First Light: complete local component source snapshot',
    '',
    'This is a **local working-tree snapshot, including uncommitted source**. It is not a deployment record or a claim about the live site.',
    '',
    `Snapshot SHA-256: \`${snapshotHash}\`. All **${files.filter(file => file.path.startsWith('src/')).length} files under src/** plus **${extraSourceFiles.length} explicit compatibility/example entries** are included below in full and in the accompanying ZIP: **${files.length} selected source files**, with no source truncation.`,
    '',
    `Additional files: ${extraSourceFiles.map(path => `\`${path}\``).join(' and ')}. The example entry mounts the optional GlassPanelExample; it is supporting application code, not an additional React component.`,
    '',
    'The inventory lists component-bearing modules, their primary exports and any named component exports reviewed in this source tree. It does not equate every function with a React component. Hooks, template objects, styles, HTML boilerplate, domain logic and application entry files are included separately. Internal components/helpers remain in their complete parent module.',
    '',
    'Application usage is literal relative-import reachability from `src/main.tsx`, including lazy/conditional imports. It describes code connections, not whether a component is mounted at a given moment. A compatibility re-export is identified separately rather than counted as a new implementation. Optional example status is stated only where supported by the source.',
    '',
    'The ZIP contains exact bytes for every `src/...` file and the two explicitly listed source entries. Public model/font binaries, dependencies, tests and repository configuration remain in the project and are outside this source-only delivery. The manifest records every selected source filename, byte count and SHA-256. Code fences add a separator newline only when a source file lacks its final newline; the ZIP preserves that distinction exactly. Non-UTF-8 files, if any, are shown completely as base64 and labeled.',
    '',
    'Regenerate with `node scripts/export-component-catalog.mjs`; verify without writing with `node scripts/export-component-catalog.mjs --verify`.',
    '',
    '<a id="contents"></a>',
    '## Contents',
    '',
    '- [Component module inventory](#component-inventory)',
    '- [Hooks and template objects](#support-inventory)',
  ]
  for (const [id, title] of groups) {
    const members = files.filter(file => groupFor(file.path)[0] === id)
    if (!members.length) continue
    lines.push(`- [${title}](#group-${id})`)
    for (const file of members) lines.push(`  - [${file.path}](#${anchor(file.path)})`)
  }
  lines.push('', '<a id="component-inventory"></a>', '## Component module inventory', '',
    `${items.components.length} component-bearing or compatibility modules; ${items.components.filter(item => item.kind === 'compatibility alias').length} compatibility re-exports. This is a module inventory, not a speculative total of React functions.`, '',
    '| Module | Primary / named exports | Complete source | Application use |', '| --- | --- | --- | --- |')
  for (const item of items.components) {
    const exports = [item.primaryExport, ...item.namedExports].join('; ')
    lines.push(`| ${item.module} | ${exports} | [${item.file}](#${anchor(item.file)}) | ${item.usage} |`)
  }
  lines.push('', '<a id="support-inventory"></a>', '## Hooks and template objects', '', '| Kind | Export | Complete source |', '| --- | --- | --- |')
  for (const [kind, list] of [['Hook', items.hooks], ['Template', items.templates]]) {
    for (const item of list) lines.push(`| ${kind} | ${item.name} | [${item.file}](#${anchor(item.file)}) |`)
  }
  for (const [id, title] of groups) {
    const members = files.filter(file => groupFor(file.path)[0] === id)
    if (!members.length) continue
    lines.push('', `<a id="group-${id}"></a>`, `## ${title}`, '')
    for (const file of members) {
      const longest = Math.max(0, ...[...file.text.matchAll(/`+/g)].map(match => match[0].length))
      const fence = '`'.repeat(Math.max(3, longest + 1))
      const language = file.encoding === 'base64' ? 'base64' : ({ '.tsx': 'tsx', '.jsx': 'jsx', '.ts': 'ts', '.css': 'css', '.html': 'html', '.md': 'markdown', '.json': 'json' }[posix.extname(file.path)] ?? 'text')
      lines.push(`<a id="${anchor(file.path)}"></a>`, `### ${file.path}`, '',
        `${file.bytes.length} bytes · SHA-256 \`${file.sha256}\` · ${file.encoding}`, '',
        `${fence}${language}`, file.text + (file.text.endsWith('\n') ? '' : '\n') + fence, '', '[Back to contents](#contents)', '')
    }
  }
  return Buffer.from(lines.join('\n').trimEnd() + '\n')
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})
function crc32(bytes) {
  let value = 0xffffffff
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

// Standard uncompressed ZIP: UTF-8 names, fixed1980 timestamp, fixed0644 mode.
function archive(files) {
  assert.ok(files.length < 65535, 'ZIP64 is not needed/supported by this source exporter')
  const local = [], central = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.path)
    const checksum = crc32(file.bytes)
    assert.ok(file.bytes.length <= 0xffffffff && name.length <= 65535)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(0x800, 6)
    header.writeUInt16LE(0x21, 12)
    header.writeUInt32LE(checksum, 14)
    header.writeUInt32LE(file.bytes.length, 18)
    header.writeUInt32LE(file.bytes.length, 22)
    header.writeUInt16LE(name.length, 26)
    local.push(header, name, file.bytes)
    const directory = Buffer.alloc(46)
    directory.writeUInt32LE(0x02014b50)
    directory.writeUInt16LE(0x314, 4)
    directory.writeUInt16LE(20, 6)
    directory.writeUInt16LE(0x800, 8)
    directory.writeUInt16LE(0x21, 14)
    directory.writeUInt32LE(checksum, 16)
    directory.writeUInt32LE(file.bytes.length, 20)
    directory.writeUInt32LE(file.bytes.length, 24)
    directory.writeUInt16LE(name.length, 28)
    directory.writeUInt32LE((0o100644 << 16) >>> 0, 38)
    directory.writeUInt32LE(offset, 42)
    central.push(directory, name)
    offset += header.length + name.length + file.bytes.length
  }
  const directoryBytes = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(directoryBytes.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, directoryBytes, end])
}

async function main() {
  const args = process.argv.slice(2)
  assert.ok(args.length === 0 || args.length === 1 && args[0] === '--verify', 'Usage: node scripts/export-component-catalog.mjs [--verify]')
  const files = await captureSource()
  const items = inventory(files)
  const snapshotHash = sha256(Buffer.from(files.map(file => `${file.path}\0${file.bytes.length}\0${file.sha256}\n`).join('')))
  const markdown = sourcebook(files, items, snapshotHash)
  const zip = archive(files)
  const manifest = Buffer.from(JSON.stringify({
    formatVersion: 1,
    snapshotKind: 'local working-tree source; not deployment evidence',
    snapshotSha256: snapshotHash,
    sourceSelection: { directory: 'all files under src/', explicitFiles: extraSourceFiles },
    exporter: { file: 'scripts/export-component-catalog.mjs', sha256: sha256(await readFile(fileURLToPath(import.meta.url))) },
    fileCount: files.length,
    srcFileCount: files.filter(file => file.path.startsWith('src/')).length,
    sourceBytes: files.reduce((sum, file) => sum + file.bytes.length, 0),
    componentModuleCount: items.components.length,
    components: items.components,
    hooks: items.hooks,
    templates: items.templates,
    files: files.map(file => ({ path: file.path, bytes: file.bytes.length, sha256: file.sha256, encoding: file.encoding, category: groupFor(file.path)[1], anchor: anchor(file.path), importedFromMain: items.reachable.has(file.path) })),
    artifacts: {
      markdown: { path: targets.markdown, bytes: markdown.length, sha256: sha256(markdown) },
      zip: { path: targets.zip, bytes: zip.length, sha256: sha256(zip), entries: files.length },
    },
  }, null, 2) + '\n')
  // Reject a mixed snapshot if another worker changed source during capture.
  const current = await captureSource()
  assert.deepEqual(current.map(file => [file.path, file.sha256]), files.map(file => [file.path, file.sha256]), 'Source changed during export; regenerate after edits settle')
  if (!args.includes('--verify')) {
    await writeFile(new URL(targets.markdown, root), markdown)
    await writeFile(new URL(targets.zip, root), zip)
    await writeFile(new URL(targets.manifest, root), manifest)
  }
  for (const [path, expected] of [[targets.markdown, markdown], [targets.zip, zip], [targets.manifest, manifest]]) {
    assert.ok((await readFile(new URL(path, root))).equals(expected), `${path} differs from the exact current source snapshot`)
  }
  console.log(JSON.stringify({
    mode: args.includes('--verify') ? 'verified without writes' : 'generated and verified',
    snapshotSha256: snapshotHash,
    files: files.length,
    sourceBytes: files.reduce((sum, file) => sum + file.bytes.length, 0),
    componentModules: items.components.length,
    compatibilityAliases: items.components.filter(item => item.kind === 'compatibility alias').length,
    hooks: items.hooks.length,
    templates: items.templates.length,
    artifacts: targets,
  }, null, 2))
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
