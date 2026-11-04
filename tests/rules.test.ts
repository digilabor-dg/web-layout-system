// 第 1 層規則的資料驅動測試:每條規則一份 fixture,每份有合法與不合法的案例。

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRESETS, SCHEMAS } from '../src/assets.js';
import { createSchemaValidator, RULES, validateDataset, type Violation } from '../src/validate/index.js';
import { FIXTURES, applyPatch, listFixtures, loadBase, readJson, toDataset, type PatchOp } from './helpers/fixture.js';

/** fixture 的形狀 */
interface RuleFixture {
  rule: string;
  base: string;
  cases: { name: string; patch: PatchOp[]; expect: { rule: string; id: string; severity: string }[] }[];
}

// schema 只編譯一次,所有案例共用
const validator = createSchemaValidator(SCHEMAS);

/** 只留下要比對的欄位,去除重複並排序(同一份資料可能有多筆 schema 錯誤,只看觸發了哪些代號) */
function brief(vs: { rule: string; id: string; severity: string }[]) {
  return [...new Set(vs.map(({ rule, id, severity }) => `${rule}|${id}|${severity}`))].sort();
}

const files = listFixtures('rules');

describe('規則 fixture 的完整性', () => {
  it('每個規則代號都有一份 fixture', () => {
    expect(files.map((f) => f.replace(/\.json$/, '')).sort()).toEqual(Object.keys(RULES).sort());
  });

  it.each(files)('%s 至少有一個合法與一個不合法的案例,且不合法案例會觸發該代號', (file) => {
    const fx = readJson<RuleFixture>(join(FIXTURES, 'rules', file));
    expect(fx.cases.some((c) => c.expect.length === 0)).toBe(true);
    const bad = fx.cases.filter((c) => c.expect.length > 0);
    expect(bad.length).toBeGreaterThan(0);
    for (const c of bad) expect(c.expect.some((e) => e.rule === fx.rule)).toBe(true);
  });
});

for (const file of files) {
  const fx = readJson<RuleFixture>(join(FIXTURES, 'rules', file));
  describe(`規則 ${fx.rule}`, () => {
    it.each(fx.cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
      // 【第一步】在基準資料集上套用這個案例的修改
      const dataset = toDataset(applyPatch(loadBase(fx.base), c.patch));
      // 【第二步】執行檢查,只比對規則代號、id 與嚴重度
      const result: Violation[] = validateDataset(dataset, { validator, presets: PRESETS });
      expect(brief(result)).toEqual(brief(c.expect));
    });
  });
}

describe('其他行為', () => {
  it('JSON 解析失敗的檔案回報 schema', () => {
    const result = validateDataset(
      { files: [{ path: 'broken.json', data: undefined, error: 'Unexpected token' }] },
      { validator, presets: PRESETS },
    );
    expect(result.some((v) => v.rule === 'schema' && v.file === 'broken.json')).toBe(true);
  });

  it('未知的 type 回報 schema', () => {
    const base = loadBase('minimal');
    const dataset = toDataset(
      applyPatch(base, [
        { op: 'add', path: '/misc', value: {} },
        { op: 'add', path: '/misc/x', value: { type: 'Banner', id: 'x' } },
      ]),
    );
    const result = validateDataset(dataset, { validator, presets: PRESETS });
    expect(brief(result)).toEqual(['schema|x|error']);
  });

  it('同樣的輸入得到逐字相同的輸出(確定性)', () => {
    const dataset = toDataset(
      applyPatch(loadBase('minimal'), [
        { op: 'remove', path: '/block-instances/inst-list/items/3' },
        { op: 'add', path: '/block-templates/tpl-grid/tabs', value: 2 },
      ]),
    );
    const a = JSON.stringify(validateDataset(dataset, { validator, presets: PRESETS }));
    const b = JSON.stringify(validateDataset(structuredClone(dataset), { schemas: SCHEMAS, presets: PRESETS }));
    expect(a).toBe(b);
  });

  it('檔案順序不同,輸出仍相同', () => {
    const dataset = toDataset(applyPatch(loadBase('minimal'), [{ op: 'remove', path: '/block-instances/inst-list/items/3' }]));
    const reversed = { files: [...dataset.files].reverse() };
    expect(validateDataset(reversed, { validator, presets: PRESETS })).toEqual(
      validateDataset(dataset, { validator, presets: PRESETS }),
    );
  });
});
