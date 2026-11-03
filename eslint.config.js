// ESLint 設定(flat config):JavaScript 建議規則 + TypeScript 建議規則
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  // 不檢查的目錄:套件、OpenSpec 文件、POC 產出物
  { ignores: ['node_modules/', 'openspec/', 'docs/', 'poc/**/out/', 'reports/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
  },
);
