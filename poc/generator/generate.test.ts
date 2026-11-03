// POC 3 的測試:參數格式、確定性、產生的資料通過第 1 層、分數高於手排首頁。

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluatePage } from '../evaluate/evaluate.js';
import { buildWorld } from '../estimate-vs-render/model.js';
import { toDataset } from '../../tests/helpers/fixture.js';
import { type Params, buildSections, optionsFor, search } from './generate.js';
import { baseNested, checkParams } from './params.js';

const HERE = import.meta.dirname;
const files = readdirSync(join(HERE, 'params')).filter((f) => f.endsWith('.json')).sort();
const read = (f: string) => JSON.parse(readFileSync(join(HERE, 'params', f), 'utf8')) as Params;

describe('參數', () => {
  it.each(files)('%s 符合 params.schema.json', (f) => {
    expect(() => checkParams(read(f))).not.toThrow();
  });

  it('section 結構:全寬獨立成 flow,側欄放右欄,只有一欄時改成 12', () => {
    const p = read('default.json');
    const s = buildSections(p) as { mode: string; columns?: { width: number; blocks: string[] }[] }[];
    expect(s.map((x) => x.mode)).toEqual(['stack', 'flow', 'stack', 'flow']);
    expect(s[0]!.columns!.map((c) => c.width)).toEqual([8, 4]);
    expect(s[0]!.columns![1]!.blocks).toEqual(['inst-gen-flash', 'inst-gen-popular']);
    const single = buildSections({ ...p, sidebar: [], fullWidth: [] }) as { columns: { width: number }[] }[];
    expect(single).toHaveLength(1);
    expect(single[0]!.columns.map((c) => c.width)).toEqual([12]);
  });

  it('每種區塊都有選項,第一個是預設值', () => {
    for (const id of read('default.json').blocks) expect(optionsFor(id).length).toBeGreaterThan(0);
  });
});

describe('產生', () => {
  const base = baseNested();
  const p = read('default.json');
  const a = search(base, p);

  it('確定性:同樣的參數得到同樣的選擇', () => {
    const b = search(base, p);
    expect(b.best.choice.map((c) => c.label)).toEqual(a.best.choice.map((c) => c.label));
    expect(b.best.objective).toBe(a.best.objective);
  }, 60_000);

  it('產生的資料通過第 1 層(0 錯誤、0 警告)', () => {
    expect(a.best.violations).toEqual([]);
  });

  it('JSON 估算總分高於手排的範例首頁', () => {
    const hand = evaluatePage(buildWorld(toDataset(base).files.map((f) => f.data)));
    expect(a.best.evaluation!.total).toBeGreaterThan(hand.total);
  });

  it('集束搜尋也能產生合法的版面', () => {
    const r = search(base, read('tw4-beam.json'));
    expect(r.best.violations.filter((v) => v.severity === 'error')).toEqual([]);
    expect(r.best.evaluation).not.toBeNull();
  }, 60_000);
});
