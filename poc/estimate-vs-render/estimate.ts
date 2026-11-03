// POC 1 的估算:依共用排法描述與 height-estimation 的公式,算出每塊的高度與每個標題的行數。
// 盒模型(各處間距)與 render.ts 的 CSS 一一對應,改一邊就要改另一邊。

import { deviceClass } from '../../src/index.js';
import { type Block, type World, blockLayout, blockWidth } from './model.js';
import { linesByGreedy, linesByRatio } from './text.js';

/** 標題行數的估算方法 */
export type TitleMethod = 'ratio' | 'greedy';

/** 一個標題的估算 */
export interface TitleEstimate {
  tid: string;
  lines: number;
}

/** 評分(POC 2)需要的中間值 */
export interface BlockParts {
  /** 左右並排時,兩欄各自的高度 */
  columns?: [number, number];
  /** 左圖右文時,每則的填充率(文字區高 ÷ 圖高) */
  fill?: number[];
  /** 疊字標題的估算行數(未截斷前) */
  overlayLines?: number;
  /** 第一張圖的高度(手機首屏用) */
  imageHeight?: number;
}

/** 一塊的估算結果 */
export interface BlockEstimate {
  height: number;
  titles: TitleEstimate[];
  parts: BlockParts;
}

/** 版面常數:對應 render.ts 的 CSS */
export const BOX = {
  /** 編號清單的號碼欄寬 */
  numberCol: 32,
  /** 時間軸左邊線加內距 */
  timelineInset: 14,
  /** 摘要與標題的間距 */
  summaryGap: 4,
  /** 疊字區的內距 */
  overlayPadding: 16,
  /** 左圖右文時,縮圖佔卡片寬的比例(手機結構 1/3、電腦結構 1/4) */
  sideThumbMobile: 1 / 3,
  sideThumbDesktop: 1 / 4,
};

/** 估算一塊在某個視窗寬度的高度 */
export function estimateBlock(world: World, b: Block, width: number, method: TitleMethod): BlockEstimate {
  const { profile, site } = world;
  const t = profile.typography;
  const s = profile.spacing;
  const g = site.gutterPx;
  const device = deviceClass(width, site.breakpoints);
  const layout = blockLayout(b, device);
  const W = blockWidth(world, b, width);
  const titles: TitleEstimate[] = [];
  const parts: BlockParts = {};

  // 【第一步】文字的工具:標題行數、標題高、摘要高
  const lh = (size: number) => size * t.lineHeight;
  const lines = (text: string, size: number, avail: number) =>
    method === 'ratio'
      ? linesByRatio(text, size, avail, t.avgCharWidth)
      : linesByGreedy(text, size, avail, t.avgCharWidth);
  /** 標題高,並記下這個標題的估算行數 */
  const title = (i: number, size: number, avail: number) => {
    const n = lines(b.items[i]!.title, size, avail);
    titles.push({ tid: `${b.instance.id}#${i}`, lines: n });
    return n * lh(size);
  };
  /** 摘要高(只有文字量為 summary/paragraph 且有摘要時才顯示) */
  const summary = (i: number, avail: number) => {
    const text = b.items[i]!.summary;
    if (!text || b.pattern.textAmount === 'headline') return 0;
    return BOX.summaryGap + lines(text, t.baseFontSize, avail) * lh(t.baseFontSize);
  };
  // 一般標題字級依文字量;首則用放大字級
  const size = t.headingFontSize[b.pattern.textAmount];
  const leadSize = t.headingFontSize.lead;
  const ratio = b.ratio ?? 1;

  /** 圖上文下的卡片高:圖 + 圖文間距 + 標題 + 摘要 + 卡片下內距 */
  const card = (i: number, cardW: number, titleSize = size) =>
    cardW / ratio + s.imageTextGap + title(i, titleSize, cardW) + summary(i, cardW) + s.cardPadding;
  /** 純文字清單:每則的標題高加總,中間夾則間距 */
  const textList = (from: number, avail: number) => {
    let h = 0;
    for (let i = from; i < b.items.length; i++) h += title(i, size, avail) + (i > from ? s.itemGap : 0);
    return h;
  };

  // 【第二步】依排法算內容高
  let body = 0;
  switch (layout.kind) {
    case 'overlay':
      // 疊字型:只有圖的高度,標題在圖上(兩行截斷),不比對行數;另記下未截斷前的行數
      body = W / ratio;
      parts.imageHeight = body;
      parts.overlayLines = lines(b.items[0]!.title, leadSize, W - BOX.overlayPadding * 2);
      break;
    case 'grid': {
      // 格線:每列取最高的卡片,列與列之間加列間距
      const c = layout.cols!;
      const cardW = (W - g * (c - 1)) / c;
      const heights = b.items.map((_, i) => card(i, cardW));
      parts.imageHeight = cardW / ratio;
      for (let r = 0; r * c < heights.length; r++) {
        body += Math.max(...heights.slice(r * c, r * c + c)) + (r > 0 ? s.rowGap : 0);
      }
      break;
    }
    case 'list-card':
      // 卡片上下排:每張卡片之間夾則間距
      body = b.items.reduce((h, _, i) => h + card(i, W) + (i > 0 ? s.itemGap : 0), 0);
      break;
    case 'list-text':
      body = textList(0, W);
      break;
    case 'list-number':
      body = textList(0, W - BOX.numberCol);
      break;
    case 'list-timeline':
      body = textList(0, W - BOX.timelineInset);
      break;
    case 'lead-stack':
      // 首則大圖在上,接著其餘清單
      body = card(0, W, leadSize) + s.itemGap + textList(1, W);
      parts.imageHeight = W / ratio;
      break;
    case 'lead-split': {
      // 首則在左、清單在右,取兩欄較高者
      const [l, r] = layout.split!;
      const lw = ((W - g) * l) / (l + r);
      const rw = ((W - g) * r) / (l + r);
      const left = card(0, lw, leadSize);
      const right = textList(1, rw);
      parts.columns = [left, right];
      parts.imageHeight = lw / ratio;
      body = Math.max(left, right);
      break;
    }
    case 'feature-stack':
      body = b.items.reduce((h, _, i) => h + card(i, W) + (i > 0 ? s.itemGap : 0), 0);
      break;
    case 'feature-split': {
      // 每則左圖右文,取圖與文字的較高者
      const [l, r] = layout.split!;
      const lw = ((W - g) * l) / (l + r);
      const rw = ((W - g) * r) / (l + r);
      parts.fill = [];
      parts.imageHeight = lw / ratio;
      body = b.items.reduce((h, _, i) => {
        const words = title(i, size, rw) + summary(i, rw);
        parts.fill!.push(words / (lw / ratio));
        const text = s.imageTextGap + words + s.cardPadding;
        return h + Math.max(lw / ratio, text) + (i > 0 ? s.itemGap : 0);
      }, 0);
      break;
    }
    case 'carousel': {
      // 輪播:一列放全部卡片,高度取最高的一張
      const pv = layout.perView!;
      const cardW = (W - g * (Math.ceil(pv) - 1)) / pv;
      body = Math.max(...b.items.map((_, i) => card(i, cardW)));
      break;
    }
  }
  // 【第三步】加上區塊標題列
  return { height: s.blockHeadingHeight + body, titles, parts };
}
