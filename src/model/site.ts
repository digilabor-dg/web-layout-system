// 網站設定的解析:把預設參數組(bs5、tw4、md3)與網站設定的覆寫合併,
// 並提供「某個寬度屬於哪類裝置」「某個寬度的內容寬度是多少」等計算。

import type { Breakpoints, Preset, SiteProfile } from './types.js';
import { parseRatio } from './ratio.js';

/** 四類裝置 */
export type DeviceClass = 'mobile' | 'tablet-V' | 'tablet-H' | 'desktop';

/** 合併後的網站設定 */
export interface ResolvedSite {
  profile: SiteProfile;
  breakpoints: Breakpoints;
  containers: Preset['containers'];
  gutterPx: number;
  maxWidthPx: number | null;
  mainRatio: number;
}

/** rem 的基準:1rem = 16px */
const REM_PX = 16;

/**
 * 把 CSS 長度(只接受 px 或 rem)轉成 px 數字。
 * 例:"1rem" → 16,"24px" → 24
 */
export function parseLength(length: string): number {
  // 【第一步】拆出數字與單位
  const match = /^([0-9]+(?:\.[0-9]+)?)(px|rem)$/.exec(length);
  if (!match) {
    throw new Error(`長度格式錯誤:${length}`);
  }
  const value = Number(match[1]);
  // 【第二步】rem 乘上基準,px 直接用
  return match[2] === 'rem' ? value * REM_PX : value;
}

/**
 * 合併預設參數組與網站設定的覆寫。
 * custom 沒有預設參數組,斷點與欄距必須由網站設定自己提供。
 */
export function resolveSite(profile: SiteProfile, presets: Record<string, Preset>): ResolvedSite {
  // 【第一步】取出預設參數組;custom 時沒有
  const preset = profile.preset === 'custom' ? undefined : presets[profile.preset];
  if (profile.preset !== 'custom' && !preset) {
    throw new Error(`找不到預設參數組:${profile.preset}`);
  }
  // 【第二步】斷點:預設值逐項被網站設定覆寫
  const bp = { ...(preset?.breakpoints ?? {}), ...(profile.breakpoints ?? {}) };
  if (bp.tabletV === undefined || bp.tabletH === undefined || bp.desktop === undefined) {
    throw new Error('custom 網站設定必須提供 tabletV、tabletH、desktop 三個斷點');
  }
  // 【第三步】欄距:網站設定優先,其次預設參數組
  const gutter = profile.grid?.gutter ?? preset?.gutter;
  if (!gutter) {
    throw new Error('custom 網站設定必須提供 grid.gutter');
  }
  // 【第四步】容器規則:custom 時只有一條「滿版、內距為欄距一半」
  const containers = preset?.containers ?? [{ minWidth: 0, maxWidth: null, padding: null }];
  return {
    profile,
    breakpoints: { tabletV: bp.tabletV, tabletH: bp.tabletH, desktop: bp.desktop },
    containers,
    gutterPx: parseLength(gutter),
    maxWidthPx: profile.grid?.maxWidth ? parseLength(profile.grid.maxWidth) : null,
    mainRatio: parseRatio(profile.mainRatio),
  };
}

/**
 * 依斷點判斷某個視窗寬度屬於哪類裝置。
 * 例:bs5 的 1024 → tablet-H(992 ≤ 1024 < 1200)
 */
export function deviceClass(width: number, bp: Breakpoints): DeviceClass {
  if (width >= bp.desktop) return 'desktop';
  if (width >= bp.tabletH) return 'tablet-H';
  if (width >= bp.tabletV) return 'tablet-V';
  return 'mobile';
}

/**
 * 是否採用電腦的排法結構。主切換點 = tablet-H 的起點,
 * 所以 tablet-H 與 desktop 用電腦排法,mobile 與 tablet-V 用手機排法。
 */
export function usesDesktopStructure(device: DeviceClass): boolean {
  return device === 'tablet-H' || device === 'desktop';
}

/**
 * 某個視窗寬度下,容器扣掉左右內距後的內容寬度。
 * fluid 為 true 時不受容器最大寬度限制。
 */
export function contentWidth(width: number, site: ResolvedSite, fluid = false): number {
  // 【第一步】找出「minWidth ≤ 視窗寬」的最後一條容器規則
  let rule = site.containers[0];
  for (const c of site.containers) {
    if (width >= c.minWidth) rule = c;
  }
  if (!rule) throw new Error('預設參數組沒有容器規則');
  // 【第二步】容器寬:滿版就是視窗寬,否則取視窗寬與最大寬的較小者
  let container = rule.maxWidth === null || fluid ? width : Math.min(width, rule.maxWidth);
  // 【第三步】網站設定另有最大寬時再限制一次(fluid 除外)
  if (site.maxWidthPx !== null && !fluid) container = Math.min(container, site.maxWidthPx);
  // 【第四步】左右內距:沒寫就等於欄距的一半
  const padding = rule.padding ?? site.gutterPx / 2;
  // 【第五步】內容寬 = 容器寬 − 左右內距
  return container - padding * 2;
}
