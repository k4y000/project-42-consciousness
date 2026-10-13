import { readFile } from 'node:fs/promises';
import { prepare } from '../research/p01/prepare.mjs';
export const dataset = JSON.parse(await readFile(new URL('../research/p01/items.json', import.meta.url), 'utf8'));
export const manifest = JSON.parse(await readFile(new URL('../research/p01/manifest.template.json', import.meta.url), 'utf8'));

// Synthetic software test data only, never observations from a provider.
export function syntheticJournal() {
  const plan = prepare(dataset, manifest);
  return {
    schemaVersion: 1, protocol: dataset.datasetId, datasetSha256: plan.datasetSha256,
    dataKind: 'synthetic', runId: 'hand-calculated-test-only', provider: 'synthetic-fixture',
    modelVersion: 'no-model-called', condition: 'fixture', generation: { temperature: 0, tools: false },
    orderSeed: 42001, analysis: { seed: 42002, draws: 2000 }, baselineFreeze: null,
    trials: Object.values(plan.phases).flat().map(row => ({
      trialId: row.trialId, itemId: row.itemId, repetition: row.repetition, split: row.split,
      request: row.request, modelVersion: 'no-model-called', generation: { temperature: 0, tools: false },
      status: 'not_attempted', statusReason: 'Synthetic test: no collection.', rawText: null,
      startedAtUTC: null, endedAtUTC: null, responseId: null, durationMs: null, cost: null
    }))
  };
}
export function setValid(journal, itemId, observations) {
  const item = dataset.items.find(item => item.id === itemId);
  observations.forEach(([correct, confidence], index) => {
    const row = journal.trials.find(row => row.trialId === `${itemId}-r${index + 1}`);
    Object.assign(row, {
      status: 'ok', statusReason: null,
      rawText: JSON.stringify({ answer: item.referenceAnswer + (correct ? 0 : 1), confidence }),
      startedAtUTC: item.split === 'development' ? '2026-01-01T10:00:00.000Z' : '2026-01-01T12:00:00.000Z',
      endedAtUTC: item.split === 'development' ? '2026-01-01T10:00:01.000Z' : '2026-01-01T12:00:01.000Z'
    });
  });
}
export function handCalculatedJournal() {
  const journal = syntheticJournal();
  setValid(journal, 'dev-01', [[1, 0.8], [1, 0.8], [0, 0.8]]);
  setValid(journal, 'dev-02', [[0, 0.2]]);
  setValid(journal, 'eva-01', [[1, 0.8], [0, 0.2], [0, 0.4]]);
  setValid(journal, 'eva-02', [[1, 0.6]]);
  return journal;
}
