import { readFile, writeFile } from 'node:fs/promises';
import { initializeJournal } from '../research/p01/initialize.mjs';

const [input, output, ...extra] = process.argv.slice(2);
if (!input || !output || extra.length) {
  console.error('Usage: npm run p01:journal -- completed-draft-manifest.json new-journal.json');
  process.exitCode = 1;
} else {
  try {
    const dataset = JSON.parse(await readFile(new URL('../research/p01/items.json', import.meta.url), 'utf8'));
    const manifest = JSON.parse(await readFile(input, 'utf8'));
    const journal = initializeJournal(dataset, manifest);
    await writeFile(output, `${JSON.stringify(journal, null, 2)}\n`, { flag: 'wx' });
    console.log('Created 72 not_attempted trials. No observations, model calls or permission to collect.');
  } catch (error) {
    console.error(`P01 initialization failed: ${error.message}`);
    process.exitCode = 1;
  }
}
