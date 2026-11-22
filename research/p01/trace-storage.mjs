import { open } from 'node:fs/promises';
import { runSyntheticDevelopment, SequenceRecordingError } from './development-sequence.mjs';

// Only these deliberately constructed fields are suitable for publication.
// Never attach an underlying filesystem exception, path, code or cause.
export class TraceStorageError extends Error {
  constructor(report, storage) {
    super('Local trace storage failed.');
    this.name = 'TraceStorageError';
    this.report = structuredClone(report);
    this.storage = { ...storage };
  }
}

/**
 * Synthetic, local-only recorder. Parent directory must exist and be trusted.
 * openFile is a trusted test seam, not a sandbox or a provider adapter.
 * A failed/partial destination is preserved and is never reused automatically.
 */
export async function runRecordedSyntheticDevelopment(dataset, manifest, localDouble, destination, options = {}) {
  if (typeof destination !== 'string' || !destination.trim() || destination.includes('\0')) {
    throw new Error('An explicit local destination path is required.');
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(options))
    || Reflect.ownKeys(options).some(key => key !== 'openFile')) {
    throw new Error('Expected local storage options.');
  }
  const openFile = options.openFile ?? open;
  if (typeof openFile !== 'function') throw new Error('Expected a local file opener.');
  let handle = null;
  let report;
  let stage = 'open';
  let recordSequence = null;
  let recordsSynced = 0;
  let failure = null;
  let closeFailed = false;
  const record = async (type, data) => {
    // Core validation and plan construction finish before this first invocation.
    if (handle === null) {
      stage = 'open';
      handle = await openFile(destination, 'wx', 0o600);
    }
    stage = type;
    recordSequence = recordsSynced + 1;
    const bytes = Buffer.from(JSON.stringify({ sequence: recordSequence, type, data }) + '\n', 'utf8');
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesWritten } = await handle.write(bytes, offset, bytes.length - offset, null);
      if (!Number.isInteger(bytesWritten) || bytesWritten <= 0 || bytesWritten > bytes.length - offset) {
        throw new Error('Incomplete local trace write.');
      }
      offset += bytesWritten;
    }
    await handle.sync();
    recordsSynced += 1;
  };
  try {
    report = await runSyntheticDevelopment(dataset, manifest, localDouble, record);
  } catch (error) {
    // Validation errors happen before opening a file; keep their existing API.
    if (!(error instanceof SequenceRecordingError)) throw error;
    report = error.report;
    failure = { stage, recordSequence };
  } finally {
    if (handle !== null) {
      try {
        await handle.close();
      } catch {
        closeFailed = true;
        if (failure === null) failure = { stage: 'close', recordSequence: null };
      }
    }
  }
  if (failure !== null) {
    throw new TraceStorageError(report, { state: 'failed', ...failure, recordsSynced, closeFailed });
  }
  return { report, storage: { state: 'complete', recordsSynced, closed: true } };
}
