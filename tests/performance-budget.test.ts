import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { auditPerformanceBudget, DEFAULT_BUDGETS } from '../scripts/check-performance-budget.mjs'

const directories: string[] = []
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))) })

interface FixtureNode { file: string; isEntry?: boolean; src?: string; imports?: string[]; dynamicImports?: string[]; css?: string[] }
type Manifest = Record<string, FixtureNode>

function noisyModule(length: number) {
  let seed = 123456789
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const text = Array.from({ length }, () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
    return alphabet[(seed >>> 0) % alphabet.length]
  }).join('')
  return `export default "${text}";\n`
}

async function fixture({ extraHtml = '', gpu = noisyModule(190000) } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'first-light-budget-'))
  directories.push(directory)
  await mkdir(join(directory, '.vite'))
  await mkdir(join(directory, 'assets'))
  const manifest: Manifest = {
    'index.html': { file: 'assets/main.js', isEntry: true, src: 'index.html', imports: ['shared', 'controls'], dynamicImports: ['gpu'], css: ['assets/main.css'] },
    shared: { file: 'assets/shared.js', imports: ['controls'], css: ['assets/shared.css'] },
    controls: { file: 'assets/controls.js', imports: ['shared'], css: ['assets/shared.css'] },
    gpu: { file: 'assets/gpu.js', imports: ['shared'] },
    'examples/other/index.html': { file: 'assets/other.js', isEntry: true, imports: ['gpu'] },
  }
  const files = {
    'assets/main.js': 'import "./shared.js"; import("./gpu.js");',
    'assets/shared.js': 'export const shared = 1;',
    'assets/controls.js': 'export const controls = true;',
    'assets/gpu.js': gpu,
    'assets/other.js': 'import "./gpu.js";',
    'assets/main.css': 'body { color: white; background: black; }',
    'assets/shared.css': 'button { font: inherit; }',
  }
  await Promise.all(Object.entries(files).map(([path, text]) => writeFile(join(directory, path), text)))
  await writeFile(join(directory, 'index.html'), `<script type="module" src="/first-light/assets/main.js"></script>
    <link rel="modulepreload" href="/first-light/assets/shared.js">
    <link rel="stylesheet" href="/first-light/assets/main.css">${extraHtml}`)
  async function saveManifest() { await writeFile(join(directory, '.vite/manifest.json'), JSON.stringify(manifest)) }
  await saveManifest()
  return { directory, manifest, files, saveManifest }
}

describe('production entry graph performance budget', () => {
  it('counts shared static imports and CSS once, excludes dynamic imports and other entries', async () => {
    const build = await fixture()
    const report = await auditPerformanceBudget({ distDirectory: build.directory })
    expect(report.passed).toBe(true)
    expect(report.budgets).toEqual(DEFAULT_BUDGETS)
    expect(report.initial.js.files.map(file => file.file)).toEqual(['assets/controls.js', 'assets/main.js', 'assets/shared.js'])
    expect(report.initial.css.files.map(file => file.file)).toEqual(['assets/main.css', 'assets/shared.css'])
    expect(report.initial.js.rawBytes).toBe(build.files['assets/main.js'].length + build.files['assets/shared.js'].length + build.files['assets/controls.js'].length)
    const expectedGzip = ['assets/main.js', 'assets/shared.js', 'assets/controls.js']
      .reduce((total, file) => total + gzipSync(Buffer.from(build.files[file as keyof typeof build.files]), { level: 9 }).length, 0)
    expect(report.initial.js.gzipBytes).toBe(expectedGzip)
    expect(report.jsChunks.find(chunk => chunk.file === 'assets/gpu.js')?.initial).toBe(false)
    expect(report.staticManifestEntries).not.toContain('examples/other/index.html')
  })

  it('rejects an accidentally eager GPU graph that was previously a bounded lazy chunk', async () => {
    const build = await fixture()
    expect((await auditPerformanceBudget({ distDirectory: build.directory })).passed).toBe(true)
    build.manifest['index.html'].imports!.push('gpu')
    await build.saveManifest()
    const report = await auditPerformanceBudget({ distDirectory: build.directory })
    expect(report.passed).toBe(false)
    expect(report.initial.js.files.some(file => file.file === 'assets/gpu.js')).toBe(true)
    expect(report.violations.map(violation => violation.kind)).toEqual(['initial-js'])
  })

  it('includes explicit HTML modulepreloads even when the manifest marks that chunk dynamic', async () => {
    const build = await fixture({ extraHtml: '<link rel="modulepreload" href="/first-light/assets/gpu.js">' })
    const report = await auditPerformanceBudget({ distDirectory: build.directory })
    expect(report.passed).toBe(false)
    expect(report.initial.js.files.some(file => file.file === 'assets/gpu.js')).toBe(true)
  })

  it('checks oversized lazy chunks without adding them to the initial entry total', async () => {
    const build = await fixture({ gpu: noisyModule(520000) })
    const report = await auditPerformanceBudget({ distDirectory: build.directory })
    expect(report.passed).toBe(false)
    expect(report.initial.js.gzipBytes).toBeLessThan(DEFAULT_BUDGETS.initialJsGzipBytes)
    expect(report.violations).toMatchObject([{ kind: 'js-chunk', file: 'assets/gpu.js' }])
  })

  it('enforces CSS separately and fails if an expected lazy output is missing', async () => {
    const build = await fixture()
    const report = await auditPerformanceBudget({ distDirectory: build.directory, budgets: { initialCssGzipBytes: 1 } })
    expect(report.violations.map(violation => violation.kind)).toEqual(['initial-css'])
    await rm(join(build.directory, 'assets/gpu.js'))
    await expect(auditPerformanceBudget({ distDirectory: build.directory })).rejects.toThrow('Missing build output: assets/gpu.js')
  })

  it('fails closed for missing dependency metadata rather than undercounting a graph', async () => {
    const build = await fixture()
    build.manifest.shared.imports = ['missing']
    await build.saveManifest()
    await expect(auditPerformanceBudget({ distDirectory: build.directory })).rejects.toThrow('Missing manifest dependency: missing')
  })

  it('returns nonzero from the CLI on a regression, with a readable JSON report and no output mutations', async () => {
    const build = await fixture()
    build.manifest['index.html'].imports!.push('gpu')
    await build.saveManifest()
    const before = await readFile(join(build.directory, '.vite/manifest.json'), 'utf8')
    const command = spawnSync(process.execPath, [resolve('scripts/check-performance-budget.mjs'), build.directory], { encoding: 'utf8' })
    expect(command.status).toBe(1)
    expect(command.stderr).toBe('')
    expect(JSON.parse(command.stdout)).toMatchObject({ passed: false, violations: [{ kind: 'initial-js' }] })
    expect(await readFile(join(build.directory, '.vite/manifest.json'), 'utf8')).toBe(before)
  })
})
