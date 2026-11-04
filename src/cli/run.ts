// validate 指令的主體:解析參數、執行檢查、輸出文字或 JSON、決定結束代碼。
// 讀檔與輸出都由參數注入,方便測試。

import { PRESETS, SCHEMAS } from '../assets.js';
import { validateDataset, type Dataset, type Violation } from '../validate/index.js';

/** 指令參數 */
export interface CliOptions {
  dir: string;
  json: boolean;
  strict: boolean;
}

/** 解析命令列參數:[目錄] [--json] [--strict];目錄預設 data */
export function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { dir: 'data', json: false, strict: false };
  for (const arg of argv) {
    if (arg === '--json') opts.json = true;
    else if (arg === '--strict') opts.strict = true;
    else if (arg.startsWith('--')) throw new Error(`不認得的參數:${arg}`);
    else opts.dir = arg;
  }
  return opts;
}

/** 計算錯誤數與警告數 */
export function countBySeverity(violations: Violation[]): { errors: number; warnings: number } {
  const errors = violations.filter((v) => v.severity === 'error').length;
  return { errors, warnings: violations.length - errors };
}

/** 結束代碼:有錯誤 → 1;只有警告 → 0,但 --strict 時為 1;沒有違規 → 0 */
export function exitCode(violations: Violation[], strict: boolean): number {
  const { errors, warnings } = countBySeverity(violations);
  if (errors > 0) return 1;
  if (strict && warnings > 0) return 1;
  return 0;
}

/** 文字輸出:每行一筆「嚴重度 檔案 id 規則代號 訊息」,最後一行是統計 */
export function formatText(violations: Violation[]): string {
  const label = { error: '錯誤', warning: '警告' } as const;
  const lines = violations.map((v) => `${label[v.severity]}  ${v.file}  ${v.id || '-'}  ${v.rule}  ${v.message}`);
  const { errors, warnings } = countBySeverity(violations);
  lines.push(`錯誤 ${errors} 個,警告 ${warnings} 個`);
  return lines.join('\n') + '\n';
}

/** JSON 輸出:{ errors, warnings, violations } */
export function formatJson(violations: Violation[]): string {
  return JSON.stringify({ ...countBySeverity(violations), violations }, null, 2) + '\n';
}

/** 執行一次 validate,回傳結束代碼 */
export function run(argv: string[], io: { load: (dir: string) => Dataset; write: (text: string) => void }): number {
  // 【第一步】解析參數
  const opts = parseArgs(argv);
  // 【第二步】讀資料並檢查
  const violations = validateDataset(io.load(opts.dir), { schemas: SCHEMAS, presets: PRESETS });
  // 【第三步】依格式輸出
  io.write(opts.json ? formatJson(violations) : formatText(violations));
  // 【第四步】決定結束代碼
  return exitCode(violations, opts.strict);
}
