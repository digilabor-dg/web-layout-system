// 資料完整性規則:引用存在、網站設定唯一、主比例與媒體類型一致、型數上限、則數範圍。

import { DATASET_FILE, type RuleContext, type Violation, violation } from '../types.js';

/** 展示類型總數上限 */
export const PATTERN_LIMIT = 40;

/** ref-exists:所有引用的 id 都要存在,而且是正確的 prototype */
export function checkRefs({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  // 小工具:某種 prototype 有沒有這個 id(格式錯的資料也算存在,它的錯誤已由 schema 回報)
  const has = (type: string, id: string) => index.knownIds.get(type)?.has(id) ?? false;
  // 小工具:引用不存在時記一筆
  const need = (ok: boolean, file: string, id: string, what: string) => {
    if (!ok) out.push(violation('ref-exists', file, id, `引用不存在:${what}`));
  };
  // 【第一步】展示類型 → 用途分組、外觀標籤
  for (const { file, obj } of index.patterns.values()) {
    need(has('PatternGroup', obj.group), file, obj.id, `用途分組 ${obj.group}`);
    for (const t of obj.tags) need(has('PatternTag', t), file, obj.id, `外觀標籤 ${t}`);
  }
  // 【第二步】內容類型 → 建議搭配的展示類型
  for (const { file, obj } of index.contentTypes.values()) {
    for (const p of obj.suggestedPatterns) need(has('LayoutPattern', p), file, obj.id, `展示類型 ${p}`);
  }
  // 【第三步】範本 → 內容類型(含分類)、展示類型、斷點下換型的展示類型
  for (const { file, obj } of index.templates.values()) {
    const ct = index.contentTypes.get(obj.contentType.ref);
    need(has('ContentType', obj.contentType.ref), file, obj.id, `內容類型 ${obj.contentType.ref}`);
    if (ct && obj.contentType.category) {
      need(ct.obj.categories.includes(obj.contentType.category), file, obj.id, `分類 ${obj.contentType.category}`);
    }
    need(has('LayoutPattern', obj.pattern), file, obj.id, `展示類型 ${obj.pattern}`);
    const mp = obj.responsive?.mobile?.pattern;
    if (mp) need(has('LayoutPattern', mp), file, obj.id, `展示類型 ${mp}`);
  }
  // 【第四步】實例 → 範本、新聞則
  for (const { file, obj } of index.instances.values()) {
    need(has('BlockTemplate', obj.template), file, obj.id, `區塊範本 ${obj.template}`);
    for (const it of obj.items) need(has('ContentItem', it), file, obj.id, `新聞則 ${it}`);
  }
  // 【第五步】頁面 → 實例(含 mobileOrder)
  for (const { file, obj } of index.pages.values()) {
    for (const section of obj.sections) {
      const ids =
        section.mode === 'stack' ? section.columns.flatMap((c) => c.blocks) : section.blocks.map((b) => b.instance);
      for (const i of [...ids, ...(section.mobileOrder ?? [])]) {
        need(has('BlockInstance', i), file, obj.id, `區塊實例 ${i}`);
      }
    }
  }
  // 【第六步】新聞則 → 內容類型與分類
  for (const { file, obj } of index.items.values()) {
    const ct = index.contentTypes.get(obj.contentType);
    need(has('ContentType', obj.contentType), file, obj.id, `內容類型 ${obj.contentType}`);
    if (ct && obj.category) need(ct.obj.categories.includes(obj.category), file, obj.id, `分類 ${obj.category}`);
  }
  return out;
}

/** single-site-profile:恰好一份網站設定 */
export function checkSingleSite({ index }: RuleContext): Violation[] {
  if (index.sites.length === 1) return [];
  return [violation('single-site-profile', DATASET_FILE, '', `網站設定應恰好一份,目前有 ${index.sites.length} 份`)];
}

/** main-ratio-media-kind:平面站 3:2、影視站 16:9 */
export function checkMainRatio({ index }: RuleContext): Violation[] {
  const expected = { print: '3:2', broadcast: '16:9' } as const;
  return index.sites
    .filter(({ obj }) => obj.mainRatio !== expected[obj.mediaKind])
    .map(({ file, obj }) =>
      violation(
        'main-ratio-media-kind',
        file,
        obj.id,
        `媒體類型 ${obj.mediaKind} 的主比例應為 ${expected[obj.mediaKind]},目前為 ${obj.mainRatio}`,
      ),
    );
}

/** pattern-limit:展示類型不超過 40 種 */
export function checkPatternLimit({ index }: RuleContext): Violation[] {
  if (index.patterns.size <= PATTERN_LIMIT) return [];
  return [
    violation('pattern-limit', DATASET_FILE, '', `展示類型有 ${index.patterns.size} 種,超過上限 ${PATTERN_LIMIT}`),
  ];
}

/** pattern-item-range:則數範圍的 min 不得大於 max */
export function checkPatternItemRange({ index }: RuleContext): Violation[] {
  return [...index.patterns.values()]
    .filter(({ obj }) => obj.items.max !== null && obj.items.min > obj.items.max)
    .map(({ file, obj }) =>
      violation('pattern-item-range', file, obj.id, `則數範圍顛倒:min ${obj.items.min} > max ${obj.items.max}`),
    );
}
