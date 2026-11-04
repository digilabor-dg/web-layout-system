// skill 與角色 agent 的格式:frontmatter、引用的指令與檔案都要存在。

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(import.meta.dirname, '..');
const scripts = (JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;

/** 解析 frontmatter(--- 之間的 key: value) */
function frontmatter(text: string): Record<string, string> {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return {};
  return Object.fromEntries(m[1]!.split('\n').map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
}

describe('skill layout-tuner', () => {
  const text = readFileSync(join(REPO, 'skills', 'layout-tuner', 'SKILL.md'), 'utf8');
  it('frontmatter 有 name 與 description', () => {
    const fm = frontmatter(text);
    expect(fm.name).toBe('layout-tuner');
    expect((fm.description ?? '').length).toBeGreaterThan(20);
  });
  it('引用的 npm 指令都存在', () => {
    const used = [...text.matchAll(/npm run -s ([a-z0-9:-]+)/g)].map((m) => m[1]!);
    expect(used.length).toBeGreaterThan(0);
    for (const s of used) expect(scripts, s).toHaveProperty(s);
  });
  it('引用的檔案路徑都存在(不含 <名稱> 這類佔位)', () => {
    const paths = [...text.matchAll(/`((?:poc|docs|agents|openspec|skills)\/[^`<>*\s]+)`/g)].map((m) => m[1]!);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) expect(existsSync(join(REPO, p)), p).toBe(true);
  });
  it('在 repo 內透過 .claude/skills 生效', () => {
    expect(existsSync(join(REPO, '.claude', 'skills', 'layout-tuner', 'SKILL.md'))).toBe(true);
  });
});

describe('角色 agent', () => {
  const files = readdirSync(join(REPO, 'agents')).filter((f) => f.endsWith('.md'));
  it('有 12 個角色,並透過 .claude/agents 生效', () => {
    expect(files).toHaveLength(12);
    expect(existsSync(join(REPO, '.claude', 'agents', files[0]!))).toBe(true);
  });
  it.each(files)('%s:name 與檔名一致,只用 Read、Glob、Write', (f) => {
    const fm = frontmatter(readFileSync(join(REPO, 'agents', f), 'utf8'));
    expect(fm.name).toBe(f.replace(/\.md$/, ''));
    expect((fm.description ?? '').length).toBeGreaterThan(20);
    expect(fm.tools).toBe('Read, Glob, Write');
  });
});
