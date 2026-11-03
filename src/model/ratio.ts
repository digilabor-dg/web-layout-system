// 比例工具:把「3:2」這類字串轉成數字,並依圖片角色取出應有的比例。

import type { ImageRole } from './types.js';

/** 影片固定 16:9 */
export const VIDEO_RATIO = 16 / 9;

/**
 * 把「寬:高」字串轉成寬高比數字。
 * 例:"3:2" → 1.5,"16:9" → 1.777…
 */
export function parseRatio(ratio: string): number {
  // 【第一步】用冒號切成寬與高兩段
  const [w, h] = ratio.split(':').map(Number);
  // 【第二步】任一段不是正數就視為格式錯誤
  if (!w || !h || w <= 0 || h <= 0) {
    throw new Error(`比例格式錯誤:${ratio}`);
  }
  // 【第三步】寬除以高就是寬高比
  return w / h;
}

/**
 * 依圖片角色取出應有的寬高比。
 * main 用網站主比例;square 固定 1;video 固定 16:9;none 沒有圖,回傳 null。
 */
export function roleRatio(role: ImageRole, mainRatio: string): number | null {
  switch (role) {
    case 'main':
      return parseRatio(mainRatio);
    case 'square':
      return 1;
    case 'video':
      return VIDEO_RATIO;
    case 'none':
      return null;
  }
}

/**
 * 實際比例與應有比例的相對誤差。
 * 例:實際 1.333、應為 1.5 → |1.333 − 1.5| ÷ 1.5 ≈ 0.111(11%)
 */
export function ratioError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / expected;
}
