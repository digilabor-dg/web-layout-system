// POC 1 共用的排法描述:每塊在每類裝置用哪種排法、幾欄、多寬。
// 估算(estimate.ts)與渲染(render.ts)都只讀這裡的結果,兩邊才會一致。

import {
  type BlockInstance,
  type BlockTemplate,
  type ContentItem,
  type DeviceClass,
  type LayoutPattern,
  type Page,
  type ResolvedSite,
  type ResponsiveEntry,
  type SiteProfile,
  PRESETS,
  contentWidth,
  deviceClass,
  entryFor,
  placements,
  resolveSite,
  roleRatio,
  usesDesktopStructure,
} from '../../src/index.js';
import { loadDataset } from '../../src/node/load.js';

/** 排法種類 */
export type Kind =
  | 'overlay' // 大圖疊字:只有圖,字疊在圖上
  | 'grid' // 卡片格線
  | 'list-text' // 純文字清單
  | 'list-number' // 編號清單
  | 'list-timeline' // 時間軸
  | 'list-card' // 圖上文下的卡片,上下排
  | 'lead-stack' // 首則大圖在上,其餘清單在下
  | 'lead-split' // 首則大圖在左,其餘清單在右
  | 'feature-stack' // 專題:圖上文下
  | 'feature-split' // 專題:左圖右文
  | 'carousel'; // 輪播

/** 某塊在某類裝置的排法 */
export interface BlockLayout {
  kind: Kind;
  cols?: number;
  perView?: number;
  split?: [number, number];
}

/** 一塊的完整資訊 */
export interface Block {
  code: string;
  instance: BlockInstance;
  template: BlockTemplate;
  pattern: LayoutPattern;
  items: ContentItem[];
  /** 圖片比例(寬 ÷ 高),無圖為 null */
  ratio: number | null;
  sectionIndex: number;
  columnIndex: number | null;
}

/** POC 用的整份資料 */
export interface World {
  site: ResolvedSite;
  profile: SiteProfile;
  page: Page;
  blocks: Block[];
}

/** 讀範例資料,組成 POC 需要的結構 */
export function loadWorld(dir: string, pageId = 'home'): World {
  return buildWorld(loadDataset(dir).files.map((f) => f.data), pageId);
}

/** 由記憶體中的資料組成 POC 需要的結構(POC 3 產生版型後直接用) */
export function buildWorld(data: unknown[], pageId = 'home'): World {
  // 【第一步】依 type 分類
  const files = data as { type: string; id: string }[];
  const of = <T>(type: string) => new Map(files.filter((d) => d.type === type).map((d) => [d.id, d as T]));
  const profile = [...of<SiteProfile>('SiteProfile').values()][0]!;
  const page = of<Page>('Page').get(pageId);
  if (!page) throw new Error(`找不到頁面 ${pageId}`);
  const patterns = of<LayoutPattern>('LayoutPattern');
  const templates = of<BlockTemplate>('BlockTemplate');
  const instances = of<BlockInstance>('BlockInstance');
  const items = of<ContentItem>('ContentItem');
  const site = resolveSite(profile, PRESETS);
  // 【第二步】依頁面位置組出每一塊
  const blocks = placements(page).map((p) => {
    const instance = instances.get(p.instance)!;
    const template = templates.get(instance.template)!;
    const pattern = patterns.get(template.pattern)!;
    const role = template.imageRole ?? pattern.slots[0]!.image[0]!;
    return {
      code: p.code,
      instance,
      template,
      pattern,
      items: instance.items.map((id) => items.get(id)!),
      ratio: roleRatio(role, profile.mainRatio),
      sectionIndex: p.sectionIndex,
      columnIndex: p.columnIndex,
    };
  });
  return { site, profile, page, blocks };
}

/** 範本覆寫後的響應式設定(手機逐項合併,電腦整組取代) */
function mergedResponsive(b: Block): { mobile: ResponsiveEntry; desktop: ResponsiveEntry } {
  const base = b.pattern.responsiveDefault;
  if (!base) throw new Error(`${b.pattern.id} 沒有預設響應式設定,POC 不支援`);
  const o = b.template.responsive;
  return {
    mobile: { ...base.mobile, ...(o?.mobile ?? {}) } as ResponsiveEntry,
    desktop: o?.desktop ?? base.desktop,
  };
}

/** 決定某塊在某類裝置的排法 */
export function blockLayout(b: Block, device: DeviceClass): BlockLayout {
  const e = entryFor(mergedResponsive(b), device);
  const p = b.pattern;
  const noImage = b.ratio === null;
  switch (e.layout) {
    case 'full':
      // 疊字型只有圖;其餘單則型當成一欄的卡片
      return p.imageText === 'overlay' ? { kind: 'overlay' } : { kind: 'grid', cols: 1 };
    case 'grid':
      return { kind: 'grid', cols: e.cols as number };
    case 'list':
      // 清單依圖片與型決定樣式
      if (!noImage && p.imageText === 'stacked') return { kind: 'list-card' };
      if (p.id === 'P05') return { kind: 'list-number' };
      if (p.id === 'P06') return { kind: 'list-timeline' };
      return { kind: 'list-text' };
    case 'stack':
      return p.emphasis === 'lead1' && p.arrangement === 'list' ? { kind: 'lead-stack' } : { kind: 'feature-stack' };
    case 'split': {
      const [l, r] = e.cols as number[];
      return p.arrangement === 'list'
        ? { kind: 'lead-split', split: [l!, r!] }
        : { kind: 'feature-split', split: [l!, r!] };
    }
    case 'carousel':
      return { kind: 'carousel', perView: e.perView! };
    default:
      throw new Error(`POC 不支援的排法:${e.layout}(${p.id})`);
  }
}

/** 某個視窗寬度下,某塊可用的寬度 */
export function blockWidth(world: World, b: Block, width: number): number {
  const section = world.page.sections[b.sectionIndex]!;
  const W = contentWidth(width, world.site, section.fluid);
  const g = world.site.gutterPx;
  const device = deviceClass(width, world.site.breakpoints);
  // 【第一步】手機結構:每塊都是整個內容寬
  if (!usesDesktopStructure(device)) return W;
  // 【第二步】電腦結構的 stack:欄寬 = (內容寬 − 欄距 × (欄數 − 1)) × 欄寬 ÷ 12
  if (section.mode === 'stack') {
    const n = section.columns.length;
    return ((W - g * (n - 1)) * section.columns[b.columnIndex!]!.width) / 12;
  }
  // 【第三步】flow:POC 的範例都是 span 12,直接用內容寬
  return W;
}
