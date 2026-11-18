import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { dataset, manifest } from '../fixtures/p01-synthetic.mjs';
import { runSyntheticDevelopment } from '../research/p01/development-sequence.mjs';

const draft = () => ({ ...structuredClone(manifest), dataKind: 'synthetic',
  provider: 'local-double', modelVersion: 'fictional-v1', runId: 'sequence-test-only',
  generation: { temperature: 0, tools: false } });
const delivered = (payload, rawText = '{"answer":0,"confidence":0}') => ({
  kind: 'delivered', rawText, modelVersion: payload.modelVersion,
  generation: structuredClone(payload.generation), reason: null
});
// Frozen oracle for the published 42001 order, independent of the runner.
const expectedOrder = `dev-01-r3 dev-11-r1 dev-10-r3 dev-08-r3 dev-06-r2 dev-09-r3
dev-07-r2 dev-01-r1 dev-08-r2 dev-06-r3 dev-12-r1 dev-04-r2 dev-10-r1 dev-04-r3
dev-06-r1 dev-09-r1 dev-02-r3 dev-02-r1 dev-05-r3 dev-03-r1 dev-11-r2 dev-08-r1
dev-02-r2 dev-09-r2 dev-05-r2 dev-12-r3 dev-12-r2 dev-01-r2 dev-10-r2 dev-04-r1
dev-03-r2 dev-07-r3 dev-05-r1 dev-03-r3 dev-11-r3 dev-07-r1`.split(/\s+/);

test('local sequence follows all 36 development trials, without evaluation or reference leakage', async () => {
  const input = draft(), before = structuredClone(input), seen = [];
  const report = await runSyntheticDevelopment(dataset, input, async payload => {
    seen.push(structuredClone(payload));
    assert.deepEqual(Object.keys(payload).sort(), ['generation', 'modelVersion', 'request', 'trialId']);
    assert.deepEqual(Object.keys(payload.request).sort(), ['system', 'user']);
    assert.equal(payload.request.user, dataset.items.find(item => item.id === payload.trialId.slice(0, 6)).question);
    return delivered(payload);
  });
  assert.deepEqual(seen.map(row => row.trialId), expectedOrder);
  assert.deepEqual(report.plannedDevelopmentTrialIds, expectedOrder);
  assert.deepEqual(report.trace.map(row => row.payload), seen);
  assert.equal(report.callsToDouble, 36);
  assert.equal(report.developmentCompleted, true);
  assert.equal(report.stopReason, 'development_complete');
  assert.equal(report.status, 'SYNTHETIC_LOCAL_SEQUENCE_ONLY');
  assert.equal(report.dataKind, 'synthetic');
  assert.equal(report.evaluationCalls, 0);
  assert.equal(report.baselineFreeze, null);
  assert.deepEqual(report.notCalledDevelopmentTrialIds, []);
  assert.equal(report.notCalledEvaluationTrialIds.length, 36);
  assert.ok(report.notCalledEvaluationTrialIds.every(id => id.startsWith('eva-')));
  assert.deepEqual(input, before);
});

test('a pending local response prevents the next call, with at most one active call', async () => {
  const gates = [], calls = [];
  let active = 0, maximum = 0;
  const pending = runSyntheticDevelopment(dataset, draft(), payload => {
    calls.push(payload.trialId);
    active += 1;
    maximum = Math.max(maximum, active);
    return new Promise(resolve => gates.push(() => { active -= 1; resolve(delivered(payload)); }));
  });
  for (let i = 0; i < 36; i++) {
    await setImmediate();
    assert.equal(calls.length, i + 1);
    assert.equal(gates.length, i + 1);
    assert.equal(active, 1);
    gates[i]();
  }
  const report = await pending;
  assert.deepEqual(calls, expectedOrder);
  assert.equal(maximum, 1);
  assert.equal(active, 0);
  assert.equal(report.callsToDouble, calls.length);
});

test('scripted timeout or transport error stops at first, middle or last trial without retry', async () => {
  for (const kind of ['transport_error', 'timeout']) {
    for (const stopIndex of [0, 17, 35]) {
      const calls = [];
      const event = { kind, rawText: '{"answer":0,"confidence":0}', modelVersion: null,
        generation: null, reason: 'Fictional interruption before terminal delivery.' };
      const report = await runSyntheticDevelopment(dataset, draft(), async payload => {
        calls.push(payload.trialId);
        return calls.length === stopIndex + 1 ? event : delivered(payload);
      });
      assert.deepEqual(calls, expectedOrder.slice(0, stopIndex + 1));
      assert.equal(report.callsToDouble, calls.length);
      assert.deepEqual(report.trace.at(-1).event, event);
      assert.equal(report.stopReason, kind);
      assert.equal(report.developmentCompleted, false);
      assert.deepEqual(report.notCalledDevelopmentTrialIds, expectedOrder.slice(stopIndex + 1));
      assert.equal(report.notCalledEvaluationTrialIds.length, 36);
      assert.equal(report.evaluationCalls, 0);
      assert.equal(report.baselineFreeze, null);
      await setImmediate();
      assert.equal(calls.length, stopIndex + 1);
    }
  }
});

test('delivered refusals, malformed text and empty text are retained without recoding or replacement', async () => {
  const texts = ['Je ne répondrai pas à cette question.', '{"answer":', '', '{"answer":0,"confidence":0}'];
  let calls = 0;
  const report = await runSyntheticDevelopment(dataset, draft(), async payload => delivered(payload, texts[calls++ % texts.length]));
  assert.equal(calls, 36);
  assert.equal(report.developmentCompleted, true);
  report.trace.forEach((entry, i) => {
    assert.equal(entry.event.rawText, texts[i % texts.length]);
    assert.equal(entry.outcome, 'delivered');
    assert.equal(Object.hasOwn(entry, 'status'), false);
  });
});

test('exceptions, invalid contracts and metadata drift stop without inventing a transport error', async () => {
  const cyclic = {}; cyclic.self = cyclic;
  const cases = [
    [() => { throw new Error('DO_NOT_RECORD_PRIVATE_EXCEPTION'); }, 'double_exception'],
    [() => undefined, 'non_json_event'],
    [() => cyclic, 'non_json_event'],
    [payload => ({ ...delivered(payload), generation: { temperature: Infinity } }), 'non_json_event'],
    [payload => {
      const event = delivered(payload);
      event.generation.options = [0];
      event.generation.options.extra = 'non-json-drift';
      return event;
    }, 'non_json_event'],
    [() => null, 'invalid_event'],
    [payload => ({ ...delivered(payload), kind: 'refusal' }), 'invalid_event'],
    [payload => ({ ...delivered(payload), rawText: null }), 'invalid_event'],
    [payload => ({ ...delivered(payload), extra: true }), 'invalid_event'],
    [payload => ({ ...delivered(payload), modelVersion: 'fictional-v2' }), 'metadata_drift'],
    [payload => ({ ...delivered(payload), generation: { temperature: 1, tools: false } }), 'metadata_drift']
  ];
  for (const [reply, outcome] of cases) {
    let calls = 0;
    const report = await runSyntheticDevelopment(dataset, draft(), async payload => {
      calls += 1;
      return calls === 18 ? reply(payload) : delivered(payload);
    });
    assert.equal(calls, 18);
    assert.equal(report.callsToDouble, calls);
    assert.equal(report.stopReason, outcome);
    assert.equal(report.trace.at(-1).outcome, outcome);
    assert.equal(report.developmentCompleted, false);
    assert.deepEqual(report.notCalledDevelopmentTrialIds, expectedOrder.slice(18));
    assert.equal(JSON.stringify(report).includes('DO_NOT_RECORD_PRIVATE_EXCEPTION'), false);
    if (outcome === 'metadata_drift') assert.notDeepEqual(report.trace.at(-1).event, delivered(report.trace.at(-1).payload));
  }
});

test('incompatible inputs reject before calling the local double', async () => {
  const changes = [
    m => { m.dataKind = 'empirical'; }, m => { m.provider = 'provider'; },
    m => { m.paidCallsAuthorized = true; }, m => { m.approvedBudgetEUR = 1; },
    m => { m.generation.tools = true; }, m => { m.modelVersion = ''; },
    m => { m.generation = Object.assign(Object.create({ tools: false }), { temperature: 0 }); },
    m => { m.generation.options = new Array(1); },
    m => { m.baselineFreeze = {}; }, m => { m.orderSeed = -1; },
    m => { m.collectionControls.retryFailedTrials = true; },
    m => { m.collectionControls.toolsEnabled = true; },
    m => { m.collectionControls.followPlannedOrder = false; },
    m => { m.collectionControls.freshSessionPerTrial = false; }
  ];
  let calls = 0;
  const double = payload => { calls += 1; return delivered(payload); };
  for (const change of changes) {
    const input = draft(); change(input);
    await assert.rejects(runSyntheticDevelopment(dataset, input, double));
  }
  await assert.rejects(runSyntheticDevelopment({ ...dataset, items: [] }, draft(), double));
  await assert.rejects(runSyntheticDevelopment(dataset, draft(), null));
  assert.equal(calls, 0);
});

test('double mutations cannot rewrite the trace, the plan, the manifest or later requests', async () => {
  const input = draft(), before = structuredClone(input), dataBefore = structuredClone(dataset);
  let returned;
  const report = await runSyntheticDevelopment(dataset, input, async payload => {
    assert.equal(payload.generation.temperature, 0);
    returned = delivered(payload);
    payload.generation.temperature = 42;
    payload.request.user = 'mutated';
    payload.trialId = 'eva-01-r1';
    return returned;
  });
  returned.rawText = 'changed after completion';
  assert.deepEqual(input, before);
  assert.deepEqual(dataset, dataBefore);
  assert.deepEqual(report.trace.map(row => row.payload.trialId), expectedOrder);
  assert.ok(report.trace.every(row => row.payload.generation.temperature === 0 && row.payload.request.user !== 'mutated'));
  assert.equal(report.trace.at(-1).event.rawText, '{"answer":0,"confidence":0}');
  assert.equal(report.developmentCompleted, true);
});
