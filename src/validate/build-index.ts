// 第一輪:逐檔做 schema 驗證,並把通過的資料依 prototype 建索引。
// 沒通過 schema 的資料不進索引,後面的規則就不會因為形狀不對而出錯或連鎖誤報。

import type { PrototypeName } from '../model/types.js';
import { SCHEMA_IDS, type SchemaValidator } from './schema.js';
import { type Dataset, type Entry, type Index, type Violation, violation } from './types.js';

/** 建立空索引 */
function emptyIndex(): Index {
  return {
    sites: [],
    tags: new Map(),
    groups: new Map(),
    patterns: new Map(),
    contentTypes: new Map(),
    templates: new Map(),
    pages: new Map(),
    instances: new Map(),
    items: new Map(),
    knownIds: new Map(),
  };
}

/** 記下某種 prototype 出現過的 id */
function remember(index: Index, type: string, id: string): void {
  if (!id) return;
  const set = index.knownIds.get(type) ?? new Set<string>();
  set.add(id);
  index.knownIds.set(type, set);
}

/** 取出物件的 id 字串;沒有就回傳空字串 */
function idOf(data: unknown): string {
  if (data && typeof data === 'object' && 'id' in data && typeof (data as { id: unknown }).id === 'string') {
    return (data as { id: string }).id;
  }
  return '';
}

/** prototype 名稱 → 索引裡的 Map 欄位(SiteProfile 另外用陣列存) */
const MAP_KEY: Record<Exclude<PrototypeName, 'SiteProfile'>, keyof Omit<Index, 'sites'>> = {
  PatternTag: 'tags',
  PatternGroup: 'groups',
  LayoutPattern: 'patterns',
  ContentType: 'contentTypes',
  BlockTemplate: 'templates',
  Page: 'pages',
  BlockInstance: 'instances',
  ContentItem: 'items',
};

/**
 * 驗證每個檔案並建索引。
 * 回傳索引與這一輪找到的違規(schema、duplicate-id)。
 */
export function buildIndex(dataset: Dataset, validator: SchemaValidator): { index: Index; violations: Violation[] } {
  const index = emptyIndex();
  const violations: Violation[] = [];
  // 【第一步】依檔案路徑排序,確保輸出順序與重複 id 的判定都固定
  const files = [...dataset.files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const file of files) {
    // 【第二步】JSON 解析失敗的檔案直接回報
    if (file.error) {
      violations.push(violation('schema', file.path, '', `JSON 解析失敗:${file.error}`));
      continue;
    }
    // 【第三步】依 type 欄位選 schema;沒有或不認得就回報
    const data = file.data;
    const type = data && typeof data === 'object' ? (data as { type?: unknown }).type : undefined;
    if (typeof type !== 'string' || !(type in SCHEMA_IDS)) {
      violations.push(violation('schema', file.path, idOf(data), `未知的 type:${String(type)}`));
      continue;
    }
    const proto = type as PrototypeName;
    // 不論 schema 是否通過,都記下這個 id 存在
    remember(index, proto, idOf(data));
    // 【第四步】schema 驗證,每個錯誤各列一筆
    const errors = validator.validate(proto, data);
    if (errors.length > 0) {
      for (const message of errors) violations.push(violation('schema', file.path, idOf(data), message));
      continue;
    }
    // 【第五步】通過的資料放進索引;同一種 prototype 的 id 重複時回報,保留先出現的那份
    const id = idOf(data);
    if (proto === 'SiteProfile') {
      index.sites.push({ file: file.path, obj: data as never });
      continue;
    }
    const map = index[MAP_KEY[proto]] as Map<string, Entry<unknown>>;
    const existing = map.get(id);
    if (existing) {
      violations.push(violation('duplicate-id', file.path, id, `${proto} 的 id「${id}」與 ${existing.file} 重複`));
      continue;
    }
    map.set(id, { file: file.path, obj: data });
  }
  return { index, violations };
}
