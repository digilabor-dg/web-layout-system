// wiki 與 spec 的一致性:每個 capability 都要在某一頁白話規格中被說明到;wiki 內的相對連結都要指到存在的檔案。

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(import.meta.dirname, '..');
const WIKI = join(REPO, 'docs', 'wiki');
/** 白話規格頁(規格總覽的表格是自動產生的,不算說明) */
const PLAIN = ['資料模型.md', '規則檢查.md', '估算與渲染.md', '評估.md', '改進與生成.md'];

describe('wiki', () => {
  const caps = readdirSync(join(REPO, 'openspec', 'specs')).filter((n) => !n.startsWith('.'));
  const plain = PLAIN.map((f) => readFileSync(join(WIKI, f), 'utf8')).join('\n');

  it.each(caps)('capability %s 在白話規格頁中有說明', (cap) => {
    expect(plain).toContain(`openspec/specs/${cap}/spec.md`);
  });

  const pages = readdirSync(WIKI).filter((f) => f.endsWith('.md'));
  it.each(pages)('%s 的相對連結都指到存在的檔案', (page) => {
    const text = readFileSync(join(WIKI, page), 'utf8');
    // 取出 ](相對路徑) 的連結,略過網址與頁內錨點
    const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]!).filter((l) => !/^(https?:|#|mailto:)/.test(l));
    for (const link of links) {
      const target = resolve(dirname(join(WIKI, page)), decodeURI(link.split('#')[0]!));
      expect(existsSync(target), `${page} → ${link}`).toBe(true);
    }
  });
});
