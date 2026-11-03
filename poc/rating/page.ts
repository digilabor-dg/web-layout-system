// 人評工具(檢視器):中間是預覽(把 JSON 渲染成的真實網頁),右側工具列有裝置切換、評分、A/B 比較與匯出。
// 評分模式:在預覽上點選區塊,側欄給 0~10 分(5 顆星,半顆 = 1 分)與短評,盲評(評完才揭曉程式分數)。
// A/B 模式:同一個裝置下切換或並排兩版,選比較好的那一版(說不出原因也沒關係);左右依題號單雙交替,避免位置偏差。
// 單一 HTML 檔,不需要伺服器。

import type { Layout } from './collect.js';

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
.mode-ab .only-rate,.mode-rate .only-ab{display:none}
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
    <div class="grid2"><button id="m-rate" aria-pressed="true">評分</button><button id="m-ab" aria-pressed="false">A/B 比較</button></div>
  </details>
  <details open class="only-rate"><summary>評分</summary>
    <select id="layout" aria-label="選擇版面"></select>
    <div id="blockPanel"></div>
    <ol class="list" id="blockList"></ol>
    <div class="box"><b>整頁短評</b><textarea id="pageComment" placeholder="整體感覺?"></textarea></div>
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
const D = ${data};
const DEVICES = [['手機', 390, 844], ['平板', 768, 1024], ['筆電', 1280, 800], ['桌機', 1440, 900]];
const byId = Object.fromEntries(D.layouts.map((l) => [l.id, l]));
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// 【第一步】狀態(暫存在瀏覽器;讀寫失敗時照常運作)
let S = { mode: 'rate', device: 2, layout: D.layouts[0].id, block: null, pair: 0, view: 'toggle', show: 'A', rater: '', ratings: {}, pageComments: {}, ab: {} };
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
  f.addEventListener('load', () => { if (S.mode === 'rate') inspect(f); fit(); f.contentDocument.fonts && f.contentDocument.fonts.ready.then(fit); });
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
  if (S.mode === 'rate') {
    box.appendChild(frameFor(S.layout, byId[S.layout].title));
    $('cap').textContent = dn + ' ' + w + 'px · ' + byId[S.layout].title;
    $('hint').textContent = '點選區塊來評分';
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

// 【第四步】A/B 模式
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
  $('progress').textContent = '已評 ' + rated + ' 塊;A/B 已答 ' + Object.keys(S.ab).length + ' / ' + D.pairs.length + ' 題';
}

// 【第五步】畫側欄與事件
$('devices').innerHTML = DEVICES.map(([n, w], i) => '<button class="dev-btn" data-d="' + i + '" aria-pressed="' + (i === S.device) + '">' + n + ' ' + w + '</button>').join('');
$('layout').innerHTML = D.layouts.map((l) => '<option value="' + esc(l.id) + '"' + (l.id === S.layout ? ' selected' : '') + '>' + esc(l.group + ' · ' + l.title) + '</option>').join('');
$('rater').value = S.rater;
function setMode(m) { S.mode = m; document.body.className = 'mode-' + m; $('m-rate').setAttribute('aria-pressed', String(m === 'rate')); $('m-ab').setAttribute('aria-pressed', String(m === 'ab')); save(); renderFrames(); m === 'rate' ? renderRatePanel() : renderAbPanel(); }
document.addEventListener('click', (e) => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.classList.contains('dev-btn')) { S.device = Number(t.dataset.d); document.querySelectorAll('.dev-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === t))); save(); renderFrames(); return; }
  if (t.dataset.code) return selectBlock(t.dataset.code, true);
  const act = { 'm-rate': () => setMode('rate'), 'm-ab': () => setMode('ab'),
    prevPair: () => { if (S.pair > 0) { S.pair--; S.show = 'A'; } }, nextPair: () => { if (S.pair < D.pairs.length - 1) { S.pair++; S.show = 'A'; } },
    'v-toggle': () => { S.view = 'toggle'; }, 'v-side': () => { S.view = 'side'; }, showA: () => { S.show = 'A'; }, showB: () => { S.show = 'B'; },
    pickA: () => pick('A'), pickB: () => pick('B'), pickTie: () => pick('tie'), download };
  if (act[t.id]) { act[t.id](); if (!['download', 'pickA', 'pickB', 'pickTie', 'm-rate', 'm-ab'].includes(t.id)) { save(); renderFrames(); renderAbPanel(); } }
});
document.addEventListener('input', (e) => {
  const id = e.target.id;
  if (id === 'score') { rating(S.layout, S.block).score = Number(e.target.value); save(); renderRatePanel(); }
  if (id === 'comment') { rating(S.layout, S.block).comment = e.target.value; save(); }
  if (id === 'pageComment') { S.pageComments[S.layout] = e.target.value; save(); }
  if (id === 'reason' && S.ab[S.pair]) { S.ab[S.pair].reason = e.target.value; save(); }
  if (id === 'rater') { S.rater = e.target.value; save(); }
});
$('layout').addEventListener('change', (e) => { S.layout = e.target.value; S.block = null; save(); renderFrames(); renderRatePanel(); });
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
  const out = { tool: 'layout-review', rater: S.rater.trim() || 'anonymous', source: 'human', ratings, pageComments: Object.entries(S.pageComments).filter(([, c]) => c.trim()).map(([layout, comment]) => ({ layout, comment: comment.trim() })), ab };
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
