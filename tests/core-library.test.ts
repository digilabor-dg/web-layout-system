// 核心函式庫的界線:核心目錄不得依賴 Node 專屬 API,公開入口要匯出主要功能。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as api from '../src/index.js';

const SRC = join(import.meta.dirname, '..', 'src');

/** 遞迴列出目錄下的 .ts 檔 */
function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? tsFiles(full) : name.endsWith('.ts') ? [full] : [];
  });
}

describe('核心函式庫', () => {
  const core = [...tsFiles(join(SRC, 'model')), ...tsFiles(join(SRC, 'validate')), join(SRC, 'index.ts'), join(SRC, 'assets.ts')];

  it.each(core.map((f) => [f.slice(SRC.length + 1), f]))('%s 沒有 import node: 模組', (_name, file) => {
    const text = readFileSync(file, 'utf8');
    expect(text).not.toMatch(/from ['"]node:/);
    expect(text).not.toMatch(/\bprocess\.|Date\.now|Math\.random/);
  });

  it('公開入口匯出主要功能', () => {
    for (const name of ['validateDataset', 'SCHEMAS', 'PRESETS', 'placements', 'resolveSite', 'contentWidth', 'deriveTabletCols']) {
      expect(api).toHaveProperty(name);
    }
  });

  it('不讀檔就能檢查記憶體中的資料集', () => {
    const result = api.validateDataset({ files: [] }, { schemas: api.SCHEMAS, presets: api.PRESETS });
    expect(result.map((v) => v.rule)).toEqual(['single-site-profile']);
  });
});
