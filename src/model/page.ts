// 頁面的位置推算:版位代號、閱讀順序、flow section 的自然換列。
// 版位代號不存在資料裡,一律由這裡依位置算出來。

import type { Page, Section } from './types.js';

/** 一個區塊在頁面上的位置 */
export interface Placement {
  instance: string;
  sectionIndex: number;
  sectionId: string;
  /** stack section 的第幾欄(從 0 起);flow section 為 null */
  columnIndex: number | null;
  /** 在整頁的順序(從 0 起) */
  pageIndex: number;
  /** 在 section 內的順序(從 0 起) */
  indexInSection: number;
  /** 推算出的版位代號,例如 H 或 AC */
  code: string;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** 第 n 個字母(從 0 起);超過 26 個時回傳 ? 加序號,由規則 code-capacity 回報 */
export function letter(n: number): string {
  return LETTERS[n] ?? `?${n + 1}`;
}

/** section 內的實例 id,依「左欄到右欄、每欄由上而下」或 flow 的列出順序 */
export function sectionInstances(section: Section): string[] {
  if (section.mode === 'stack') {
    return section.columns.flatMap((c) => c.blocks);
  }
  return section.blocks.map((b) => b.instance);
}

/**
 * 推算整頁每個區塊的位置與版位代號。
 * flat:整頁依序 A~Z;sectioned:section 字母 + section 內字母,例如 AC。
 */
export function placements(page: Page): Placement[] {
  const result: Placement[] = [];
  let pageIndex = 0;
  // 【第一步】section 由上而下
  page.sections.forEach((section, sectionIndex) => {
    let indexInSection = 0;
    // 【第二步】列出這個 section 的區塊,stack 要記下所在欄
    const entries: { instance: string; columnIndex: number | null }[] =
      section.mode === 'stack'
        ? section.columns.flatMap((col, columnIndex) => col.blocks.map((instance) => ({ instance, columnIndex })))
        : section.blocks.map((b) => ({ instance: b.instance, columnIndex: null }));
    // 【第三步】依編號方式算出代號
    for (const entry of entries) {
      const code =
        page.codeScheme === 'flat' ? letter(pageIndex) : `${letter(sectionIndex)}${letter(indexInSection)}`;
      result.push({
        instance: entry.instance,
        sectionIndex,
        sectionId: section.id,
        columnIndex: entry.columnIndex,
        pageIndex,
        indexInSection,
        code,
      });
      pageIndex += 1;
      indexInSection += 1;
    }
  });
  return result;
}

/** 則的代號:版位代號加序數(從 1 起),例如 H3、AC12 */
export function itemCode(blockCode: string, ordinal: number): string {
  return `${blockCode}${ordinal}`;
}

/**
 * 手機上的閱讀順序:每個 section 依 mobileOrder,沒寫就把各欄依序串起來。
 */
export function mobileSequence(page: Page): string[] {
  return page.sections.flatMap((section) => section.mobileOrder ?? sectionInstances(section));
}

/**
 * 電腦上的閱讀順序:每一條「欄」各自由上而下。
 * stack section 的每一欄算一條;flow section 整個算一條。
 */
export function desktopColumns(page: Page): string[][] {
  return page.sections.flatMap((section) =>
    section.mode === 'stack' ? section.columns.map((c) => [...c.blocks]) : [section.blocks.map((b) => b.instance)],
  );
}

/**
 * flow section 的自然換列:由左而右累計 span,超過 12 就換到下一列。
 * 例:span 8、4、6、6 → [[第 1、2 塊], [第 3、4 塊]]
 */
export function flowRows(
  blocks: { instance: string; span: { mobile: number; desktop: number } }[],
  device: 'mobile' | 'desktop',
): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let used = 0;
  for (const b of blocks) {
    const span = b.span[device];
    // 這一塊放不下就先收掉目前這一列
    if (used + span > 12 && current.length > 0) {
      rows.push(current);
      current = [];
      used = 0;
    }
    current.push(b.instance);
    used += span;
  }
  if (current.length > 0) rows.push(current);
  return rows;
}
