import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeJournal, validateJournal, developmentHash } from '../research/p01/analyze.mjs';
import { analyzeTemplateSensitivity } from '../research/p01/template-sensitivity.mjs';
import { dataset, syntheticJournal, setValid, handCalculatedJournal } from '../fixtures/p01-synthetic.mjs';

// All rows here are constructed in memory. Changing dataKind only selects the
// validator branch under test; these are never empirical observations.
function completeWithExclusions(journal) {
  const statuses = ['invalid', 'refusal', 'api_error'];
  journal.trials.filter(row => row.split === 'development' && row.status === 'not_attempted').forEach((row, i) => {
    const status = statuses[i % statuses.length];
    Object.assign(row, { status, statusReason: 'Synthetic phase-transition test.',
      rawText: status === 'api_error' ? null : status === 'refusal' ? 'Synthetic refusal.' : 'malformed synthetic output',
      startedAtUTC: '2026-01-01T10:00:00.000Z', endedAtUTC: '2026-01-01T10:00:01.000Z' });
  });
}
function freeze(journal, probability) {
  journal.baselineFreeze = { probability, developmentSha256: developmentHash(journal.trials), frozenAtUTC: '2026-01-01T11:00:00.000Z' };
}

test('A01 rejects empirical freezes with incomplete development, before or after evaluation', () => {
  for (const remaining of [1, 35]) {
    for (const evaluationAttempted of [false, true]) {
      const journal = syntheticJournal();
      setValid(journal, 'dev-01', [[1, 1]]);
      const unattempted = journal.trials.filter(row => row.split === 'development' && row.status === 'not_attempted').slice(0, remaining).map(row => structuredClone(row));
      completeWithExclusions(journal);
      for (const original of unattempted) Object.assign(journal.trials.find(row => row.trialId === original.trialId), original);
      if (evaluationAttempted) setValid(journal, 'eva-01', [[1, 1]]);
      journal.dataKind = 'empirical';
      freeze(journal, 1); // Correct value and hash: only phase completeness is wrong.
      assert.equal(journal.trials.filter(row => row.split === 'development' && row.status === 'not_attempted').length, remaining);
      for (const analyze of [validateJournal, analyzeJournal, analyzeTemplateSensitivity]) {
        assert.throws(() => analyze(dataset, journal), /all 36 development trials to be attempted/);
      }
    }
  }
});

test('all development trials attempted allows valid freezes with exclusions and baseline zero or one', () => {
  for (const correct of [0, 1]) {
    const journal = syntheticJournal();
    setValid(journal, 'dev-01', [[correct, 0.5]]);
    completeWithExclusions(journal);
    journal.dataKind = 'empirical';
    freeze(journal, correct);
    assert.doesNotThrow(() => validateJournal(dataset, journal)); // Evaluation has not started.
    setValid(journal, 'eva-01', [[1, 0.8]]);
    const report = analyzeJournal(dataset, journal);
    assert.equal(report.development.attemptedTrials, 36);
    assert.equal(report.development.validTrials, 1);
    assert.equal(report.baseline.probability, correct);
    for (const status of ['invalid', 'refusal', 'api_error']) assert.ok(report.development.statusCounts[status] > 0);
    assert.equal(report.collectionComplete, false); // Most evaluation trials remain unattempted.
  }
});

test('interrupted empirical journals remain analyzable; attempted development with no valid response cannot freeze', () => {
  const journal = syntheticJournal();
  journal.dataKind = 'empirical';
  assert.equal(analyzeJournal(dataset, journal).baseline.probability, null);
  setValid(journal, 'dev-01', [[1, 1]]);
  assert.equal(analyzeJournal(dataset, journal).baseline.probability, 1);
  assert.equal(analyzeJournal(dataset, journal).comparison.difference, null);
  const allExcluded = syntheticJournal();
  completeWithExclusions(allExcluded);
  allExcluded.dataKind = 'empirical';
  const report = analyzeJournal(dataset, allExcluded);
  assert.equal(report.development.attemptedTrials, 36);
  assert.equal(report.development.validTrials, 0);
  assert.equal(report.baseline.probability, null);
  freeze(allExcluded, 0);
  assert.throws(() => validateJournal(dataset, allExcluded), /does not match item-weighted development accuracy/);
});

test('an empirical evaluation transport error still requires a complete frozen development phase', () => {
  const journal = syntheticJournal();
  setValid(journal, 'dev-01', [[1, 1]]);
  Object.assign(journal.trials.find(row => row.split === 'evaluation'), {
    status: 'api_error', statusReason: 'Synthetic evaluation timeout.',
    startedAtUTC: '2026-01-01T12:00:00.000Z', endedAtUTC: '2026-01-01T12:00:01.000Z'
  });
  journal.dataKind = 'empirical';
  assert.throws(() => validateJournal(dataset, journal), /requires a frozen development baseline/);
  freeze(journal, 1);
  assert.throws(() => validateJournal(dataset, journal), /all 36 development trials to be attempted/);
  completeWithExclusions(journal);
  freeze(journal, 1);
  const report = analyzeJournal(dataset, journal);
  assert.equal(report.evaluation.attemptedTrials, 1);
  assert.equal(report.evaluation.validTrials, 0);
  assert.equal(report.comparison.difference, null);
});

test('synthetic partial freezes retain their label and independent hand-calculated scores', () => {
  const journal = handCalculatedJournal();
  freeze(journal, 1 / 3);
  const report = analyzeTemplateSensitivity(dataset, journal);
  assert.equal(report.status, 'SYNTHETIC_VALIDATION_ONLY');
  assert.equal(report.primaryAnalysis.development.attemptedTrials, 4);
  assert.equal(report.primaryAnalysis.baseline.probability, 1 / 3);
  assert.ok(Math.abs(report.primaryAnalysis.comparison.difference + 16 / 75) < 1e-12);
});
