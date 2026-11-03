// 圈選區域 → 目標的判定(反饋收集 MVP,見 docs/brainstorm/feedback-collection.md 第 1 節、math.md 第 11 節)。
// 純函式、確定性:同樣的圈選與元素位置,永遠得到同樣的目標。檢視工具(page.ts)把這個函式原樣嵌進瀏覽器執行。
// 注意:函式必須自給自足(不引用外部變數或其他函式),因為會用 toString() 嵌進頁面。

/** 一個矩形(頁面座標,px) */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 頁面上的一個框:區塊、單則、元素(圖、文字行),或容器(欄、section、頁面) */
export interface Box extends Rect {
  level: 'element' | 'item' | 'block' | 'column' | 'section' | 'page';
  /** 區塊代號(容器沒有) */
  code?: string;
  /** 單則在區塊裡的序號(從 1 起算) */
  item?: number;
  /** 元素名稱:圖、標題、摘要、作者、名次 */
  element?: string;
  /** 容器的名稱,例如 section 的 id */
  id?: string;
}

/** 判定結果的一個目標 */
export interface Target {
  level: Box['level'];
  code?: string;
  item?: number;
  element?: string;
  id?: string;
  /** 圈選區有多少落在這個框裡 */
  oR: number;
  /** 這個框有多少被圈到 */
  oB: number;
}

/** 判定結果 */
export interface Resolved {
  /** 圈到內容、圈到空白,或跨好幾塊 */
  kind: 'content' | 'blank' | 'multi';
  /** 圈到內容時是一個目標;跨好幾塊時依重疊比例排序 */
  targets: Target[];
  /** 圈到空白時:包住圈選區的最小容器,以及空白的種類 */
  blank?: { where: 'in-block' | 'in-column' | 'between-blocks' | 'page'; container: Target };
  /** 圈到空白時:上下左右最近的區塊(容器是區塊時,改找區塊裡的單則) */
  neighbors?: Partial<Record<'up' | 'down' | 'left' | 'right', Target & { gap: number }>>;
  /** 圈選區被內容(圖與文字行)蓋住的比例 */
  contentShare: number;
}

/** 依圈選區與頁面上的框,判定使用者在評哪裡 */
export function resolveRegion(r: Rect, boxes: Box[]): Resolved | null {
  // 【第一步】基本量:兩個矩形的交集面積、面積
  const area = (b: Rect) => Math.max(0, b.w) * Math.max(0, b.h);
  const inter = (a: Rect, b: Rect) => {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? w * h : 0;
  };
  const aR = area(r);
  if (aR < 1) return null;
  const r4 = (x: number) => Math.round(x * 1000) / 1000;
  const target = (b: Box): Target => {
    const t: Target = { level: b.level, oR: r4(inter(r, b) / aR), oB: r4(area(b) ? inter(r, b) / area(b) : 0) };
    if (b.code !== undefined) t.code = b.code;
    if (b.item !== undefined) t.item = b.item;
    if (b.element !== undefined) t.element = b.element;
    if (b.id !== undefined) t.id = b.id;
    return t;
  };
  // 同分時依固定順序決定:重疊比例大的在前,再依面積小的、頁面上方的、左邊的
  const best = (list: Box[]) =>
    [...list].sort((a, b) => inter(r, b) - inter(r, a) || area(a) - area(b) || a.y - b.y || a.x - b.x)[0];
  const of = (level: Box['level']) => boxes.filter((b) => b.level === level);

  // 【第二步】內容佔圈選區多少:元素(圖、文字行)彼此不重疊,交集面積直接相加
  const elements = of('element');
  const contentShare = r4(Math.min(1, elements.reduce((s, b) => s + inter(r, b), 0) / aR));

  // 【第三步】圈到內容:取最小的一層,只要它蓋住圈選區的一半以上
  if (contentShare >= 0.5) {
    for (const level of ['element', 'item', 'block'] as const) {
      const b = best(of(level));
      if (b && inter(r, b) / aR >= 0.5) return { kind: 'content', targets: [target(b)], contentShare };
    }
    // 沒有任何一塊佔一半以上:跨好幾塊,列出佔 20% 以上的
    const multi = of('block')
      .filter((b) => inter(r, b) / aR >= 0.2)
      .sort((a, b) => inter(r, b) - inter(r, a) || a.y - b.y || a.x - b.x)
      .map(target);
    return { kind: 'multi', targets: multi, contentShare };
  }

  // 【第四步】圈到空白:包住圈選區(90% 以上落在裡面)的最小容器
  const holders = boxes
    .filter((b) => b.level !== 'element' && inter(r, b) / aR >= 0.9)
    .sort((a, b) => area(a) - area(b) || a.y - b.y || a.x - b.x);
  const holder = holders[0];
  // 【第五步】鄰居:容器是區塊(或單則)時找區塊裡的單則,否則找區塊;四個方向各取邊距最近的
  const inBlock = holder && (holder.level === 'block' || holder.level === 'item');
  const pool = inBlock ? of('item').filter((b) => b.code === holder.code) : of('block');
  const cx = (lo: number, hi: number, lo2: number, hi2: number) => Math.min(hi, hi2) - Math.max(lo, lo2) > 0;
  const neighbors: NonNullable<Resolved['neighbors']> = {};
  const pickDir = (dir: 'up' | 'down' | 'left' | 'right') => {
    const cand = pool
      .filter((b) => inter(r, b) / aR < 0.5)
      .map((b) => {
        const gap =
          dir === 'up' ? r.y - (b.y + b.h) : dir === 'down' ? b.y - (r.y + r.h) : dir === 'left' ? r.x - (b.x + b.w) : b.x - (r.x + r.w);
        const overlap = dir === 'up' || dir === 'down' ? cx(r.x, r.x + r.w, b.x, b.x + b.w) : cx(r.y, r.y + r.h, b.y, b.y + b.h);
        return { b, gap, overlap };
      })
      // 容許 2px 的誤差:邊框貼著圈選區也算鄰居
      .filter((c) => c.overlap && c.gap >= -2)
      .sort((a, b) => a.gap - b.gap || a.b.y - b.b.y || a.b.x - b.b.x)[0];
    if (cand) neighbors[dir] = { ...target(cand.b), gap: Math.round(Math.max(0, cand.gap)) };
  };
  (['up', 'down', 'left', 'right'] as const).forEach(pickDir);
  // 【第六步】空白的種類:區塊裡、兩塊之間(上下都有很近的區塊)、欄裡、頁面
  let where: NonNullable<Resolved['blank']>['where'] = 'page';
  if (inBlock) where = 'in-block';
  else if (holder && (holder.level === 'column' || holder.level === 'section')) {
    where = neighbors.up && neighbors.down && neighbors.up.gap <= 48 && neighbors.down.gap <= 48 ? 'between-blocks' : 'in-column';
  }
  const container: Target = holder ? target(holder) : { level: 'page', oR: 1, oB: 0 };
  return { kind: 'blank', targets: [], blank: { where, container }, neighbors, contentShare };
}
