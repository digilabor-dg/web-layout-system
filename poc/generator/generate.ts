// POC 3 的版型產生器:由參數組出 section 結構,再為每一塊在合法選項中挑展示類型、則數與排法,
// 以評估分數為目標,用貪婪法(逐塊改良)或集束搜尋找出最好的組合。全程確定性,不用亂數。

import {
  type BlockTemplate,
  type ContentItem,
  type ImageRole,
  PRESETS,
  SCHEMAS,
  createSchemaValidator,
  validateDataset,
  type Violation,
} from '../../src/index.js';
import { applyPatch, toDataset, type Nested } from '../../tests/helpers/fixture.js';
import { type Evaluation, evaluatePage } from '../evaluate/evaluate.js';
import { buildWorld } from '../estimate-vs-render/model.js';

/** 產生參數(格式見 params.schema.json) */
export interface Params {
  name: string;
  title?: string;
  preset: 'bs5' | 'tw4' | 'md3';
  blocks: BlockId[];
  sidebar: string[];
  fullWidth: string[];
  columns: [number, number];
  strategy: 'greedy' | 'beam';
  beamWidth?: number;
}

export type BlockId =
  | 'headline' | 'subheadline' | 'flash' | 'popular' | 'video' | 'world' | 'politics'
  | 'finance' | 'feature' | 'society' | 'opinion' | 'tech' | 'shorts';

/** 一塊的一個選項 */
export interface Option {
  pattern: string;
  count: number;
  imageRole?: ImageRole;
  responsive: BlockTemplate['responsive'];
  /** 給人看的說明,例如「P07 6 則 3 欄」 */
  label: string;
}

/** 每種區塊的固定設定:用途、內容類型、新聞池、標題 */
interface BlockDef {
  role: BlockTemplate['role'];
  contentType: string;
  category?: string;
  pool: string;
  heading: string;
  more?: string;
}

const CATEGORY: Record<string, string> = { world: '國際', politics: '政治', finance: '財經', society: '社會', tech: '科技' };

export const DEFS: Record<BlockId, BlockDef> = {
  headline: { role: 'headline', contentType: 'news', pool: 'news', heading: '頭條' },
  subheadline: { role: 'subheadline', contentType: 'news', pool: 'news', heading: '焦點新聞' },
  flash: { role: 'flash', contentType: 'flash', pool: 'flash', heading: '即時', more: '/flash' },
  popular: { role: 'popular', contentType: 'news', pool: 'news', heading: '熱門排行', more: '/popular' },
  video: { role: 'video', contentType: 'video', pool: 'video', heading: '影音焦點', more: '/video' },
  shorts: { role: 'video', contentType: 'video', pool: 'video', heading: '短影音', more: '/shorts' },
  feature: { role: 'feature', contentType: 'feature', pool: 'feature', heading: '專題', more: '/feature' },
  opinion: { role: 'opinion', contentType: 'opinion', pool: 'opinion', heading: '觀點評論', more: '/opinion' },
  ...(Object.fromEntries(
    Object.entries(CATEGORY).map(([c, h]) => [c, { role: 'section', contentType: 'news', category: c, pool: `news:${c}`, heading: h, more: `/${c}` }]),
  ) as Record<'world' | 'politics' | 'finance' | 'society' | 'tech', BlockDef>),
};

/** 整數範圍 */
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const grid = (cols: number) => ({ desktop: { layout: 'grid' as const, cols } });
const carousel = (perView: number) => ({ desktop: { layout: 'carousel' as const, perView } });

/**
 * 每種區塊的合法選項。展示類型只用該內容類型的建議搭配(而且 POC 渲染器支援的),
 * 則數同時受展示類型與用途的範圍限制。第一個選項是預設值。
 */
export function optionsFor(id: BlockId): Option[] {
  const o = (pattern: string, count: number, label: string, responsive: BlockTemplate['responsive'] = null, imageRole?: ImageRole): Option => ({
    pattern, count, label, responsive, ...(imageRole ? { imageRole } : {}),
  });
  switch (id) {
    case 'headline':
      return [o('P01', 1, 'P01 大圖疊字'), o('P02', 1, 'P02 大圖下文')];
    case 'subheadline':
      return [
        ...[4, 3].flatMap((c) => range(3, 6).map((n) => o('P07', n, `P07 ${n} 則 ${c} 欄`, grid(c)))),
        ...(['main', 'square'] as const).flatMap((r) => range(3, 6).map((n) => o('P03', n, `P03 ${n} 則(${r})`, null, r))),
      ];
    case 'flash':
      return range(3, 5).reverse().map((n) => o('P06', n, `P06 ${n} 則`));
    case 'popular':
      return (['none', 'square'] as const).flatMap((r) => [8, 5, 6, 7, 9, 10].map((n) => o('P05', n, `P05 ${n} 則(${r === 'none' ? '純文字' : '1:1 縮圖'})`, null, r)));
    case 'video':
      return [4, 3].flatMap((pv) => range(4, 6).map((n) => o('P12', n, `P12 ${n} 則、一次 ${pv} 張`, carousel(pv), 'video')));
    case 'shorts':
      return [6, 4].flatMap((pv) => range(4, 6).map((n) => o('P13', n, `P13 ${n} 則、一次 ${pv} 張`, carousel(pv))));
    case 'feature':
      return [o('P14', 2, 'P14 2 則'), o('P14', 1, 'P14 1 則')];
    case 'opinion':
      return [
        ...range(4, 6).map((n) => o('P17', n, `P17 ${n} 則、電腦清單`, { desktop: { layout: 'list', cols: 1 } })),
        ...range(4, 6).map((n) => o('P17', n, `P17 ${n} 則、電腦 2 欄`, grid(2))),
      ];
    default:
      // 分類版區:P09、P07、P03
      return [
        ...range(4, 6).reverse().map((n) => o('P09', n, `P09 ${n} 則`)),
        ...[3, 4].flatMap((c) => range(4, 8).map((n) => o('P07', n, `P07 ${n} 則 ${c} 欄`, grid(c)))),
        ...(['main', 'square'] as const).flatMap((r) => range(4, 6).map((n) => o('P03', n, `P03 ${n} 則(${r})`, null, r))),
      ];
  }
}

/** 依參數組出 section:全寬的區塊獨立成 flow;其餘依序放進 stack 的主欄或側欄 */
export function buildSections(p: Params): unknown[] {
  const inst = (id: string) => `inst-gen-${id}`;
  const sections: { id: string; mode: 'stack' | 'flow'; left?: string[]; right?: string[]; blocks?: string[] }[] = [];
  let cur: (typeof sections)[number] | null = null;
  for (const id of p.blocks) {
    if (p.fullWidth.includes(id)) {
      // 連續的全寬區塊放在同一個 flow section
      const last = sections[sections.length - 1];
      if (last?.mode === 'flow') last.blocks!.push(id);
      else sections.push({ id: `s${sections.length + 1}`, mode: 'flow', blocks: [id] });
      cur = null;
      continue;
    }
    if (!cur) {
      cur = { id: `s${sections.length + 1}`, mode: 'stack', left: [], right: [] };
      sections.push(cur);
    }
    (p.sidebar.includes(id) ? cur.right! : cur.left!).push(id);
  }
  return sections.map((s) => {
    if (s.mode === 'flow') {
      return { id: s.id, mode: 'flow', fluid: false, blocks: s.blocks!.map((b) => ({ instance: inst(b), span: { mobile: 12, desktop: 12 } })) };
    }
    // 只有一欄有內容時改成單欄 12
    const cols = [s.left!, s.right!].filter((c) => c.length > 0);
    const widths = cols.length === 2 ? p.columns : [12];
    return { id: s.id, mode: 'stack', fluid: false, columns: cols.map((c, i) => ({ width: widths[i], blocks: c.map(inst) })) };
  });
}

/** 新聞池:依發布時間由新到舊、再依 id 排序(確定性) */
function pools(base: Nested): Map<string, ContentItem[]> {
  const items = Object.values(base['content-items'] ?? {}) as ContentItem[];
  items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : a.id < b.id ? -1 : 1));
  const m = new Map<string, ContentItem[]>();
  const add = (k: string, it: ContentItem) => m.set(k, [...(m.get(k) ?? []), it]);
  for (const it of items) {
    add(it.contentType, it);
    if (it.category) add(`${it.contentType}:${it.category}`, it);
  }
  return m;
}

/** 分配新聞的優先順序:有分類的先拿,泛用的新聞池最後拿剩下的 */
const PRIORITY: BlockId[] = ['world', 'politics', 'finance', 'society', 'tech', 'feature', 'opinion', 'flash', 'video', 'shorts', 'headline', 'subheadline', 'popular'];

/** 由參數與每塊的選項組成完整資料集;新聞不夠分時回傳 null */
export function buildNested(base: Nested, p: Params, choice: Option[]): Nested | null {
  // 【第一步】拿掉原本的頁面、範本、實例,換成產生的;網站設定換預設參數組
  const n = applyPatch(base, [
    { op: 'replace', path: '/site-profile/site-main/preset', value: p.preset },
    { op: 'replace', path: '/pages', value: {} },
    { op: 'replace', path: '/block-templates', value: {} },
    { op: 'replace', path: '/block-instances', value: {} },
  ]);
  // 【第二步】依優先順序分配新聞,同一頁不重複
  const pool = pools(base);
  const used = new Set<string>();
  const assigned = new Map<string, string[]>();
  for (const id of PRIORITY) {
    const i = p.blocks.indexOf(id);
    if (i < 0) continue;
    const def = DEFS[id];
    const free = (pool.get(def.pool) ?? []).filter((it) => !used.has(it.id));
    if (free.length < choice[i]!.count) return null;
    const pick = free.slice(0, choice[i]!.count).map((it) => it.id);
    pick.forEach((x) => used.add(x));
    assigned.set(id, pick);
  }
  // 【第三步】範本與實例
  p.blocks.forEach((id, i) => {
    const def = DEFS[id];
    const opt = choice[i]!;
    n['block-templates']![`tpl-gen-${id}`] = {
      type: 'BlockTemplate', id: `tpl-gen-${id}`, name: def.heading, role: def.role,
      contentType: { ref: def.contentType, ...(def.category ? { category: def.category } : {}) },
      pattern: opt.pattern, itemCount: opt.count, ...(opt.imageRole ? { imageRole: opt.imageRole } : {}),
      selection: { mode: 'latest' }, responsive: opt.responsive,
      heading: { title: def.heading, ...(def.more ? { moreLink: def.more } : {}) },
    };
    n['block-instances']![`inst-gen-${id}`] = { type: 'BlockInstance', id: `inst-gen-${id}`, template: `tpl-gen-${id}`, overrides: {}, items: assigned.get(id)! };
  });
  // 【第四步】頁面
  n['pages']!['home'] = { type: 'Page', id: 'home', name: p.title ?? p.name, path: '/', codeScheme: 'flat', sections: buildSections(p) };
  return n;
}

/** 一次評估的結果 */
export interface Scored {
  choice: Option[];
  objective: number;
  evaluation: Evaluation | null;
  violations: Violation[];
}

const validator = createSchemaValidator(SCHEMAS);

/**
 * 目標函數:總分為主;同分時,有問題的對象越少越好(不合格一個扣 10、警告一個扣 1),
 * 再扣掉「欄高」「欄底對齊」的差距百分比:這兩項只要還不合格,差 60% 與差 15% 的總分相同,
 * 加上連續的差距才能引導搜尋往平衡的方向走。只影響搜尋怎麼挑,不改評估分數。
 * 第 1 層有錯誤或新聞不夠時為 −∞。
 */
export function score(base: Nested, p: Params, choice: Option[]): Scored {
  const n = buildNested(base, p, choice);
  if (!n) return { choice, objective: -Infinity, evaluation: null, violations: [] };
  const dataset = toDataset(n);
  const violations = validateDataset(dataset, { validator, presets: PRESETS });
  if (violations.some((v) => v.severity === 'error')) return { choice, objective: -Infinity, evaluation: null, violations };
  const evaluation = evaluatePage(buildWorld(dataset.files.map((f) => f.data)));
  const fails = evaluation.findings.filter((f) => f.verdict === 'fail').length;
  const warns = evaluation.findings.filter((f) => f.verdict === 'warn').length;
  const gap = evaluation.findings
    .filter((f) => f.verdict !== 'pass' && (f.item === '欄高' || f.item === '欄底對齊'))
    .reduce((g, f) => g + f.value * 100, 0);
  return { choice, objective: evaluation.total * 1000 - fails * 10 - warns - gap, evaluation, violations };
}

/** 搜尋紀錄的一行 */
export interface Step {
  note: string;
  objective: number;
  total: number | null;
}

/**
 * 搜尋最好的組合。
 * greedy:從預設值開始,逐塊試所有選項、取最好的;整頁重複到沒有改善為止(最多 4 輪)。
 * beam:逐塊展開,每一步保留目標函數最好的 k 種組合。
 */
export function search(base: Nested, p: Params): { best: Scored; steps: Step[]; evaluated: number } {
  const options = p.blocks.map(optionsFor);
  const steps: Step[] = [];
  let evaluated = 0;
  const run = (choice: Option[]) => {
    evaluated += 1;
    return score(base, p, choice);
  };
  // 【第一步】起點:每塊都用預設選項
  let best = run(options.map((o) => o[0]!));
  steps.push({ note: '起點:每塊都用預設選項', objective: best.objective, total: best.evaluation?.total ?? null });
  if (p.strategy === 'greedy') {
    // 【第二步】逐塊改良
    for (let pass = 1; pass <= 4; pass++) {
      let improved = false;
      p.blocks.forEach((id, i) => {
        let local = best;
        for (const opt of options[i]!) {
          if (opt === best.choice[i]) continue;
          const trial = run(best.choice.map((c, k) => (k === i ? opt : c)));
          if (trial.objective > local.objective) local = trial;
        }
        if (local !== best) {
          steps.push({ note: `第 ${pass} 輪:${id} 改為 ${local.choice[i]!.label}`, objective: local.objective, total: local.evaluation?.total ?? null });
          best = local;
          improved = true;
        }
      });
      if (!improved) break;
    }
  } else {
    // 【第二步】集束搜尋
    const k = p.beamWidth ?? 3;
    let beam: Scored[] = [best];
    p.blocks.forEach((id, i) => {
      const next: Scored[] = [];
      const seen = new Set<string>();
      for (const b of beam) {
        for (const opt of options[i]!) {
          const choice = b.choice.map((c, j) => (j === i ? opt : c));
          const key = choice.map((c) => c.label).join('|');
          if (seen.has(key)) continue;
          seen.add(key);
          next.push(run(choice));
        }
      }
      // 目標函數由大到小;同分時保持展開順序(確定性)
      beam = next
        .map((s, idx) => ({ s, idx }))
        .sort((a, b) => b.s.objective - a.s.objective || a.idx - b.idx)
        .slice(0, k)
        .map((x) => x.s);
      steps.push({ note: `第 ${i + 1} 步:${id} 保留前 ${k} 名,最好是 ${beam[0]!.choice[i]!.label}`, objective: beam[0]!.objective, total: beam[0]!.evaluation?.total ?? null });
    });
    if (beam[0]!.objective > best.objective) best = beam[0]!;
  }
  return { best, steps, evaluated };
}
