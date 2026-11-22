import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, open, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { dataset, manifest } from '../fixtures/p01-synthetic.mjs';
import { runSyntheticDevelopment } from '../research/p01/development-sequence.mjs';
import { runRecordedSyntheticDevelopment, TraceStorageError } from '../research/p01/trace-storage.mjs';

const draft = () => ({ ...structuredClone(manifest), dataKind: 'synthetic',
  provider: 'local-double', modelVersion: 'fictional-v1', runId: 'storage-test-only',
  generation: { temperature: 0, tools: false } });
const delivered = (payload, rawText = '{"answer":0,"confidence":0}') => ({
  kind: 'delivered', rawText, modelVersion: payload.modelVersion,
  generation: structuredClone(payload.generation), reason: null
});
// Frozen oracle for the published 42001 order, independent of either runner.
const expectedOrder = ('dev-01-r3 dev-11-r1 dev-10-r3 dev-08-r3 dev-06-r2 dev-09-r3 ' +
  'dev-07-r2 dev-01-r1 dev-08-r2 dev-06-r3 dev-12-r1 dev-04-r2 dev-10-r1 dev-04-r3 ' +
  'dev-06-r1 dev-09-r1 dev-02-r3 dev-02-r1 dev-05-r3 dev-03-r1 dev-11-r2 dev-08-r1 ' +
  'dev-02-r2 dev-09-r2 dev-05-r2 dev-12-r3 dev-12-r2 dev-01-r2 dev-10-r2 dev-04-r1 ' +
  'dev-03-r2 dev-07-r3 dev-05-r1 dev-03-r3 dev-11-r3 dev-07-r1').split(' ');
const PRIVATE = 'PRIVATE_STORAGE_ERROR_MUST_NOT_ESCAPE';
const privateError = () => Object.assign(new Error(PRIVATE), { path: PRIVATE, code: PRIVATE });
const deferred = () => {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
};
async function tempDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), 'p01-trace-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
function parseComplete(text) {
  assert.ok(text.endsWith('\n'), 'the last record has a newline');
  const records = text.slice(0, -1).split('\n').map(line => JSON.parse(line));
  records.forEach((record, index) => {
    assert.deepEqual(Object.keys(record).sort(), ['data', 'sequence', 'type']);
    assert.equal(record.sequence, index + 1);
  });
  return records;
}
async function rejection(promise) {
  let error;
  await assert.rejects(promise, value => { error = value; return true; });
  return error;
}
function checkError(error, expected) {
  assert.ok(error instanceof TraceStorageError);
  assert.deepEqual(error.storage, { state: 'failed', ...expected });
  assert.equal(JSON.stringify(error).includes(PRIVATE), false);
  assert.equal(error.message.includes(PRIVATE), false);
  assert.equal(Object.hasOwn(error, 'cause'), false);
}
function checkReport(report, calls, stopReason, completed = false) {
  assert.equal(report.callsToDouble, calls);
  assert.equal(report.trace.length, calls);
  assert.deepEqual(report.trace.map(row => row.payload.trialId), expectedOrder.slice(0, calls));
  assert.deepEqual(report.notCalledDevelopmentTrialIds, expectedOrder.slice(calls));
  assert.equal(report.notCalledEvaluationTrialIds.length, 36);
  assert.ok(report.notCalledEvaluationTrialIds.every(id => id.startsWith('eva-')));
  assert.equal(report.evaluationCalls, 0);
  assert.equal(report.baselineFreeze, null);
  assert.equal(report.stopReason, stopReason);
  assert.equal(report.developmentCompleted, completed);
}
function checkRecorded(records, report) {
  assert.equal(records.length, 2 * report.callsToDouble + 2);
  assert.equal(records[0].type, 'header');
  assert.deepEqual(records[0].data, {
    format: 'P01_LOCAL_TRACE_V1', schemaVersion: 1, dataKind: 'synthetic',
    runId: report.runId, datasetSha256: report.datasetSha256,
    developmentPlanSha256: report.developmentPlanSha256,
    plannedDevelopmentTrialIds: expectedOrder,
    notCalledEvaluationTrialIds: report.notCalledEvaluationTrialIds
  });
  for (let index = 0; index < report.callsToDouble; index++) {
    const intent = records[2 * index + 1], result = records[2 * index + 2];
    assert.equal(intent.type, 'intent');
    assert.deepEqual(intent.data, { ordinal: index + 1, payload: report.trace[index].payload });
    assert.equal(result.type, 'result');
    assert.deepEqual(result.data, report.trace[index]);
  }
  assert.equal(records.at(-1).type, 'terminal');
  assert.deepEqual(records.at(-1).data, report);
  assert.equal(Object.hasOwn(records.at(-1).data, 'storage'), false);
}

test('recorded run writes 74 complete JSONL records in independent development order', async t => {
  const directory = await tempDirectory(t), destination = join(directory, 'complete.jsonl');
  const calls = [], input = draft(), before = structuredClone(input);
  const rawText = 'Réponse fictive 🙂\n{"answer":0,"confidence":0}\n';
  const { report, storage } = await runRecordedSyntheticDevelopment(dataset, input, payload => {
    calls.push(payload.trialId);
    return delivered(payload, rawText);
  }, destination);
  assert.deepEqual(calls, expectedOrder);
  checkReport(report, 36, 'development_complete', true);
  assert.deepEqual(storage, { state: 'complete', recordsSynced: 74, closed: true });
  const records = parseComplete(await readFile(destination, 'utf8'));
  checkRecorded(records, report);
  assert.ok(report.trace.every(row => row.event.rawText === rawText));
  const memoryReport = await runSyntheticDevelopment(dataset, draft(), payload => delivered(payload, rawText));
  assert.deepEqual(report, memoryReport);
  assert.deepEqual(input, before);
  assert.equal((await stat(destination)).mode & 0o777, 0o600);
});

test('existing files are unchanged; incompatible inputs cause no open and no double call', async t => {
  const directory = await tempDirectory(t), destination = join(directory, 'existing.jsonl');
  const original = Buffer.from('Unfinished synthetic file\n{"sequence":');
  await writeFile(destination, original);
  let calls = 0, opens = 0;
  const double = payload => { calls++; return delivered(payload); };
  const collision = await rejection(runRecordedSyntheticDevelopment(dataset, draft(), double, destination));
  checkError(collision, { stage: 'open', recordSequence: null, recordsSynced: 0, closeFailed: false });
  checkReport(collision.report, 0, 'recording_error');
  assert.deepEqual(await readFile(destination), original);
  const openFile = async () => { opens++; throw privateError(); };
  const changes = [
    input => { input.dataKind = 'empirical'; },
    input => { input.provider = 'provider'; },
    input => { input.approvedBudgetEUR = 1; },
    input => { input.paidCallsAuthorized = true; },
    input => { input.generation.tools = true; },
    input => { input.modelVersion = ''; },
    input => { input.orderSeed = -1; },
    input => { input.baselineFreeze = {}; },
    input => { input.collectionControls.retryFailedTrials = true; }
  ];
  for (const change of changes) {
    const input = draft(); change(input);
    await assert.rejects(runRecordedSyntheticDevelopment(dataset, input, double, destination, { openFile }));
  }
  await assert.rejects(runRecordedSyntheticDevelopment({ ...dataset, items: [] }, draft(), double, destination, { openFile }));
  await assert.rejects(runRecordedSyntheticDevelopment(dataset, draft(), null, destination, { openFile }));
  for (const invalid of ['', null, {}]) {
    await assert.rejects(runRecordedSyntheticDevelopment(dataset, draft(), double, invalid, { openFile }));
  }
  assert.equal(opens, 0);
  assert.equal(calls, 0);
});

test('all double stop paths still persist the last result and terminal, with no private exception', async t => {
  const directory = await tempDirectory(t);
  const cases = [
    { k: 1, outcome: 'double_exception', reply: () => { throw privateError(); } },
    { k: 18, outcome: 'timeout', reply: () => ({
      kind: 'timeout', rawText: 'fragment reçu\né🙂', modelVersion: null,
      generation: null, reason: 'Synthetic interruption.'
    }) },
    { k: 36, outcome: 'non_json_event', reply: () => undefined },
    { k: 1, outcome: 'invalid_event', reply: () => null },
    { k: 18, outcome: 'metadata_drift', reply: payload => ({ ...delivered(payload), modelVersion: 'fictional-v2' }) }
  ];
  for (const [index, scenario] of cases.entries()) {
    let calls = 0, closes = 0;
    const destination = join(directory, 'stop-' + index + '.jsonl');
    const openFile = async (...args) => {
      const handle = await open(...args);
      return {
        write: (...writeArgs) => handle.write(...writeArgs),
        sync: () => handle.sync(),
        close: async () => { closes++; await handle.close(); }
      };
    };
    const { report, storage } = await runRecordedSyntheticDevelopment(dataset, draft(), payload =>
      ++calls === scenario.k ? scenario.reply(payload) : delivered(payload), destination, { openFile });
    checkReport(report, scenario.k, scenario.outcome);
    assert.equal(calls, scenario.k);
    assert.equal(closes, 1);
    assert.deepEqual(storage, { state: 'complete', recordsSynced: 2 * scenario.k + 2, closed: true });
    const text = await readFile(destination, 'utf8');
    assert.equal(text.includes(PRIVATE), false);
    checkRecorded(parseComplete(text), report);
    if (scenario.outcome === 'timeout') assert.equal(report.trace.at(-1).event.rawText, 'fragment reçu\né🙂');
  }
});

test('each write and sync is a barrier, and success waits for terminal sync and close', { timeout: 10000 }, async t => {
  const writeEntered = Array.from({ length: 74 }, deferred), allowWrite = Array.from({ length: 74 }, deferred);
  const syncEntered = Array.from({ length: 74 }, deferred), allowSync = Array.from({ length: 74 }, deferred);
  const closeEntered = deferred(), allowClose = deferred();
  let writes = 0, syncs = 0, closes = 0, calls = 0, settled = false;
  const openFile = async (path, flags, mode) => {
    assert.equal(path, 'synthetic-only.jsonl');
    assert.equal(flags, 'wx');
    assert.equal(mode, 0o600);
    return {
      async write(buffer, offset, length, position) {
        assert.ok(Buffer.isBuffer(buffer));
        assert.equal(position, null);
        const index = writes++;
        assert.equal(syncs, index);
        writeEntered[index].resolve();
        await allowWrite[index].promise;
        return { bytesWritten: length };
      },
      async sync() {
        const index = syncs++;
        assert.equal(writes, index + 1);
        syncEntered[index].resolve();
        await allowSync[index].promise;
      },
      async close() {
        closes++;
        closeEntered.resolve();
        await allowClose.promise;
      }
    };
  };
  const pending = runRecordedSyntheticDevelopment(dataset, draft(), payload => {
    calls++;
    return delivered(payload);
  }, 'synthetic-only.jsonl', { openFile });
  pending.then(() => { settled = true; }, () => { settled = true; });
  t.after(async () => {
    allowWrite.forEach(gate => gate.resolve());
    allowSync.forEach(gate => gate.resolve());
    allowClose.resolve();
    await pending.catch(() => {});
  });
  for (let sequence = 1; sequence <= 74; sequence++) {
    const expectedCalls = sequence === 74 ? 36 : Math.floor((sequence - 1) / 2);
    await writeEntered[sequence - 1].promise;
    await setImmediate();
    assert.equal(calls, expectedCalls, 'calls while write is pending at record ' + sequence);
    assert.equal(syncs, sequence - 1);
    assert.equal(settled, false);
    allowWrite[sequence - 1].resolve();
    await syncEntered[sequence - 1].promise;
    await setImmediate();
    assert.equal(calls, expectedCalls, 'calls while sync is pending at record ' + sequence);
    assert.equal(writes, sequence);
    assert.equal(settled, false);
    allowSync[sequence - 1].resolve();
  }
  await closeEntered.promise;
  await setImmediate();
  assert.equal(calls, 36);
  assert.equal(closes, 1);
  assert.equal(settled, false);
  allowClose.resolve();
  const result = await pending;
  assert.deepEqual(result.storage, { state: 'complete', recordsSynced: 74, closed: true });
});

test('write and sync failures stop at header, first/middle/last intent/result, and terminal', async () => {
  const targets = [{ stage: 'header', sequence: 1, calls: 0 },
    ...[1, 18, 36].flatMap(k => [
      { stage: 'intent', sequence: 2 * k, calls: k - 1 },
      { stage: 'result', sequence: 2 * k + 1, calls: k }
    ]), { stage: 'terminal', sequence: 74, calls: 36 }];
  for (const failure of ['write', 'sync']) {
    for (const target of targets) {
      const operations = [], fragments = [];
      let writes = 0, syncs = 0, closes = 0, calls = 0, failed = false;
      const openFile = async () => ({
        async write(buffer, offset, length) {
          assert.equal(failed, false, 'no writes after failure');
          writes++;
          operations.push('write');
          if (failure === 'write' && writes === target.sequence) { failed = true; throw privateError(); }
          fragments.push(Buffer.from(buffer.subarray(offset, offset + length)));
          return { bytesWritten: length };
        },
        async sync() {
          assert.equal(failed, false, 'no sync after failure');
          syncs++;
          operations.push('sync');
          if (failure === 'sync' && syncs === target.sequence) { failed = true; throw privateError(); }
        },
        async close() { closes++; operations.push('close'); }
      });
      const error = await rejection(runRecordedSyntheticDevelopment(dataset, draft(), payload => {
        calls++; return delivered(payload);
      }, 'synthetic-only.jsonl', { openFile }));
      checkError(error, { stage: target.stage, recordSequence: target.sequence,
        recordsSynced: target.sequence - 1, closeFailed: false });
      const completed = target.stage === 'terminal';
      checkReport(error.report, target.calls, completed ? 'development_complete' : 'recording_error', completed);
      assert.equal(calls, target.calls);
      assert.equal(closes, 1);
      assert.equal(writes, target.sequence);
      assert.equal(syncs, target.sequence - (failure === 'write' ? 1 : 0));
      assert.equal(operations.at(-1), 'close');
      const text = Buffer.concat(fragments).toString('utf8');
      assert.equal(text.includes(PRIVATE), false);
      const records = text ? parseComplete(text) : [];
      assert.equal(records.length, target.sequence - (failure === 'write' ? 1 : 0));
      if (target.stage !== 'terminal') assert.ok(records.every(record => record.type !== 'terminal'));
      if (target.stage === 'result') {
        assert.equal(error.report.trace.at(-1).outcome, 'delivered');
        assert.equal(error.report.trace.at(-1).event.rawText, '{"answer":0,"confidence":0}');
      }
    }
  }
});

test('open and close errors retain the primary stage and sanitized diagnostics', async () => {
  let calls = 0;
  const openError = await rejection(runRecordedSyntheticDevelopment(dataset, draft(), () => { calls++; },
    'synthetic-only.jsonl', { openFile: async () => { throw privateError(); } }));
  checkError(openError, { stage: 'open', recordSequence: null, recordsSynced: 0, closeFailed: false });
  checkReport(openError.report, 0, 'recording_error');
  assert.equal(calls, 0);
  for (const primaryFailure of [null, 'write', 'sync']) {
    let writes = 0, syncs = 0, closes = 0;
    const error = await rejection(runRecordedSyntheticDevelopment(dataset, draft(), delivered,
      'synthetic-only.jsonl', { openFile: async () => ({
        async write(buffer, offset, length) {
          writes++;
          if (primaryFailure === 'write') throw privateError();
          return { bytesWritten: length };
        },
        async sync() { syncs++; if (primaryFailure === 'sync') throw privateError(); },
        async close() { closes++; throw privateError(); }
      }) }));
    checkError(error, { stage: primaryFailure ? 'header' : 'close',
      recordSequence: primaryFailure ? 1 : null, recordsSynced: primaryFailure ? 0 : 74, closeFailed: true });
    checkReport(error.report, primaryFailure ? 0 : 36,
      primaryFailure ? 'recording_error' : 'development_complete', !primaryFailure);
    assert.equal(closes, 1);
    assert.equal(writes, primaryFailure ? 1 : 74);
    assert.equal(syncs, primaryFailure === 'write' ? 0 : primaryFailure === 'sync' ? 1 : 74);
  }
});

test('short writes use byte offsets and preserve multibyte UTF-8 and embedded newlines', async t => {
  const directory = await tempDirectory(t), destination = join(directory, 'short.jsonl');
  let writes = 0, syncs = 0, closes = 0;
  const fragment = 'é🙂\nRéponse synthétique';
  const openFile = async (...args) => {
    const handle = await open(...args);
    return {
      async write(buffer, offset, length, position) {
        writes++;
        assert.ok(Buffer.isBuffer(buffer));
        assert.equal(position, null);
        return handle.write(buffer, offset, Math.min(length, 7), position);
      },
      async sync() { syncs++; await handle.sync(); },
      async close() { closes++; await handle.close(); }
    };
  };
  const { report, storage } = await runRecordedSyntheticDevelopment(dataset, draft(), () => ({
    kind: 'timeout', rawText: fragment, modelVersion: null, generation: null, reason: 'Synthetic stop.'
  }), destination, { openFile });
  checkReport(report, 1, 'timeout');
  assert.ok(writes > 4);
  assert.equal(syncs, 4);
  assert.equal(closes, 1);
  assert.deepEqual(storage, { state: 'complete', recordsSynced: 4, closed: true });
  checkRecorded(parseComplete(await readFile(destination, 'utf8')), report);
  assert.equal(report.trace[0].event.rawText, fragment);
});

test('partial intent followed by an error or zero-byte write remains unchanged and uncalled', async t => {
  const directory = await tempDirectory(t);
  for (const failure of ['error', 'zero']) {
    const destination = join(directory, failure + '.jsonl');
    let writes = 0, syncs = 0, closes = 0, calls = 0, expectedBytes;
    const openFile = async (...args) => {
      const handle = await open(...args);
      return {
        async write(buffer, offset, length, position) {
          writes++;
          if (writes === 1) {
            expectedBytes = Buffer.from(buffer.subarray(offset, offset + length));
            return handle.write(buffer, offset, length, position);
          }
          if (writes === 2) {
            expectedBytes = Buffer.concat([expectedBytes, buffer.subarray(offset, offset + 5)]);
            return handle.write(buffer, offset, 5, position);
          }
          if (failure === 'error') throw privateError();
          return { bytesWritten: 0 };
        },
        async sync() { syncs++; await handle.sync(); },
        async close() { closes++; await handle.close(); }
      };
    };
    const error = await rejection(runRecordedSyntheticDevelopment(dataset, draft(), payload => {
      calls++; return delivered(payload);
    }, destination, { openFile }));
    checkError(error, { stage: 'intent', recordSequence: 2, recordsSynced: 1, closeFailed: false });
    checkReport(error.report, 0, 'recording_error');
    assert.equal(calls, 0);
    assert.equal(writes, 3);
    assert.equal(syncs, 1);
    assert.equal(closes, 1);
    assert.deepEqual(await readFile(destination), expectedBytes);
    assert.equal(expectedBytes.toString('utf8').endsWith('\n'), false);
  }
});

function nextChildMessage(child) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      child.off('message', onMessage); child.off('error', onError); child.off('exit', onExit);
    };
    const onMessage = message => { cleanup(); resolve(message); };
    const onError = error => { cleanup(); reject(error); };
    const onExit = (code, signal) => { cleanup(); reject(new Error('Child exited before barrier: ' + code + '/' + signal)); };
    child.on('message', onMessage); child.once('error', onError); child.once('exit', onExit);
  });
}

test('process interruption preserves the acknowledged prefix without repair or automatic continuation', { timeout: 15000 }, async t => {
  const directory = await tempDirectory(t);
  for (const phase of ['double_pending', 'result_synced']) {
    const destination = join(directory, phase + '.jsonl');
    const child = fork(new URL('../test-support/p01-trace-child.mjs', import.meta.url), [destination, phase], {
      execArgv: [], stdio: ['ignore', 'ignore', 'pipe', 'ipc']
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', text => { stderr += text; });
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        const closed = once(child, 'close');
        child.kill('SIGKILL');
        await closed;
      }
    });
    const message = await nextChildMessage(child);
    assert.deepEqual(message, { phase, calls: 1 }, stderr);
    const closed = once(child, 'close');
    assert.equal(child.kill('SIGKILL'), true);
    const [code, signal] = await closed;
    assert.equal(code, null);
    assert.equal(signal, 'SIGKILL');
    const preserved = await readFile(destination);
    const records = parseComplete(preserved.toString('utf8'));
    assert.deepEqual(records.map(record => record.type), phase === 'double_pending'
      ? ['header', 'intent'] : ['header', 'intent', 'result']);
    assert.deepEqual(records[0].data.plannedDevelopmentTrialIds, expectedOrder);
    assert.equal(records[1].data.payload.trialId, expectedOrder[0]);
    if (phase === 'result_synced') {
      assert.equal(records[2].data.outcome, 'delivered');
      assert.equal(records[2].data.ordinal, 1);
    }
    // A deliberate second invocation must refuse this path and leave every byte intact.
    let resumedCalls = 0;
    const error = await rejection(runRecordedSyntheticDevelopment(dataset, draft(), payload => {
      resumedCalls++; return delivered(payload);
    }, destination));
    assert.equal(error.storage.stage, 'open');
    assert.equal(resumedCalls, 0);
    assert.deepEqual(await readFile(destination), preserved);
  }
});
