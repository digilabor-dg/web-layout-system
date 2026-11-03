// 第 1 層規則檢查的入口:schema 驗證 → 建索引 → 依序執行各條規則 → 排序輸出。
// 核心不讀檔、不碰 Node 專屬 API;資料、schema、預設參數組都由呼叫端傳入。

import type { Preset } from '../model/types.js';
import { buildIndex } from './build-index.js';
import {
  checkMainRatio,
  checkPatternItemRange,
  checkPatternLimit,
  checkRefs,
  checkSingleSite,
} from './rules/integrity.js';
import {
  checkImageRole,
  checkInstanceContentMatch,
  checkInstanceItemCount,
  checkOverrideFields,
  checkOverrideItemCount,
  checkSuggestedPattern,
  checkTemplateItemCount,
  checkTemplateTabs,
} from './rules/template-instance.js';
import { checkGallerySize, checkImageFiles, checkItemCrops } from './rules/images.js';
import {
  checkCodeCapacity,
  checkDeviceHidden,
  checkDuplicateItemOnPage,
  checkInstanceOnOnePage,
  checkMobileOrder,
  checkStackColumns,
} from './rules/page.js';
import { createSchemaValidator, type SchemaValidator } from './schema.js';
import type { Dataset, RuleContext, Violation } from './types.js';

export * from './types.js';
export { createSchemaValidator } from './schema.js';

/** 依規格順序排列的規則函式 */
const RULE_FUNCTIONS = [
  checkRefs,
  checkSingleSite,
  checkMainRatio,
  checkPatternLimit,
  checkPatternItemRange,
  checkTemplateItemCount,
  checkTemplateTabs,
  checkImageRole,
  checkSuggestedPattern,
  checkOverrideFields,
  checkOverrideItemCount,
  checkInstanceItemCount,
  checkInstanceContentMatch,
  checkItemCrops,
  checkImageFiles,
  checkGallerySize,
  checkInstanceOnOnePage,
  checkStackColumns,
  checkMobileOrder,
  checkCodeCapacity,
  checkDeviceHidden,
  checkDuplicateItemOnPage,
];

/** 違規的固定排序:檔案 → id → 規則代號 → 訊息 */
export function compareViolations(a: Violation, b: Violation): number {
  for (const key of ['file', 'id', 'rule', 'message'] as const) {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
  }
  return 0;
}

/** 檢查選項 */
export interface ValidateOptions {
  /** 已建立的 schema 驗證器;重複檢查時可共用,省去重新編譯 */
  validator?: SchemaValidator;
  /** 沒傳 validator 時,用這組 schema 物件建立 */
  schemas?: object[];
  /** 預設參數組(bs5、tw4、md3) */
  presets: Record<string, Preset>;
}

/**
 * 對一份資料集執行第 1 層規則檢查,回傳排序好的違規清單。
 * 同樣的輸入一定得到同樣的輸出(內容與順序都相同)。
 */
export function validateDataset(dataset: Dataset, options: ValidateOptions): Violation[] {
  // 【第一步】準備 schema 驗證器
  const validator = options.validator ?? createSchemaValidator(options.schemas ?? []);
  // 【第二步】schema 驗證並建索引;沒通過的資料不進索引
  const { index, violations } = buildIndex(dataset, validator);
  // 【第三步】依序執行每條規則
  const ctx: RuleContext = { index, presets: options.presets };
  for (const rule of RULE_FUNCTIONS) violations.push(...rule(ctx));
  // 【第四步】固定排序後回傳
  return violations.sort(compareViolations);
}
