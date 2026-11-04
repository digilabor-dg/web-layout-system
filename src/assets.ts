// 內建的 schema 與預設參數組。以 JSON import 載入,Node 與打包工具(瀏覽器)都能用。

import common from '../schemas/common.schema.json' with { type: 'json' };
import siteProfile from '../schemas/site-profile.schema.json' with { type: 'json' };
import patternTag from '../schemas/pattern-tag.schema.json' with { type: 'json' };
import patternGroup from '../schemas/pattern-group.schema.json' with { type: 'json' };
import layoutPattern from '../schemas/layout-pattern.schema.json' with { type: 'json' };
import contentType from '../schemas/content-type.schema.json' with { type: 'json' };
import blockTemplate from '../schemas/block-template.schema.json' with { type: 'json' };
import page from '../schemas/page.schema.json' with { type: 'json' };
import blockInstance from '../schemas/block-instance.schema.json' with { type: 'json' };
import contentItem from '../schemas/content-item.schema.json' with { type: 'json' };
import bs5 from '../presets/bs5.json' with { type: 'json' };
import tw4 from '../presets/tw4.json' with { type: 'json' };
import md3 from '../presets/md3.json' with { type: 'json' };
import type { Preset } from './model/types.js';

/** 規則檢查需要的全部 schema(共用定義 + 9 種 prototype) */
export const SCHEMAS: object[] = [
  common,
  siteProfile,
  patternTag,
  patternGroup,
  layoutPattern,
  contentType,
  blockTemplate,
  page,
  blockInstance,
  contentItem,
];

/** 內建的三組預設參數組 */
export const PRESETS: Record<string, Preset> = {
  bs5: bs5 as Preset,
  tw4: tw4 as Preset,
  md3: md3 as Preset,
};
