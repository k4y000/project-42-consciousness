import { prepare } from './prepare.mjs';
import { validateJournal } from './analyze.mjs';

// This maps a completed draft into an empty journal; it never contacts a model
// or converts planned trials into observations.
export function initializeJournal(dataset, manifest) {
  const plan = prepare(dataset, manifest);
  if (Object.hasOwn(manifest, 'baseline')) throw new Error('Legacy baseline field: use baselineFreeze. Do not silently migrate an existing freeze.');
  if (manifest.baselineFreeze !== null) throw new Error('A new empty journal requires baselineFreeze: null; preserve existing collected journals.');
  const controls = manifest.collectionControls;
  if (controls?.freshSessionPerTrial !== true || controls.toolsEnabled !== false || controls.followPlannedOrder !== true || controls.retryFailedTrials !== false) {
    throw new Error('P01 requires fresh sessions, no tools, planned order and no retries. These are intended controls, not verified provider behavior.');
  }
  const journal = {
    schemaVersion: 1, protocol: manifest.protocol, datasetSha256: plan.datasetSha256,
    dataKind: manifest.dataKind, runId: manifest.runId, provider: manifest.provider,
    modelVersion: manifest.modelVersion, condition: manifest.condition,
    generation: structuredClone(manifest.generation), orderSeed: manifest.orderSeed,
    analysis: structuredClone(manifest.analysis), baselineFreeze: null,
    trials: Object.values(plan.phases).flat().map(row => ({
      trialId: row.trialId, itemId: row.itemId, repetition: row.repetition, split: row.split,
      request: structuredClone(row.request), modelVersion: manifest.modelVersion,
      generation: structuredClone(manifest.generation), status: 'not_attempted',
      statusReason: 'Journal initialized offline; no collection attempted.', rawText: null,
      startedAtUTC: null, endedAtUTC: null, responseId: null, durationMs: null, cost: null
    }))
  };
  validateJournal(dataset, journal);
  return journal;
}
