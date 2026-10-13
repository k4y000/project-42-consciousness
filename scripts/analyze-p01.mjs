import { readFile, writeFile } from 'node:fs/promises';
import { analyzeJournal } from '../research/p01/analyze.mjs';

const [input, output, ...extra] = process.argv.slice(2);
if (!input || !output || extra.length) {
  console.error('Usage: npm run p01:analyze -- journal.json new-report.json');
  process.exitCode = 1;
} else {
  try {
    const dataset = JSON.parse(await readFile(new URL('../research/p01/items.json', import.meta.url), 'utf8'));
    const journal = JSON.parse(await readFile(input, 'utf8'));
    const report = analyzeJournal(dataset, journal);
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    console.log(`P01 ${report.status}: ${report.development.validTrials}/36 + ${report.evaluation.validTrials}/36 valid trials. No model calls.`);
  } catch (error) {
    console.error(`P01 analysis failed: ${error.message}`);
    process.exitCode = 1;
  }
}
