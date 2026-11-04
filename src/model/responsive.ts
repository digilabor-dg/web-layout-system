// 響應式:展示類型只存手機與電腦兩組設定,平板由程式推算。

import type { ResponsiveEntry } from './types.js';
import { type DeviceClass, usesDesktopStructure } from './site.js';

/**
 * 推算平板欄數:電腦版欄數減一欄,且不少於手機欄數。
 * 例:手機 2 欄、電腦 4 欄 → 平板 3 欄。
 */
export function deriveTabletCols(mobileCols: number, desktopCols: number): number {
  // 電腦不比手機多欄時,直接沿用電腦欄數
  if (desktopCols <= mobileCols) return desktopCols;
  // 否則取「電腦 − 1」與「手機」的較大者
  return Math.max(mobileCols, desktopCols - 1);
}

/**
 * 取得某類裝置的排法。
 * 手機、電腦直接取設定;平板的結構跟著主切換點(tablet-V 用手機、tablet-H 用電腦),
 * 兩端都是整數欄數時,欄數改用推算值。
 */
export function entryFor(
  rd: { mobile: ResponsiveEntry; desktop: ResponsiveEntry },
  device: DeviceClass,
): ResponsiveEntry {
  // 【第一步】手機與電腦直接回傳
  if (device === 'mobile') return rd.mobile;
  if (device === 'desktop') return rd.desktop;
  // 【第二步】平板:先依主切換點決定沿用哪一端的結構
  const base = usesDesktopStructure(device) ? rd.desktop : rd.mobile;
  // 【第三步】兩端欄數都是整數時,欄數用推算值
  if (typeof rd.mobile.cols === 'number' && typeof rd.desktop.cols === 'number') {
    return { ...base, cols: deriveTabletCols(rd.mobile.cols, rd.desktop.cols) };
  }
  // 【第四步】否則照沿用那一端的設定
  return base;
}
