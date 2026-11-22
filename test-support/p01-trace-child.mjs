import { open } from 'node:fs/promises';
import { dataset, manifest } from '../fixtures/p01-synthetic.mjs';
import { runRecordedSyntheticDevelopment } from '../research/p01/trace-storage.mjs';

const [destination, phase] = process.argv.slice(2);
if (!destination || !['double_pending', 'result_synced'].includes(phase) || !process.send) {
  throw new Error('This helper requires a destination, a supported phase and an IPC channel.');
}
// Keep the explicit IPC barrier alive until the parent sends SIGKILL.
process.channel.ref();
const input = { ...structuredClone(manifest), dataKind: 'synthetic', provider: 'local-double',
  modelVersion: 'fictional-v1', runId: 'storage-test-only', generation: { temperature: 0, tools: false } };
let calls = 0;
const barrier = async () => {
  await new Promise((resolve, reject) => {
    process.send({ phase, calls }, error => error ? reject(error) : resolve());
  });
  // The parent kills this process after receiving the exact phase. No timer permits progress.
  await new Promise(() => {});
};
const openFile = async (...args) => {
  const handle = await open(...args);
  let synced = 0;
  return {
    write: (...writeArgs) => handle.write(...writeArgs),
    async sync() {
      await handle.sync();
      synced++;
      // Record 3 is the first result. Its bytes are synced, and this barrier
      // prevents the runner from beginning the next intent.
      if (phase === 'result_synced' && synced === 3) await barrier();
    },
    close: () => handle.close()
  };
};
await runRecordedSyntheticDevelopment(dataset, input, async payload => {
  calls++;
  if (phase === 'double_pending') await barrier();
  return { kind: 'delivered', rawText: '{"answer":0,"confidence":0}',
    modelVersion: payload.modelVersion, generation: structuredClone(payload.generation), reason: null };
}, destination, { openFile });
throw new Error('The parent must interrupt the helper at its IPC barrier.');
