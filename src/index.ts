// 公開 API:核心函式庫的唯一入口。CLI、MCP server 與外部系統都從這裡 import。
// 這裡只匯出不依賴 Node 專屬 API 的模組;讀檔請用 src/node/。

export * from './model/types.js';
export { parseRatio, roleRatio, ratioError, VIDEO_RATIO } from './model/ratio.js';
export {
  type DeviceClass,
  type ResolvedSite,
  parseLength,
  resolveSite,
  deviceClass,
  usesDesktopStructure,
  contentWidth,
} from './model/site.js';
export { deriveTabletCols, entryFor } from './model/responsive.js';
export {
  type Placement,
  placements,
  itemCode,
  mobileSequence,
  desktopColumns,
  flowRows,
  sectionInstances,
} from './model/page.js';
export {
  validateDataset,
  compareViolations,
  createSchemaValidator,
  RULES,
  type ValidateOptions,
  type Dataset,
  type DataFile,
  type Violation,
  type RuleCode,
  type Severity,
} from './validate/index.js';
export { SCHEMAS, PRESETS } from './assets.js';
