import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { dataset, manifest } from '../fixtures/p01-synthetic.mjs';
import { prepare } from '../research/p01/prepare.mjs';
import { analyzeJournal } from '../research/p01/analyze.mjs';
import { initializeJournal } from '../research/p01/initialize.mjs';
const completedDraft = () => ({ ...structuredClone(manifest), dataKind: 'synthetic', runId: 'initializer-test-only',
  provider: 'synthetic-fixture', modelVersion: 'no-model-called', generation: { temperature: 0.3, tools: false } });

test('completed draft produces an analyzable empty journal with actual settings and planned order', () => {
  const draft = completedDraft();
  const before = structuredClone(draft);
  const journal = initializeJournal(dataset, draft);
  assert.deepEqual(draft, before);
  assert.equal(journal.dataKind, 'synthetic');
  assert.deepEqual(journal.analysis, { seed: 42002, draws: 2000 });
  assert.equal(journal.generation.temperature, 0.3);
  assert.equal(draft.requestedGeneration.temperature, 0);
  const planned = Object.values(prepare(dataset, draft).phases).flat();
  assert.deepEqual(journal.trials.map(t => t.trialId), planned.map(t => t.trialId));
  for (const row of journal.trials) {
    assert.equal(row.status, 'not_attempted');
    assert.equal(row.rawText, null);
    assert.equal(row.startedAtUTC, null);
    assert.equal(row.endedAtUTC, null);
    assert.equal(row.responseId, null);
    assert.equal(row.durationMs, null);
    assert.equal(row.cost, null);
    assert.deepEqual(row.generation, journal.generation);
  }
  const report = analyzeJournal(dataset, journal);
  assert.equal(report.collectionComplete, false);
  assert.equal(report.development.validTrials, 0);
  assert.equal(report.evaluation.validTrials, 0);
  assert.equal(report.comparison.difference, null);
  assert.equal(report.baseline.probability, null);
  journal.trials[0].generation.temperature = 1;
  assert.equal(journal.trials[1].generation.temperature, 0.3);
  assert.equal(draft.generation.temperature, 0.3);
});

test('incomplete, ambiguous, incompatible or already frozen manifests cannot initialize a journal', () => {
  assert.throws(() => initializeJournal(dataset, manifest), /dataKind/);
  for (const mutate of [
    m => { m.provider = null; },
    m => { m.modelVersion = ''; },
    m => { m.generation = null; },
    m => { m.analysis.seed = -1; },
    m => { m.analysis.draws = 10; },
    m => { m.baseline = { probability: 0.5 }; },
    m => { m.baselineFreeze = { probability: 0.5 }; },
    m => { delete m.baselineFreeze; },
    m => { m.collectionControls.toolsEnabled = true; },
    m => { m.collectionControls.retryFailedTrials = true; },
    m => { m.collectionControls.freshSessionPerTrial = false; },
    m => { m.collectionControls.followPlannedOrder = false; }
  ]) {
    const draft = completedDraft();
    mutate(draft);
    assert.throws(() => initializeJournal(dataset, draft));
  }
});

test('initializer CLI rejects the unchanged template, preserves existing files and round-trips into analyzer', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'p01-initialize-test-'));
  try {
    const input = join(dir, 'draft.json'), output = join(dir, 'journal.json');
    const script = new URL('../scripts/initialize-p01.mjs', import.meta.url).pathname;
    const run = () => spawnSync(process.execPath, [script, input, output], { encoding: 'utf8' });
    await writeFile(input, JSON.stringify(manifest));
    assert.equal(run().status, 1);
    await assert.rejects(readFile(output), { code: 'ENOENT' });
    await writeFile(input, JSON.stringify(completedDraft()));
    const created = run();
    assert.equal(created.status, 0, created.stderr);
    const bytes = await readFile(output, 'utf8');
    assert.equal(analyzeJournal(dataset, JSON.parse(bytes)).status, 'SYNTHETIC_VALIDATION_ONLY');
    assert.equal(run().status, 1);
    assert.equal(await readFile(output, 'utf8'), bytes);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
