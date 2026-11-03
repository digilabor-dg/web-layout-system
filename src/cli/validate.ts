// npm run validate 的進入點:用 Node 讀檔,其餘交給 run()。

import { loadDataset } from '../node/load.js';
import { run } from './run.js';

try {
  process.exitCode = run(process.argv.slice(2), {
    load: loadDataset,
    write: (text) => process.stdout.write(text),
  });
} catch (e) {
  // 參數錯誤或目錄不存在等,直接顯示訊息並以 2 結束
  process.stderr.write(`${(e as Error).message}\n`);
  process.exitCode = 2;
}
