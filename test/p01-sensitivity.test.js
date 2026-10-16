import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { analyzeJournal, developmentHash } from '../research/p01/analyze.mjs';
import { analyzeTemplateSensitivity } from '../research/p01/template-sensitivity.mjs';
import { dataset, syntheticJournal, setValid, handCalculatedJournal } from '../fixtures/p01-synthetic.mjs';
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

// Entirely constructed test data. No provider or model is called.
function dependentJournal(positive) {
  const journal = syntheticJournal();
  setValid(journal, 'dev-01', [[0, 0.5]]);
  setValid(journal, 'dev-02', [[1, 0.5]]);
  setValid(journal, 'eva-01', [[positive ? 0 : 1, 0.5]]);
  setValid(journal, 'eva-02', [[positive ? 1 : 0, 0.5]]);
  return journal;
}

test('known positive and negative dependence produce independently enumerated bounds', () => {
  for (const positive of [true, false]) {
    const report = analyzeTemplateSensitivity(dataset, dependentJournal(positive));
    const result = report.restrictedComparison;
    assert.equal(report.status, 'SYNTHETIC_VALIDATION_ONLY');
    assert.equal(report.subset.eligiblePairs, 2);
    near(result.baseline.probability, 0.5);
    near(result.modelBrier, 0.25);
    near(result.baselineBrier, 0.25);
    near(result.difference, 0);
    // Joint: same pair twice (probability 1/2) gives +1/4 or -3/4;
    // one of each gives 0. Independent extremes each have probability 1/8.
    near(result.pairedInterval.lower, positive ? 0 : -0.75);
    near(result.pairedInterval.upper, positive ? 0.25 : 0);
    near(result.independentInterval.lower, -0.75);
    near(result.independentInterval.upper, 0.25);
    for (const interval of [result.pairedInterval, result.independentInterval]) {
      assert.equal(interval.draws, 2000);
      assert.equal(interval.seed, 42002);
      assert.equal(interval.reason, null);
    }
  }
});

test('unequal repetitions and one-sided pairs preserve weights, coverage and the primary frozen baseline', () => {
  const journal = handCalculatedJournal();
  setValid(journal, 'dev-03', [[1, 1]]); // No evaluation partner: affects only primary q.
  setValid(journal, 'eva-04', [[1, 1]]); // No development partner.
  journal.baselineFreeze = { probability: 5 / 9, developmentSha256: developmentHash(journal.trials), frozenAtUTC: '2026-01-01T11:00:00.000Z' };
  const before = structuredClone(journal);
  const report = analyzeTemplateSensitivity(dataset, journal);
  assert.deepEqual(journal, before);
  assert.deepEqual(report.primaryAnalysis, analyzeJournal(dataset, journal));
  near(report.primaryAnalysis.baseline.probability, 5 / 9);
  assert.equal(report.primaryAnalysis.baseline.freezeMetadataChecked, true);
  near(report.restrictedComparison.baseline.probability, 1 / 3); // Pooled would be 1/2.
  near(report.restrictedComparison.modelBrier, 0.12); // Pooled would be 0.10.
  near(report.restrictedComparison.baselineBrier, 1 / 3);
  near(report.restrictedComparison.difference, -16 / 75);
  near(report.restrictedComparison.independentInterval.lower, -0.84);
  near(report.restrictedComparison.independentInterval.upper, 11 / 225);
  assert.deepEqual(report.subset.validTrials, { development: 4, evaluation: 4 });
  assert.equal(report.subset.plannedPairs, 12);
  assert.equal(report.subset.excludedPairs, 10);
  assert.deepEqual(report.subset.families.arithmetic, { plannedPairs: 4, eligiblePairs: 2 });
  assert.deepEqual(report.subset.families.counting, { plannedPairs: 4, eligiblePairs: 0 });
  const pairs = Object.fromEntries(report.subset.pairs.map(pair => [pair.template, pair]));
  assert.equal(pairs.t01.development.validTrials, 3);
  assert.equal(pairs.t02.development.validTrials, 1);
  assert.equal(pairs.t03.exclusionReason, 'no_valid_evaluation_responses');
  assert.equal(pairs.t04.exclusionReason, 'no_valid_development_responses');
  assert.equal(pairs.t05.exclusionReason, 'no_valid_development_or_evaluation_responses');
  assert.equal(report.primaryAnalysis.development.plannedTrials, 36);
  assert.equal(report.primaryAnalysis.evaluation.validTrials, 5);
});

test('no eligible pairs and a single eligible pair have no percentile bounds', () => {
  const journal = syntheticJournal();
  const empty = analyzeTemplateSensitivity(dataset, journal);
  assert.equal(empty.restrictedComparison.difference, null);
  assert.equal(empty.restrictedComparison.baseline.probability, null);
  setValid(journal, 'dev-01', [[1, 1]]);
  setValid(journal, 'eva-02', [[1, 1]]);
  const disjoint = analyzeTemplateSensitivity(dataset, journal);
  assert.equal(disjoint.primaryAnalysis.comparison.difference, 0);
  assert.equal(disjoint.restrictedComparison.modelBrier, null);
  assert.equal(disjoint.restrictedComparison.pairedInterval.reason, 'no_eligible_pairs');
  setValid(journal, 'eva-01', [[0, 0.5]]);
  const one = analyzeTemplateSensitivity(dataset, journal).restrictedComparison;
  near(one.difference, -0.75);
  assert.equal(one.pairedInterval.reason, 'insufficient_eligible_pairs');
  for (const result of [empty.restrictedComparison, disjoint.restrictedComparison, one]) {
    for (const interval of [result.independentInterval, result.pairedInterval]) {
      assert.equal(interval.draws, 0);
      assert.equal(interval.lower, null);
      assert.equal(interval.upper, null);
    }
  }
});

test('deterministic pairing ignores journal and dataset array order', () => {
  const journal = dependentJournal(true);
  const original = analyzeTemplateSensitivity(dataset, journal);
  assert.deepEqual(analyzeTemplateSensitivity(dataset, journal), original);
  journal.trials.reverse();
  const reorderedDataset = structuredClone(dataset);
  reorderedDataset.items.reverse();
  journal.datasetSha256 = createHash('sha256').update(JSON.stringify(reorderedDataset)).digest('hex');
  const reordered = analyzeTemplateSensitivity(reorderedDataset, journal);
  assert.deepEqual(reordered.restrictedComparison, original.restrictedComparison);
  assert.deepEqual(reordered.subset, original.subset);
});

test('rejects ambiguous or cross-family templates, even with a matching dataset hash', () => {
  for (const mutate of [
    d => { delete d.items[0].template; },
    d => { d.items[0].template = ' '; },
    d => { d.items[0].template = 'new-unpaired-template'; },
    d => { d.items.find(i => i.id === 'dev-02').template = 't01'; },
    d => {
      d.items.find(i => i.id === 'eva-01').template = 't05';
      d.items.find(i => i.id === 'eva-05').template = 't01';
    }
  ]) {
    const changed = structuredClone(dataset);
    mutate(changed);
    const journal = syntheticJournal();
    journal.datasetSha256 = createHash('sha256').update(JSON.stringify(changed)).digest('hex');
    assert.throws(() => analyzeTemplateSensitivity(changed, journal), /template/);
  }
  const invalid = dependentJournal(true);
  invalid.dataKind = 'empirical'; // In-memory validation test, never an empirical observation.
  assert.throws(() => analyzeTemplateSensitivity(dataset, invalid), /requires a frozen/);
});

test('sensitivity CLI validates before writing and never overwrites a report', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'p01-sensitivity-test-'));
  try {
    const input = join(dir, 'synthetic.json');
    const output = join(dir, 'report.json');
    const script = new URL('../scripts/sensitivity-p01.mjs', import.meta.url);
    const run = destination => spawnSync(process.execPath, [script.pathname, input, destination], { encoding: 'utf8' });
    await writeFile(input, JSON.stringify(dependentJournal(true)));
    const first = run(output);
    assert.equal(first.status, 0, first.stderr);
    const original = await readFile(output, 'utf8');
    assert.equal(JSON.parse(original).analysisId, 'p01-template-pair-sensitivity-v1');
    assert.equal(run(output).status, 1);
    assert.equal(await readFile(output, 'utf8'), original);
    await writeFile(input, '{}');
    const invalidOutput = join(dir, 'invalid.json');
    assert.equal(run(invalidOutput).status, 1);
    await assert.rejects(readFile(invalidOutput), { code: 'ENOENT' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
