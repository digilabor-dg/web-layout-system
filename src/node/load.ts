// Node 專用:把一個目錄下的所有 JSON 檔讀成資料集。核心模組不 import 這個檔案。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Dataset, DataFile } from '../validate/types.js';

/** 遞迴列出目錄下所有 .json 檔的完整路徑,依路徑排序 */
function listJson(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listJson(full));
    else if (name.endsWith('.json')) out.push(full);
  }
  return out;
}

/**
 * 讀取目錄成資料集。
 * 路徑一律轉成相對於該目錄、用 / 分隔,讓不同作業系統的輸出相同。
 */
export function loadDataset(dir: string): Dataset {
  const files: DataFile[] = listJson(dir).map((full) => {
    // 【第一步】相對路徑,統一用 /
    const path = relative(dir, full).split(sep).join('/');
    // 【第二步】解析 JSON;失敗時記下錯誤訊息,交給規則 schema 回報
    try {
      return { path, data: JSON.parse(readFileSync(full, 'utf8')) as unknown };
    } catch (e) {
      return { path, data: undefined, error: (e as Error).message };
    }
  });
  return { files };
}
