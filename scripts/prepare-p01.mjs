import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { prepare } from '../research/p01/prepare.mjs';

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: npm run p01:prepare -- <manifest.json> <new-output.json>');
  process.exit(1);
}
const dataset = JSON.parse(await readFile(new URL('../research/p01/items.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(args[0]), 'utf8'));
const output = prepare(dataset, manifest);
await mkdir(dirname(resolve(args[1])), { recursive: true });
await writeFile(resolve(args[1]), JSON.stringify(output, null, 2) + '\n', { flag: 'wx' });
console.log(`Prepared ${output.phases.development.length} development and ${output.phases.evaluation.length} evaluation sessions. No model calls. Output: ${args[1]}`);
