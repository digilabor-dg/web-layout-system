// 人評對齊的測試:區塊分數換算、等級相關、A/B 一致率、反饋覆蓋率。

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { judge, runFiles, summarize } from '../feedback/coverage.js';
import { spearman } from './analyze.js';
import { align, load } from './align.js';
import { blockScore, type Layout } from './collect.js';

describe('區塊的程式分數(0~10)', () => {
  it('沒有問題是 10 分;不合格扣 3、警告扣 1;同一項目只扣一次', () => {
    expect(blockScore([])).toBe(10);
    expect(blockScore([{ item: '末列不落單', verdict: 'fail' }, { item: '標題行數', verdict: 'warn' }])).toBe(6);
    expect(blockScore([{ item: '觸控目標', verdict: 'fail' }, { item: '觸控目標', verdict: 'fail' }])).toBe(7);
    expect(blockScore(Array.from({ length: 5 }, (_, i) => ({ item: `x${i}`, verdict: 'fail' as const })))).toBe(0);
  });
});

describe('等級相關', () => {
  it('完全同序為 1、完全反序為 −1;同分取平均名次', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(spearman([1, 1, 2], [1, 1, 2])).toBeCloseTo(1);
  });
  it('少於 3 筆或某一邊沒有變化時為 null', () => {
    expect(spearman([1, 2], [1, 2])).toBeNull();
    expect(spearman([5, 5, 5], [1, 2, 3])).toBeNull();
  });
});

describe('A/B 一致率', () => {
  const layouts: Layout[] = [
    { id: 'x', title: 'X', group: 'g', total: 80, verdict: 'fail', blocks: [] },
    { id: 'y', title: 'Y', group: 'g', total: 70, verdict: 'fail', blocks: [] },
  ];
  it('選程式分數高的那一版算一致;差不多不計', () => {
    const r = align(layouts, [], [
      { rater: 'p', source: 'human', a: 'x', b: 'y', winner: 'x', reason: '' },
      { rater: 'q', source: 'human', a: 'y', b: 'x', winner: 'y', reason: '比較清爽' },
      { rater: 's', source: 'human', a: 'x', b: 'y', winner: 'tie', reason: '' },
    ]);
    expect(r.ab).toMatchObject({ total: 2, agree: 1 });
    expect(r.ab.perPair[0]).toMatchObject({ agree: 1, disagree: 1, tie: 1 });
  });
});

describe('評分檔的輪次', () => {
  it('有 round 時,評分者名稱加上輪次,兩輪分開計算', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rating-'));
    const file = (round: number | undefined) => {
      const f = join(dir, `r${round ?? 0}.json`);
      const body = { set: 'default', rater: 'persona-x', source: 'ai-persona', ...(round ? { round } : {}), ratings: [{ ref: 'r1', code: 'A', score: 5, comment: '' }] };
      writeFileSync(f, JSON.stringify(body));
      return f;
    };
    expect(load(file(undefined), []).ratings[0]!.rater).toBe('persona-x');
    expect(load(file(1), []).ratings[0]!.rater).toBe('persona-x · 第 1 輪');
    expect(load(file(2), []).ratings[0]).toMatchObject({ rater: 'persona-x · 第 2 輪', layout: 'gen-default' });
  });
  it('只給各軸強度、沒有喜好分數的評分(受訓評估員),不參與區塊評分的對齊', () => {
    const f = join(mkdtempSync(join(tmpdir(), 'rating-')), 'panel.json');
    const ratings = [
      { ref: 'r1', code: 'A', axes: { 大小: 2 }, comment: '' },
      { ref: 'r2', code: 'B', score: null, axes: { 數量: -1 }, comment: '' },
      { ref: 'r3', code: 'C', score: 6, comment: '' },
    ];
    writeFileSync(f, JSON.stringify({ set: 'default', rater: 'persona-p', source: 'ai-persona', ratings }));
    expect(load(f, []).ratings.map((r) => r.code)).toEqual(['C']);
  });
});

describe('反饋覆蓋率', () => {
  it('範例 02 的擬人評估:3 句中只有「末列落單」被對應的項目覆蓋', () => {
    const results = runFiles([join(import.meta.dirname, '..', 'feedback', 'entries', '02-tablet-persona.json')]);
    const s = summarize(results);
    expect(s).toMatchObject({ dislikes: 3, covered: 1 });
    expect(s.uncovered.map((u) => u.id)).toEqual(['02-2', '02-3']);
  });
  it('同一塊剛好有別的問題,不算覆蓋', () => {
    const entry = { id: 't', source: 'human' as const, report: '', width: 768 as const, ref: 'r1', sentiment: 'dislike' as const, text: '輪播被切掉', mapped: '輪播填滿' };
    const report = { findings: [{ item: '觸控目標', verdict: 'fail', ref: 'r1', display: '37px' }] } as never;
    expect(judge(entry, report).agree).toBe(false);
  });
});
