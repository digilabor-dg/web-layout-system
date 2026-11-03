// 頁面規則:實例只屬於一個頁面、stack 欄寬加總、手機順序完整、代號容量、裝置隱藏、同頁重複新聞。

import { placements, sectionInstances } from '../../model/page.js';
import { type RuleContext, type Violation, violation } from '../types.js';

/** 代號可用的字母數 */
export const CODE_CAPACITY = 26;

/** instance-on-one-page:每個實例恰好被一個頁面引用一次 */
export function checkInstanceOnOnePage({ index }: RuleContext): Violation[] {
  // 【第零步】有頁面沒通過 schema 時,讀不出它引用了哪些實例,無法判斷,整條跳過(錯誤已由 schema 回報)
  const pageIds = index.knownIds.get('Page') ?? new Set<string>();
  if ([...pageIds].some((id) => !index.pages.has(id))) return [];
  // 【第一步】數一數每個實例被引用幾次
  const count = new Map<string, number>();
  for (const { obj: page } of index.pages.values()) {
    for (const section of page.sections) {
      for (const id of sectionInstances(section)) count.set(id, (count.get(id) ?? 0) + 1);
    }
  }
  // 【第二步】次數不是 1 的實例都回報
  const out: Violation[] = [];
  for (const { file, obj } of index.instances.values()) {
    const n = count.get(obj.id) ?? 0;
    if (n !== 1) {
      out.push(
        violation('instance-on-one-page', file, obj.id, n === 0 ? '沒有被任何頁面引用' : `被頁面引用了 ${n} 次`),
      );
    }
  }
  return out;
}

/** stack-columns-sum:stack section 的欄寬加總為 12 */
export function checkStackColumns({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.pages.values()) {
    for (const s of obj.sections) {
      if (s.mode !== 'stack') continue;
      const sum = s.columns.reduce((acc, c) => acc + c.width, 0);
      if (sum !== 12) {
        out.push(
          violation('stack-columns-sum', file, obj.id, `section ${s.id} 的欄寬加總為 ${sum}(${s.columns.map((c) => c.width).join(':')}),應為 12`),
        );
      }
    }
  }
  return out;
}

/** mobile-order-complete:mobileOrder 恰好列出該 section 所有實例,不多不少不重複 */
export function checkMobileOrder({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.pages.values()) {
    for (const s of obj.sections) {
      if (!s.mobileOrder) continue;
      // 【第一步】把兩邊都排序後比較,順序不同沒關係,內容要完全相同
      const expected = [...sectionInstances(s)].sort();
      const actual = [...s.mobileOrder].sort();
      if (expected.length !== actual.length || expected.some((v, i) => v !== actual[i])) {
        out.push(
          violation('mobile-order-complete', file, obj.id, `section ${s.id} 的 mobileOrder 沒有恰好列出該 section 的所有實例`),
        );
      }
    }
  }
  return out;
}

/** code-capacity:flat 整頁不超過 26 塊;sectioned 的 section 數與每個 section 的塊數都不超過 26 */
export function checkCodeCapacity({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.pages.values()) {
    if (obj.codeScheme === 'flat') {
      const n = placements(obj).length;
      if (n > CODE_CAPACITY) {
        out.push(violation('code-capacity', file, obj.id, `flat 編號最多 ${CODE_CAPACITY} 塊,目前 ${n} 塊`));
      }
      continue;
    }
    if (obj.sections.length > CODE_CAPACITY) {
      out.push(violation('code-capacity', file, obj.id, `sectioned 編號最多 ${CODE_CAPACITY} 個 section,目前 ${obj.sections.length} 個`));
    }
    for (const s of obj.sections) {
      const n = sectionInstances(s).length;
      if (n > CODE_CAPACITY) {
        out.push(violation('code-capacity', file, obj.id, `section ${s.id} 最多 ${CODE_CAPACITY} 塊,目前 ${n} 塊`));
      }
    }
  }
  return out;
}

/** device-hidden(警告):實例在某類裝置整塊隱藏,等於藏稿 */
export function checkDeviceHidden({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.instances.values()) {
    if (obj.devices?.mobile === false) {
      out.push(violation('device-hidden', file, obj.id, '在手機上整塊隱藏(規格要求不在手機上藏稿)'));
    }
    if (obj.devices?.desktop === false) {
      out.push(violation('device-hidden', file, obj.id, '在電腦上整塊隱藏'));
    }
  }
  return out;
}

/** duplicate-item-on-page(警告):同一則新聞出現在同一頁的兩個實例 */
export function checkDuplicateItemOnPage({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { obj: page } of index.pages.values()) {
    // 【第一步】依頁面順序走過每個實例,記下每則新聞第一次出現在哪個實例
    const firstSeen = new Map<string, string>();
    for (const { instance } of placements(page)) {
      const inst = index.instances.get(instance);
      if (!inst) continue;
      for (const itemId of inst.obj.items) {
        const prev = firstSeen.get(itemId);
        // 【第二步】之前在別的實例出現過,就在後出現的實例回報
        if (prev && prev !== instance) {
          out.push(
            violation('duplicate-item-on-page', inst.file, instance, `${itemId} 已出現在同頁的 ${prev}(頁面 ${page.id})`),
          );
        } else if (!prev) {
          firstSeen.set(itemId, instance);
        }
      }
    }
  }
  return out;
}
