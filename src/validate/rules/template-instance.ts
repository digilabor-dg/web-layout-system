// 範本與實例規則:則數範圍、分頁數、圖片角色、建議搭配、覆寫限制、實際則數、內容一致。

import type { BlockInstance, BlockTemplate, LayoutPattern } from '../../model/types.js';
import { type RuleContext, type Violation, violation } from '../types.js';

/** 分頁籤型(arrangement 為 tabs):則數指每一頁,總則數 = 分頁數 × 每頁則數 */
export function isTabs(pattern: LayoutPattern | undefined): boolean {
  return pattern?.arrangement === 'tabs';
}

/** 實例覆寫只允許的欄位 */
export const OVERRIDABLE = ['itemCount', 'selection', 'heading'] as const;

/** 則數是否落在展示類型的範圍內;max 為 null 表示不限 */
export function inRange(n: number, items: LayoutPattern['items']): boolean {
  return n >= items.min && (items.max === null || n <= items.max);
}

/** 範圍的文字說明,例如「4–6」或「1 以上」 */
function rangeText(items: LayoutPattern['items']): string {
  return items.max === null ? `${items.min} 以上` : `${items.min}–${items.max}`;
}

/** 實例應有的實際則數:覆寫後的則數;分頁籤型再乘上分頁數 */
export function expectedItemCount(inst: BlockInstance, tpl: BlockTemplate, pattern: LayoutPattern | undefined): number {
  const perPage = inst.overrides.itemCount ?? tpl.itemCount;
  return isTabs(pattern) ? perPage * (tpl.tabs ?? 1) : perPage;
}

/** template-item-count:範本則數在展示類型範圍內 */
export function checkTemplateItemCount({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.templates.values()) {
    const p = index.patterns.get(obj.pattern);
    if (p && !inRange(obj.itemCount, p.obj.items)) {
      out.push(
        violation(
          'template-item-count',
          file,
          obj.id,
          `則數 ${obj.itemCount} 不在 ${obj.pattern} 的範圍 ${rangeText(p.obj.items)} 內`,
        ),
      );
    }
  }
  return out;
}

/** template-tabs:分頁籤型必須有 tabs,其他型不得有 tabs */
export function checkTemplateTabs({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.templates.values()) {
    const p = index.patterns.get(obj.pattern);
    if (!p) continue;
    const tabs = isTabs(p.obj);
    if (tabs && obj.tabs === undefined) {
      out.push(violation('template-tabs', file, obj.id, `${obj.pattern} 是分頁籤型,必須以 tabs 記錄分頁數`));
    }
    if (!tabs && obj.tabs !== undefined) {
      out.push(violation('template-tabs', file, obj.id, `只有分頁籤型可以有 tabs,${obj.pattern} 不是`));
    }
  }
  return out;
}

/**
 * image-role:
 * 1. slot 允許多個角色時,範本必須用 imageRole 選定,且要在每個多選 slot 的清單內。
 * 2. 範本寫了 imageRole,但沒有多選 slot 時,至少要出現在某個 slot 的清單內。
 * 3. video 角色只能用於影音內容。
 */
export function checkImageRole({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.templates.values()) {
    const p = index.patterns.get(obj.pattern);
    if (!p) continue;
    // 【第一步】找出允許多個角色的 slot
    const multi = p.obj.slots.filter((s) => s.image.length > 1);
    const role = obj.imageRole;
    if (multi.length > 0) {
      // 【第二步】有多選 slot:必須選定,且每個多選 slot 都要接受這個角色
      if (!role) {
        out.push(violation('image-role', file, obj.id, `${obj.pattern} 的圖片角色有多種可選,必須以 imageRole 選定`));
      } else if (!multi.every((s) => s.image.includes(role))) {
        out.push(violation('image-role', file, obj.id, `imageRole「${role}」不在 ${obj.pattern} 的允許清單內`));
      }
    } else if (role && !p.obj.slots.some((s) => s.image.includes(role))) {
      // 【第三步】沒有多選 slot:寫了就要是某個 slot 允許的角色
      out.push(violation('image-role', file, obj.id, `imageRole「${role}」不在 ${obj.pattern} 的允許清單內`));
    }
    // 【第四步】video 角色只給需要 16:9 縮圖的內容類型用
    const ct = index.contentTypes.get(obj.contentType.ref);
    if (role === 'video' && ct && !ct.obj.requiresVideo) {
      out.push(violation('image-role', file, obj.id, `video 角色只能用於需要 16:9 縮圖的內容類型,${ct.obj.id} 不是`));
    }
  }
  return out;
}

/** suggested-pattern(警告):內容類型與展示類型不在建議搭配內 */
export function checkSuggestedPattern({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.templates.values()) {
    const ct = index.contentTypes.get(obj.contentType.ref);
    if (ct && !ct.obj.suggestedPatterns.includes(obj.pattern)) {
      out.push(
        violation('suggested-pattern', file, obj.id, `${obj.pattern} 不在內容類型 ${ct.obj.id} 的建議搭配內`),
      );
    }
  }
  return out;
}

/** override-fields:覆寫只出現 itemCount、selection、heading */
export function checkOverrideFields({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.instances.values()) {
    for (const key of Object.keys(obj.overrides).sort()) {
      if (!(OVERRIDABLE as readonly string[]).includes(key)) {
        out.push(violation('override-fields', file, obj.id, `不可覆寫的欄位:${key}(只允許 ${OVERRIDABLE.join('、')})`));
      }
    }
  }
  return out;
}

/** override-item-count:覆寫後的則數仍在展示類型範圍內 */
export function checkOverrideItemCount({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.instances.values()) {
    const n = obj.overrides.itemCount;
    const tpl = index.templates.get(obj.template);
    const p = tpl && index.patterns.get(tpl.obj.pattern);
    if (n !== undefined && p && !inRange(n, p.obj.items)) {
      out.push(
        violation(
          'override-item-count',
          file,
          obj.id,
          `覆寫後的則數 ${n} 不在 ${p.obj.id} 的範圍 ${rangeText(p.obj.items)} 內`,
        ),
      );
    }
  }
  return out;
}

/** instance-item-count:實際放的則數要等於覆寫後的則數 */
export function checkInstanceItemCount({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.instances.values()) {
    const tpl = index.templates.get(obj.template);
    if (!tpl) continue;
    const expected = expectedItemCount(obj, tpl.obj, index.patterns.get(tpl.obj.pattern)?.obj);
    if (obj.items.length !== expected) {
      out.push(
        violation('instance-item-count', file, obj.id, `應放 ${expected} 則,實際放了 ${obj.items.length} 則`),
      );
    }
  }
  return out;
}

/** instance-content-match:新聞則的內容類型與分類要和範本一致 */
export function checkInstanceContentMatch({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.instances.values()) {
    const tpl = index.templates.get(obj.template);
    if (!tpl) continue;
    const { ref, category } = tpl.obj.contentType;
    for (const itemId of obj.items) {
      const item = index.items.get(itemId);
      if (!item) continue;
      // 內容類型不同
      if (item.obj.contentType !== ref) {
        out.push(
          violation('instance-content-match', file, obj.id, `${itemId} 的內容類型為 ${item.obj.contentType},範本要求 ${ref}`),
        );
      } else if (category && item.obj.category !== category) {
        // 內容類型相同,但範本指定的分類不同
        out.push(
          violation(
            'instance-content-match',
            file,
            obj.id,
            `${itemId} 的分類為 ${item.obj.category ?? '(無)'},範本要求 ${category}`,
          ),
        );
      }
    }
  }
  return out;
}
