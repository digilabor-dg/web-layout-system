// POC 2 的門檻判定:每個項目把量到的數字換成合格、警告、不合格。
// 門檻全部來自 openspec/specs 的 template-evaluation 與 page-evaluation;純函式,方便測試。

/** 判定 */
export type Verdict = 'pass' | 'warn' | 'fail';

/** 判定的嚴重度排序:不合格最差 */
export const RANK: Record<Verdict, number> = { pass: 0, warn: 1, fail: 2 };

/** 取較差的判定 */
export function worse(a: Verdict, b: Verdict): Verdict {
  return RANK[b] > RANK[a] ? b : a;
}

/** 「越小越好」的項目:≤ 一般標準合格,≤ 上限警告,超過上限不合格 */
export function lowerBetter(value: number, normal: number, limit: number): Verdict {
  if (value <= normal + 1e-9) return 'pass';
  if (value <= limit + 1e-9) return 'warn';
  return 'fail';
}

/** 「越大越好」的項目:≥ 一般標準合格,≥ 下限警告,低於下限不合格 */
export function higherBetter(value: number, normal: number, limit: number): Verdict {
  if (value >= normal - 1e-9) return 'pass';
  if (value >= limit - 1e-9) return 'warn';
  return 'fail';
}

/** 末列不落單:餘數 0 合格;餘數 ≥ 欄數一半警告;0 < 餘數 < 欄數一半不合格 */
export function lastRow(items: number, cols: number): Verdict {
  const r = items % cols;
  if (r === 0) return 'pass';
  return r >= cols / 2 ? 'warn' : 'fail';
}

/** 標題行數:電腦 ≤ 2 合格、3 警告;手機 ≤ 3 合格;疊字 ≤ 2 合格;其餘不合格 */
export function titleLines(lines: number, mobile: boolean, overlay: boolean): Verdict {
  if (overlay) return lines <= 2 ? 'pass' : 'fail';
  if (mobile) return lines <= 3 ? 'pass' : 'fail';
  if (lines <= 2) return 'pass';
  return lines === 3 ? 'warn' : 'fail';
}

/** 填充率:60%~90% 合格,超出為警告(規格沒有不合格區間) */
export function fillRate(rate: number): Verdict {
  return rate >= 0.6 - 1e-9 && rate <= 0.9 + 1e-9 ? 'pass' : 'warn';
}

/** 區塊數:10~15 合格;6~9 或 16~18 警告;其餘不合格 */
export function blockCount(n: number): Verdict {
  if (n >= 10 && n <= 15) return 'pass';
  if ((n >= 6 && n <= 9) || (n >= 16 && n <= 18)) return 'warn';
  return 'fail';
}

/** 整頁則數:30~80 合格;少於 30 警告;超過 80 不合格 */
export function pageItems(n: number): Verdict {
  if (n > 80) return 'fail';
  return n >= 30 ? 'pass' : 'warn';
}

/** 同型不連續:最長連續同型 1 塊合格、2 塊警告、3 塊以上不合格 */
export function sameTypeRun(run: number): Verdict {
  if (run <= 1) return 'pass';
  return run === 2 ? 'warn' : 'fail';
}

/** 各用途的建議則數 */
export const ROLE_ITEMS: Record<string, [number, number]> = {
  headline: [1, 1],
  subheadline: [3, 6],
  flash: [3, 5],
  popular: [5, 10],
  section: [4, 8],
  video: [3, 6],
  opinion: [4, 6],
  feature: [1, 2],
};
