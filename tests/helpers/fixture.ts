// 測試用的 fixture 工具:讀基準資料集、套用 JSON Patch(RFC 6902 的 add、remove、replace)、轉成資料集。
// fixture 本身是純 JSON,其他語言只要實作同樣三個操作就能沿用。

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Dataset } from '../../src/validate/types.js';

/** fixture 目錄 */
export const FIXTURES = join(import.meta.dirname, '..', 'fixtures');

/** 一個 JSON Patch 操作 */
export interface PatchOp {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: unknown;
}

/** 基準資料集:資料夾 → 檔名(不含 .json)→ 內容 */
export type Nested = Record<string, Record<string, unknown>>;

/** 讀一份 JSON 檔 */
export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** 讀基準資料集 */
export function loadBase(name: string): Nested {
  return readJson<Nested>(join(FIXTURES, 'base', `${name}.json`));
}

/** 把 JSON Pointer 拆成片段,並還原 ~1(/)與 ~0(~) */
function pointer(path: string): string[] {
  return path
    .split('/')
    .slice(1)
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/**
 * 套用 JSON Patch,回傳新物件(不改動原物件)。
 * 只實作 add、remove、replace;陣列的 "-" 表示加在最後。
 */
export function applyPatch<T>(doc: T, ops: PatchOp[]): T {
  // 【第一步】深拷貝,避免改到共用的基準資料
  const root = structuredClone(doc) as unknown;
  for (const op of ops) {
    // 【第二步】走到目標的父節點
    const parts = pointer(op.path);
    const last = parts.pop();
    if (last === undefined) throw new Error(`路徑不可為根節點:${op.path}`);
    let parent = root as Record<string, unknown> | unknown[];
    for (const p of parts) {
      const next = Array.isArray(parent) ? parent[Number(p)] : parent[p];
      if (next === undefined || next === null || typeof next !== 'object') {
        throw new Error(`路徑不存在:${op.path}`);
      }
      parent = next as Record<string, unknown> | unknown[];
    }
    // 【第三步】依操作修改父節點
    if (Array.isArray(parent)) {
      const i = last === '-' ? parent.length : Number(last);
      if (op.op === 'add') parent.splice(i, 0, op.value);
      else if (op.op === 'remove') parent.splice(i, 1);
      else parent[i] = op.value;
    } else {
      if (op.op === 'remove' || op.op === 'replace') {
        if (!(last in parent)) throw new Error(`路徑不存在:${op.path}`);
      }
      if (op.op === 'remove') delete parent[last];
      else parent[last] = op.value;
    }
  }
  return root as T;
}

/** 把巢狀的基準資料集轉成資料集:路徑為「資料夾/檔名.json」 */
export function toDataset(nested: Nested): Dataset {
  const files = Object.entries(nested).flatMap(([folder, entries]) =>
    Object.entries(entries).map(([name, data]) => ({ path: `${folder}/${name}.json`, data })),
  );
  return { files };
}

/** 列出某個目錄下的 fixture 檔 */
export function listFixtures(dir: string): string[] {
  return readdirSync(join(FIXTURES, dir))
    .filter((f) => f.endsWith('.json'))
    .sort();
}
