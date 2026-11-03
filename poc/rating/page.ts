// 人評工具(檢視器):中間是預覽(把 JSON 渲染成的真實網頁),右側工具列有裝置切換、評分、A/B 比較與匯出。
// 評分模式:在預覽上點選區塊,側欄給 0~10 分(5 顆星,半顆 = 1 分)與短評,盲評(評完才揭曉程式分數)。
// A/B 模式:同一個裝置下切換或並排兩版,選比較好的那一版(說不出原因也沒關係);左右依題號單雙交替,避免位置偏差。
// 圈選模式(反饋收集 MVP):在預覽上任意拖一個框(可以框空白),程式判定框到哪裡(region.ts),再依 5 條方向軸評 −5~+5。
// 單一 HTML 檔,不需要伺服器。

import type { Layout } from './collect.js';
import { resolveRegion } from './region.js';

/** 檢視工具的資料 */
export interface ReviewData {
  title: string;
  layouts: Layout[];
  /** 每個版面的預覽 HTML,key 為版面 id */
  html: Record<string, string>;
  /** A/B 配對:[版面 id, 版面 id, 說明] */
  pairs: [string, string, string][];
}

/** 產生檢視工具的 HTML */
export function renderReviewPage(d: ReviewData): string {
  const data = JSON.stringify(d).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>版面檢視與人評</title>
<style>
:root{--bg:#fff;--fg:#202124;--muted:#5f6368;--line:#dadce0;--card:#f1f3f4;--accent:#1a73e8;--star:#f5a623;--bad:#d4311f;--mid:#c26a00;--good:#0a8a3a;--stage:#e8eaed}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1f2023;--fg:#e8eaed;--muted:#9aa0a6;--line:#3c4043;--card:#2d2e31;--accent:#8ab4f8;--star:#ffc24d;--bad:#ff6b5e;--mid:#ffa94d;--good:#3ccf72;--stage:#141517}}
:root[data-theme="dark"]{--bg:#1f2023;--fg:#e8eaed;--muted:#9aa0a6;--line:#3c4043;--card:#2d2e31;--accent:#8ab4f8;--star:#ffc24d;--bad:#ff6b5e;--mid:#ffa94d;--good:#3ccf72;--stage:#141517}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,'Noto Sans TC',sans-serif;display:grid;grid-template-columns:1fr 360px;height:100vh;overflow:hidden}
main{background:var(--stage);overflow:auto;position:relative}
.cap{position:sticky;top:0;z-index:2;background:var(--stage);padding:8px 16px;color:var(--muted);font-size:13px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.frames{display:flex;gap:16px;justify-content:center;align-items:flex-start;padding:0 16px 32px}
.dev{transform-origin:top left;flex:none}
.dev .lbl{font-weight:600;margin:0 0 4px;font-size:13px}
iframe{border:0;background:#fff;display:block;box-shadow:0 0 0 1px var(--line),0 4px 16px rgba(0,0,0,.08);border-radius:8px}
aside{border-left:1px solid var(--line);overflow:auto;padding:8px 12px 24px}
details{border-bottom:1px solid var(--line);padding:6px 0}
summary{font-weight:600;cursor:pointer;min-height:36px;display:flex;align-items:center}
button{font:inherit;min-height:44px;min-width:44px;padding:0 10px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg);cursor:pointer}
button[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);font-weight:600}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
select,textarea,input[type=text]{width:100%;font:inherit;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);min-height:44px}
textarea{min-height:64px}
.muted{color:var(--muted)}.box{border:1px solid var(--line);border-radius:8px;padding:10px;margin:8px 0}
.stars{font-size:26px;letter-spacing:2px;white-space:nowrap}.stars .on{color:var(--star)}.stars .off{color:var(--line)}
input[type=range]{width:100%;min-height:44px;accent-color:var(--star)}
.reveal{background:var(--card);border-radius:6px;padding:8px 10px;margin-top:8px}.reveal ul{margin:4px 0 0;padding-left:18px}
.fail{color:var(--bad)}.warn{color:var(--mid)}
ol.list{list-style:none;margin:0;padding:0}ol.list button{width:100%;display:flex;justify-content:space-between;margin:3px 0;text-align:left}
ol.list button.sel{border-color:var(--accent)}
.only-rate,.only-ab,.only-region{display:none}.mode-rate .only-rate,.mode-ab .only-ab,.mode-region .only-region{display:block}
.axis{margin:6px 0}.axis .ends{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}.axis b{font-size:13px}
input.ax{accent-color:var(--accent)}
@media (max-width:820px){body{grid-template-columns:1fr;grid-template-rows:1fr 48vh}aside{border-left:0;border-top:1px solid var(--line)}}
</style>
</head>
<body class="mode-rate">
<main id="stage"><div class="cap"><span id="cap"></span><span id="hint" class="muted"></span></div><div class="frames" id="frames"></div></main>
<aside>
  <details open><summary>裝置</summary>
    <div class="grid2" id="devices"></div>
  </details>
  <details open><summary>模式</summary>
    <div class="grid3"><button id="m-rate" aria-pressed="true">評分</button><button id="m-region" aria-pressed="false">圈選</button><button id="m-ab" aria-pressed="false">A/B 比較</button></div>
  </details>
  <details open class="only-rate"><summary>評分</summary>
    <select id="layout" aria-label="選擇版面"></select>
    <div id="blockPanel"></div>
    <ol class="list" id="blockList"></ol>
    <div class="box"><b>整頁短評</b><textarea id="pageComment" placeholder="整體感覺?"></textarea></div>
  </details>
  <details open class="only-region"><summary>圈選評價</summary>
    <select id="layoutR" aria-label="選擇版面"></select>
    <div id="regionPanel"></div>
    <ol class="list" id="regionList"></ol>
  </details>
  <details open class="only-ab"><summary>A/B 比較</summary>
    <div class="row muted" id="pairInfo"></div>
    <div class="grid2"><button id="prevPair">← 上一題</button><button id="nextPair">下一題 →</button></div>
    <p class="muted">看法:</p>
    <div class="grid2"><button id="v-toggle" aria-pressed="true">切換(A ⇄ B)</button><button id="v-side" aria-pressed="false">並排</button></div>
    <div class="grid2" id="abSwitch" style="margin-top:6px"><button id="showA" aria-pressed="true">看 A</button><button id="showB" aria-pressed="false">看 B</button></div>
    <p class="muted">快速切換:按鍵盤 A、B 或空白鍵。說不出哪裡不同也沒關係,選感覺比較好的。</p>
    <div class="grid3"><button id="pickA">A 比較好</button><button id="pickTie">差不多</button><button id="pickB">B 比較好</button></div>
    <textarea id="reason" placeholder="原因(可以不寫)" style="margin-top:6px"></textarea>
    <div id="abReveal"></div>
  </details>
  <details open><summary>匯出</summary>
    <input type="text" id="rater" placeholder="評分者(名字或代號)">
    <button id="download" style="width:100%;margin-top:6px">下載評分 JSON</button>
    <p class="muted" id="progress"></p>
  </details>
</aside>
<script>
var __name = (f) => f;
${resolveRegion.toString()}
const D = ${data};
const AXES = [['數量', '太少', '太多'], ['大小', '太小', '太大'], ['圖↔字', '圖多一點', '字多一點'], ['空↔擠', '太空', '太擠'], ['層級', '太弱', '太搶']];
const DEVICES = [['手機', 390, 844], ['平板', 768, 1024], ['筆電', 1280, 800], ['桌機', 1440, 900]];
const byId = Object.fromEntries(D.layouts.map((l) => [l.id, l]));
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// 【第一步】狀態(暫存在瀏覽器;讀寫失敗時照常運作)
let S = { mode: 'rate', device: 2, layout: D.layouts[0].id, block: null, pair: 0, view: 'toggle', show: 'A', rater: '', ratings: {}, pageComments: {}, ab: {}, regions: {}, region: null };
try { const saved = JSON.parse(localStorage.getItem('layout-review') || 'null'); if (saved) S = Object.assign(S, saved); } catch (e) {}
function save() { try { localStorage.setItem('layout-review', JSON.stringify(S)); } catch (e) {} }
const rating = (lid, code) => ((S.ratings[lid] = S.ratings[lid] || {}), (S.ratings[lid][code] = S.ratings[lid][code] || { score: null, comment: '' }));

/** A/B 第 n 題:單數題把第二個版面放左邊(A),避免位置偏差 */
function pairSides(n) { const [x, y, note] = D.pairs[n]; return n % 2 ? { A: y, B: x, note } : { A: x, B: y, note }; }

/** 0~10 分轉成 5 顆星 */
function stars(score) {
  if (score === null) return '<span class="off">☆☆☆☆☆</span>';
  const full = Math.floor(score / 2), half = score % 2;
  return '<span class="on">' + '★'.repeat(full) + (half ? '⯪' : '') + '</span><span class="off">' + '☆'.repeat(5 - full - half) + '</span>';
}

// 【第二步】預覽:依模式放一或兩個 iframe,依裝置寬度設定,縮放到放得進中間
function frameFor(lid, label) {
  const wrap = document.createElement('div'); wrap.className = 'dev';
  wrap.innerHTML = '<div class="lbl">' + esc(label) + '</div>';
  const f = document.createElement('iframe'); f.title = label; f.srcdoc = D.html[lid];
  wrap.appendChild(f);
  f.addEventListener('load', () => { if (S.mode === 'rate') inspect(f); if (S.mode === 'region') regionTool(f); fit(); f.contentDocument.fonts && f.contentDocument.fonts.ready.then(fit); });
  return wrap;
}
function fit() {
  const [, w] = DEVICES[S.device];
  const frames = [...document.querySelectorAll('#frames .dev')];
  const avail = ($('stage').clientWidth - 32 - (frames.length - 1) * 16) / frames.length;
  const scale = Math.min(1, avail / w);
  for (const wrap of frames) {
    const f = wrap.querySelector('iframe'); const doc = f.contentDocument; if (!doc) continue;
    f.style.width = w + 'px'; f.style.height = doc.documentElement.scrollHeight + 'px';
    wrap.style.width = w + 'px'; wrap.style.transform = 'scale(' + scale + ')';
    wrap.style.marginRight = (w * scale - w) + 'px'; wrap.style.marginBottom = ((doc.documentElement.scrollHeight + 24) * (scale - 1)) + 'px';
  }
}
window.addEventListener('resize', fit);
function renderFrames() {
  const box = $('frames'); box.innerHTML = '';
  const [dn, w] = DEVICES[S.device];
  if (S.mode === 'rate' || S.mode === 'region') {
    box.appendChild(frameFor(S.layout, byId[S.layout].title));
    $('cap').textContent = dn + ' ' + w + 'px · ' + byId[S.layout].title;
    $('hint').textContent = S.mode === 'rate' ? '點選區塊來評分' : '在預覽上拖曳畫框;不必框準,也可以框空白';
  } else {
    const p = pairSides(S.pair);
    if (S.view === 'side') { box.appendChild(frameFor(p.A, 'A')); box.appendChild(frameFor(p.B, 'B')); }
    else box.appendChild(frameFor(p[S.show], S.show));
    $('cap').textContent = dn + ' ' + w + 'px · 第 ' + (S.pair + 1) + ' 題';
    $('hint').textContent = S.view === 'side' ? '並排比較' : '目前看 ' + S.show + '(按 A / B / 空白鍵切換)';
  }
}

// 【第三步】評分模式:在預覽上加 inspector 式的框線,點選區塊
function inspect(f) {
  const doc = f.contentDocument;
  const css = doc.createElement('style');
  css.textContent = '[data-block]{cursor:pointer;position:relative}[data-block].hov{outline:2px dashed #1a73e8;outline-offset:2px}[data-block].sel{outline:3px solid #1a73e8;outline-offset:2px}'
    + '[data-block].hov::after,[data-block].sel::after{content:attr(data-label);position:absolute;top:0;left:0;transform:translateY(-100%);background:#1a73e8;color:#fff;font:12px/1.6 system-ui;padding:0 6px;border-radius:3px;z-index:9}a{pointer-events:none}';
  doc.head.appendChild(css);
  const lay = byId[S.layout]; const heads = Object.fromEntries(lay.blocks.map((b) => [b.code, b.heading]));
  doc.querySelectorAll('[data-block]').forEach((el) => {
    el.dataset.label = el.dataset.block + ' · ' + (heads[el.dataset.block] || '');
    if (el.dataset.block === S.block) el.classList.add('sel');
    el.addEventListener('mouseenter', () => el.classList.add('hov'));
    el.addEventListener('mouseleave', () => el.classList.remove('hov'));
    el.addEventListener('click', (e) => { e.preventDefault(); selectBlock(el.dataset.block, false); });
  });
}
function selectBlock(code, scroll) {
  S.block = code; save();
  const f = document.querySelector('#frames iframe'); const doc = f && f.contentDocument;
  if (doc) {
    doc.querySelectorAll('[data-block].sel').forEach((el) => el.classList.remove('sel'));
    const el = doc.querySelector('[data-block="' + code + '"]');
    if (el) { el.classList.add('sel'); if (scroll) { const scale = f.getBoundingClientRect().width / f.offsetWidth; $('stage').scrollTo({ top: el.offsetTop * scale, behavior: 'smooth' }); } }
  }
  renderRatePanel();
}
function renderRatePanel() {
  const lay = byId[S.layout];
  if (S.block && lay.blocks.some((b) => b.code === S.block)) {
    const b = lay.blocks.find((x) => x.code === S.block); const r = rating(S.layout, b.code);
    $('blockPanel').innerHTML = '<div class="box"><b>' + esc(b.code) + ' · ' + esc(b.heading) + '</b><div class="muted">' + esc(b.pattern) + '</div>'
      + '<div class="stars" aria-hidden="true">' + stars(r.score) + '</div>'
      + '<input type="range" min="0" max="10" step="1" value="' + (r.score ?? 5) + '" id="score" aria-label="' + esc(b.code) + ' 的分數">'
      + '<b>' + (r.score === null ? '未評(拖動評分)' : r.score + ' / 10') + '</b>'
      + '<textarea id="comment" placeholder="短評:喜歡或不喜歡什麼?">' + esc(r.comment) + '</textarea>'
      + (r.score !== null ? '<div class="reveal">程式分數 <b>' + b.program.score + ' / 10</b>' + (b.program.findings.length ? '<ul>' + b.program.findings.map((f) => '<li class="' + f.verdict + '">' + esc(f.item) + ':' + esc(f.display) + '</li>').join('') + '</ul>' : ':沒有問題') + '</div>' : '<div class="muted">評分後顯示程式分數(盲評)</div>')
      + '</div>';
  } else $('blockPanel').innerHTML = '<div class="box muted">在預覽上點選任一區塊開始評分;滑過會出現虛線框。</div>';
  $('blockList').innerHTML = lay.blocks.map((b) => { const r = rating(S.layout, b.code); return '<li><button data-code="' + esc(b.code) + '" class="' + (b.code === S.block ? 'sel' : '') + '"><span>' + esc(b.code) + ' · ' + esc(b.heading) + '</span><span>' + (r.score === null ? '<span class="muted">未評</span>' : r.score + ' 分') + '</span></button></li>'; }).join('');
  $('pageComment').value = S.pageComments[S.layout] || '';
  progress();
}

// 【第四步】圈選模式:收集頁面上每個框的位置,拖曳畫框,判定目標(resolveRegion),依方向軸評價
const ELEMENT_NAMES = { ph: '圖', t: '標題', s: '摘要', au: '作者', n: '名次', bh: '區塊標題' };
function collectBoxes(doc) {
  const win = doc.defaultView; const sx = win.scrollX, sy = win.scrollY;
  const rect = (r) => ({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height });
  const out = [{ level: 'page', x: 0, y: 0, w: doc.documentElement.scrollWidth, h: doc.documentElement.scrollHeight }];
  doc.querySelectorAll('.sec').forEach((sec) => {
    out.push(Object.assign({ level: 'section', id: sec.dataset.section }, rect(sec.getBoundingClientRect())));
    sec.querySelectorAll(':scope > .col').forEach((col, i) => out.push(Object.assign({ level: 'column', id: sec.dataset.section + '/' + (i + 1) }, rect(col.getBoundingClientRect()))));
  });
  doc.querySelectorAll('[data-block]').forEach((bl) => {
    const code = bl.dataset.block;
    out.push(Object.assign({ level: 'block', code }, rect(bl.getBoundingClientRect())));
    const items = [...bl.querySelectorAll('.card, .list > li, .feat, .ov')];
    items.forEach((it, i) => out.push(Object.assign({ level: 'item', code, item: i + 1 }, rect(it.getBoundingClientRect()))));
    const itemOf = (el) => { const i = items.findIndex((it) => it.contains(el)); return i < 0 ? undefined : i + 1; };
    // 圖:整個圖框;文字:只取有字的那幾行(標題元素本身比字寬)
    bl.querySelectorAll('.ph').forEach((el) => out.push(Object.assign({ level: 'element', code, item: itemOf(el), element: '圖' }, rect(el.getBoundingClientRect()))));
    bl.querySelectorAll('.t, .s, .au, .n, .bh > span, .bh > a').forEach((el) => {
      const cls = el.closest('.bh') ? 'bh' : el.classList[0];
      const range = doc.createRange(); range.selectNodeContents(el);
      [...range.getClientRects()].forEach((r) => { if (r.width > 0 && r.height > 0) out.push(Object.assign({ level: 'element', code, item: itemOf(el), element: ELEMENT_NAMES[cls] || cls }, rect(r))); });
    });
  });
  return out;
}
const regionsHere = () => ((S.regions[S.layout] = S.regions[S.layout] || []), S.regions[S.layout].filter((g) => g.width === DEVICES[S.device][1]));
function regionTool(f) {
  const doc = f.contentDocument;
  const css = doc.createElement('style');
  css.textContent = 'html{user-select:none;cursor:crosshair}a{pointer-events:none}'
    + '.rg-box{position:absolute;border:2px solid #e8710a;background:rgba(232,113,10,.12);pointer-events:none;z-index:20}.rg-box.sel{border-color:#1a73e8;background:rgba(26,115,232,.16)}'
    + '.rg-box span{position:absolute;top:-2px;left:-2px;transform:translateY(-100%);background:#e8710a;color:#fff;font:12px/1.6 system-ui;padding:0 6px;border-radius:3px}.rg-box.sel span{background:#1a73e8}';
  doc.head.appendChild(css);
  let start = null, box = null;
  doc.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; e.preventDefault();
    start = { x: e.pageX, y: e.pageY };
    box = doc.createElement('div'); box.className = 'rg-box sel'; doc.body.appendChild(box);
    Object.assign(box.style, { left: start.x + 'px', top: start.y + 'px', width: '0px', height: '0px' });
  });
  doc.addEventListener('pointermove', (e) => {
    if (!start) return;
    const x = Math.min(start.x, e.pageX), y = Math.min(start.y, e.pageY);
    Object.assign(box.style, { left: x + 'px', top: y + 'px', width: Math.abs(e.pageX - start.x) + 'px', height: Math.abs(e.pageY - start.y) + 'px' });
  });
  doc.addEventListener('pointerup', (e) => {
    if (!start) return;
    const r = { x: Math.round(Math.min(start.x, e.pageX)), y: Math.round(Math.min(start.y, e.pageY)), w: Math.round(Math.abs(e.pageX - start.x)), h: Math.round(Math.abs(e.pageY - start.y)) };
    start = null; box.remove(); box = null;
    // 太小的框當成誤觸
    if (r.w < 8 || r.h < 8) return;
    const g = { id: 'g' + Date.now().toString(36), width: DEVICES[S.device][1], region: r, resolved: resolveRegion(r, collectBoxes(doc)), axes: {}, comment: '' };
    S.regions[S.layout] = S.regions[S.layout] || []; S.regions[S.layout].push(g); S.region = g.id; save();
    drawRegions(doc); renderRegionPanel();
  });
  drawRegions(doc);
}
function drawRegions(doc) {
  doc.querySelectorAll('.rg-box').forEach((el) => el.remove());
  regionsHere().forEach((g, i) => {
    const el = doc.createElement('div'); el.className = 'rg-box' + (g.id === S.region ? ' sel' : '');
    Object.assign(el.style, { left: g.region.x + 'px', top: g.region.y + 'px', width: g.region.w + 'px', height: g.region.h + 'px' });
    el.innerHTML = '<span>' + (i + 1) + '</span>'; doc.body.appendChild(el);
  });
}
/** 把判定結果寫成一句白話 */
function describe(res) {
  if (!res) return '無法判定';
  const name = (t) => t.level === 'column' ? '欄 ' + t.id : t.level === 'section' ? 'section ' + t.id : t.level === 'page' ? '頁面' : t.code + (t.item ? ' 第 ' + t.item + ' 則' : '') + (t.element ? ' · ' + t.element : '');
  const pct = (x) => Math.round(x * 100) + '%';
  if (res.kind === 'content') return '內容:' + name(res.targets[0]) + '(佔圈選區 ' + pct(res.targets[0].oR) + ')';
  if (res.kind === 'multi') return '跨區塊:' + res.targets.map((t) => t.code + ' ' + pct(t.oR)).join('、');
  const where = { 'in-block': '區塊裡的空白', 'in-column': '欄裡、區塊外的空白', 'between-blocks': '兩塊之間的間距', page: '頁面空白' }[res.blank.where];
  const dirs = { up: '上', down: '下', left: '左', right: '右' };
  const nb = Object.entries(res.neighbors || {}).map(([d, t]) => dirs[d] + ':' + name(t) + '(' + t.gap + 'px)').join(';');
  return where + '(' + name(res.blank.container) + ')' + (nb ? '。鄰居 ' + nb : '');
}
const axisText = (a, v) => v === undefined ? '未評' : v === 0 ? '剛好' : v < 0 ? a[1] + ' ' + (-v) : a[2] + ' ' + v;
function renderRegionPanel() {
  const list = regionsHere(); const g = list.find((x) => x.id === S.region);
  $('layoutR').innerHTML = $('layout').innerHTML; $('layoutR').value = S.layout;
  if (g) {
    $('regionPanel').innerHTML = '<div class="box"><b>圈選 ' + (list.indexOf(g) + 1) + '</b><div>' + esc(describe(g.resolved)) + '</div>'
      + AXES.map((a) => '<div class="axis"><b>' + a[0] + ':' + axisText(a, g.axes[a[0]]) + '</b><div class="ends"><span>' + a[1] + '</span><span>剛好</span><span>' + a[2] + '</span></div>'
        + '<input type="range" class="ax" min="-5" max="5" step="1" value="' + (g.axes[a[0]] ?? 0) + '" data-axis="' + a[0] + '" aria-label="' + a[0] + '"></div>').join('')
      + '<textarea id="rgComment" placeholder="短評(可以不寫)">' + esc(g.comment) + '</textarea>'
      + '<div class="grid2" style="margin-top:6px"><button id="rgClear">清除各軸</button><button id="rgDelete">刪除這個圈選</button></div></div>';
  } else $('regionPanel').innerHTML = '<div class="box muted">在預覽上拖曳畫一個框,不必框準區塊,也可以框空白。程式會判定框到哪裡,再請你沿 5 條軸評:0 是剛好,往兩邊是太少/太多等。</div>';
  $('regionList').innerHTML = list.map((x, i) => '<li><button data-rg="' + x.id + '" class="' + (x.id === S.region ? 'sel' : '') + '"><span>' + (i + 1) + '. ' + esc(describe(x.resolved).slice(0, 28)) + '</span><span>' + Object.keys(x.axes).length + ' 軸</span></button></li>').join('');
  progress();
}
const currentRegion = () => regionsHere().find((x) => x.id === S.region);
function redrawRegions() { const f = document.querySelector('#frames iframe'); if (f && f.contentDocument) drawRegions(f.contentDocument); }

// 【第五步】A/B 模式
function renderAbPanel() {
  const p = pairSides(S.pair); const choice = S.ab[S.pair];
  $('pairInfo').textContent = '第 ' + (S.pair + 1) + ' / ' + D.pairs.length + ' 題' + (choice ? ' · 已選:' + ({ A: 'A 比較好', B: 'B 比較好', tie: '差不多' })[choice.pick] : '');
  ['v-toggle', 'v-side'].forEach((id) => $(id).setAttribute('aria-pressed', String((S.view === 'side') === (id === 'v-side'))));
  $('abSwitch').style.display = S.view === 'side' ? 'none' : '';
  $('showA').setAttribute('aria-pressed', String(S.show === 'A')); $('showB').setAttribute('aria-pressed', String(S.show === 'B'));
  $('reason').value = choice ? choice.reason : '';
  $('abReveal').innerHTML = choice
    ? '<div class="reveal">揭曉:A 是「' + esc(byId[p.A].title) + '」(程式 ' + byId[p.A].total + ' 分),B 是「' + esc(byId[p.B].title) + '」(程式 ' + byId[p.B].total + ' 分)。<br><span class="muted">' + esc(p.note) + '</span></div>'
    : '<div class="muted">選完才揭曉 A、B 是哪一版與程式分數(盲測)。</div>';
  progress();
}
function pick(which) { S.ab[S.pair] = { pick: which, reason: $('reason').value.trim() }; save(); renderAbPanel(); }

function progress() {
  const rated = Object.values(S.ratings).reduce((n, m) => n + Object.values(m).filter((r) => r.score !== null).length, 0);
  const regions = Object.values(S.regions).reduce((n, l) => n + l.length, 0);
  $('progress').textContent = '已評 ' + rated + ' 塊;圈選 ' + regions + ' 個;A/B 已答 ' + Object.keys(S.ab).length + ' / ' + D.pairs.length + ' 題';
}

// 【第六步】畫側欄與事件
$('devices').innerHTML = DEVICES.map(([n, w], i) => '<button class="dev-btn" data-d="' + i + '" aria-pressed="' + (i === S.device) + '">' + n + ' ' + w + '</button>').join('');
$('layout').innerHTML = D.layouts.map((l) => '<option value="' + esc(l.id) + '"' + (l.id === S.layout ? ' selected' : '') + '>' + esc(l.group + ' · ' + l.title) + '</option>').join('');
$('rater').value = S.rater;
function setMode(m) {
  S.mode = m; document.body.className = 'mode-' + m;
  ['rate', 'region', 'ab'].forEach((x) => $('m-' + x).setAttribute('aria-pressed', String(m === x)));
  save(); renderFrames(); m === 'rate' ? renderRatePanel() : m === 'region' ? renderRegionPanel() : renderAbPanel();
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.classList.contains('dev-btn')) { S.device = Number(t.dataset.d); document.querySelectorAll('.dev-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === t))); save(); renderFrames(); return; }
  if (t.dataset.code) return selectBlock(t.dataset.code, true);
  if (t.dataset.rg) { S.region = t.dataset.rg; save(); redrawRegions(); return renderRegionPanel(); }
  if (t.id === 'rgClear' && currentRegion()) { currentRegion().axes = {}; save(); return renderRegionPanel(); }
  if (t.id === 'rgDelete' && currentRegion()) { S.regions[S.layout] = S.regions[S.layout].filter((x) => x.id !== S.region); S.region = null; save(); redrawRegions(); return renderRegionPanel(); }
  const act = { 'm-rate': () => setMode('rate'), 'm-region': () => setMode('region'), 'm-ab': () => setMode('ab'),
    prevPair: () => { if (S.pair > 0) { S.pair--; S.show = 'A'; } }, nextPair: () => { if (S.pair < D.pairs.length - 1) { S.pair++; S.show = 'A'; } },
    'v-toggle': () => { S.view = 'toggle'; }, 'v-side': () => { S.view = 'side'; }, showA: () => { S.show = 'A'; }, showB: () => { S.show = 'B'; },
    pickA: () => pick('A'), pickB: () => pick('B'), pickTie: () => pick('tie'), download };
  if (act[t.id]) { act[t.id](); if (!['download', 'pickA', 'pickB', 'pickTie', 'm-rate', 'm-region', 'm-ab'].includes(t.id)) { save(); renderFrames(); renderAbPanel(); } }
});
document.addEventListener('input', (e) => {
  const id = e.target.id;
  if (id === 'score') { rating(S.layout, S.block).score = Number(e.target.value); save(); renderRatePanel(); }
  if (id === 'comment') { rating(S.layout, S.block).comment = e.target.value; save(); }
  if (id === 'pageComment') { S.pageComments[S.layout] = e.target.value; save(); }
  if (id === 'reason' && S.ab[S.pair]) { S.ab[S.pair].reason = e.target.value; save(); }
  if (id === 'rater') { S.rater = e.target.value; save(); }
  if (e.target.dataset.axis && currentRegion()) { currentRegion().axes[e.target.dataset.axis] = Number(e.target.value); save(); renderRegionPanel(); }
  if (id === 'rgComment' && currentRegion()) { currentRegion().comment = e.target.value; save(); }
});
$('layout').addEventListener('change', (e) => { S.layout = e.target.value; S.block = null; save(); renderFrames(); renderRatePanel(); });
$('layoutR').addEventListener('change', (e) => { S.layout = e.target.value; S.region = null; $('layout').value = S.layout; save(); renderFrames(); renderRegionPanel(); });
document.addEventListener('keydown', (e) => {
  if (S.mode !== 'ab' || S.view !== 'toggle' || /TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'b' || k === ' ') { e.preventDefault(); S.show = k === ' ' ? (S.show === 'A' ? 'B' : 'A') : k.toUpperCase(); save(); renderFrames(); renderAbPanel(); }
});
function download() {
  const ratings = [];
  for (const [layout, m] of Object.entries(S.ratings)) for (const [code, r] of Object.entries(m)) {
    const b = byId[layout] && byId[layout].blocks.find((x) => x.code === code);
    if (b && (r.score !== null || r.comment)) ratings.push({ layout, ref: b.ref, code, score: r.score, comment: r.comment.trim() });
  }
  const ab = Object.entries(S.ab).map(([n, c]) => { const p = pairSides(Number(n)); return { pair: Number(n), A: p.A, B: p.B, winner: c.pick === 'tie' ? 'tie' : p[c.pick], reason: c.reason }; });
  // 圈選:目標的區塊代號換成穩定的 ref,版面改了以後還能對回去
  const refOf = (layout, code) => { const b = byId[layout] && byId[layout].blocks.find((x) => x.code === code); return b ? b.ref : undefined; };
  const withRef = (layout, t) => (t && t.code ? Object.assign({}, t, { ref: refOf(layout, t.code) }) : t);
  const regions = [];
  for (const [layout, list] of Object.entries(S.regions)) for (const g of list) {
    const res = g.resolved && Object.assign({}, g.resolved, { targets: g.resolved.targets.map((t) => withRef(layout, t)),
      neighbors: g.resolved.neighbors && Object.fromEntries(Object.entries(g.resolved.neighbors).map(([d, t]) => [d, withRef(layout, t)])),
      blank: g.resolved.blank && Object.assign({}, g.resolved.blank, { container: withRef(layout, g.resolved.blank.container) }) });
    regions.push({ layout, width: g.width, region: g.region, resolved: res, axes: g.axes, comment: g.comment.trim() });
  }
  const out = { tool: 'layout-review', rater: S.rater.trim() || 'anonymous', source: 'human', ratings, pageComments: Object.entries(S.pageComments).filter(([, c]) => c.trim()).map(([layout, comment]) => ({ layout, comment: comment.trim() })), ab, regions };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2) + '\\n'], { type: 'application/json' }));
  a.download = 'review-' + out.rater + '.json'; a.click();
}
setMode(S.mode);
</script>
</body>
</html>
`;
}
