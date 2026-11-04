// 渲染器完整性的測試:編號排行帶縮圖時要有名次、觀點類要顯示作者名,估算也要算進去。
// 這兩個漏洞是第一輪角色評分(poc/rating)找到的盲點。

import { describe, expect, it } from 'vitest';
import { deviceClass } from '../../src/index.js';
import { applyPatch, toDataset } from '../../tests/helpers/fixture.js';
import { baseNested } from '../generator/params.js';
import { BOX, estimateBlock } from './estimate.js';
import { blockLayout, blockWidth, buildWorld } from './model.js';
import { renderPage } from './render.js';
import { linesByGreedy } from './text.js';

/** 範例資料,熱門排行改成帶方形縮圖(產生器會選到的組合) */
function worldWithSquareRanking(extra: Parameters<typeof applyPatch>[1] = []) {
  const nested = applyPatch(baseNested(), [
    { op: 'replace', path: '/block-templates/tpl-popular/imageRole', value: 'square' },
    ...extra,
  ]);
  return buildWorld(toDataset(nested).files.map((f) => f.data));
}

describe('編號排行帶縮圖', () => {
  it('排法是左圖右文、並標示要加名次;其他左圖右文不加', () => {
    const world = worldWithSquareRanking();
    const D = world.blocks.find((b) => b.code === 'D')!;
    expect(blockLayout(D, 'mobile')).toEqual({ kind: 'list-side', thumb: 1 / 3, numbered: true });
    expect(blockLayout(D, 'desktop')).toEqual({ kind: 'list-side', thumb: 1 / 4, numbered: true });
    // 其他左圖右文的清單(例如政治 G 的 P03)沒有名次
    for (const b of world.blocks.filter((x) => x.code !== 'D')) {
      expect(blockLayout(b, 'mobile').numbered).toBeUndefined();
    }
  });

  it('渲染出 1、2、3… 的名次', () => {
    const html = renderPage(worldWithSquareRanking());
    const d = html.slice(html.indexOf('id="b-D"'), html.indexOf('id="b-E"'));
    expect(d).toContain('<span class="n">1</span>');
    expect(d).toContain('<span class="n">8</span>');
  });

  it('估算:文字區寬 = 區塊寬 − 縮圖 − 欄距 − 名次欄 − 欄距', () => {
    const world = worldWithSquareRanking();
    const D = world.blocks.find((b) => b.code === 'D')!;
    const width = 390;
    const t = world.profile.typography;
    const s = world.profile.spacing;
    const g = world.site.gutterPx;
    const W = blockWidth(world, D, width);
    // 【第一步】手機結構縮圖佔 1/3,方圖高 = 縮圖寬
    const thumbW = W / 3;
    const textW = W - thumbW - g - BOX.numberCol - g;
    // 【第二步】每則取縮圖高與標題高的較大者,則與則之間夾則間距
    const size = t.headingFontSize[D.pattern.textAmount];
    const expected =
      s.blockHeadingHeight +
      D.items.reduce((h, item, i) => {
        const titleH = linesByGreedy(item.title, size, textW, t.avgCharWidth) * size * t.lineHeight;
        return h + Math.max(thumbW, titleH) + (i > 0 ? s.itemGap : 0);
      }, 0);
    expect(deviceClass(width, world.site.breakpoints)).toBe('mobile');
    expect(estimateBlock(world, D, width, 'greedy').height).toBeCloseTo(expected, 6);
  });
});

describe('作者名', () => {
  it('觀點類有 author 時渲染一行作者名', () => {
    const html = renderPage(worldWithSquareRanking());
    expect(html).toContain('<p class="au">示意作者甲</p>');
    // 一般新聞沒有 author,不輸出作者列
    const a = html.slice(html.indexOf('id="b-A"'), html.indexOf('id="b-B"'));
    expect(a).not.toContain('class="au"');
  });

  it('估算:每列多一行作者名(間距 + 字級 × 行高)', () => {
    // 觀點評論 K 在 390px 是 2 欄格線、4 則 → 2 列
    const ids = ['art-20261103-0058', 'art-20261103-0059', 'art-20261103-0060', 'art-20261103-0061'];
    const withAuthor = worldWithSquareRanking();
    const noAuthor = worldWithSquareRanking(ids.map((id) => ({ op: 'remove' as const, path: `/content-items/${id}/author` })));
    const K1 = withAuthor.blocks.find((b) => b.code === 'K')!;
    const K0 = noAuthor.blocks.find((b) => b.code === 'K')!;
    expect(blockLayout(K1, 'mobile')).toEqual({ kind: 'grid', cols: 2 });
    const line = BOX.authorGap + BOX.authorSize * withAuthor.profile.typography.lineHeight;
    const diff = estimateBlock(withAuthor, K1, 390, 'greedy').height - estimateBlock(noAuthor, K0, 390, 'greedy').height;
    expect(diff).toBeCloseTo(2 * line, 6);
  });
});
