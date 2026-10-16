import { createHash } from 'node:crypto';
import { prepare, validateDataset } from './prepare.mjs';

const SPLITS = ['development', 'evaluation'];
const STATUSES = ['ok', 'invalid', 'refusal', 'api_error', 'not_attempted'];
const FAMILIES = ['arithmetic', 'number_theory', 'counting'];
const fail = message => { throw new Error(message); };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonblank = value => typeof value === 'string' && value.trim().length > 0;
const uint32 = value => Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
function exactKeys(value, keys, label) {
  if (!record(value) || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) fail(`Invalid ${label} fields.`);
}
function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  fail('Only finite JSON values are allowed.');
}
const serialized = value => JSON.stringify(canonical(value));
const sha256 = value => createHash('sha256').update(value).digest('hex');
function utc(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value;
}

// Match exactly two numeric properties, including JSON's escaped-key syntax.
// JSON.parse alone would silently discard duplicate properties.
const numberToken = '-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?';
const stringToken = '"(?:[^"\\\\\\x00-\\x1f]|\\\\(?:["\\\\/bfnrt]|u[0-9a-fA-F]{4}))*"';
const ws = '[ \\t\\r\\n]*';
const outputPattern = new RegExp(`^${ws}\\{${ws}(${stringToken})${ws}:${ws}(${numberToken})${ws},${ws}(${stringToken})${ws}:${ws}(${numberToken})${ws}\\}${ws}$`);
function allowedNumber(token, kind) {
  const value = Number(token);
  if (!Number.isFinite(value)) return false;
  const negative = token.startsWith('-');
  const [mantissa, exponentText = '0'] = token.replace(/^-/, '').toLowerCase().split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  const coefficient = (whole + fraction).replace(/^0+/, '');
  if (!coefficient) return true; // Exact zero, including -0 and exponent notation.
  if (value === 0) return false; // Reject nonzero literals lost through underflow.
  const digits = coefficient.replace(/0+$/, '');
  const scale = Number(exponentText) - fraction.length + coefficient.length - digits.length;
  // Check the decimal value before floating-point rounding can turn a fraction
  // into an integer, or a probability just above one into exactly one.
  if (kind === 'answer') return scale >= 0 && Number.isSafeInteger(value);
  const order = digits.length + scale;
  return !negative && (order <= 0 || (digits === '1' && scale === 0));
}
export function parseOutput(rawText) {
  if (typeof rawText !== 'string') return null;
  const match = outputPattern.exec(rawText);
  if (!match) return null;
  const first = JSON.parse(match[1]);
  const second = JSON.parse(match[3]);
  if (first === second || ![first, second].includes('answer') || ![first, second].includes('confidence')) return null;
  if (!allowedNumber(match[2], first) || !allowedNumber(match[4], second)) return null;
  const value = JSON.parse(rawText);
  if (!Number.isSafeInteger(value.answer) || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) return null;
  return value;
}

export function developmentHash(trials) {
  const rows = trials.filter(row => row.split === 'development').sort((a, b) => a.trialId.localeCompare(b.trialId, 'en'));
  return sha256(serialized(rows));
}

export function validateJournal(dataset, journal) {
  validateDataset(dataset);
  exactKeys(journal, ['schemaVersion', 'protocol', 'datasetSha256', 'dataKind', 'runId', 'provider', 'modelVersion', 'condition', 'generation', 'orderSeed', 'analysis', 'baselineFreeze', 'trials'], 'journal');
  if (journal.schemaVersion !== 1 || journal.protocol !== dataset.datasetId || journal.datasetSha256 !== sha256(JSON.stringify(dataset))) fail('Journal dataset fingerprint or version mismatch.');
  if (!['synthetic', 'empirical'].includes(journal.dataKind)) fail('Explicit synthetic/empirical dataKind required.');
  for (const key of ['runId', 'provider', 'modelVersion', 'condition']) if (!nonblank(journal[key])) fail(`Missing ${key}.`);
  if (!record(journal.generation) || !Object.keys(journal.generation).length || !uint32(journal.orderSeed)) fail('Effective generation settings and order seed required.');
  serialized(journal.generation);
  exactKeys(journal.analysis, ['seed', 'draws'], 'analysis');
  if (!uint32(journal.analysis.seed) || journal.analysis.draws !== 2000) fail('Analysis requires a uint32 seed and 2000 draws.');
  const plan = prepare(dataset, { schemaVersion: 1, protocol: dataset.datasetId, repetitions: 3, orderSeed: journal.orderSeed, status: 'DRAFT_NOT_PREREGISTERED' });
  const planned = new Map(Object.values(plan.phases).flat().map(row => [row.trialId, row]));
  if (!Array.isArray(journal.trials) || journal.trials.length !== planned.size) fail('Journal must retain all 72 planned trials.');
  const seen = new Set();
  for (const row of journal.trials) {
    exactKeys(row, ['trialId', 'itemId', 'repetition', 'split', 'request', 'modelVersion', 'generation', 'status', 'statusReason', 'rawText', 'startedAtUTC', 'endedAtUTC', 'responseId', 'durationMs', 'cost'], 'trial');
    const expected = planned.get(row.trialId);
    if (!expected || seen.has(row.trialId)) fail('Unknown or duplicate trial ID.');
    seen.add(row.trialId);
    for (const key of ['itemId', 'repetition', 'split']) if (row[key] !== expected[key]) fail(`Trial ${key} mismatch.`);
    if (serialized(row.request) !== serialized(expected.request)) fail('Exact planned prompts required.');
    if (row.modelVersion !== journal.modelVersion || serialized(row.generation) !== serialized(journal.generation)) fail('Mixed model versions or generation settings; use separate journals.');
    if (!STATUSES.includes(row.status)) fail('Unknown status; pending plans are not observations.');
    if (row.rawText !== null && typeof row.rawText !== 'string') fail('rawText must be a string or null.');
    if (row.responseId !== null && !nonblank(row.responseId)) fail('Invalid response ID.');
    if (row.durationMs !== null && (!Number.isFinite(row.durationMs) || row.durationMs < 0)) fail('Invalid duration.');
    if (row.cost !== null) {
      exactKeys(row.cost, ['amount', 'currency'], 'cost');
      if (!Number.isFinite(row.cost.amount) || row.cost.amount < 0 || typeof row.cost.currency !== 'string' || !/^[A-Z]{3}$/.test(row.cost.currency)) fail('Invalid cost.');
    }
    if (row.status === 'not_attempted') {
      if (['rawText', 'startedAtUTC', 'endedAtUTC', 'responseId', 'durationMs', 'cost'].some(key => row[key] !== null) || !nonblank(row.statusReason)) fail('Unattempted trials need null observation fields and a reason.');
      continue;
    }
    if (!utc(row.startedAtUTC) || !utc(row.endedAtUTC) || row.endedAtUTC < row.startedAtUTC) fail('Invalid UTC trial timestamps.');
    if (row.status === 'ok') {
      if (!parseOutput(row.rawText) || row.statusReason !== null) fail('ok requires strictly valid output and no exclusion reason.');
    } else {
      if (!nonblank(row.statusReason)) fail('Exclusions require a documented reason.');
      if (['invalid', 'refusal'].includes(row.status) && typeof row.rawText !== 'string') fail('Model output required for invalid/refusal.');
      if (row.status === 'invalid' && parseOutput(row.rawText)) fail('A valid numeric answer cannot be excluded as invalid.');
      if (row.status === 'refusal' && parseOutput(row.rawText)) fail('A valid numeric answer cannot be coded as refusal.');
    }
  }
  const freeze = journal.baselineFreeze;
  if (freeze !== null) {
    exactKeys(freeze, ['probability', 'developmentSha256', 'frozenAtUTC'], 'baseline freeze');
    if (!Number.isFinite(freeze.probability) || freeze.probability < 0 || freeze.probability > 1 || !utc(freeze.frozenAtUTC)) fail('Invalid baseline freeze.');
    if (freeze.developmentSha256 !== developmentHash(journal.trials)) fail('Frozen development journal fingerprint mismatch.');
    const development = phaseSummary(dataset, journal.trials, 'development');
    if (development.accuracy === null || Math.abs(development.accuracy - freeze.probability) > 1e-12) fail('Frozen baseline does not match item-weighted development accuracy.');
    for (const row of journal.trials.filter(row => row.status !== 'not_attempted')) {
      if (row.split === 'development' && row.endedAtUTC > freeze.frozenAtUTC) fail('Development must finish before baseline freeze.');
      if (row.split === 'evaluation' && row.startedAtUTC <= freeze.frozenAtUTC) fail('Evaluation must start after baseline freeze.');
    }
  }
  if (journal.dataKind === 'empirical' && journal.trials.some(row => row.split === 'evaluation' && row.status !== 'not_attempted') && freeze === null) fail('Empirical evaluation requires a frozen development baseline.');
  return journal;
}

function itemScores(dataset, trials, split) {
  return dataset.items.filter(item => item.split === split).map(item => {
    const responses = trials.filter(row => row.itemId === item.id && row.status === 'ok').map(row => {
      const output = parseOutput(row.rawText);
      const y = Number(output.answer === item.referenceAnswer);
      return { y, brier: (output.confidence - y) ** 2 };
    });
    return { itemId: item.id, validTrials: responses.length, accuracy: mean(responses.map(row => row.y)), brier: mean(responses.map(row => row.brier)) };
  });
}
function coverage(rows, plannedItems) {
  const statusCounts = Object.fromEntries(STATUSES.map(status => [status, rows.filter(row => row.status === status).length]));
  return { plannedTrials: rows.length, attemptedTrials: rows.length - statusCounts.not_attempted, validTrials: statusCounts.ok,
    plannedItems, validItems: new Set(rows.filter(row => row.status === 'ok').map(row => row.itemId)).size,
    coverage: rows.length ? statusCounts.ok / rows.length : null, statusCounts };
}
function phaseSummary(dataset, trials, split) {
  const items = itemScores(dataset, trials, split);
  const valid = items.filter(item => item.validTrials > 0);
  const rows = trials.filter(row => row.split === split);
  const families = Object.fromEntries(FAMILIES.map(family => {
    const ids = new Set(dataset.items.filter(item => item.split === split && item.family === family).map(item => item.id));
    return [family, coverage(rows.filter(row => ids.has(row.itemId)), ids.size)];
  }));
  return { ...coverage(rows, items.length), accuracy: mean(valid.map(item => item.accuracy)), brier: mean(valid.map(item => item.brier)), families, items };
}
const baselineBrier = (items, q) => mean(items.map(item => item.accuracy * (1 - q) ** 2 + (1 - item.accuracy) * q ** 2));
function bootstrap(development, evaluation, settings) {
  const base = { method: 'conditional_item_cluster_percentile_linear', draws: 0, seed: settings.seed, lower: null, upper: null };
  if (!development.length) return { ...base, reason: 'no_valid_development_items' };
  if (!evaluation.length) return { ...base, reason: 'no_valid_evaluation_items' };
  if (development.length < 2 || evaluation.length < 2) return { ...base, reason: 'insufficient_valid_items' };
  let state = settings.seed;
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  const sample = items => Array.from({ length: items.length }, () => items[Math.floor(random() * items.length)]);
  const differences = Array.from({ length: settings.draws }, () => {
    const q = mean(sample(development).map(item => item.accuracy));
    const sampledEvaluation = sample(evaluation);
    return mean(sampledEvaluation.map(item => item.brier)) - baselineBrier(sampledEvaluation, q);
  }).sort((a, b) => a - b);
  const quantile = p => {
    const index = (differences.length - 1) * p;
    const low = Math.floor(index), high = Math.ceil(index);
    return differences[low] + (differences[high] - differences[low]) * (index - low);
  };
  return { ...base, draws: settings.draws, reason: null, lower: quantile(0.025), upper: quantile(0.975) };
}

// Reused unchanged by the separate template-pair sensitivity analysis.
export { bootstrap as bootstrapIndependentItems };

export function analyzeJournal(dataset, journal) {
  validateJournal(dataset, journal);
  const development = phaseSummary(dataset, journal.trials, 'development');
  const evaluation = phaseSummary(dataset, journal.trials, 'evaluation');
  const devItems = development.items.filter(item => item.validTrials > 0);
  const evalItems = evaluation.items.filter(item => item.validTrials > 0);
  const q = development.accuracy;
  const baseline = q === null || !evalItems.length ? null : baselineBrier(evalItems, q);
  return {
    schemaVersion: 1, protocol: journal.protocol, dataKind: journal.dataKind,
    status: journal.dataKind === 'synthetic' ? 'SYNTHETIC_VALIDATION_ONLY' : 'DESCRIPTIVE_ANALYSIS_NOT_PREREGISTRATION_PROOF',
    runId: journal.runId, provider: journal.provider, modelVersion: journal.modelVersion, condition: journal.condition,
    generation: journal.generation, datasetSha256: journal.datasetSha256, journalSha256: sha256(serialized(journal)),
    collectionComplete: !journal.trials.some(row => row.status === 'not_attempted'),
    baseline: { probability: q, developmentSha256: developmentHash(journal.trials), freezeMetadataChecked: journal.baselineFreeze !== null },
    development, evaluation,
    comparison: { modelBrier: evaluation.brier, baselineBrier: baseline, difference: baseline === null ? null : evaluation.brier - baseline,
      interval: bootstrap(devItems, evalItems, journal.analysis) },
    warnings: [
      'Conditional on valid responses; exclusions may bias every score and interval.',
      'Equal weight per valid item; repetitions are clustered, not independent items.',
      'Small public convenience dataset with shared templates; no population generalization.',
      'Phases are resampled separately; possible dependence across shared templates is not preserved. Percentile bounds have no guaranteed frequentist coverage.',
      'Brier differences against the development baseline do not isolate calibration or question-level discrimination.',
      'Journal metadata and hashes do not prove provenance, preregistration or honest chronology.',
      'Behavioral calibration does not demonstrate consciousness or access to internal mechanisms.'
    ]
  };
}
