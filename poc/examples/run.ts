// 範例執行器:每個範例有 V1(改善前)與 V2(改善後),兩版都跑第 1 層檢查與完整評估,並自動驗收。
// 用法:npm run poc:examples [-- --json-only] [--case 03]

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRESETS, SCHEMAS, validateDataset, type Violation } from '../../src/index.js';
import { loadDataset } from '../../src/node/load.js';
import { applyPatch, toDataset, type Nested, type PatchOp } from '../../tests/helpers/fixture.js';
import { RANK, type Verdict } from '../evaluate/checks.js';
import { type Evaluation, type Finding, evaluatePage, itemVerdicts } from '../evaluate/evaluate.js';
import { renderAudit } from '../evaluate/render-audit.js';
import { buildWorld } from '../estimate-vs-render/model.js';
import { renderComparison } from './report.js';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');

/** 一個範例 */
export interface Case {
  id: string;
  title: string;
  /** 要示範的問題 */
  problem: string;
  /** V2 怎麼改(給人看) */
  fixNote: string;
  /**
   * 目標:V1 要有問題、V2 要合格。
   * 寫「項目」看整個項目;寫「項目@代號」只看 V1 中那個對象(用穩定參照追到 V2,不怕區塊搬動後代號重排)。
   */
  targets: string[];
  /** 只能改善、無法完全解決時為 true:目標項目只要求變好 */
  partial?: boolean;
  /** 截圖的寬度 */
  shotWidth: number;
  v1: PatchOp[];
  /** V2 = V1 + fix */
  fix?: PatchOp[];
  /** 或直接指定 V2 = 範例資料 + v2(V1 是「製造問題」時,V2 常常就是原樣) */
  v2?: PatchOp[];
}

/** 一版的結果 */
export interface VersionResult {
  violations: Violation[];
  evaluation: Evaluation;
  items: Record<string, Verdict>;
}

/** 一個範例的結果與驗收 */
export interface CaseResult {
  case: Case;
  v1: VersionResult;
  v2: VersionResult;
  checks: { name: string; pass: boolean; detail: string }[];
  pass: boolean;
}

/** 範例資料轉成巢狀結構(資料夾 → 檔名 → 內容),供 JSON Patch 使用 */
function baseNested(): Nested {
  const nested: Nested = {};
  for (const f of loadDataset(join(REPO, 'data')).files) {
    const [folder, file] = f.path.split('/') as [string, string];
    (nested[folder] ??= {})[file.replace(/\.json$/, '')] = f.data;
  }
  return nested;
}

/** 跑一版:第 1 層檢查 + 評估 */
async function runVersion(nested: Nested, jsonOnly: boolean, shotWidth?: number): Promise<VersionResult> {
  // 【第一步】第 1 層規則檢查
  const dataset = toDataset(nested);
  const violations = validateDataset(dataset, { schemas: SCHEMAS, presets: PRESETS });
  // 【第二步】評估(JSON 估算 + 渲染量測)
  const world = buildWorld(dataset.files.map((f) => f.data));
  const rendered = jsonOnly
    ? undefined
    : await renderAudit(world, join(HERE, 'out'), shotWidth ? join(HERE, 'out', 'shots') : undefined, shotWidth ? [shotWidth] : []);
  const evaluation = evaluatePage(world, rendered);
  return { violations, evaluation, items: Object.fromEntries(itemVerdicts(evaluation.findings)) };
}

/** 驗收一個範例 */
function judge(c: Case, v1: VersionResult, v2: VersionResult): CaseResult['checks'] {
  const errors = (v: VersionResult) => v.violations.filter((x) => x.severity === 'error').length;
  const checks: CaseResult['checks'] = [];
  // 1. 兩版都沒有第 1 層錯誤
  checks.push({ name: '第 1 層', pass: errors(v1) === 0 && errors(v2) === 0, detail: `V1 錯誤 ${errors(v1)}、V2 錯誤 ${errors(v2)}` });
  // 2. V2 總分高於 V1
  const t1 = v1.evaluation.total;
  const t2 = v2.evaluation.total;
  checks.push({ name: '總分提升', pass: t2 > t1, detail: `${t1} → ${t2}` });
  // 3. 目標:V1 有問題、V2 合格(partial 時只要求判定變好)
  const worst = (fs: Finding[]): Verdict => fs.reduce<Verdict>((a, f) => (RANK[f.verdict] > RANK[a] ? f.verdict : a), 'pass');
  for (const t of c.targets) {
    const [item, code] = t.split('@') as [string, string | undefined];
    // 「項目@代號」:先在 V1 找到那個對象的穩定參照,再到 V2 找同一個參照
    const refs = code ? v1.evaluation.findings.filter((f) => f.item === item && f.target === code).map((f) => f.ref) : undefined;
    const pick = (ev: Evaluation) => ev.findings.filter((f) => f.item === item && (!refs || refs.includes(f.ref)));
    const a = worst(pick(v1.evaluation));
    const b = worst(pick(v2.evaluation));
    const ok = (code ? refs!.length > 0 : true) && (c.partial ? RANK[a] > 0 && RANK[b] < RANK[a] : RANK[a] > 0 && b === 'pass');
    checks.push({ name: `目標:${t}`, pass: ok, detail: `${a} → ${b}` });
  }
  // 4. V2 沒有新的不合格:以「項目 + 穩定參照」比對,區塊搬動也不會認錯對象
  const failedV1 = new Set(v1.evaluation.findings.filter((f) => f.verdict === 'fail').map((f) => `${f.item}|${f.ref}`));
  const newFails = v2.evaluation.findings.filter((f) => f.verdict === 'fail' && !failedV1.has(`${f.item}|${f.ref}`));
  checks.push({
    name: '沒有新的不合格',
    pass: newFails.length === 0,
    detail: newFails.length ? newFails.map((f) => `${f.item}@${f.target}`).join('、') : '無',
  });
  return checks;
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json-only');
  const only = args.includes('--case') ? args[args.indexOf('--case') + 1] : undefined;
  const files = readdirSync(join(HERE, 'cases')).filter((f) => f.endsWith('.json') && (!only || f.startsWith(only))).sort();
  const base = baseNested();
  const results: CaseResult[] = [];
  mkdirSync(join(HERE, 'screenshots'), { recursive: true });
  for (const file of files) {
    const c = JSON.parse(readFileSync(join(HERE, 'cases', file), 'utf8')) as Case;
    // 【第一步】V1 = 範例資料 + v1;V2 = V1 + fix
    const n1 = applyPatch(base, c.v1);
    const n2 = c.v2 ? applyPatch(base, c.v2) : applyPatch(n1, c.fix ?? []);
    const v1 = await runVersion(n1, jsonOnly, c.shotWidth);
    if (!jsonOnly) await shotCopy(c, 'v1');
    const v2 = await runVersion(n2, jsonOnly, c.shotWidth);
    if (!jsonOnly) await shotCopy(c, 'v2');
    // 【第二步】驗收
    const checks = judge(c, v1, v2);
    const pass = checks.every((x) => x.pass);
    results.push({ case: c, v1, v2, checks, pass });
    console.log(`${pass ? '✅' : '❌'} ${c.id} ${c.title}:${v1.evaluation.total} → ${v2.evaluation.total}  ${checks.filter((x) => !x.pass).map((x) => `[${x.name} ${x.detail}]`).join(' ')}`);
  }
  // 【第三步】報表(只在完整跑、且不是單一範例時寫)
  if (!jsonOnly && !only) {
    writeFileSync(join(HERE, 'results.json'), JSON.stringify(results.map(summary), null, 2) + '\n');
    const { md, html } = renderComparison(results);
    writeFileSync(join(HERE, 'REPORT.md'), md);
    writeFileSync(join(HERE, 'report.html'), html);
  }
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed} / ${results.length} 個範例通過驗收`);
  if (passed !== results.length) process.exitCode = 1;
}

/** 把評估時存下的截圖,依範例的截圖寬度複製成固定檔名 */
async function shotCopy(c: Case, version: 'v1' | 'v2') {
  const { copyFileSync } = await import('node:fs');
  copyFileSync(join(HERE, 'out', 'shots', `page-${c.shotWidth}.jpg`), join(HERE, 'screenshots', `${c.id}-${version}.jpg`));
}

/** results.json 只留摘要,不放整份評估 */
function summary(r: CaseResult) {
  return {
    id: r.case.id,
    title: r.case.title,
    pass: r.pass,
    total: [r.v1.evaluation.total, r.v2.evaluation.total],
    scores: [r.v1.evaluation.scores, r.v2.evaluation.scores],
    verdict: [r.v1.evaluation.pageVerdict, r.v2.evaluation.pageVerdict],
    checks: r.checks,
  };
}

await main();
