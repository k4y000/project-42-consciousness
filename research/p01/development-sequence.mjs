import { createHash } from 'node:crypto';
import { initializeJournal } from './initialize.mjs';

// JSON-value copies, with sorted object keys for comparison and hashing.
// Reject values that JSON.stringify would silently drop or coerce.
function copyJson(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || ancestors.has(value)) throw new Error('Expected finite, acyclic JSON values.');
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('Expected plain JSON objects.');
  if (Object.getOwnPropertySymbols(value).length) throw new Error('Unexpected symbol fields.');
  if (Array.isArray(value)) {
    const keys = Object.getOwnPropertyNames(value).filter(key => key !== 'length');
    if (keys.length !== value.length || keys.some((key, i) => key !== String(i))) {
      throw new Error('Expected dense JSON arrays without extra fields.');
    }
  }
  ancestors.add(value);
  const result = Array.isArray(value)
    ? Array.from(value, entry => copyJson(entry, ancestors))
    : Object.fromEntries(Object.keys(value).sort().map(key => [key, copyJson(value[key], ancestors)]));
  ancestors.delete(value);
  return result;
}
const serialized = value => JSON.stringify(copyJson(value));
const nonblank = value => typeof value === 'string' && value.trim().length > 0;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function validEvent(event) {
  const keys = ['kind', 'rawText', 'modelVersion', 'generation', 'reason'];
  if (!isRecord(event) || Object.keys(event).length !== keys.length || !keys.every(key => Object.hasOwn(event, key))) return false;
  if (!['delivered', 'transport_error', 'timeout'].includes(event.kind)) return false;
  if (event.kind === 'delivered') {
    return typeof event.rawText === 'string' && nonblank(event.modelVersion)
      && isRecord(event.generation) && event.reason === null;
  }
  return (event.rawText === null || typeof event.rawText === 'string')
    && (event.modelVersion === null || nonblank(event.modelVersion))
    && (event.generation === null || isRecord(event.generation)) && nonblank(event.reason);
}

// The callback failure never becomes a fabricated provider event.
export class SequenceRecordingError extends Error {
  constructor(report) {
    super('Local sequence recording failed.');
    this.name = 'SequenceRecordingError';
    this.report = copyJson(report);
  }
}

/**
 * Qualification harness only. localDouble must be trusted, local test code.
 * An injected JS function is NOT sandboxed and can perform arbitrary effects.
 * This module has no network adapter, timer, retry or evaluation path.
 * Optional record(type, data) is trusted local code; each record is awaited.
 */
export async function runSyntheticDevelopment(dataset, manifest, localDouble, record = null) {
  if (record !== null && typeof record !== 'function') throw new Error('Expected a local recording callback.');
  if (manifest?.dataKind !== 'synthetic' || manifest.provider !== 'local-double') {
    throw new Error('Synthetic local-double manifests only; no empirical collection.');
  }
  if (manifest.paidCallsAuthorized !== false || manifest.approvedBudgetEUR !== 0) {
    throw new Error('This qualification requires zero budget and no paid calls.');
  }
  const generation = copyJson(manifest.generation);
  if (!isRecord(generation) || !Object.hasOwn(generation, 'tools') || generation.tools !== false) {
    throw new Error('The local double requires its own generation.tools: false field.');
  }
  if (typeof localDouble !== 'function') throw new Error('A local test double is required.');
  // Validate completely before the first call. Never resume or fill an existing journal.
  const blank = initializeJournal(dataset, manifest);
  const payloads = blank.trials.filter(row => row.split === 'development').map(row => ({
    trialId: row.trialId, request: copyJson(row.request),
    modelVersion: row.modelVersion, generation: copyJson(row.generation)
  }));
  const evaluationIds = blank.trials.filter(row => row.split === 'evaluation').map(row => row.trialId);
  const report = {
    schemaVersion: 1, status: 'SYNTHETIC_LOCAL_SEQUENCE_ONLY', dataKind: 'synthetic',
    runId: blank.runId, datasetSha256: blank.datasetSha256,
    developmentPlanSha256: createHash('sha256').update(serialized(payloads)).digest('hex'),
    plannedDevelopmentTrialIds: payloads.map(row => row.trialId),
    callsToDouble: 0, evaluationCalls: 0, baselineFreeze: null,
    developmentCompleted: false, stopReason: null, trace: [],
    notCalledDevelopmentTrialIds: [], notCalledEvaluationTrialIds: evaluationIds
  };
  const updateRemaining = () => {
    report.notCalledDevelopmentTrialIds = payloads.slice(report.callsToDouble).map(row => row.trialId);
  };
  const emit = async (type, data) => {
    if (record === null) return;
    try {
      await record(type, copyJson(data));
    } catch {
      updateRemaining();
      if (report.stopReason === null) report.stopReason = 'recording_error';
      throw new SequenceRecordingError(report);
    }
  };
  await emit('header', {
    format: 'P01_LOCAL_TRACE_V1', schemaVersion: 1, dataKind: 'synthetic',
    runId: report.runId, datasetSha256: report.datasetSha256,
    developmentPlanSha256: report.developmentPlanSha256,
    plannedDevelopmentTrialIds: report.plannedDevelopmentTrialIds,
    notCalledEvaluationTrialIds: report.notCalledEvaluationTrialIds
  });
  for (const payload of payloads) {
    // The trace, recorder, double and subsequent requests share no mutable objects.
    const entry = { ordinal: report.trace.length + 1, payload: copyJson(payload), event: null, outcome: null };
    await emit('intent', { ordinal: entry.ordinal, payload: entry.payload });
    report.trace.push(entry);
    report.callsToDouble += 1;
    let returned;
    try {
      returned = await localDouble(copyJson(payload));
    } catch {
      // Never copy potentially private exception text into a trace.
      entry.outcome = 'double_exception';
    }
    if (entry.outcome === null) {
      try {
        entry.event = copyJson(returned);
      } catch {
        entry.outcome = 'non_json_event';
      }
    }
    if (entry.outcome === null) {
      if (!validEvent(entry.event)) {
        entry.outcome = 'invalid_event';
      } else if ((entry.event.modelVersion !== null && entry.event.modelVersion !== payload.modelVersion)
        || (entry.event.generation !== null && serialized(entry.event.generation) !== serialized(payload.generation))) {
        entry.outcome = 'metadata_drift';
      } else {
        entry.outcome = entry.event.kind;
      }
    }
    if (entry.outcome !== 'delivered') report.stopReason = entry.outcome;
    await emit('result', entry);
    if (report.stopReason !== null) break;
  }
  updateRemaining();
  if (report.stopReason === null) {
    report.stopReason = 'development_complete';
    report.developmentCompleted = true;
  }
  await emit('terminal', report);
  return report;
}
