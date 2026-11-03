// 人評工具的資料來源:把「產生結果」與「範例的 V1、V2」整理成同一種「版面」:
// 預覽用的 HTML、每塊的程式分數與判定、總分。程式分數一律由評估報告換算,不另外計算。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyPatch, toDataset, type Nested, type PatchOp } from '../../tests/helpers/fixture.js';
import { type Evaluation, type Finding, itemVerdicts } from '../evaluate/evaluate.js';
import { buildWorld, type World } from '../estimate-vs-render/model.js';
import { renderPage } from '../estimate-vs-render/render.js';
import { baseNested } from '../generator/params.js';

const REPO = join(import.meta.dirname, '..', '..');

/** 每塊的程式分數:10 分起算,該塊每個不合格項目扣 3、警告項目扣 1(與整頁計分 30/10 同比例) */
export function blockScore(findings: Pick<Finding, 'item' | 'verdict'>[]): number {
  const penalty = itemVerdicts(findings as Finding[]).reduce((p, [, v]) => p + (v === 'fail' ? 3 : v === 'warn' ? 1 : 0), 0);
  return Math.max(0, 10 - penalty);
}

/** 版面中的一塊 */
export interface LayoutBlock {
  code: string;
  ref: string;
  pattern: string;
  heading: string;
  program: { score: number; findings: { item: string; verdict: string; display: string }[] };
}

/** 一個可以預覽、評分、比較的版面 */
export interface Layout {
  id: string;
  title: string;
  group: string;
  total: number;
  verdict: string;
  blocks: LayoutBlock[];
}

/** 版面連同預覽 HTML 與 world(截圖用) */
export interface LayoutFull extends Layout {
  html: string;
  world: World;
}

/** 預覽用的字型:Google Fonts 的 Noto Sans TC(與量測同字型),寄給別人也能正常顯示 */
export const PORTABLE_FONT = "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400&display=swap');";

/** 由 world 與報告組成版面 */
function toLayout(id: string, title: string, group: string, world: World, report: Evaluation): LayoutFull {
  const blocks = world.blocks.map((b) => {
    // 這一塊的判定:參照是實例 id,或包含它的組合(例如「同型不連續」的 F+G+H)
    const fs = report.findings.filter(
      (f) => f.verdict !== 'pass' && (f.ref === b.instance.id || f.ref.split('+').some((r) => r.split('#')[0] === b.instance.id)),
    );
    return {
      code: b.code,
      ref: b.instance.id,
      pattern: `${b.pattern.id} ${b.pattern.name}`,
      heading: b.template.heading.title,
      program: { score: blockScore(fs), findings: fs.map((f) => ({ item: f.item, verdict: f.verdict, display: f.display })) },
    };
  });
  return { id, title, group, total: report.total, verdict: report.pageVerdict, blocks, html: renderPage(world, PORTABLE_FONT), world };
}

/** 產生結果(poc/generator/results/<name>) */
export function fromGenerator(name: string): LayoutFull {
  const dir = join(REPO, 'poc', 'generator', 'results', name);
  const gen = JSON.parse(readFileSync(join(dir, 'generated.json'), 'utf8')) as {
    params: { preset: string; title?: string };
    page: { id: string };
    templates: { id: string }[];
    instances: { id: string }[];
  };
  const report = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8')) as Evaluation;
  const nested = applyPatch(baseNested(), [
    { op: 'replace', path: '/site-profile/site-main/preset', value: gen.params.preset },
    { op: 'replace', path: '/pages', value: { [gen.page.id]: gen.page } },
    { op: 'replace', path: '/block-templates', value: Object.fromEntries(gen.templates.map((t) => [t.id, t])) },
    { op: 'replace', path: '/block-instances', value: Object.fromEntries(gen.instances.map((i) => [i.id, i])) },
  ]);
  return toLayout(`gen-${name}`, gen.params.title ?? name, '產生結果', worldOf(nested), report);
}

/** 範例(poc/examples/cases/<id>-*.json)的 V1 或 V2 */
export function fromExample(caseFile: string, version: 'v1' | 'v2'): LayoutFull {
  const c = JSON.parse(readFileSync(join(REPO, 'poc', 'examples', 'cases', caseFile), 'utf8')) as {
    id: string; title: string; v1: PatchOp[]; fix?: PatchOp[]; v2?: PatchOp[];
  };
  const base = baseNested();
  const n1 = applyPatch(base, c.v1);
  const nested = version === 'v1' ? n1 : c.v2 ? applyPatch(base, c.v2) : applyPatch(n1, c.fix ?? []);
  const report = JSON.parse(readFileSync(join(REPO, 'poc', 'examples', 'reports', `${c.id}-${version}.json`), 'utf8')) as Evaluation;
  return toLayout(`ex${c.id}-${version}`, `範例 ${c.id} ${c.title} · ${version.toUpperCase()}`, '範例', worldOf(nested), report);
}

function worldOf(nested: Nested): World {
  return buildWorld(toDataset(nested).files.map((f) => f.data));
}
