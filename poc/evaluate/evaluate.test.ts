// POC 2 的測試:門檻邊界(合格、警告、不合格的分界點),以及範例首頁的已知問題。

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadWorld } from '../estimate-vs-render/model.js';
import { blockCount, fillRate, lastRow, lowerBetter, higherBetter, pageItems, sameTypeRun, titleLines, worse } from './checks.js';
import { evaluatePage, PENALTY } from './evaluate.js';
import { SPEC_ITEMS } from './run.js';

describe('門檻邊界', () => {
  it('越小越好:欄底對齊 5% / 10%', () => {
    expect(lowerBetter(0.05, 0.05, 0.1)).toBe('pass');
    expect(lowerBetter(0.0501, 0.05, 0.1)).toBe('warn');
    expect(lowerBetter(0.1, 0.05, 0.1)).toBe('warn');
    expect(lowerBetter(0.1001, 0.05, 0.1)).toBe('fail');
  });
  it('越大越好:間距節奏 2 倍 / 1.5 倍', () => {
    expect(higherBetter(2, 2, 1.5)).toBe('pass');
    expect(higherBetter(1.5, 2, 1.5)).toBe('warn');
    expect(higherBetter(1.49, 2, 1.5)).toBe('fail');
  });
  it('末列不落單:4 欄放 4、5、6、7 則', () => {
    expect([4, 5, 6, 7].map((n) => lastRow(n, 4))).toEqual(['pass', 'fail', 'warn', 'warn']);
    expect(lastRow(4, 3)).toBe('fail');
  });
  it('標題行數:電腦、手機、疊字', () => {
    expect([2, 3, 4].map((n) => titleLines(n, false, false))).toEqual(['pass', 'warn', 'fail']);
    expect([3, 4].map((n) => titleLines(n, true, false))).toEqual(['pass', 'fail']);
    expect([2, 3].map((n) => titleLines(n, true, true))).toEqual(['pass', 'fail']);
  });
  it('填充率 60%~90%', () => {
    expect([0.59, 0.6, 0.9, 0.91].map(fillRate)).toEqual(['warn', 'pass', 'pass', 'warn']);
  });
  it('區塊數與整頁則數', () => {
    expect([5, 6, 9, 10, 15, 16, 18, 19].map(blockCount)).toEqual(['fail', 'warn', 'warn', 'pass', 'pass', 'warn', 'warn', 'fail']);
    expect([29, 30, 80, 81].map(pageItems)).toEqual(['warn', 'pass', 'pass', 'fail']);
  });
  it('同型不連續與取較差的判定', () => {
    expect([1, 2, 3].map(sameTypeRun)).toEqual(['pass', 'warn', 'fail']);
    expect(worse('warn', 'fail')).toBe('fail');
    expect(worse('warn', 'pass')).toBe('warn');
  });
});

describe('範例首頁', () => {
  const ev = evaluatePage(loadWorld(join(import.meta.dirname, '..', '..', 'data')));
  const find = (item: string, target: string) => ev.findings.find((f) => f.item === item && f.target === target);

  it('涵蓋規格裡全部可由 JSON 估算的項目', () => {
    const items = new Set(ev.findings.map((f) => f.item));
    for (const item of SPEC_ITEMS) expect(items).toContain(item);
  });

  it('抓到 POC 1 截圖上肉眼看到的問題', () => {
    expect(find('同型不連續', 'F、G、H')?.verdict).toBe('fail');
    expect(find('填充率', 'I')?.verdict).toBe('warn');
    expect(find('輪播填滿', 'M')?.verdict).toBe('warn');
    expect(find('欄高', 'section sections')?.verdict).toBe('fail');
  });

  it('規格本來就合格的項目維持合格', () => {
    expect(find('區塊數', '整頁')?.verdict).toBe('pass');
    expect(find('整頁則數', '整頁')?.verdict).toBe('pass');
    expect(find('間距節奏', '整頁')?.verdict).toBe('pass');
    expect(find('手機首屏', 'A')?.verdict).toBe('pass');
  });

  it('每個不合格與警告都有建議', () => {
    for (const f of ev.findings.filter((x) => x.verdict !== 'pass')) expect(f.suggestion.length).toBeGreaterThan(0);
  });

  it('比例與可用性需要渲染,不給分;總分是其餘面向的平均', () => {
    expect(ev.scores['比例']).toBeNull();
    expect(ev.scores['可用性']).toBeNull();
    const valid = Object.values(ev.scores).filter((v): v is number => v !== null);
    expect(ev.total).toBe(Math.round(valid.reduce((a, b) => a + b, 0) / valid.length));
  });

  it('面向分數 = 100 − 扣分,最低 0', () => {
    for (const [facet, score] of Object.entries(ev.scores)) {
      if (score === null) continue;
      const penalty = ev.findings.filter((f) => f.facet === facet).reduce((p, f) => p + PENALTY[f.verdict], 0);
      expect(score).toBe(Math.max(0, 100 - penalty));
    }
  });

  it('確定性:同樣輸入得到同樣結果', () => {
    const again = evaluatePage(loadWorld(join(import.meta.dirname, '..', '..', 'data')));
    expect(JSON.stringify(again)).toBe(JSON.stringify(ev));
  });
});
