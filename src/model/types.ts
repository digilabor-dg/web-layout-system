// 9 種 prototype 的 TypeScript 型別。資料形狀以 schemas/ 的 JSON Schema 為準,這裡只是方便程式使用。

/** 圖片角色:main=網站主比例,square=1:1,video=16:9,none=無圖 */
export type ImageRole = 'main' | 'square' | 'video' | 'none';

/** 一份裁好的圖檔 */
export interface ImageFile {
  src: string;
  width: number;
  height: number;
}

/** 某一端(手機或電腦)的排法 */
export interface ResponsiveEntry {
  layout: 'full' | 'stack' | 'split' | 'grid' | 'list' | 'carousel' | 'tabs' | 'marquee' | 'bento';
  cols?: number | number[];
  perView?: number;
}

export interface SiteProfile {
  type: 'SiteProfile';
  id: string;
  mediaKind: 'print' | 'broadcast';
  mainRatio: '3:2' | '16:9';
  squareRatioAllowed: true;
  ratioTolerance: number;
  preset: 'bs5' | 'tw4' | 'md3' | 'custom';
  breakpoints?: Partial<Breakpoints>;
  grid?: { columns?: 12; gutter?: string; maxWidth?: string };
  testViewports: { width: number; height: number }[];
  typography: {
    baseFontSize: number;
    lineHeight: number;
    headingFontSize: { headline: number; summary: number; paragraph: number; lead: number };
    avgCharWidth: { cjk: number; latin: number };
  };
  spacing: {
    itemGap: number;
    blockGap: number;
    cardPadding: number;
    rowGap: number;
    imageTextGap: number;
    blockHeadingHeight: number;
  };
}

/** 各類裝置的起點(px) */
export interface Breakpoints {
  tabletV: number;
  tabletH: number;
  desktop: number;
}

/** 預設參數組 */
export interface Preset {
  id: 'bs5' | 'tw4' | 'md3';
  name: string;
  source: string;
  breakpoints: Breakpoints;
  containers: { minWidth: number; maxWidth: number | null; padding: number | null }[];
  gutter: string;
  columns: 12;
  baseFontSize: number;
  lineHeight: number;
  notes?: string[];
}

export interface PatternTag {
  type: 'PatternTag';
  id: string;
  name: string;
  rule: string;
}

export interface PatternGroup {
  type: 'PatternGroup';
  id: string;
  name: string;
}

export interface Slot {
  role: string;
  count: number | 'rest';
  image: ImageRole[];
}

export interface LayoutPattern {
  type: 'LayoutPattern';
  id: string;
  name: string;
  group: string;
  tags: string[];
  arrangement: 'single' | 'list' | 'grid' | 'bento' | 'carousel' | 'tabs';
  emphasis: 'none' | 'lead1' | 'lead2';
  imageText: 'stacked' | 'side' | 'overlay' | 'none';
  textAmount: 'headline' | 'summary' | 'paragraph';
  interaction: 'none' | 'carousel' | 'tabs' | 'marquee' | 'play' | 'accordion' | 'poll';
  slots: Slot[];
  items: { min: number; max: number | null; pageSize?: number };
  responsiveDefault: { mobile: ResponsiveEntry; desktop: ResponsiveEntry } | null;
  /** 圖輯型:每則新聞的 gallery 張數範圍 */
  gallery?: { min: number; max: number };
  inferred?: string[];
}

export interface ContentType {
  type: 'ContentType';
  id: string;
  name: string;
  categories: string[];
  suggestedPatterns: string[];
  /** 每則都要另外提供 16:9 的 video 縮圖 */
  requiresVideo?: boolean;
}

export interface Selection {
  mode: 'manual' | 'latest' | 'popular' | 'mixed';
  pinned?: number;
  fill?: { source: 'latest' | 'popular'; category?: string; withinHours?: number };
}

export interface Heading {
  title: string;
  moreLink?: string;
}

export type BlockRole =
  | 'headline'
  | 'subheadline'
  | 'flash'
  | 'popular'
  | 'section'
  | 'video'
  | 'opinion'
  | 'feature'
  | 'chart'
  | 'promo';

export interface BlockTemplate {
  type: 'BlockTemplate';
  id: string;
  name: string;
  role: BlockRole;
  contentType: { ref: string; category?: string };
  pattern: string;
  itemCount: number;
  imageRole?: ImageRole;
  tabs?: number;
  selection: Selection;
  responsive: null | {
    mobile?: Partial<ResponsiveEntry> & { pattern?: string };
    desktop?: ResponsiveEntry;
  };
  heading: Heading;
}

export interface BlockInstance {
  type: 'BlockInstance';
  id: string;
  template: string;
  overrides: { itemCount?: number; selection?: Selection; heading?: Heading; [key: string]: unknown };
  items: string[];
  devices?: { mobile?: boolean; desktop?: boolean };
}

export interface StackSection {
  id: string;
  mode: 'stack';
  fluid: boolean;
  columns: { width: number; blocks: string[] }[];
  mobileOrder?: string[];
}

export interface FlowSection {
  id: string;
  mode: 'flow';
  fluid: boolean;
  blocks: { instance: string; span: { mobile: number; desktop: number } }[];
  mobileOrder?: string[];
}

export type Section = StackSection | FlowSection;

export interface Page {
  type: 'Page';
  id: string;
  name: string;
  path: string;
  codeScheme: 'flat' | 'sectioned';
  sections: Section[];
}

export interface ContentItem {
  type: 'ContentItem';
  id: string;
  contentType: string;
  category?: string;
  title: string;
  summary?: string;
  author?: { name: string };
  url: string;
  publishedAt: string;
  images: Partial<Record<'main' | 'square' | 'video', ImageFile>>;
  gallery?: ImageFile[];
}

/** 所有 prototype 的聯集 */
export type Prototype =
  | SiteProfile
  | PatternTag
  | PatternGroup
  | LayoutPattern
  | ContentType
  | BlockTemplate
  | Page
  | BlockInstance
  | ContentItem;

export type PrototypeName = Prototype['type'];
