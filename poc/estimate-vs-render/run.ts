// POC 1 主程式:產生 HTML → Playwright 在 6 種寬度量測 → 與估算比對 → 輸出 results.json、RESULTS.md 與截圖。
// 用法:npm run poc:1            一般執行
//       npm run poc:1 -- --check-determinism   連跑兩次,確認結果逐字相同

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deviceClass } from '../../src/index.js';
import { estimateBlock, type TitleMethod } from './estimate.js';
import { blockLayout, blockWidth, loadWorld } from './model.js';
import { renderPage } from './render.js';
import { writeReport } from './report.js';
import { launch, notoFontCss } from '../shared/browser.js';

// 【第零步】路徑
const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');
const OUT = join(HERE, 'out');
/** 瀏覽器裡量到的東西 */
interface Measured {
  blocks: Record<string, number>;
  titles: Record<string, number>;
  scrollOverflow: number;
  badFrames: number;
  probe: { cjkEm: number; latinEm: number; fontOk: boolean };
}

/** 一筆比對結果 */
export interface Row {
  width: number;
  device: string;
  code: string;
  pattern: string;
  kind: string;
  blockWidth: number;
  estRatio: number;
  estGreedy: number;
  measured: number;
}

/** 標題比對結果 */
export interface TitleRow {
  width: number;
  tid: string;
  ratio: number;
  greedy: number;
  measured: number;
}

/** 四捨五入到小數 2 位,讓 JSON 輸出穩定 */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** 渲染用的字型:預設 Noto Sans TC;敏感度實驗改用系統的文泉驛正黑,估算參數不變 */
export type FontChoice = 'noto' | 'wqy';
const FAMILY: Record<FontChoice, string> = { noto: "'Noto Sans TC'", wqy: "'WenQuanYi Zen Hei'" };

/** 執行一輪:渲染、量測、比對 */
async function runOnce(screenshots: boolean, font: FontChoice = 'noto') {
  // 【第一步】讀資料、產生 HTML
  const world = loadWorld(join(REPO, 'data'));
  mkdirSync(OUT, { recursive: true });
  const htmlPath = join(OUT, `home-${font}.html`);
  writeFileSync(htmlPath, renderPage(world, font === 'noto' ? notoFontCss() : '', FAMILY[font]));
  // 【第二步】逐一寬度量測
  const browser = await launch();
  const rows: Row[] = [];
  const titleRows: TitleRow[] = [];
  const checks: { width: number; scrollOverflow: number; badFrames: number; probe: Measured['probe'] }[] = [];
  for (const { width, height } of world.profile.testViewports) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlPath).href);
    const m = await page.evaluate(async (): Promise<Measured> => {
      // 瀏覽器端:等字型載入完成後才量
      await document.fonts.load('16px "Noto Sans TC"', '示意');
      await document.fonts.ready;
      const blocks: Record<string, number> = {};
      document.querySelectorAll<HTMLElement>('[data-block]').forEach((el) => {
        blocks[el.dataset.block!] = el.getBoundingClientRect().height;
      });
      // 標題行數 = 高度 ÷ 行高(疊字的標題有截斷,不量)
      const titles: Record<string, number> = {};
      document.querySelectorAll<HTMLElement>('.t[data-tid]:not([data-clamp])').forEach((el) => {
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        titles[el.dataset.tid!] = Math.round(el.getBoundingClientRect().height / lh);
      });
      // 規範檢查:水平捲動、圖框比例
      const scrollOverflow = document.documentElement.scrollWidth - window.innerWidth;
      let badFrames = 0;
      document.querySelectorAll<HTMLElement>('.ph').forEach((el) => {
        if (getComputedStyle(el).aspectRatio === 'auto') badFrames += 1;
      });
      document.querySelectorAll<HTMLElement>('img,video').forEach((el) => {
        const fit = getComputedStyle(el).objectFit;
        if (fit === 'contain' || fit === 'cover') badFrames += 1;
      });
      // 量實際字寬:10 個中文字與 36 個英數字,各自除以字級
      const span = document.createElement('span');
      span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:100px';
      document.body.appendChild(span);
      span.textContent = '示意標題測試文字一二三';
      const cjkEm = span.getBoundingClientRect().width / 100 / 11;
      span.textContent = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const latinEm = span.getBoundingClientRect().width / 100 / 36;
      span.remove();
      // 字型確認:實際用到的字型是否已載入(系統字型一律視為可用)
      const family = getComputedStyle(document.body).fontFamily;
      const fontOk = family.includes('Noto') ? document.fonts.check('16px "Noto Sans TC"', '示意') : true;
      return { blocks, titles, scrollOverflow, badFrames, probe: { cjkEm, latinEm, fontOk } };
    });
    if (screenshots && (width === 390 || width === 1280)) {
      await page.screenshot({ path: join(HERE, 'screenshots', `home-${width}.jpg`), fullPage: true, type: 'jpeg', quality: 60 });
    }
    await page.close();
    checks.push({ width, scrollOverflow: m.scrollOverflow, badFrames: m.badFrames, probe: { cjkEm: Math.round(m.probe.cjkEm * 1000) / 1000, latinEm: Math.round(m.probe.latinEm * 1000) / 1000, fontOk: m.probe.fontOk } });
    // 【第三步】同一寬度的估算,兩種標題方法各算一次
    const device = deviceClass(width, world.site.breakpoints);
    for (const b of world.blocks) {
      const est = (method: TitleMethod) => estimateBlock(world, b, width, method);
      const ratio = est('ratio');
      const greedy = est('greedy');
      rows.push({
        width,
        device,
        code: b.code,
        pattern: b.pattern.id,
        kind: blockLayout(b, device).kind,
        blockWidth: r2(blockWidth(world, b, width)),
        estRatio: r2(ratio.height),
        estGreedy: r2(greedy.height),
        measured: r2(m.blocks[b.code]!),
      });
      ratio.titles.forEach((tr, i) => {
        const measured = m.titles[tr.tid];
        if (measured === undefined) return;
        titleRows.push({ width, tid: tr.tid, ratio: tr.lines, greedy: greedy.titles[i]!.lines, measured });
      });
    }
  }
  await browser.close();
  return { rows, titleRows, checks };
}

async function main() {
  const determinism = process.argv.includes('--check-determinism');
  mkdirSync(join(HERE, 'screenshots'), { recursive: true });
  // 【第一步】跑一輪(要截圖)
  const result = await runOnce(!determinism);
  const json = JSON.stringify(result, null, 2) + '\n';
  writeFileSync(join(OUT, 'results.json'), json);
  // 【第二步】確定性檢查:再跑一輪,逐字比較
  if (determinism) {
    const again = JSON.stringify(await runOnce(false), null, 2) + '\n';
    if (again !== json) {
      console.error('確定性檢查失敗:兩次結果不同');
      process.exitCode = 1;
      return;
    }
    console.log('確定性檢查通過:兩次結果逐字相同');
    return;
  }
  // 【第三步】敏感度實驗:換字型、估算不變
  const wqy = await runOnce(false, 'wqy');
  // 【第四步】寫報告並印出驗收結果
  const verdict = writeReport(result, join(HERE, 'RESULTS.md'), wqy);
  writeFileSync(join(HERE, 'results.json'), json);
  console.log(verdict.summary);
  if (!verdict.pass) process.exitCode = 1;
}

await main();
