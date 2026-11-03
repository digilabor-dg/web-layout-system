// POC 1 的渲染:把範例首頁轉成一份 RWD 的 HTML。
// 每塊的 DOM 固定,依裝置用 media query 切換排法;所有間距都對應 estimate.ts 的公式。
// 圖框一律用 aspect-ratio 的佔位框,不使用 object-fit。

import type { DeviceClass } from '../../src/index.js';
import { BOX } from './estimate.js';
import { type Block, type BlockLayout, type World, blockLayout } from './model.js';

/** 固定字型,讓量測可重現(Noto Sans TC,由 @fontsource/noto-sans-tc 提供) */
export const FONT = "'Noto Sans TC'";

/** 跳脫 HTML 特殊字元 */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 比例數字 → CSS aspect-ratio 的寫法 */
function aspect(ratio: number): string {
  if (Math.abs(ratio - 1.5) < 1e-6) return '3 / 2';
  if (Math.abs(ratio - 16 / 9) < 1e-6) return '16 / 9';
  if (Math.abs(ratio - 1) < 1e-6) return '1 / 1';
  return `${ratio} / 1`;
}

/** 佔位圖:比例正確的框,標示角色與比例 */
function placeholder(b: Block): string {
  const r = b.ratio ?? 1;
  return `<div class="ph" data-ratio="${r}" style="aspect-ratio:${aspect(r)}"><span>${esc(b.template.imageRole ?? b.pattern.slots[0]!.image[0]!)} ${aspect(r).replace(/ /g, '')}</span></div>`;
}

/** 標題元素:字級與行高都寫成 px,data-tid 供量測比對 */
function titleTag(b: Block, i: number, size: number, lh: number, clamp = false): string {
  const attrs = clamp ? ' data-clamp="1"' : '';
  return `<h3 class="t" data-tid="${esc(`${b.instance.id}#${i}`)}"${attrs} style="font-size:${size}px;line-height:${size * lh}px">${esc(b.items[i]!.title)}</h3>`;
}

/** 卡片:圖 + 文字區(標題、摘要) */
function card(world: World, b: Block, i: number, size: number): string {
  const t = world.profile.typography;
  const item = b.items[i]!;
  const sum =
    item.summary && b.pattern.textAmount !== 'headline'
      ? `<p class="s">${esc(item.summary)}</p>`
      : '';
  return `<div class="card">${placeholder(b)}<div class="txt">${titleTag(b, i, size, t.lineHeight)}${sum}</div></div>`;
}

/** 依排法種類輸出一塊的內容 DOM(同一塊在各裝置的 DOM 相同,只有 CSS 不同) */
function body(world: World, b: Block, sample: BlockLayout): string {
  const t = world.profile.typography;
  const size = t.headingFontSize[b.pattern.textAmount];
  const lead = t.headingFontSize.lead;
  const list = (from: number, cls: string) =>
    `<ul class="list ${cls}">${b.items
      .slice(from)
      .map((_, k) => {
        const i = from + k;
        const num = cls === 'num' ? `<span class="n">${i + 1}</span>` : '';
        return `<li>${num}${titleTag(b, i, size, t.lineHeight)}</li>`;
      })
      .join('')}</ul>`;
  switch (sample.kind) {
    case 'overlay': {
      const item = b.items[0]!;
      return `<div class="ov">${placeholder(b)}<div class="ovt">${titleTag(b, 0, lead, t.lineHeight, true)}${
        item.summary ? `<p class="s">${esc(item.summary)}</p>` : ''
      }</div></div>`;
    }
    case 'grid':
    case 'list-card':
      return `<div class="cards">${b.items.map((_, i) => card(world, b, i, size)).join('')}</div>`;
    case 'list-text':
      return list(0, '');
    case 'list-number':
      return list(0, 'num');
    case 'list-timeline':
      return list(0, 'tl');
    case 'lead-stack':
    case 'lead-split':
      return `<div class="ls" data-split="${(sample.split ?? []).join(':')}"><div class="lead">${card(world, b, 0, lead)}</div>${list(1, '')}</div>`;
    case 'feature-stack':
    case 'feature-split':
      return `<div class="feats">${b.items
        .map((item, i) => {
          const sum = item.summary ? `<p class="s">${esc(item.summary)}</p>` : '';
          return `<div class="feat" data-split="${(sample.split ?? []).join(':')}">${placeholder(b)}<div class="txt">${titleTag(b, i, size, t.lineHeight)}${sum}</div></div>`;
        })
        .join('')}</div>`;
    case 'carousel':
      // 輪播:電腦結構才顯示左右箭頭(觸控目標)
      return `<div class="carw"><div class="car">${b.items.map((_, i) => card(world, b, i, size)).join('')}</div><button class="arr prev" aria-label="上一張">‹</button><button class="arr next" aria-label="下一張">›</button></div>`;
  }
}

/** 某塊在某類裝置的 CSS(只寫跟裝置有關的部分) */
function blockCss(world: World, b: Block, layout: BlockLayout): string {
  const g = world.site.gutterPx;
  const s = world.profile.spacing;
  const id = `#b-${b.code}`;
  switch (layout.kind) {
    case 'grid':
      return `${id} .cards{display:grid;grid-template-columns:repeat(${layout.cols},minmax(0,1fr));column-gap:${g}px;row-gap:${s.rowGap}px}`;
    case 'list-card':
      return `${id} .cards{display:flex;flex-direction:column;gap:${s.itemGap}px}`;
    case 'lead-stack':
      return `${id} .ls{display:flex;flex-direction:column;gap:${s.itemGap}px}`;
    case 'lead-split':
      return `${id} .ls{display:grid;grid-template-columns:${layout.split![0]}fr ${layout.split![1]}fr;column-gap:${g}px;align-items:start}`;
    case 'feature-stack':
      return `${id} .feat{display:block}`;
    case 'feature-split':
      return `${id} .feat{display:grid;grid-template-columns:${layout.split![0]}fr ${layout.split![1]}fr;column-gap:${g}px;align-items:start}`;
    case 'carousel': {
      const pv = layout.perView!;
      const k = Math.ceil(pv) - 1;
      return `${id} .car>.card{flex:0 0 calc((100% - ${g * k}px) / ${pv})}`;
    }
    default:
      return '';
  }
}

/** 產生整頁 HTML。fontCss 是字型的 @font-face 宣告(由呼叫端讀檔後傳入);family 可換字型做敏感度實驗 */
export function renderPage(world: World, fontCss = '', family = FONT): string {
  const { site, profile, page, blocks } = world;
  const t = profile.typography;
  const s = profile.spacing;
  const g = site.gutterPx;
  const bp = site.breakpoints;
  // 【第一步】四類裝置的寬度範圍,用來包 media query
  const ranges: [DeviceClass, string][] = [
    ['mobile', `(max-width:${bp.tabletV - 0.02}px)`],
    ['tablet-V', `(min-width:${bp.tabletV}px) and (max-width:${bp.tabletH - 0.02}px)`],
    ['tablet-H', `(min-width:${bp.tabletH}px) and (max-width:${bp.desktop - 0.02}px)`],
    ['desktop', `(min-width:${bp.desktop}px)`],
  ];
  // 【第二步】容器:依預設參數組的容器規則設定最大寬與內距
  const containerCss = site.containers
    .map((c) => {
      const pad = c.padding ?? g / 2;
      const rule = `.container{padding:0 ${pad}px;${c.maxWidth === null ? 'max-width:none' : `max-width:${c.maxWidth}px`}}`;
      return c.minWidth === 0 ? rule : `@media (min-width:${c.minWidth}px){${rule}}`;
    })
    .join('\n');
  // 【第三步】每塊在四類裝置的排法 CSS
  const perBlock = ranges
    .map(([device, mq]) => `@media ${mq}{${blocks.map((b) => blockCss(world, b, blockLayout(b, device))).join('')}}`)
    .join('\n');
  // 【第四步】section 的結構:主切換點以下上下堆疊,以上依欄寬並排
  const sectionCss = page.sections
    .map((sec, i) =>
      sec.mode === 'stack'
        ? `@media (min-width:${bp.tabletH}px){#s-${i}{display:grid;grid-template-columns:${sec.columns.map((c) => `${c.width}fr`).join(' ')};column-gap:${g}px;align-items:start}}`
        : '',
    )
    .join('\n');
  const css = `
${fontCss}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:${family};font-size:${t.baseFontSize}px;line-height:${t.lineHeight};color:#222;background:#fff}
h3,p{font-weight:400}
.container{width:100%;margin:0 auto}
${containerCss}
.sec{display:flex;flex-direction:column;gap:${s.blockGap}px;margin-bottom:${s.blockGap}px}
.col{display:flex;flex-direction:column;gap:${s.blockGap}px;min-width:0}
.block{min-width:0}
.bh{height:${s.blockHeadingHeight}px;line-height:${s.blockHeadingHeight}px;font-size:20px;white-space:nowrap;overflow:hidden;border-top:3px solid #222}
.ph{position:relative;width:100%;background:#d9dee7}
.ph span{position:absolute;left:6px;top:6px;font:12px/1 monospace;color:#556;background:#fff;padding:2px 4px}
.txt{padding:${s.imageTextGap}px 0 ${s.cardPadding}px}
.s{margin-top:${BOX.summaryGap}px;font-size:${t.baseFontSize}px;line-height:${t.baseFontSize * t.lineHeight}px;color:#555}
.list{list-style:none;display:flex;flex-direction:column;gap:${s.itemGap}px}
.list.num li{display:flex}
.list.num .n{flex:0 0 ${BOX.numberCol}px}
.list.num .t{flex:1;min-width:0}
.list.tl li{border-left:2px solid #c33;padding-left:${BOX.timelineInset - 2}px}
.ov{position:relative}
.ovt{position:absolute;left:0;right:0;bottom:0;padding:${BOX.overlayPadding}px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.7))}
.ovt .t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ovt .s{color:#eee}
.feats{display:flex;flex-direction:column;gap:${s.itemGap}px}
.car{display:flex;gap:${g}px;overflow-x:auto;scrollbar-width:none}
.carw{position:relative}
.arr{display:none;position:absolute;top:30%;width:44px;height:44px;border:0;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;font-size:24px;cursor:pointer}
.arr.prev{left:4px}.arr.next{right:4px}
@media (min-width:${bp.tabletH}px){.arr{display:block}}
.bh{display:flex;justify-content:space-between}
.more{font-size:14px;color:#c33;text-decoration:none;padding:0 4px}
${sectionCss}
${perBlock}
`;
  // 【第五步】HTML:section → 欄 → 區塊
  const blockHtml = (b: Block) =>
    `<section class="block" id="b-${b.code}" data-block="${b.code}" data-instance="${esc(b.instance.id)}" data-pattern="${b.pattern.id}"><h2 class="bh"><span>${b.code} · ${esc(b.template.heading.title)}</span>${b.template.heading.moreLink ? `<a class="more" href="${esc(b.template.heading.moreLink)}">更多 ›</a>` : ''}</h2>${body(world, b, blockLayout(b, 'desktop'))}</section>`;
  const sections = page.sections
    .map((sec, i) => {
      const inSec = blocks.filter((b) => b.sectionIndex === i);
      if (sec.mode === 'stack') {
        const cols = sec.columns
          .map((_, ci) => `<div class="col">${inSec.filter((b) => b.columnIndex === ci).map(blockHtml).join('')}</div>`)
          .join('');
        return `<div class="sec" id="s-${i}" data-section="${esc(sec.id)}" data-cols="${sec.columns.map((c) => c.width).join(':')}">${cols}</div>`;
      }
      return `<div class="sec" id="s-${i}" data-section="${esc(sec.id)}">${inSec.map(blockHtml).join('')}</div>`;
    })
    .join('');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>POC 1 · 首頁</title><style>${css}</style></head><body><div class="container">${sections}</div></body></html>\n`;
}
