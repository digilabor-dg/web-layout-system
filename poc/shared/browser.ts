// POC 共用:取得預裝的 Playwright Chromium,以及 Noto Sans TC 的 @font-face。

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = join(import.meta.dirname, '..', '..');
const require = createRequire(import.meta.url);

/** 只用到的 Playwright 介面 */
export interface PwPage {
  goto(url: string): Promise<unknown>;
  evaluate<T, A = undefined>(fn: (arg: A) => T | Promise<T>, arg?: A): Promise<T>;
  screenshot(opts: { path: string; fullPage: boolean; type: 'jpeg'; quality: number }): Promise<unknown>;
  addInitScript(script: string): Promise<void>;
  close(): Promise<void>;
}
export interface PwBrowser {
  newPage(opts: { viewport: { width: number; height: number }; deviceScaleFactor: number }): Promise<PwPage>;
  close(): Promise<void>;
}

/**
 * 啟動 Chromium(環境已預裝,不另外下載)。
 * tsx 會在具名函式外包一層 __name(…);送進瀏覽器執行的函式也會帶著它,
 * 所以每個新分頁先注入一個什麼都不做的 __name。
 */
export async function launch(): Promise<PwBrowser> {
  const { chromium } = require('playwright') as { chromium: { launch(): Promise<PwBrowser> } };
  const browser = await chromium.launch();
  return {
    async newPage(opts) {
      const page = await browser.newPage(opts);
      await page.addInitScript('window.__name = (f) => f;');
      return page;
    },
    close: () => browser.close(),
  };
}

/** Noto Sans TC 400 的 @font-face,相對路徑換成本機絕對路徑 */
export function notoFontCss(): string {
  const dir = join(REPO, 'node_modules', '@fontsource', 'noto-sans-tc');
  const css = readFileSync(join(dir, '400.css'), 'utf8');
  return css.replace(/url\(\.\/files\//g, `url(${pathToFileURL(join(dir, 'files')).href}/`);
}
