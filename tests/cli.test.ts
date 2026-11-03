// validate 指令的測試:參數、結束代碼、文字與 JSON 輸出,以及實際執行一次 npm run validate。

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exitCode, formatJson, formatText, parseArgs, run } from '../src/cli/run.js';
import type { Violation } from '../src/validate/types.js';
import { applyPatch, loadBase, toDataset } from './helpers/fixture.js';

const REPO = join(import.meta.dirname, '..');
const warn: Violation = { file: 'a.json', id: 'a', rule: 'suggested-pattern', severity: 'warning', message: 'm' };
const err: Violation = { file: 'b.json', id: 'b', rule: 'ref-exists', severity: 'error', message: 'm' };

describe('參數', () => {
  it('預設檢查 data/', () => {
    expect(parseArgs([])).toEqual({ dir: 'data', json: false, strict: false });
  });
  it('--json、--strict 與目錄', () => {
    expect(parseArgs(['x', '--json', '--strict'])).toEqual({ dir: 'x', json: true, strict: true });
  });
  it('不認得的參數丟出例外', () => {
    expect(() => parseArgs(['--fix'])).toThrow();
  });
});

describe('結束代碼', () => {
  it('沒有違規 → 0', () => expect(exitCode([], false)).toBe(0));
  it('只有警告 → 0', () => expect(exitCode([warn], false)).toBe(0));
  it('只有警告但 --strict → 1', () => expect(exitCode([warn], true)).toBe(1));
  it('有錯誤 → 1', () => expect(exitCode([err, warn], false)).toBe(1));
});

describe('輸出格式', () => {
  it('文字:每行一筆,最後一行是統計', () => {
    const lines = formatText([err, warn]).trimEnd().split('\n');
    expect(lines).toEqual([
      '錯誤  b.json  b  ref-exists  m',
      '警告  a.json  a  suggested-pattern  m',
      '錯誤 1 個,警告 1 個',
    ]);
  });
  it('JSON:可解析,含統計與違規清單', () => {
    expect(JSON.parse(formatJson([err]))).toEqual({ errors: 1, warnings: 0, violations: [err] });
  });
});

describe('run()', () => {
  it('只有警告時回傳 0,--strict 時回傳 1', () => {
    // 加一個「影音放進 P07」的範本,只會產生 suggested-pattern 警告
    const dataset = toDataset(
      applyPatch(loadBase('minimal'), [
        {
          op: 'add',
          path: '/block-templates/tpl-vg',
          value: {
            type: 'BlockTemplate', id: 'tpl-vg', name: 'tpl-vg', role: 'video',
            contentType: { ref: 'video' }, pattern: 'P07', itemCount: 3,
            selection: { mode: 'latest' }, responsive: null, heading: { title: 'tpl-vg' },
          },
        },
      ]),
    );
    let out = '';
    const io = { load: () => dataset, write: (t: string) => (out += t) };
    expect(run([], io)).toBe(0);
    expect(out).toContain('suggested-pattern');
    expect(run(['--strict'], io)).toBe(1);
  });
});

describe('npm run validate(實際執行)', () => {
  it('範例資料:0 個錯誤、0 個警告,exit code 0,JSON 可解析', () => {
    const r = spawnSync('npx', ['tsx', 'src/cli/validate.ts', '--json'], { cwd: REPO, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({ errors: 0, warnings: 0, violations: [] });
  });
  it('不認得的參數:exit code 2', () => {
    const r = spawnSync('npx', ['tsx', 'src/cli/validate.ts', '--fix'], { cwd: REPO, encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('--fix');
  });
  it('有錯誤的目錄:exit code 1', () => {
    const r = spawnSync('npx', ['tsx', 'src/cli/validate.ts', 'tests/fixtures/broken-data'], { cwd: REPO, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('schema');
  });
});
