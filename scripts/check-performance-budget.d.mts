export interface PerformanceBudgets {
  initialJsGzipBytes: number
  initialCssGzipBytes: number
  maxJsChunkGzipBytes: number
}
export interface AssetSize { file: string; rawBytes: number; gzipBytes: number }
export interface AssetGroup { rawBytes: number; gzipBytes: number; files: AssetSize[] }
export interface BudgetViolation {
  kind: 'initial-js' | 'initial-css' | 'js-chunk'
  file?: string
  actualGzipBytes: number
  limitGzipBytes: number
  message: string
}
export interface PerformanceBudgetReport {
  formatVersion: number
  entryHtml: string
  compression: string
  budgets: PerformanceBudgets
  initial: { js: AssetGroup; css: AssetGroup }
  staticManifestEntries: string[]
  jsChunks: (AssetSize & { initial: boolean })[]
  passed: boolean
  violations: BudgetViolation[]
  notes: string[]
}
export const DEFAULT_BUDGETS: Readonly<PerformanceBudgets>
export function auditPerformanceBudget(options?: {
  distDirectory?: string
  entryHtml?: string
  budgets?: Partial<PerformanceBudgets>
}): Promise<PerformanceBudgetReport>
