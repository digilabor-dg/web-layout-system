// POC 3 的參數工具:讀範例資料、檢查參數格式。獨立成檔,讓測試可以 import(run.ts 一 import 就會執行)。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { loadDataset } from '../../src/node/load.js';
import type { Nested } from '../../tests/helpers/fixture.js';
import type { Params } from './generate.js';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');

/** 範例資料轉成巢狀結構 */
export function baseNested(): Nested {
  const nested: Nested = {};
  for (const f of loadDataset(join(REPO, 'data')).files) {
    const [folder, file] = f.path.split('/') as [string, string];
    (nested[folder] ??= {})[file.replace(/\.json$/, '')] = f.data;
  }
  return nested;
}

/** 檢查參數格式 */
export function checkParams(p: unknown): asserts p is Params {
  const schema = JSON.parse(readFileSync(join(HERE, 'params.schema.json'), 'utf8')) as object;
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  if (!validate(p)) throw new Error(`參數格式錯誤:${JSON.stringify(validate.errors)}`);
}

