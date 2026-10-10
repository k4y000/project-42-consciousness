import { createHash } from 'node:crypto';

export function validateDataset(dataset) {
  if (dataset?.schemaVersion !== 1 || dataset.datasetId !== 'p01-qualification-v1' || !Array.isArray(dataset.items) || dataset.items.length !== 24) {
    throw new Error('Expected the 24-item P01 qualification dataset.');
  }
  const ids = new Set();
  const counts = new Map();
  for (const item of dataset.items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) throw new Error('Missing or duplicate item ID.');
    ids.add(item.id);
    if (!['development', 'evaluation'].includes(item.split) || !['arithmetic', 'number_theory', 'counting'].includes(item.family)) throw new Error('Unknown split or family.');
    if (typeof item.question !== 'string' || !item.question.trim() || !Number.isSafeInteger(item.referenceAnswer) || typeof item.template !== 'string' || !item.template) throw new Error('Invalid question, reference answer or template.');
    const key = `${item.split}:${item.family}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (const split of ['development', 'evaluation']) {
    for (const family of ['arithmetic', 'number_theory', 'counting']) {
      if (counts.get(`${split}:${family}`) !== 4) throw new Error('Each split needs four items per family.');
    }
  }
  return dataset;
}

function shuffled(rows, initialSeed) {
  const copy = [...rows];
  let state = initialSeed >>> 0;
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function prepare(dataset, manifest) {
  validateDataset(dataset);
  if (manifest?.schemaVersion !== 1 || manifest.protocol !== dataset.datasetId || manifest.repetitions !== 3 || !Number.isInteger(manifest.orderSeed) || manifest.orderSeed < 0 || manifest.orderSeed > 0xffffffff) throw new Error('Invalid manifest: exactly three repetitions and an unsigned 32-bit order seed required.');
  if (manifest.status !== 'DRAFT_NOT_PREREGISTERED') throw new Error('This command prepares drafts only; it does not certify a preregistration.');
  const phases = {};
  for (const split of ['development', 'evaluation']) {
    const trials = dataset.items.filter(item => item.split === split).flatMap(item =>
      Array.from({ length: 3 }, (_, i) => ({
        trialId: `${item.id}-r${i + 1}`,
        itemId: item.id,
        repetition: i + 1,
        split,
        status: 'pending',
        request: {
          system: 'Réponds à la question sans outil externe. Donne uniquement un objet JSON avec answer, un nombre entier, et confidence, un nombre entre 0 et 1 représentant la probabilité que ta réponse soit correcte. Ne fournis pas de raisonnement détaillé.',
          user: item.question
        },
        response: null
      })));
    phases[split] = shuffled(trials, manifest.orderSeed + (split === 'evaluation' ? 1 : 0));
  }
  return {
    schemaVersion: 1,
    status: 'PLANNED_NO_MODEL_CALLS',
    datasetSha256: createHash('sha256').update(JSON.stringify(dataset)).digest('hex'),
    manifest,
    warning: 'Stimuli and planned sessions only. No empirical observations. Freeze the plan and development baseline before collecting evaluation responses.',
    phases
  };
}
