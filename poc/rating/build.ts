// 人評測試系統之一:產生評分集(給角色 agent 用)。對一個產生的版面,每塊截一張手機圖與一張電腦圖,
// 並把該塊的程式判定換算成 0~10(與人評同一個尺度);另存拿掉程式分數的盲評版。真人用的檢視工具見 review.ts。
// 用法:npm run poc:rating -- <產生結果名稱,例如 default>

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyPatch, toDataset } from '../../tests/helpers/fixture.js';
import type { Evaluation } from '../evaluate/evaluate.js';
import { blockScore } from './collect.js';
import { buildWorld } from '../estimate-vs-render/model.js';
import { renderPage } from '../estimate-vs-render/render.js';
import { baseNested } from '../generator/params.js';
import { launch, notoFontCss } from '../shared/browser.js';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');

/** 評分集的一塊 */
export interface RatingBlock {
  code: string;
  ref: string;
  pattern: string;
  heading: string;
  program: { score: number; findings: { item: string; verdict: string; display: string }[] };
  images: { mobile: string; desktop: string };
}

/** 評分集 */
export interface RatingSet {
  set: string;
  title: string;
  total: number;
  blocks: RatingBlock[];
}

async function main() {
  const name = process.argv[2];
  if (!name) throw new Error('用法:npm run poc:rating -- <產生結果名稱>');
  // 【第一步】由產生結果重建資料:範例資料 + 產生的頁面、範本、實例
  const resDir = join(REPO, 'poc', 'generator', 'results', name);
  const gen = JSON.parse(readFileSync(join(resDir, 'generated.json'), 'utf8')) as {
    params: { preset: string; title?: string };
    page: { id: string };
    templates: { id: string }[];
    instances: { id: string }[];
  };
  const report = JSON.parse(readFileSync(join(resDir, 'report.json'), 'utf8')) as Evaluation;
  const nested = applyPatch(baseNested(), [
    { op: 'replace', path: '/site-profile/site-main/preset', value: gen.params.preset },
    { op: 'replace', path: '/pages', value: { [gen.page.id]: gen.page } },
    { op: 'replace', path: '/block-templates', value: Object.fromEntries(gen.templates.map((t) => [t.id, t])) },
    { op: 'replace', path: '/block-instances', value: Object.fromEntries(gen.instances.map((i) => [i.id, i])) },
  ]);
  const world = buildWorld(toDataset(nested).files.map((f) => f.data));
  // 【第二步】渲染,並在 390px 與 1280px 對每塊截圖
  const out = join(HERE, 'sets', name);
  mkdirSync(join(out, 'blocks'), { recursive: true });
  const html = join(HERE, 'out', `${name}.html`);
  mkdirSync(join(HERE, 'out'), { recursive: true });
  writeFileSync(html, renderPage(world, notoFontCss()));
  const browser = await launch();
  for (const [label, width, height] of [['mobile', 390, 844], ['desktop', 1280, 800]] as const) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(html).href);
    const boxes = await page.evaluate(async () => {
      await document.fonts.load('16px "Noto Sans TC"', '示意');
      await document.fonts.ready;
      return [...document.querySelectorAll<HTMLElement>('[data-block]')].map((el) => {
        const r = el.getBoundingClientRect();
        return { code: el.dataset.block!, x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
      });
    });
    for (const b of boxes) {
      // 每塊四周多留 8px,看得到和周圍的關係
      const pad = 8;
      await page.screenshot({
        path: join(out, 'blocks', `${b.code}-${label}.jpg`),
        fullPage: true,
        type: 'jpeg',
        quality: 70,
        clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(width, b.w + pad * 2), height: b.h + pad * 2 },
      });
    }
    await page.close();
  }
  await browser.close();
  // 【第三步】每塊的程式分數與判定
  const set: RatingSet = {
    set: name,
    title: gen.params.title ?? name,
    total: report.total,
    blocks: world.blocks.map((b) => {
      const fs = report.findings.filter((f) => f.verdict !== 'pass' && (f.ref === b.instance.id || f.ref.split('+').some((r) => r.split('#')[0] === b.instance.id)));
      return {
        code: b.code,
        ref: b.instance.id,
        pattern: `${b.pattern.id} ${b.pattern.name}`,
        heading: b.template.heading.title,
        program: { score: blockScore(fs), findings: fs.map((f) => ({ item: f.item, verdict: f.verdict, display: f.display })) },
        images: { mobile: `blocks/${b.code}-mobile.jpg`, desktop: `blocks/${b.code}-desktop.jpg` },
      };
    }),
  };
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(set, null, 2) + '\n');
  // 盲評版:拿掉程式分數與判定,給角色 agent 用,避免先看到程式的意見
  const blind = {
    set: set.set,
    title: set.title,
    blocks: set.blocks.map((b) => ({ code: b.code, ref: b.ref, pattern: b.pattern, heading: b.heading, images: b.images })),
  };
  writeFileSync(join(out, 'manifest.blind.json'), JSON.stringify(blind, null, 2) + '\n');
  console.log(`評分集 ${name}:${set.blocks.length} 塊(角色 agent 用的截圖與盲評版)→ ${join('poc', 'rating', 'sets', name)}`);
  console.log(set.blocks.map((b) => `  ${b.code} ${b.heading} 程式 ${b.program.score}/10`).join('\n'));
}

if (process.argv[1] && import.meta.filename === process.argv[1]) await main();
