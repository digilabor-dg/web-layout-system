// POC 2 的評分:對一個頁面跑第 2、3 層「可由 JSON 估算」的項目。
// 每個項目在 6 種寬度各判一次,依「項目 + 對象」取最差的那次;再依 8 個面向給分。

import { deviceClass, desktopColumns, mobileSequence, usesDesktopStructure } from '../../src/index.js';
import { type BlockEstimate, estimateBlock } from '../estimate-vs-render/estimate.js';
import { type Block, type World, blockLayout, blockWidth } from '../estimate-vs-render/model.js';
import {
  ROLE_ITEMS,
  type Verdict,
  RANK,
  blockCount,
  fillRate,
  higherBetter,
  lastRow,
  lowerBetter,
  pageItems,
  sameTypeRun,
  titleLines,
} from './checks.js';

/** 8 個面向 */
export const FACETS = ['比例', '對齊', '完整', '密度', '節奏', '層級', '文字', '可用性'] as const;
export type Facet = (typeof FACETS)[number];

/** 需要渲染才能量的面向(JSON 階段不給分) */
export const RENDER_ONLY: Facet[] = ['比例', '可用性'];

/** 一項判定結果 */
export interface Finding {
  /** 項目名稱,例如「同型不連續」 */
  item: string;
  layer: 2 | 3;
  facet: Facet;
  /** 對象:版位代號、section id 或「整頁」(給人看;區塊搬動後代號會重排) */
  target: string;
  /** 穩定的參照:區塊用實例 id、section 用 section id;比對 V1、V2 時用它 */
  ref: string;
  verdict: Verdict;
  /** 最差那次的寬度;與寬度無關的項目為 null */
  width: number | null;
  value: number;
  /** 給人看的數字說明 */
  display: string;
  /** 改進建議(合格時為空字串) */
  suggestion: string;
  /** POC 新增、規格沒有的項目 */
  poc?: boolean;
}

/** 評分結果 */
export interface Evaluation {
  findings: Finding[];
  scores: Record<Facet, number | null>;
  total: number;
  pageVerdict: Verdict;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** 每次扣分:不合格 30 分、警告 10 分(經驗值,之後用數據校正) */
export const PENALTY: Record<Verdict, number> = { pass: 0, warn: 10, fail: 30 };

/**
 * 對一個頁面評分。
 * rendered 是渲染量測的結果(render-audit.ts);沒傳時,比例與可用性兩個面向不給分。
 */
export function evaluatePage(world: World, rendered?: Finding[]): Evaluation {
  return scoreFindings([...jsonFindings(world), ...(rendered ?? [])], rendered !== undefined);
}

/** 可由 JSON 估算的項目 */
export function jsonFindings(world: World): Finding[] {
  const { profile, site, page, blocks } = world;
  const s = profile.spacing;
  const byCode = new Map(blocks.map((b) => [b.code, b]));
  const byInstance = new Map(blocks.map((b) => [b.instance.id, b]));
  const raw: Finding[] = [];
  // 小工具:記一筆判定;ref 沒給時由 target 推回實例 id(代號 → 實例,section 與整頁照原樣)
  const add = (f: Omit<Finding, 'suggestion' | 'ref'> & { suggestion?: string; ref?: string }) =>
    raw.push({ ...f, ref: f.ref ?? refOf(world, f.target), suggestion: f.verdict === 'pass' ? '' : (f.suggestion ?? '') });

  // 【第一步】逐一寬度估算每一塊
  for (const { width, height } of profile.testViewports) {
    const device = deviceClass(width, site.breakpoints);
    const mobile = device === 'mobile';
    const est = new Map<string, BlockEstimate>(blocks.map((b) => [b.code, estimateBlock(world, b, width, 'greedy')]));

    for (const b of blocks) {
      const e = est.get(b.code)!;
      const layout = blockLayout(b, device);
      // 第 2 層 · 末列不落單(格線)
      if (layout.kind === 'grid' && layout.cols! > 1) {
        const n = b.items.length;
        const c = layout.cols!;
        add({
          item: '末列不落單', layer: 2, facet: '完整', target: b.code, width,
          verdict: lastRow(n, c), value: n % c, display: `${n} 則 ÷ ${c} 欄,餘 ${n % c}`,
          suggestion: `${b.code} 在 ${width}px 為 ${c} 欄、${n} 則;則數改成 ${c} 的倍數,或調整這類裝置的欄數`,
        });
      }
      // 第 2 層 · 區塊長度(只看手機)
      if (mobile) {
        const screens = e.height / height;
        add({
          item: '區塊長度', layer: 2, facet: '密度', target: b.code, width,
          verdict: lowerBetter(screens, 1.5, 2), value: screens, display: `${screens.toFixed(2)} 屏`,
          suggestion: `${b.code} 在手機約 ${screens.toFixed(1)} 屏;改輪播、加「看更多」或減少則數`,
        });
      }
      // 第 2 層 · 標題行數(一般標題取最多的那則;疊字另判)
      const maxLines = Math.max(0, ...e.titles.map((t) => t.lines));
      if (maxLines > 0) {
        add({
          item: '標題行數', layer: 2, facet: '文字', target: b.code, width,
          verdict: titleLines(maxLines, mobile, false), value: maxLines, display: `最多 ${maxLines} 行`,
          suggestion: `${b.code} 在 ${width}px 有標題 ${maxLines} 行;限制字數、加寬欄或降低文字量`,
        });
      }
      if (e.parts.overlayLines !== undefined) {
        const n = e.parts.overlayLines;
        const avail = blockWidth(world, b, width) - 32;
        const maxChars = Math.floor((avail / profile.typography.headingFontSize.lead) * 2);
        add({
          item: '標題行數', layer: 2, facet: '文字', target: `${b.code}(疊字)`, width,
          verdict: titleLines(n, mobile, true), value: n, display: `疊字標題 ${n} 行`,
          suggestion: `${b.code} 的疊字標題在 ${width}px 估 ${n} 行,超過上限 2 行;標題縮到約 ${maxChars} 字以內,或手機改用 P02 大圖下文`,
        });
      }
      // 第 2 層 · 欄底對齊(首則與清單左右並排)
      if (e.parts.columns) {
        const [l, r] = e.parts.columns;
        const diff = Math.abs(l - r) / Math.max(l, r);
        const shorter = l < r ? '左欄' : '右欄';
        add({
          item: '欄底對齊', layer: 2, facet: '對齊', target: b.code, width,
          verdict: lowerBetter(diff, 0.05, 0.1), value: diff, display: `兩欄高差 ${pct(diff)}(左 ${Math.round(l)}px、右 ${Math.round(r)}px)`,
          suggestion: `${b.code} 的${shorter}較短 ${pct(diff)};調整左右比例(例如 8:4 改 7:5)、調整則數,或換成不怕高度差的型`,
        });
      }
      // 第 2 層 · 填充率(左圖右文)
      if (e.parts.fill) {
        const worst = e.parts.fill.reduce((a, x) => (Math.abs(x - 0.75) > Math.abs(a - 0.75) ? x : a));
        add({
          item: '填充率', layer: 2, facet: '密度', target: b.code, width,
          verdict: e.parts.fill.map(fillRate).reduce((a, v) => (RANK[v] > RANK[a] ? v : a), 'pass' as Verdict), value: worst,
          display: `文字區 ÷ 圖高 = ${pct(worst)}`,
          suggestion: worst < 0.6
            ? `${b.code} 的文字只佔圖高 ${pct(worst)}(右邊太空);加長摘要、加 META 或相關連結,或把左右比例改成 6:6`
            : `${b.code} 的文字佔圖高 ${pct(worst)}(太擠);縮短摘要或加大圖片比例`,
        });
      }
      // 第 2 層 · 列距(卡片間距 ÷ 卡片內圖文距)
      if (layout.kind === 'grid' || layout.kind === 'list-card' || layout.kind === 'carousel') {
        const gap = layout.kind === 'grid' ? s.rowGap : layout.kind === 'list-card' ? s.itemGap : site.gutterPx;
        const ratio = gap / s.imageTextGap;
        add({
          item: '列距', layer: 2, facet: '節奏', target: b.code, width,
          verdict: ratio >= 2 - 1e-9 ? 'pass' : 'warn', value: ratio, display: `${gap}px ÷ ${s.imageTextGap}px = ${ratio.toFixed(1)} 倍`,
          suggestion: `${b.code} 的卡片間距只有圖文距的 ${ratio.toFixed(1)} 倍;加大列距`,
        });
      }
      // POC 新增 · 輪播填滿:則數少於一次顯示的張數,右側會留白
      if (layout.kind === 'carousel') {
        const need = Math.ceil(layout.perView!);
        add({
          item: '輪播填滿', layer: 2, facet: '密度', target: b.code, width, poc: true,
          verdict: b.items.length >= need ? 'pass' : 'warn', value: b.items.length, display: `${b.items.length} 則,一次顯示 ${layout.perView} 張`,
          suggestion: `${b.code} 只有 ${b.items.length} 則,少於 ${width}px 一次顯示的 ${layout.perView} 張;增加則數,或減少一次顯示的張數`,
        });
      }
    }

    // 第 3 層 · 手機首屏:390×844 首屏內頭條圖高佔比
    if (width === 390) {
      let y = 0;
      for (const id of mobileSequence(page)) {
        const b = byInstance.get(id)!;
        const e = est.get(b.code)!;
        if (b.template.role === 'headline') {
          const top = y + s.blockHeadingHeight;
          const visible = Math.max(0, Math.min(top + (e.parts.imageHeight ?? 0), height) - top);
          const share = visible / height;
          add({
            item: '手機首屏', layer: 3, facet: '層級', target: b.code, width,
            verdict: lowerBetter(share, 0.4, 0.6), value: share, display: `頭條圖佔首屏 ${pct(share)}`,
            suggestion: `頭條圖佔手機首屏 ${pct(share)};頭條改用 P02,或降低圖高`,
          });
          break;
        }
        y += e.height + s.blockGap;
      }
    }

    // 第 3 層 · 欄高(stack section 在電腦結構下的各欄總高)
    if (usesDesktopStructure(device)) {
      page.sections.forEach((sec) => {
        if (sec.mode !== 'stack' || sec.columns.length < 2) return;
        const hs = sec.columns.map((c) =>
          c.blocks.reduce((h, id, i) => h + est.get(byInstance.get(id)!.code)!.height + (i > 0 ? s.blockGap : 0), 0),
        );
        const hi = Math.max(...hs);
        const lo = Math.min(...hs);
        const diff = (hi - lo) / hi;
        const tallCol = hs.indexOf(hi);
        const codes = (ci: number) => sec.columns[ci]!.blocks.map((id) => byInstance.get(id)!.code).join('、');
        add({
          item: '欄高', layer: 3, facet: '對齊', target: `section ${sec.id}`, width,
          verdict: lowerBetter(diff, 0.05, 0.1), value: diff,
          display: `${hs.map((h) => `${Math.round(h)}px`).join(' / ')},差 ${pct(diff)}`,
          suggestion: `section ${sec.id} 的${tallCol === 0 ? '左欄' : '右欄'}(${codes(tallCol)})比另一欄高 ${pct(diff)};把較高那欄的一塊移到另一欄,或在較矮的欄加一塊`,
        });
      });
    }
  }

  // 【第二步】與寬度無關的第 3 層項目
  // 間距節奏
  const rhythm = s.blockGap / s.itemGap;
  add({
    item: '間距節奏', layer: 3, facet: '節奏', target: '整頁', width: null,
    verdict: higherBetter(rhythm, 2, 1.5), value: rhythm, display: `區塊間距 ${s.blockGap}px ÷ 則間距 ${s.itemGap}px = ${rhythm.toFixed(1)} 倍`,
    suggestion: '區塊間距至少是則間距的 2 倍',
  });
  // 同型不連續與放大型不相鄰:手機順序與電腦各欄分別看
  const sequences = [mobileSequence(page), ...desktopColumns(page)].map((seq) => seq.map((id) => byInstance.get(id)!));
  const runs = new Map<string, number>();
  const zoomPairs = new Set<string>();
  for (const seq of sequences) {
    let start = 0;
    for (let i = 1; i <= seq.length; i++) {
      // 連續同型的一段結束時,記下這一段
      if (i === seq.length || seq[i]!.pattern.id !== seq[start]!.pattern.id) {
        if (i - start >= 2) {
          const key = seq.slice(start, i).map((b) => b.code).join('、');
          runs.set(key, Math.max(runs.get(key) ?? 0, i - start));
        }
        start = i;
      }
      // 相鄰兩塊都帶放大標籤
      if (i < seq.length && seq[i]!.pattern.tags.includes('zoom') && seq[i - 1]!.pattern.tags.includes('zoom')) {
        zoomPairs.add(`${seq[i - 1]!.code}、${seq[i]!.code}`);
      }
    }
  }
  if (runs.size === 0) {
    add({ item: '同型不連續', layer: 3, facet: '節奏', target: '整頁', width: null, verdict: 'pass', value: 1, display: '沒有相鄰的同型區塊' });
  }
  for (const [codes, run] of runs) {
    const first = byCode.get(codes.split('、')[0]!)!;
    add({
      item: '同型不連續', layer: 3, facet: '節奏', target: codes, width: null,
      verdict: sameTypeRun(run), value: run, display: `${codes} 連續 ${run} 塊都是 ${first.pattern.id}`,
      suggestion: `${codes} 連續使用 ${first.pattern.id};把中間那塊換成同分組(${first.pattern.group})的其他型,或和其他區塊交錯排列`,
    });
  }
  add({
    item: '放大型不相鄰', layer: 3, facet: '層級', target: zoomPairs.size ? [...zoomPairs].join(';') : '整頁', width: null,
    verdict: zoomPairs.size ? 'warn' : 'pass', value: zoomPairs.size, display: zoomPairs.size ? `相鄰的放大型 ${zoomPairs.size} 組` : '沒有相鄰的放大型',
    suggestion: '相鄰的放大型會搶重點;把其中一塊換成不放大的型(例如 P07、P03)',
  });
  // 區塊數、整頁則數
  const totalItems = blocks.reduce((n, b) => n + b.items.length, 0);
  add({
    item: '區塊數', layer: 3, facet: '密度', target: '整頁', width: null,
    verdict: blockCount(blocks.length), value: blocks.length, display: `${blocks.length} 塊`,
    suggestion: '首頁建議 10~15 塊',
  });
  add({
    item: '整頁則數', layer: 3, facet: '密度', target: '整頁', width: null,
    verdict: pageItems(totalItems), value: totalItems, display: `${totalItems} 則`,
    suggestion: '整頁建議 30~80 則',
  });
  // 單塊不重複
  for (const role of ['headline', 'popular', 'flash']) {
    const n = blocks.filter((b) => b.template.role === role).length;
    add({
      item: '單塊不重複', layer: 3, facet: '層級', target: role, width: null,
      verdict: n <= 1 ? 'pass' : 'fail', value: n, display: `${role} ${n} 塊`,
      suggestion: `${role} 只能有一塊,目前 ${n} 塊`,
    });
  }
  // 用途則數
  for (const b of blocks) {
    const range = ROLE_ITEMS[b.template.role];
    if (!range) continue;
    const n = b.items.length;
    const ok = n >= range[0] && n <= range[1];
    add({
      item: '用途則數', layer: 3, facet: '密度', target: b.code, width: null,
      verdict: ok ? 'pass' : 'warn', value: n, display: `${b.template.role} ${n} 則(建議 ${range[0]}–${range[1]})`,
      suggestion: `${b.code}(${b.template.role})建議 ${range[0]}–${range[1]} 則,目前 ${n} 則`,
    });
  }

  return mergeWorst(raw);
}

/** 由顯示用的對象推回穩定參照:「F、G、H」→ 三個實例 id;「A(疊字)」→ 實例 id + #overlay */
export function refOf(world: World, target: string): string {
  const codeToId = new Map(world.blocks.map((b) => [b.code, b.instance.id]));
  return target
    .split(/[、;]/)
    .map((t) => {
      const overlay = t.endsWith('(疊字)');
      const code = overlay ? t.slice(0, -4) : t;
      const id = codeToId.get(code);
      return id ? `${id}${overlay ? '#overlay' : ''}` : t;
    })
    .join('+');
}

/** 依「項目 + 參照」取最差的那次(同樣差時取第一次出現的寬度) */
export function mergeWorst(raw: Finding[]): Finding[] {
  const merged = new Map<string, Finding>();
  for (const f of raw) {
    const key = `${f.item}|${f.ref}`;
    const prev = merged.get(key);
    if (!prev || RANK[f.verdict] > RANK[prev.verdict]) merged.set(key, f);
  }
  return [...merged.values()];
}

/** 由判定結果算分數與整頁判定;rendered 為 false 時,需要渲染的面向不給分 */
export function scoreFindings(findings: Finding[], rendered: boolean): Evaluation {
  // 【第四步】面向分數:100 − 各項目的扣分;沒有渲染量測時,需要渲染的面向不給分。
  // 同 Lighthouse:一個項目只扣一次(取最差的對象),有問題的對象列在明細裡,分數不因區塊多而放大
  const scores = Object.fromEntries(
    FACETS.map((facet) => {
      if (!rendered && RENDER_ONLY.includes(facet)) return [facet, null];
      const penalty = itemVerdicts(findings.filter((f) => f.facet === facet)).reduce((p, [, v]) => p + PENALTY[v], 0);
      return [facet, Math.max(0, 100 - penalty)];
    }),
  ) as Record<Facet, number | null>;
  const valid = Object.values(scores).filter((v): v is number => v !== null);
  const total = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  // 【第五步】整頁判定:任一項目不合格,或 3 個以上項目警告,即不合格
  const items = itemVerdicts(findings);
  const fails = items.filter(([, v]) => v === 'fail').length;
  const warns = items.filter(([, v]) => v === 'warn').length;
  const pageVerdict: Verdict = fails > 0 || warns >= 3 ? 'fail' : warns > 0 ? 'warn' : 'pass';
  return { findings, scores, total, pageVerdict };
}

/** 每個項目的最終判定:取所有對象中最差的那個 */
export function itemVerdicts(findings: Finding[]): [string, Verdict][] {
  const m = new Map<string, Verdict>();
  for (const f of findings) {
    const prev = m.get(f.item);
    if (!prev || RANK[f.verdict] > RANK[prev]) m.set(f.item, f.verdict);
  }
  return [...m];
}

/** 排序:不合格 → 警告 → 合格;同級依面向、項目、對象 */
export function sortFindings(fs: Finding[]): Finding[] {
  return [...fs].sort(
    (a, b) =>
      RANK[b.verdict] - RANK[a.verdict] ||
      FACETS.indexOf(a.facet) - FACETS.indexOf(b.facet) ||
      a.item.localeCompare(b.item, 'zh-Hant') ||
      a.target.localeCompare(b.target, 'en'),
  );
}

/** 同一頁所有塊的估算(供報告顯示) */
export function blockOf(world: World, code: string): Block | undefined {
  return world.blocks.find((b) => b.code === code);
}
