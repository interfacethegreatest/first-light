import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

export const DEFAULT_BUDGETS = Object.freeze({
  initialJsGzipBytes: 120 * 1024,
  initialCssGzipBytes: 12 * 1024,
  maxJsChunkGzipBytes: 350 * 1024,
})

const isJs = file => /\.[cm]?js$/i.test(file)

function outputPath(file) {
  assert.equal(typeof file, 'string', 'Build output paths must be strings')
  assert.ok(file && !file.startsWith('/') && !/[\\\0?#:]/.test(file)
    && !file.split('/').includes('..'), `Invalid local build output path: ${file}`)
  return posix.normalize(file)
}

function tags(html) {
  const result = []
  for (const match of html.matchAll(/<(script|link)\b([^>]*)>/gi)) {
    const attributes = {}
    for (const attribute of match[2].matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? attribute[4] ?? ''
    }
    const tag = match[1].toLowerCase()
    const rel = (attributes.rel ?? '').toLowerCase().split(/\s+/)
    if (tag === 'script' && attributes.src) {
      result.push({ url: attributes.src, kind: 'js', module: attributes.type === 'module' })
    } else if (tag === 'link' && attributes.href && rel.includes('modulepreload')) {
      result.push({ url: attributes.href, kind: 'js', module: true })
    } else if (tag === 'link' && attributes.href && rel.includes('stylesheet')) {
      result.push({ url: attributes.href, kind: 'css', module: false })
    }
  }
  return result
}

/** Read an existing Vite build only. Never builds, rewrites output or follows dynamic imports. */
export async function auditPerformanceBudget({ distDirectory = 'dist', entryHtml = 'index.html', budgets = {} } = {}) {
  entryHtml = outputPath(entryHtml)
  const limits = { ...DEFAULT_BUDGETS, ...budgets }
  for (const [key, value] of Object.entries(limits)) {
    assert.ok(Object.hasOwn(DEFAULT_BUDGETS, key) && Number.isSafeInteger(value) && value >= 0,
      `Invalid performance budget: ${key}`)
  }
  const directory = resolve(distDirectory)
  const manifest = JSON.parse(await readFile(resolve(directory, '.vite/manifest.json'), 'utf8'))
  assert.ok(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Expected a Vite manifest object')
  const entry = manifest[entryHtml] ?? Object.values(manifest).find(node => node.src === entryHtml && node.isEntry)
  assert.ok(entry?.isEntry && isJs(entry.file), `Missing JavaScript manifest entry for ${entryHtml}`)
  const entryKey = Object.keys(manifest).find(key => manifest[key] === entry)
  const html = await readFile(resolve(directory, entryHtml), 'utf8')
  const eager = tags(html)
  const pageUrl = new URL(entryHtml, 'https://build.invalid/')
  const localUrl = raw => {
    const url = new URL(raw, pageUrl)
    assert.equal(url.origin, pageUrl.origin, `Unmeasured external critical resource: ${raw}`)
    return decodeURIComponent(url.pathname)
  }
  const entryUrl = eager.find(item => item.kind === 'js' && item.module
    && localUrl(item.url).endsWith(`/${entry.file}`))
  assert.ok(entryUrl, `The built HTML does not load its manifest entry: ${entry.file}`)
  const basePath = localUrl(entryUrl.url).slice(0, -entry.file.length)
  const fromUrl = raw => {
    const pathname = localUrl(raw)
    assert.ok(pathname.startsWith(basePath), `Critical resource is outside the build base: ${raw}`)
    return outputPath(pathname.slice(basePath.length))
  }

  const declaredFiles = new Set()
  const entriesByFile = new Map()
  for (const [key, node] of Object.entries(manifest)) {
    const file = outputPath(node.file)
    declaredFiles.add(file)
    entriesByFile.set(file, [...(entriesByFile.get(file) ?? []), key])
    for (const field of ['imports', 'dynamicImports', 'css', 'assets']) {
      assert.ok(node[field] === undefined || Array.isArray(node[field]), `${key}.${field} must be an array`)
      for (const value of node[field] ?? []) {
        if (field === 'imports' || field === 'dynamicImports') {
          assert.ok(Object.hasOwn(manifest, value), `Missing manifest dependency: ${value} (from ${key})`)
        } else declaredFiles.add(outputPath(value))
      }
    }
  }
  // Validate all declared outputs, including lazy chunks, instead of silently
  // measuring a partial/stale build after a chunk disappeared.
  await Promise.all([...declaredFiles].map(async file => {
    const info = await stat(resolve(directory, file)).catch(() => null)
    assert.ok(info?.isFile(), `Missing build output: ${file}`)
  }))

  const visited = new Set()
  const initialJs = new Set()
  const initialCss = new Set()
  function visit(key) {
    if (visited.has(key)) return
    visited.add(key)
    const node = manifest[key]
    if (isJs(node.file)) initialJs.add(outputPath(node.file))
    else if (node.file.endsWith('.css')) initialCss.add(outputPath(node.file))
    for (const css of node.css ?? []) initialCss.add(outputPath(css))
    for (const dependency of node.imports ?? []) visit(dependency)
    // dynamicImports are deliberately excluded: lazy code is not the static entry graph.
  }
  visit(entryKey)
  for (const resource of eager) {
    const file = fromUrl(resource.url)
    if (resource.kind === 'css') initialCss.add(file)
    else {
      assert.ok(isJs(file), `Expected a JavaScript critical resource: ${file}`)
      initialJs.add(file)
      const keys = entriesByFile.get(file)
      assert.ok(keys || !resource.module, `Missing manifest record for eager module: ${file}`)
      for (const key of keys ?? []) visit(key)
    }
  }
  const measurements = new Map()
  async function measure(file) {
    if (!measurements.has(file)) measurements.set(file, (async () => {
      const bytes = await readFile(resolve(directory, file))
      return { file, rawBytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 9 }).length }
    })())
    return measurements.get(file)
  }
  async function group(files) {
    const measured = await Promise.all([...files].sort().map(measure))
    return {
      rawBytes: measured.reduce((total, file) => total + file.rawBytes, 0),
      gzipBytes: measured.reduce((total, file) => total + file.gzipBytes, 0),
      files: measured,
    }
  }
  const initial = { js: await group(initialJs), css: await group(initialCss) }
  const jsChunks = await Promise.all([...declaredFiles].filter(isJs).sort().map(async file => ({
    ...await measure(file), initial: initialJs.has(file),
  })))
  const violations = []
  function enforce(kind, actualGzipBytes, limitGzipBytes, file) {
    if (actualGzipBytes > limitGzipBytes) violations.push({
      kind, ...(file ? { file } : {}), actualGzipBytes, limitGzipBytes,
      message: `${file ?? kind}: ${actualGzipBytes} gzip bytes exceeds ${limitGzipBytes} bytes`,
    })
  }
  enforce('initial-js', initial.js.gzipBytes, limits.initialJsGzipBytes)
  enforce('initial-css', initial.css.gzipBytes, limits.initialCssGzipBytes)
  for (const chunk of jsChunks) enforce('js-chunk', chunk.gzipBytes, limits.maxJsChunkGzipBytes, chunk.file)
  return {
    formatVersion: 1,
    entryHtml,
    compression: 'gzip-level-9',
    budgets: limits,
    initial,
    staticManifestEntries: [...visited].sort(),
    jsChunks,
    passed: violations.length === 0,
    violations,
    notes: [
      'Static manifest imports plus actual HTML script/modulepreload/stylesheet references are counted once per output file. Dynamic imports are excluded unless explicitly preloaded by the HTML.',
      'Every emitted JavaScript chunk, including other entry points and lazy chunks, also has an individual gzip budget.',
      'Gzip sizes are reproducible level-9 estimates summed per asset, not observed transfer bytes, cache behavior or LCP/INP/CLS results.',
    ],
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length > 1) {
    console.error('Usage: node scripts/check-performance-budget.mjs [DIST_DIRECTORY]')
    process.exitCode = 2
  } else {
    auditPerformanceBudget({ distDirectory: args[0] ?? 'dist' }).then(report => {
      console.log(JSON.stringify(report, null, 2))
      if (!report.passed) process.exitCode = 1
    }).catch(error => {
      console.error(`Performance budget check failed: ${error.message}`)
      process.exitCode = 1
    })
  }
}
