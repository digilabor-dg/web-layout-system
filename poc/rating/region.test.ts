// 圈選區域 → 目標的判定:圈到內容取最小的一層、跨好幾塊依比例、圈到空白找容器與鄰居。

import { describe, expect, it } from 'vitest';
import { type Box, resolveRegion } from './region.js';

// 【測試資料】一個 1000px 寬的頁面:左欄 B(4 欄格線只有 3 則)、右欄 K(在 B 下方留下空白)
const boxes: Box[] = [
  { level: 'page', x: 0, y: 0, w: 1000, h: 1200 },
  { level: 'section', id: 's1', x: 0, y: 0, w: 1000, h: 1000 },
  { level: 'column', id: 's1/1', x: 0, y: 0, w: 640, h: 1000 },
  { level: 'column', id: 's1/2', x: 660, y: 0, w: 340, h: 1000 },
  { level: 'block', code: 'B', x: 0, y: 0, w: 640, h: 300 },
  { level: 'block', code: 'F', x: 0, y: 332, w: 640, h: 668 },
  { level: 'block', code: 'K', x: 660, y: 0, w: 340, h: 600 },
  // B 的 3 則:每則 145px 寬,第 4 格空著(x 480~640)
  ...[0, 1, 2].flatMap((i): Box[] => [
    { level: 'item', code: 'B', item: i + 1, x: i * 160, y: 40, w: 145, h: 260 },
    { level: 'element', code: 'B', item: i + 1, element: '圖', x: i * 160, y: 40, w: 145, h: 97 },
    { level: 'element', code: 'B', item: i + 1, element: '標題', x: i * 160, y: 145, w: 140, h: 54 },
  ]),
  // 只有第 1 則有摘要
  { level: 'element', code: 'B', item: 1, element: '摘要', x: 0, y: 205, w: 140, h: 85 },
  { level: 'item', code: 'K', item: 1, x: 660, y: 40, w: 340, h: 560 },
  { level: 'element', code: 'K', item: 1, element: '圖', x: 660, y: 40, w: 340, h: 340 },
  { level: 'item', code: 'F', item: 1, x: 0, y: 372, w: 640, h: 628 },
  { level: 'element', code: 'F', item: 1, element: '圖', x: 0, y: 372, w: 640, h: 600 },
];

describe('圈選區域 → 目標', () => {
  it('圈在一張圖上:目標是那個元素', () => {
    const r = resolveRegion({ x: 170, y: 50, w: 100, h: 60 }, boxes)!;
    expect(r.kind).toBe('content');
    expect(r.targets[0]).toMatchObject({ level: 'element', code: 'B', item: 2, element: '圖', oR: 1 });
  });

  it('圈住一整則(圖 + 標題 + 中間的空隙):目標是那一則', () => {
    const r = resolveRegion({ x: 0, y: 40, w: 145, h: 200 }, boxes)!;
    expect(r.targets[0]).toMatchObject({ level: 'item', code: 'B', item: 1 });
  });

  it('圈住大半塊:目標是區塊', () => {
    const r = resolveRegion({ x: 0, y: 40, w: 460, h: 200 }, boxes)!;
    expect(r.targets[0]).toMatchObject({ level: 'block', code: 'B' });
  });

  it('跨兩塊、沒有一塊佔一半:列出兩塊,依重疊比例排序', () => {
    // B 佔 35%、F 佔 49%,內容(B 的摘要、F 的圖)佔圈選區一半以上
    const r = resolveRegion({ x: 0, y: 230, w: 140, h: 200 }, boxes)!;
    expect(r.kind).toBe('multi');
    expect(r.targets.map((t) => t.code)).toEqual(['F', 'B']);
    expect(r.targets[0]!.oR).toBeGreaterThan(r.targets[1]!.oR);
  });

  it('圈在 B 空著的第 4 格:區塊裡的空白,左邊的鄰居是第 3 則', () => {
    const r = resolveRegion({ x: 490, y: 60, w: 140, h: 200 }, boxes)!;
    expect(r.kind).toBe('blank');
    expect(r.blank).toMatchObject({ where: 'in-block', container: { level: 'block', code: 'B' } });
    // 第 3 則的右緣在 465,圈選區從 490 開始
    expect(r.neighbors!.left).toMatchObject({ level: 'item', code: 'B', item: 3, gap: 25 });
  });

  it('圈在 K 下方:欄裡、區塊外的空白,上方的鄰居是 K', () => {
    const r = resolveRegion({ x: 680, y: 650, w: 300, h: 300 }, boxes)!;
    expect(r.blank).toMatchObject({ where: 'in-column', container: { level: 'column', id: 's1/2' } });
    expect(r.neighbors!.up).toMatchObject({ level: 'block', code: 'K', gap: 50 });
    expect(r.neighbors!.left).toMatchObject({ level: 'block', code: 'F' });
  });

  it('圈在兩塊之間的間距:上下都有很近的區塊', () => {
    const r = resolveRegion({ x: 100, y: 302, w: 300, h: 28 }, boxes)!;
    expect(r.blank).toMatchObject({ where: 'between-blocks' });
    expect(r.neighbors!.up!.code).toBe('B');
    expect(r.neighbors!.down!.code).toBe('F');
  });

  it('確定性:同樣的輸入得到同樣的結果;面積為 0 時不判定', () => {
    const region = { x: 490, y: 60, w: 140, h: 200 };
    expect(resolveRegion(region, boxes)).toEqual(resolveRegion(region, [...boxes].reverse()));
    expect(resolveRegion({ x: 10, y: 10, w: 0, h: 50 }, boxes)).toBeNull();
  });
});
