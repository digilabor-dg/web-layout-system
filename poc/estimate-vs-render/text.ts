// 標題行數估算:兩種方法。
// ratio  = 規格的公式:⌈標題顯示寬 ÷ 文字區寬⌉
// greedy = 逐字排入:中文一字一格可在任何位置換行,英文與數字的連續字元不拆開

/** 平均字寬(em) */
export interface CharWidths {
  cjk: number;
  latin: number;
}

/**
 * 空白與半形標點的寬度(em)。
 * POC 1 第一輪把半形標點當成英數字(0.55 em),標題多估一行的 10 筆幾乎都是這個原因;
 * 實測 Noto Sans TC:逗號、冒號、句號 0.278 em,空白 0.224 em,括號 0.338 em,取 0.3 em(略保守)。
 * 第 2 階段建議把它加進網站設定的 avgCharWidth(例如 narrow)。
 */
export const NARROW_EM = 0.3;

/** 半形標點 */
const NARROW = /[ .,:;!?'"()[\]\-/]/;

/** 是否為全形字元(中日韓文字、全形標點) */
function isWide(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xff00 && c <= 0xffef) || (c >= 0x3000 && c <= 0x303f);
}

/** 一個字元的寬度(em):全形、半形標點與空白、其他英數字 */
function charEm(ch: string, w: CharWidths): number {
  if (isWide(ch)) return w.cjk;
  if (NARROW.test(ch)) return NARROW_EM;
  return w.latin;
}

/** 整段文字的顯示寬(px) */
export function textWidth(text: string, fontSize: number, w: CharWidths): number {
  let em = 0;
  for (const ch of text) em += charEm(ch, w);
  return em * fontSize;
}

/** 規格的公式:總寬 ÷ 欄寬,無條件進位,至少 1 行 */
export function linesByRatio(text: string, fontSize: number, avail: number, w: CharWidths): number {
  return Math.max(1, Math.ceil(textWidth(text, fontSize, w) / avail - 1e-9));
}

/** 逐字排入:把文字切成「不可拆的單位」,一個一個放進行裡 */
export function linesByGreedy(text: string, fontSize: number, avail: number, w: CharWidths): number {
  // 【第一步】切單位:全形字各自一個單位;連續的英數字合成一個單位;空白單獨一個單位
  const tokens = text.match(/[A-Za-z0-9.,%'’:-]+|\s|./gu) ?? [];
  let lines = 1;
  let used = 0;
  for (const t of tokens) {
    const tw = textWidth(t, fontSize, w);
    // 【第二步】行首的空白不佔位
    if (t === ' ' && used === 0) continue;
    // 【第三步】放不下就換行;換行後行首遇到空白就丟掉
    if (used + tw > avail + 1e-9 && used > 0) {
      lines += 1;
      used = t === ' ' ? 0 : tw;
      continue;
    }
    used += tw;
  }
  return lines;
}
