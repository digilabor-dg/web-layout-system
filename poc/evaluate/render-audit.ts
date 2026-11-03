// POC 2 的渲染量測項目:圖片顯示比例、同列對齊、欄寬照格線、觸控目標、水平捲動。
// 用 POC 1 的渲染器產生 HTML,在 6 種寬度用 Playwright 量,轉成與 JSON 評分相同格式的判定。

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { World } from '../estimate-vs-render/model.js';
import { renderPage } from '../estimate-vs-render/render.js';
import { launch, notoFontCss } from '../shared/browser.js';
import { lowerBetter } from './checks.js';
import { type Finding, mergeWorst } from './evaluate.js';

/** 瀏覽器端量到的原始數字(每塊或每個 section 一筆) */
interface Raw {
  frames: { block: string; worstError: number }[];
  rows: { block: string; topDiff: number; heightDiff: number }[];
  columns: { target: string; design: number; actual: number }[];
  touch: { block: string; minSize: number; label: string }[];
  overflow: number;
}

/** 渲染並量測;screenshotDir 有值時存 390px 與 1280px 的截圖 */
export async function renderAudit(world: World, outDir: string, screenshotDir?: string): Promise<Finding[]> {
  // 【第一步】產生 HTML
  mkdirSync(outDir, { recursive: true });
  const html = join(outDir, 'page.html');
  writeFileSync(html, renderPage(world, notoFontCss()));
  const browser = await launch();
  const raw: Finding[] = [];
  for (const { width, height } of world.profile.testViewports) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(html).href);
    // 【第二步】瀏覽器端量測
    const m = await page.evaluate(async (): Promise<Raw> => {
      await document.fonts.load('16px "Noto Sans TC"', '示意');
      await document.fonts.ready;
      const blockOf = (el: Element) => (el.closest('[data-block]') as HTMLElement | null)?.dataset.block ?? '?';
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      // 圖片顯示比例:實際寬 ÷ 高 與應有比例的相對誤差,每塊取最大
      const frames = new Map<string, number>();
      document.querySelectorAll<HTMLElement>('.ph[data-ratio]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const want = Number(el.dataset.ratio);
        const e = Math.abs(r.width / r.height - want) / want;
        const b = blockOf(el);
        frames.set(b, Math.max(frames.get(b) ?? 0, e));
      });
      // 同列對齊:格線與輪播裡,同一列卡片的圖片頂端差與卡片高度差
      const rows: Raw['rows'] = [];
      document.querySelectorAll<HTMLElement>('.cards, .car').forEach((box) => {
        if (getComputedStyle(box).display !== 'grid' && !box.classList.contains('car')) return;
        const cards = [...box.children].filter((c) => c.classList.contains('card'));
        const byRow = new Map<number, Element[]>();
        for (const c of cards) {
          const top = Math.round(c.getBoundingClientRect().top);
          byRow.set(top, [...(byRow.get(top) ?? []), c]);
        }
        let topDiff = 0;
        let heightDiff = 0;
        for (const row of byRow.values()) {
          const tops = row.map((c) => c.querySelector('.ph')!.getBoundingClientRect().top);
          const hs = row.map((c) => c.getBoundingClientRect().height);
          topDiff = Math.max(topDiff, Math.max(...tops) - Math.min(...tops));
          heightDiff = Math.max(heightDiff, Math.max(...hs) - Math.min(...hs));
        }
        rows.push({ block: blockOf(box), topDiff, heightDiff });
      });
      // 欄寬照格線:並排的兩欄,實際寬度比與設計比的差距
      const columns: Raw['columns'] = [];
      const pair = (target: string, a: Element, b: Element, design: number) => {
        const wa = a.getBoundingClientRect().width;
        const wb = b.getBoundingClientRect().width;
        const top = Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top) < 1;
        if (wa > 0 && wb > 0 && top) columns.push({ target, design, actual: wa / wb });
      };
      document.querySelectorAll<HTMLElement>('.sec').forEach((sec) => {
        const cols = [...sec.children].filter((c) => c.classList.contains('col'));
        const spans = (sec.dataset.cols ?? '').split(':').map(Number);
        if (cols.length === 2 && spans.length === 2) pair(`section ${sec.dataset.section}`, cols[0]!, cols[1]!, spans[0]! / spans[1]!);
      });
      document.querySelectorAll<HTMLElement>('.ls, .feat').forEach((box) => {
        if (getComputedStyle(box).display !== 'grid') return;
        const [a, b] = [...box.children];
        const design = Number(box.dataset.split?.split(':')[0]) / Number(box.dataset.split?.split(':')[1]);
        if (a && b && design) pair(blockOf(box), a, b, design);
      });
      // 觸控目標:看得到的連結與按鈕,取寬高較小者;每塊取最小
      const touch = new Map<string, { minSize: number; label: string }>();
      document.querySelectorAll<HTMLElement>('a, button').forEach((el) => {
        if (!visible(el)) return;
        const r = el.getBoundingClientRect();
        const size = Math.min(r.width, r.height);
        const b = blockOf(el);
        const prev = touch.get(b);
        if (!prev || size < prev.minSize) touch.set(b, { minSize: size, label: (el.textContent ?? '').trim() || el.getAttribute('aria-label') || el.tagName });
      });
      return {
        frames: [...frames].map(([block, worstError]) => ({ block, worstError })),
        rows,
        columns,
        touch: [...touch].map(([block, v]) => ({ block, ...v })),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    if (screenshotDir && (width === 390 || width === 1280)) {
      mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: join(screenshotDir, `page-${width}.jpg`), fullPage: true, type: 'jpeg', quality: 60 });
    }
    await page.close();
    // 【第三步】把數字轉成判定(門檻見 template-evaluation)
    const r2 = (n: number) => Math.round(n * 100) / 100;
    for (const f of m.frames) {
      raw.push({
        item: '圖片比例', layer: 2, facet: '比例', target: f.block, width, value: r2(f.worstError),
        verdict: f.worstError <= 0.01 + 1e-9 ? 'pass' : 'fail', display: `顯示比例誤差 ${(f.worstError * 100).toFixed(2)}%`,
        suggestion: `${f.block} 的圖片顯示比例誤差超過 1%;後端依主比例裁圖,前端用 aspect-ratio`,
      });
    }
    for (const r of m.rows) {
      const worst = Math.max(r.topDiff, r.heightDiff);
      raw.push({
        item: '同列對齊', layer: 2, facet: '對齊', target: r.block, width, value: r2(worst),
        verdict: lowerBetter(worst, 1, 2), display: `同列頂端差 ${r2(r.topDiff)}px、高度差 ${r2(r.heightDiff)}px`,
        suggestion: `${r.block} 同列卡片對不齊;統一文字量或限制標題行數`,
      });
    }
    for (const c of m.columns) {
      const diff = Math.abs(c.actual - c.design) / c.design;
      raw.push({
        item: '欄寬照格線', layer: 2, facet: '對齊', target: c.target, width, value: r2(diff),
        verdict: lowerBetter(diff, 0.02, 0.05), display: `欄寬比 ${c.actual.toFixed(3)}(設計 ${c.design.toFixed(3)}),差 ${(diff * 100).toFixed(1)}%`,
        suggestion: `${c.target} 的欄寬沒照格線;檢查欄距與固定寬度`,
      });
    }
    for (const t of m.touch) {
      raw.push({
        item: '觸控目標', layer: 2, facet: '可用性', target: t.block, width, value: r2(t.minSize),
        verdict: t.minSize >= 44 - 1e-9 ? 'pass' : 'fail', display: `最小觸控目標 ${r2(t.minSize)}px(「${t.label}」)`,
        suggestion: `${t.block} 的「${t.label}」只有 ${Math.round(t.minSize)}px;觸控目標至少 44×44px(例如區塊標題列加高到 44px,或連結加內距)`,
      });
    }
    raw.push({
      item: '水平捲動', layer: 2, facet: '可用性', target: '整頁', width, value: m.overflow,
      verdict: m.overflow <= 0 ? 'pass' : 'fail', display: m.overflow <= 0 ? '沒有水平捲動' : `頁面比視窗寬 ${m.overflow}px`,
      suggestion: '移除固定的最小寬度,讓內容不超出視窗',
    });
  }
  await browser.close();
  return mergeWorst(raw);
}
