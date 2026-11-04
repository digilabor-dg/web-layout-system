// JSON Schema 驗證:依每份資料的 type 選擇對應的 schema。
// schema 以 JSON 物件傳入,核心不讀檔,所以在 Node、瀏覽器都能用。

import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import type { PrototypeName } from '../model/types.js';

// ajv-formats 以 CommonJS 匯出;在 ESM 下有時包在 default 裡,兩種情況都處理
type AddFormats = (ajv: Ajv2020) => Ajv2020;
const addFormats = ((addFormatsModule as unknown as { default?: AddFormats }).default ??
  addFormatsModule) as unknown as AddFormats;

/** 每種 prototype 對應的 schema $id */
export const SCHEMA_IDS: Record<PrototypeName, string> = {
  SiteProfile: 'site-profile.schema.json',
  PatternTag: 'pattern-tag.schema.json',
  PatternGroup: 'pattern-group.schema.json',
  LayoutPattern: 'layout-pattern.schema.json',
  ContentType: 'content-type.schema.json',
  BlockTemplate: 'block-template.schema.json',
  Page: 'page.schema.json',
  BlockInstance: 'block-instance.schema.json',
  ContentItem: 'content-item.schema.json',
};

/** 編譯好的驗證器 */
export interface SchemaValidator {
  /** 回傳錯誤訊息清單;空陣列表示通過 */
  validate(type: PrototypeName, data: unknown): string[];
}

/** 把 Ajv 的一個錯誤轉成一行訊息:欄位路徑 + 說明 */
function formatError(e: ErrorObject): string {
  // 額外欄位要把欄位名稱講出來,否則只會看到「must NOT have additional properties」
  const extra =
    e.keyword === 'additionalProperties' || e.keyword === 'unevaluatedProperties'
      ? `(${String((e.params as Record<string, unknown>).additionalProperty ?? (e.params as Record<string, unknown>).unevaluatedProperty)})`
      : '';
  return `${e.instancePath || '/'} ${e.message ?? ''}${extra}`.trim();
}

/**
 * 用一組 schema 物件建立驗證器。
 * schemas 需包含 common.schema.json 與 9 種 prototype 的 schema。
 */
export function createSchemaValidator(schemas: object[]): SchemaValidator {
  // 【第一步】建立 Ajv:收集全部錯誤、啟用 date-time 等格式;
  // strictRequired 關閉,因為條件式(if/then、oneOf)裡的 required 會引用上層定義的欄位
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  // 【第二步】先登記全部 schema,讓 $ref 能互相引用
  for (const s of schemas) ajv.addSchema(s);
  // 【第三步】為每種 prototype 取出編譯好的驗證函式
  const compiled = new Map<PrototypeName, ValidateFunction>();
  for (const [type, id] of Object.entries(SCHEMA_IDS) as [PrototypeName, string][]) {
    const fn = ajv.getSchema(id);
    if (!fn) throw new Error(`缺少 schema:${id}`);
    compiled.set(type, fn);
  }
  return {
    validate(type, data) {
      const fn = compiled.get(type);
      if (!fn) return [`未知的 type:${type}`];
      // 【第四步】驗證並把錯誤轉成訊息
      return fn(data) ? [] : (fn.errors ?? []).map(formatError);
    },
  };
}
