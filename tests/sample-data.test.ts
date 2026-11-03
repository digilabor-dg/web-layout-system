// 範例資料的測試:通過第 1 層、首頁 A~M、61 則、9 種型,以及 38 型與 7 種內容類型的內容。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRESETS, SCHEMAS } from '../src/assets.js';
import { placements } from '../src/model/page.js';
import type { BlockInstance, BlockTemplate, ContentType, LayoutPattern, Page, SiteProfile } from '../src/model/types.js';
import { loadDataset } from '../src/node/load.js';
import { validateDataset } from '../src/validate/index.js';

const dataset = loadDataset(join(import.meta.dirname, '..', 'data'));
/** 依 type 取出全部資料 */
function all<T>(type: string): T[] {
  return dataset.files.map((f) => f.data as { type: string }).filter((d) => d.type === type) as T[];
}
const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));

describe('範例資料', () => {
  it('通過第 1 層:0 個錯誤、0 個警告', () => {
    expect(validateDataset(dataset, { schemas: SCHEMAS, presets: PRESETS })).toEqual([]);
  });

  it('網站設定:平面、3:2、bs5、欄距 1rem', () => {
    const [site] = all<SiteProfile>('SiteProfile');
    expect(site).toMatchObject({ mediaKind: 'print', mainRatio: '3:2', preset: 'bs5', grid: { gutter: '1rem' } });
  });

  it('38 種展示類型,依用途分組 12/5/4/11/6', () => {
    const patterns = all<LayoutPattern>('LayoutPattern');
    expect(patterns).toHaveLength(38);
    const count = (g: string) => patterns.filter((p) => p.group === g).length;
    expect([count('news-combo'), count('av'), count('data'), count('text-led'), count('interactive')]).toEqual([12, 5, 4, 11, 6]);
  });

  it('型 21~38 的響應式尚未定義(null),型 01~20 都有', () => {
    for (const p of all<LayoutPattern>('LayoutPattern')) {
      expect(p.responsiveDefault === null).toBe(Number(p.id.slice(1)) > 20);
    }
  });

  it('P09 依規格:電腦 split [8,4]、手機 stack', () => {
    const p09 = byId(all<LayoutPattern>('LayoutPattern')).get('P09')!;
    expect(p09.responsiveDefault).toEqual({ mobile: { layout: 'stack' }, desktop: { layout: 'split', cols: [8, 4] } });
    expect(p09.items).toEqual({ min: 4, max: 6 });
  });

  it('7 種內容類型;新聞的建議搭配含 P05;只有影音需要 16:9', () => {
    const types = byId(all<ContentType>('ContentType'));
    expect([...types.keys()].sort()).toEqual(['chart', 'feature', 'flash', 'news', 'opinion', 'promo', 'video']);
    expect(types.get('news')!.suggestedPatterns).toContain('P05');
    expect([...types.values()].filter((t) => t.requiresVideo).map((t) => t.id)).toEqual(['video']);
  });

  it('首頁:版位代號推算為 A~M,共 61 則,用到 9 種型', () => {
    const [home] = all<Page>('Page');
    const ps = placements(home!);
    expect(ps.map((p) => p.code).join('')).toBe('ABCDEFGHIJKLM');
    const instances = byId(all<BlockInstance>('BlockInstance'));
    const templates = byId(all<BlockTemplate>('BlockTemplate'));
    const used = ps.map((p) => templates.get(instances.get(p.instance)!.template)!);
    expect(ps.reduce((n, p) => n + instances.get(p.instance)!.items.length, 0)).toBe(61);
    expect(new Set(used.map((t) => t.pattern)).size).toBe(9);
    expect(used.map((t) => t.pattern).join(' ')).toBe('P01 P07 P06 P05 P12 P09 P09 P09 P14 P07 P17 P07 P13');
  });

  it('C、D、K 在側欄', () => {
    const [home] = all<Page>('Page');
    const side = placements(home!).filter((p) => p.columnIndex === 1).map((p) => p.code);
    expect(side).toEqual(['C', 'D', 'K']);
  });
});

describe('展示類型資料與 spec 表格一致', () => {
  // 【第一步】從 spec 的表格讀出 38 列:| id | 名稱 | 標籤 | 則數 | 圖片角色 |
  const spec = readFileSync(join(import.meta.dirname, '..', 'openspec', 'specs', 'layout-patterns', 'spec.md'), 'utf8');
  const rows = spec
    .split('\n')
    .filter((l) => /^\| P\d{2} \|/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const patterns = byId(all<LayoutPattern>('LayoutPattern'));

  /** 則數欄位的文字 → { min, max };「不限」為 1 以上;「1 則圖輯」為 1 */
  function parseItems(text: string): { min: number; max: number | null } {
    if (text.startsWith('不限')) return { min: 1, max: null };
    const range = /(\d+)–(\d+)/.exec(text);
    if (range && !text.startsWith('1 則')) return { min: Number(range[1]), max: Number(range[2]) };
    const single = /(\d+)/.exec(text);
    return { min: Number(single![1]), max: Number(single![1]) };
  }

  it('spec 表格有 38 列', () => expect(rows).toHaveLength(38));

  it.each(rows.map((r) => [r[0]!, r] as const))('%s', (id, r) => {
    const p = patterns.get(id)!;
    const [, name, tags, items, image] = r;
    // 【第二步】名稱、標籤、則數逐欄比對
    expect(p.name).toBe(name);
    expect([...p.tags].sort()).toEqual(tags!.split(',').map((t) => t.trim()).sort());
    expect({ min: p.items.min, max: p.items.max }).toEqual(parseItems(items!));
    // 【第三步】圖片角色:spec 文字裡出現的角色 = 各 slot 允許清單的聯集
    const specRoles = ['main', 'square', 'video', 'none'].filter((role) => image!.includes(role)).sort();
    const dataRoles = [...new Set(p.slots.flatMap((s) => s.image))].sort();
    expect(dataRoles).toEqual(specRoles);
  });
});
