import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { analyzeJournal, validateJournal, parseOutput, developmentHash } from '../research/p01/analyze.mjs';
import { dataset, manifest, syntheticJournal, setValid, handCalculatedJournal } from '../fixtures/p01-synthetic.mjs';
import { prepare } from '../research/p01/prepare.mjs';
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test('strict output grammar rejects ambiguous, nonfinite, extra and repaired outputs', () => {
  assert.deepEqual(parseOutput(' { "confidence": 1e-1, "answer": 3.0 }\n'), { confidence: 0.1, answer: 3 });
  assert.deepEqual(parseOutput('{"answ\\u0065r":-2,"confidence":0}'), { answer: -2, confidence: 0 });
  for (const raw of [null, '', '```json\n{"answer":3,"confidence":0.5}\n```', '{"answer":"3","confidence":0.5}',
    '{"answer":3,"confidence":0.5,"reason":"test"}', '{"answer":3,"answer":4,"confidence":0.5}',
    '{"answer":3,"answer":4}', '{"answer":3,"confidence":1.1}', '{"answer":3,"confidence":-0.1}',
    '{"answer":1e999,"confidence":0.5}', '{"answer":9007199254740993,"confidence":0.5}',
    '{"answer":3.1,"confidence":0.5}', '{"answer":03,"confidence":0.5}', '{"answer":3,"confidence":NaN}',
    '{"answer":391.00000000000000001,"confidence":0.5}', '{"answer":1e-324,"confidence":0.5}',
    '{"answer":3,"confidence":1.00000000000000001}', '{"answer":3,"confidence":-1e-400}',
    '{"answer":3,"confidence":1e-400}', '[3,0.5]', '{"answer":3,"confidence":0.5} trailing']) assert.equal(parseOutput(raw), null, raw);
});

test('unequal repetitions use equal item weights, paired baseline, coverage and family denominators', () => {
  const journal = handCalculatedJournal();
  const report = analyzeJournal(dataset, journal);
  near(report.baseline.probability, 1 / 3); // Pooled responses would give 1/2.
  near(report.evaluation.accuracy, 2 / 3);
  near(report.comparison.modelBrier, 0.12); // Pooled responses would give 0.10.
  near(report.comparison.baselineBrier, 1 / 3);
  near(report.comparison.difference, -16 / 75);
  for (const phase of [report.development, report.evaluation]) {
    assert.equal(phase.plannedTrials, 36);
    assert.equal(phase.validTrials, 4);
    assert.equal(phase.validItems, 2);
    near(phase.coverage, 4 / 36);
    assert.equal(phase.statusCounts.not_attempted, 32);
    assert.equal(phase.families.arithmetic.plannedTrials, 12);
    assert.equal(phase.families.arithmetic.validTrials, 4);
    assert.equal(phase.families.counting.validTrials, 0);
  }
  assert.equal(report.dataKind, 'synthetic');
  assert.equal(report.status, 'SYNTHETIC_VALIDATION_ONLY');
  assert.equal(report.collectionComplete, false);
});

test('bootstrap resamples development baseline and keeps evaluation repetitions together', () => {
  const journal = handCalculatedJournal();
  const report = analyzeJournal(dataset, journal);
  // Enumerating the 3x3 cluster combinations gives these extreme differences,
  // each with probability 1/16. A fixed q would incorrectly keep the interval negative.
  near(report.comparison.interval.lower, -0.84);
  near(report.comparison.interval.upper, 11 / 225);
  assert.equal(report.comparison.interval.draws, 2000);
  assert.deepEqual(analyzeJournal(dataset, journal), report);
  const reordered = structuredClone(journal);
  reordered.trials.reverse();
  assert.deepEqual(analyzeJournal(dataset, reordered).comparison, report.comparison);
  assert.equal(developmentHash(reordered.trials), developmentHash(journal.trials));
});

test('empty and insufficient valid populations produce null comparisons or no interval', () => {
  const empty = syntheticJournal();
  const result = analyzeJournal(dataset, empty);
  assert.equal(result.baseline.probability, null);
  assert.equal(result.comparison.modelBrier, null);
  assert.equal(result.comparison.baselineBrier, null);
  assert.equal(result.comparison.difference, null);
  assert.equal(result.comparison.interval.reason, 'no_valid_development_items');
  setValid(empty, 'eva-01', [[1, 0.75]]);
  assert.equal(analyzeJournal(dataset, empty).comparison.difference, null);
  setValid(empty, 'dev-01', [[1, 0.75]]);
  const one = analyzeJournal(dataset, empty);
  near(one.comparison.difference, 0.0625);
  assert.equal(one.comparison.interval.lower, null);
  assert.equal(one.comparison.interval.reason, 'insufficient_valid_items');
  const devOnly = syntheticJournal();
  setValid(devOnly, 'dev-01', [[1, 1]]);
  assert.equal(analyzeJournal(dataset, devOnly).comparison.interval.reason, 'no_valid_evaluation_items');
});

test('exclusions retain full denominator; incorrect but valid responses cannot be excluded', () => {
  const journal = syntheticJournal();
  const entries = journal.trials.filter(row => row.split === 'development').slice(0, 3);
  ['invalid', 'refusal', 'api_error'].forEach((status, i) => Object.assign(entries[i], {
    status, statusReason: 'Synthetic exclusion for testing.', rawText: status === 'api_error' ? null : 'not a numeric JSON answer',
    startedAtUTC: '2026-01-01T10:00:00.000Z', endedAtUTC: '2026-01-01T10:00:00.001Z'
  }));
  const summary = analyzeJournal(dataset, journal).development;
  assert.equal(summary.plannedTrials, 36);
  assert.equal(summary.attemptedTrials, 3);
  assert.equal(summary.validTrials, 0);
  assert.equal(summary.statusCounts.invalid, 1);
  assert.equal(summary.statusCounts.refusal, 1);
  assert.equal(summary.statusCounts.api_error, 1);
  for (const status of ['invalid', 'refusal']) {
    entries[0].status = status;
    entries[0].rawText = '{"answer":-999,"confidence":0.8}';
    assert.throws(() => validateJournal(dataset, journal), /cannot be/);
  }
});

test('rejects plan substitution, missing trials, corrupt IDs, prompt edits and mixed populations', () => {
  assert.throws(() => validateJournal(dataset, prepare(dataset, manifest)), /journal fields/);
  const mutations = [
    j => j.trials.pop(),
    j => { j.trials[1] = structuredClone(j.trials[0]); },
    j => { j.trials[0].trialId = 'invented'; },
    j => { j.trials[0].split = 'evaluation'; },
    j => { j.trials[0].request.user += ' modified'; },
    j => { j.trials[0].modelVersion = 'different-version'; },
    j => { j.trials[0].generation = { temperature: 1 }; },
    j => { j.trials[0].status = 'pending'; },
    j => { j.trials[0].y = 1; },
    j => { j.trials[0].rawText = '{"answer":1,"confidence":0.5}'; },
    j => { j.dataKind = 'unknown'; },
    j => { j.datasetSha256 = 'mismatch'; },
    j => { j.analysis.seed = -1; },
    j => { j.analysis.draws = 10; },
    j => { j.generation.temperature = Infinity; }
  ];
  for (const mutate of mutations) {
    const journal = syntheticJournal();
    mutate(journal);
    assert.throws(() => validateJournal(dataset, journal));
  }
});

test('rejects invalid observation timestamps, costs, durations and claimed valid outputs', () => {
  for (const mutate of [
    row => { row.startedAtUTC = '2026-02-30T10:00:00.000Z'; },
    row => { row.endedAtUTC = '2026-01-01T09:00:00.000Z'; },
    row => { row.endedAtUTC = '2026-01-01T10:00:01+00:00'; },
    row => { row.durationMs = -1; },
    row => { row.cost = { amount: Infinity, currency: 'EUR' }; },
    row => { row.cost = { amount: 0, currency: null }; },
    row => { row.cost = { amount: 0, currency: ['EUR'] }; },
    row => { row.rawText = 'refused'; }
  ]) {
    const journal = handCalculatedJournal();
    mutate(journal.trials.find(row => row.status === 'ok'));
    assert.throws(() => validateJournal(dataset, journal));
  }
});

test('empirical branch enforces frozen baseline value, development hash and phase chronology using synthetic test inputs', () => {
  const journal = handCalculatedJournal();
  // Construct attempted exclusions for the remaining development trials.
  // This keeps the independently calculated q=1/3 and completes the phase.
  for (const row of journal.trials.filter(row => row.split === 'development' && row.status === 'not_attempted')) {
    Object.assign(row, { status: 'api_error', statusReason: 'Synthetic test transport error.',
      startedAtUTC: '2026-01-01T10:00:00.000Z', endedAtUTC: '2026-01-01T10:00:01.000Z' });
  }
  journal.dataKind = 'empirical'; // Testing validation only; never written as empirical data.
  assert.throws(() => validateJournal(dataset, journal), /requires a frozen/);
  journal.baselineFreeze = { probability: 1 / 3, developmentSha256: developmentHash(journal.trials), frozenAtUTC: '2026-01-01T11:00:00.000Z' };
  assert.doesNotThrow(() => validateJournal(dataset, journal));
  assert.equal(analyzeJournal(dataset, journal).baseline.freezeMetadataChecked, true);
  for (const mutate of [
    j => { j.baselineFreeze.probability = 0.5; },
    j => { j.baselineFreeze.developmentSha256 = 'wrong'; },
    j => { j.baselineFreeze.frozenAtUTC = '2026-01-01T09:00:00.000Z'; },
    j => { j.baselineFreeze.frozenAtUTC = '2026-01-01T12:00:00.000Z'; },
    j => { j.trials.find(row => row.split === 'development').statusReason = 'post-freeze edit'; }
  ]) {
    const changed = structuredClone(journal);
    mutate(changed);
    assert.throws(() => validateJournal(dataset, changed));
  }
});

test('CLI produces a labeled report, refuses overwrites and fails without output on invalid input', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'p01-analysis-test-'));
  try {
    const input = join(dir, 'synthetic.json');
    const output = join(dir, 'report.json');
    const script = new URL('../scripts/analyze-p01.mjs', import.meta.url);
    const run = destination => spawnSync(process.execPath, [script.pathname, input, destination], { encoding: 'utf8' });
    await writeFile(input, JSON.stringify(handCalculatedJournal()));
    const first = run(output);
    assert.equal(first.status, 0, first.stderr);
    const original = await readFile(output, 'utf8');
    assert.equal(JSON.parse(original).status, 'SYNTHETIC_VALIDATION_ONLY');
    assert.equal(run(output).status, 1);
    assert.equal(await readFile(output, 'utf8'), original);
    await writeFile(input, JSON.stringify(prepare(dataset, manifest)));
    const invalidOutput = join(dir, 'invalid.json');
    assert.equal(run(invalidOutput).status, 1);
    await assert.rejects(readFile(invalidOutput), { code: 'ENOENT' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
