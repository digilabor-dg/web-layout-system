// 模型函式的測試:比例、裝置分類、容器內容寬、平板欄數、版位代號、手機順序、自然換列。

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRESETS } from '../../src/assets.js';
import { flowRows, itemCode, mobileSequence, placements } from '../../src/model/page.js';
import { parseRatio, ratioError } from '../../src/model/ratio.js';
import { deriveTabletCols, entryFor } from '../../src/model/responsive.js';
import { contentWidth, deviceClass, parseLength, resolveSite, usesDesktopStructure } from '../../src/model/site.js';
import type { Page, SiteProfile } from '../../src/model/types.js';
import { FIXTURES, readJson } from '../helpers/fixture.js';

const fx = (name: string) => readJson<Record<string, unknown>>(join(FIXTURES, 'model', name));
const REPO = join(import.meta.dirname, '..', '..');

describe('比例', () => {
  const data = fx('ratios.json') as {
    parse: { ratio: string; expected: number }[];
    error: { name: string; width: number; height: number; ratio: string; within1pct: boolean }[];
  };
  it.each(data.parse)('$ratio → $expected', ({ ratio, expected }) => {
    expect(parseRatio(ratio)).toBeCloseTo(expected, 10);
  });
  it.each(data.error)('$name', ({ width, height, ratio, within1pct }) => {
    expect(ratioError(width / height, parseRatio(ratio)) <= 0.01).toBe(within1pct);
  });
  it('格式錯誤時丟出例外', () => {
    expect(() => parseRatio('3x2')).toThrow();
  });
});

describe('裝置分類與主切換點', () => {
  const data = fx('device-classes.json') as {
    presets: string[];
    expected: Record<string, string>;
    mainSwitch: Record<string, number>;
  };
  it.each(data.presets)('%s 的 6 種測試寬度分類與其他預設參數組相同', (id) => {
    const bp = PRESETS[id]!.breakpoints;
    for (const [w, cls] of Object.entries(data.expected)) expect(deviceClass(Number(w), bp)).toBe(cls);
  });
  it.each(data.presets)('%s 的主切換點是 tablet-H 的起點', (id) => {
    const bp = PRESETS[id]!.breakpoints;
    const sw = data.mainSwitch[id]!;
    expect(bp.tabletH).toBe(sw);
    expect(usesDesktopStructure(deviceClass(sw - 1, bp))).toBe(false);
    expect(usesDesktopStructure(deviceClass(sw, bp))).toBe(true);
  });
});

describe('長度與內容寬度', () => {
  it('rem 與 px', () => {
    expect(parseLength('1rem')).toBe(16);
    expect(parseLength('1.5rem')).toBe(24);
    expect(parseLength('24px')).toBe(24);
    expect(() => parseLength('2em')).toThrow();
  });
  const data = fx('content-width.json') as { site: string; expected: Record<string, number>; fluid: Record<string, number> };
  const site = resolveSite(readJson<SiteProfile>(join(REPO, data.site)), PRESETS);
  it.each(Object.entries(data.expected))('範例站 %spx 的內容寬為 %ipx', (w, expected) => {
    expect(contentWidth(Number(w), site)).toBe(expected);
  });
  it.each(Object.entries(data.fluid))('fluid section 在 %spx 不受最大寬限制:%ipx', (w, expected) => {
    expect(contentWidth(Number(w), site, true)).toBe(expected);
  });
  it('custom 網站設定缺少斷點時丟出例外', () => {
    const profile = { ...readJson<SiteProfile>(join(REPO, data.site)), preset: 'custom' as const };
    expect(() => resolveSite(profile, PRESETS)).toThrow();
  });
});

describe('平板欄數', () => {
  const data = fx('tablet-cols.json') as { cases: { mobile: number; desktop: number; expected: number }[] };
  it.each(data.cases)('手機 $mobile、電腦 $desktop → 平板 $expected', ({ mobile, desktop, expected }) => {
    expect(deriveTabletCols(mobile, desktop)).toBe(expected);
  });
  it('tablet-V 用手機結構、tablet-H 用電腦結構,整數欄數改用推算值', () => {
    const rd = { mobile: { layout: 'stack' as const }, desktop: { layout: 'split' as const, cols: [8, 4] } };
    expect(entryFor(rd, 'tablet-V').layout).toBe('stack');
    expect(entryFor(rd, 'tablet-H')).toEqual({ layout: 'split', cols: [8, 4] });
    const grid = { mobile: { layout: 'grid' as const, cols: 2 }, desktop: { layout: 'grid' as const, cols: 4 } };
    expect(entryFor(grid, 'tablet-V').cols).toBe(3);
    expect(entryFor(grid, 'tablet-H').cols).toBe(3);
  });
});

describe('版位代號與閱讀順序', () => {
  const data = fx('page-codes.json') as {
    page: Page;
    flat: string[];
    sectioned: string[];
    itemCodes: { block: string; ordinal: number; expected: string }[];
    mobileDefault: string[];
    mobileOrder: { section: number; order: string[]; expected: string[] };
    flowRows: { spans: number[]; expected: string[][] };
  };
  it('flat 編號', () => {
    expect(placements(data.page).map((p) => p.code)).toEqual(data.flat);
  });
  it('sectioned 編號', () => {
    expect(placements({ ...data.page, codeScheme: 'sectioned' }).map((p) => p.code)).toEqual(data.sectioned);
  });
  it('移動區塊後代號重新推算,id 不變', () => {
    const moved = structuredClone(data.page);
    const col = (moved.sections[0] as Extract<Page['sections'][number], { mode: 'stack' }>).columns;
    col[0]!.blocks.push(col[1]!.blocks.shift()!);
    const codes = Object.fromEntries(placements(moved).map((p) => [p.instance, p.code]));
    expect(codes).toEqual({ a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' });
    expect(placements(moved).map((p) => p.instance)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it.each(data.itemCodes)('則的代號 $block + $ordinal → $expected', ({ block, ordinal, expected }) => {
    expect(itemCode(block, ordinal)).toBe(expected);
  });
  it('手機預設順序:各欄依序串起來', () => {
    expect(mobileSequence(data.page)).toEqual(data.mobileDefault);
  });
  it('手機順序可由 mobileOrder 指定', () => {
    const page = structuredClone(data.page);
    page.sections[data.mobileOrder.section]!.mobileOrder = data.mobileOrder.order;
    expect(mobileSequence(page)).toEqual(data.mobileOrder.expected);
  });
  it('flow section 累計超過 12 自然換列', () => {
    const blocks = data.flowRows.spans.map((s, i) => ({ instance: `b${i + 1}`, span: { mobile: 12, desktop: s } }));
    expect(flowRows(blocks, 'desktop')).toEqual(data.flowRows.expected);
    expect(flowRows(blocks, 'mobile')).toEqual([['b1'], ['b2'], ['b3'], ['b4']]);
  });
});
