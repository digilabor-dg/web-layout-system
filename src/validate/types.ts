// 規則檢查的共用型別:資料集、違規、規則代號與嚴重度。

import type {
  BlockInstance,
  BlockTemplate,
  ContentItem,
  ContentType,
  LayoutPattern,
  Page,
  PatternGroup,
  PatternTag,
  Preset,
  SiteProfile,
} from '../model/types.js';

/** 資料集裡的一個檔案:相對路徑與解析後的內容;解析失敗時 error 有值 */
export interface DataFile {
  path: string;
  data: unknown;
  error?: string;
}

/** 一份資料集 = 一組檔案。核心不讀檔,由呼叫端(CLI、測試、瀏覽器)準備好 */
export interface Dataset {
  files: DataFile[];
}

export type Severity = 'error' | 'warning';

/** 一筆違規 */
export interface Violation {
  file: string;
  id: string;
  rule: RuleCode;
  severity: Severity;
  message: string;
}

/** 規則代號與嚴重度(對應 openspec/specs/rule-check) */
export const RULES = {
  schema: 'error',
  'duplicate-id': 'error',
  'ref-exists': 'error',
  'single-site-profile': 'error',
  'main-ratio-media-kind': 'error',
  'pattern-limit': 'error',
  'pattern-item-range': 'error',
  'template-item-count': 'error',
  'template-tabs': 'error',
  'image-role': 'error',
  'suggested-pattern': 'warning',
  'override-fields': 'error',
  'override-item-count': 'error',
  'instance-item-count': 'error',
  'instance-content-match': 'error',
  'item-crops': 'error',
  'image-file-ratio': 'error',
  'no-portrait': 'error',
  'gallery-size': 'error',
  'instance-on-one-page': 'error',
  'stack-columns-sum': 'error',
  'mobile-order-complete': 'error',
  'code-capacity': 'error',
  'device-hidden': 'warning',
  'duplicate-item-on-page': 'warning',
} as const satisfies Record<string, Severity>;

export type RuleCode = keyof typeof RULES;

/** 通過 schema 的一筆資料,連同它所在的檔案 */
export interface Entry<T> {
  file: string;
  obj: T;
}

/** 依 prototype 分類、依 id 建索引的資料 */
export interface Index {
  sites: Entry<SiteProfile>[];
  tags: Map<string, Entry<PatternTag>>;
  groups: Map<string, Entry<PatternGroup>>;
  patterns: Map<string, Entry<LayoutPattern>>;
  contentTypes: Map<string, Entry<ContentType>>;
  templates: Map<string, Entry<BlockTemplate>>;
  pages: Map<string, Entry<Page>>;
  instances: Map<string, Entry<BlockInstance>>;
  items: Map<string, Entry<ContentItem>>;
  /**
   * 每種 prototype 出現過的 id,包含沒通過 schema 的資料。
   * 引用檢查用它判斷「存在與否」,避免一份格式錯的資料再連帶產生引用錯誤。
   */
  knownIds: Map<string, Set<string>>;
}

/** 規則執行時拿到的資料 */
export interface RuleContext {
  index: Index;
  presets: Record<string, Preset>;
}

/** 建立一筆違規;嚴重度一律由 RULES 決定,避免各處寫錯 */
export function violation(rule: RuleCode, file: string, id: string, message: string): Violation {
  return { file, id, rule, severity: RULES[rule], message };
}

/** 資料集層級的違規(不屬於單一檔案)用這個檔名 */
export const DATASET_FILE = '(dataset)';
