// 圖片規則:每則都有 main 與 square、影音另有 video;圖檔比例誤差;禁止直式;圖輯張數。

import { roleRatio, ratioError } from '../../model/ratio.js';
import type { ImageFile, ImageRole } from '../../model/types.js';
import { type RuleContext, type Violation, violation } from '../types.js';

/** item-crops:每則新聞有 main 與 square;內容類型 requiresVideo 時另有 video */
export function checkItemCrops({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { file, obj } of index.items.values()) {
    // 【第一步】列出這則必須提供的角色
    const needsVideo = index.contentTypes.get(obj.contentType)?.obj.requiresVideo === true;
    const required: ImageRole[] = needsVideo ? ['main', 'square', 'video'] : ['main', 'square'];
    // 【第二步】缺哪一份就回報哪一份
    for (const role of required) {
      if (!obj.images[role as 'main' | 'square' | 'video']) {
        out.push(violation('item-crops', file, obj.id, `缺少 ${role} 裁切`));
      }
    }
  }
  return out;
}

/** 列出一則新聞的所有圖檔與角色(圖輯一律是 square) */
function imagesOf(images: Partial<Record<'main' | 'square' | 'video', ImageFile>>, gallery: ImageFile[] = []) {
  const list: { role: ImageRole; img: ImageFile; label: string }[] = [];
  for (const role of ['main', 'square', 'video'] as const) {
    const img = images[role];
    if (img) list.push({ role, img, label: role });
  }
  gallery.forEach((img, i) => list.push({ role: 'square', img, label: `gallery[${i}]` }));
  return list;
}

/**
 * image-file-ratio 與 no-portrait:
 * 直式圖只回報 no-portrait(比較具體),橫式或方形圖才檢查比例誤差。
 */
export function checkImageFiles({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  // 【第一步】沒有唯一的網站設定時無法得知主比例與容許誤差,交給 single-site-profile 回報
  const site = index.sites.length === 1 ? index.sites[0]?.obj : undefined;
  if (!site) return out;
  for (const { file, obj } of index.items.values()) {
    for (const { role, img, label } of imagesOf(obj.images, obj.gallery)) {
      // 【第二步】高大於寬就是直式
      if (img.height > img.width) {
        out.push(violation('no-portrait', file, obj.id, `${label} 是直式圖(${img.width}×${img.height})`));
        continue;
      }
      // 【第三步】比較實際寬高比與角色比例
      const expected = roleRatio(role, site.mainRatio);
      if (expected === null) continue;
      const err = ratioError(img.width / img.height, expected);
      if (err > site.ratioTolerance) {
        out.push(
          violation(
            'image-file-ratio',
            file,
            obj.id,
            `${label} 比例誤差 ${(err * 100).toFixed(2)}%(${img.width}×${img.height}),超過 ${(site.ratioTolerance * 100).toFixed(0)}%`,
          ),
        );
      }
    }
  }
  return out;
}

/** gallery-size:放在圖輯型(展示類型有 gallery 範圍)的新聞則,圖輯張數要在範圍內 */
export function checkGallerySize({ index }: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const { obj: inst } of index.instances.values()) {
    // 【第一步】找出這個實例所用展示類型的圖輯範圍;沒有就跳過
    const tpl = index.templates.get(inst.template);
    const range = tpl && index.patterns.get(tpl.obj.pattern)?.obj.gallery;
    if (!tpl || !range) continue;
    // 【第二步】逐則檢查圖輯張數
    for (const itemId of inst.items) {
      const item = index.items.get(itemId);
      if (!item) continue;
      const n = item.obj.gallery?.length ?? 0;
      if (n < range.min || n > range.max) {
        out.push(
          violation('gallery-size', item.file, item.obj.id, `圖輯有 ${n} 張,${tpl.obj.pattern} 需要 ${range.min}~${range.max} 張`),
        );
      }
    }
  }
  return out;
}
