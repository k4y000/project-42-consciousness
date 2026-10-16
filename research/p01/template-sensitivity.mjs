import { analyzeJournal, bootstrapIndependentItems } from './analyze.mjs';

const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const baselineBrier = (pairs, q) => mean(pairs.map(pair => pair.evaluation.accuracy * (1 - q) ** 2 + (1 - pair.evaluation.accuracy) * q ** 2));

function templatePairs(dataset, primary) {
  const grouped = new Map();
  for (const item of dataset.items) {
    if (typeof item.template !== 'string' || !item.template.trim() || item.template !== item.template.trim()) {
      throw new Error('Each item needs an unambiguous template identifier.');
    }
    if (!grouped.has(item.template)) grouped.set(item.template, []);
    grouped.get(item.template).push(item);
  }
  if (grouped.size !== 12) throw new Error('Exactly 12 template pairs required.');
  return [...grouped].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([template, items]) => {
    const dev = items.filter(item => item.split === 'development');
    const eva = items.filter(item => item.split === 'evaluation');
    if (items.length !== 2 || dev.length !== 1 || eva.length !== 1 || dev[0].family !== eva[0].family) {
      throw new Error('Each template pair requires one item per phase in the same family.');
    }
    const development = primary.development.items.find(item => item.itemId === dev[0].id);
    const evaluation = primary.evaluation.items.find(item => item.itemId === eva[0].id);
    const missing = [!development.validTrials && 'development', !evaluation.validTrials && 'evaluation'].filter(Boolean);
    return { template, family: dev[0].family, development, evaluation,
      eligible: missing.length === 0, exclusionReason: missing.length ? `no_valid_${missing.join('_or_')}_responses` : null };
  });
}

function pairedBootstrap(pairs, settings) {
  const base = { method: 'conditional_template_pair_percentile_linear', draws: 0, seed: settings.seed, lower: null, upper: null };
  if (pairs.length < 2) return { ...base, reason: pairs.length ? 'insufficient_eligible_pairs' : 'no_eligible_pairs' };
  let state = settings.seed;
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  const differences = Array.from({ length: settings.draws }, () => {
    const sample = Array.from({ length: pairs.length }, () => pairs[Math.floor(random() * pairs.length)]);
    const q = mean(sample.map(pair => pair.development.accuracy));
    return mean(sample.map(pair => pair.evaluation.brier)) - baselineBrier(sample, q);
  }).sort((a, b) => a - b);
  const quantile = p => {
    const index = (differences.length - 1) * p;
    const low = Math.floor(index), high = Math.ceil(index);
    return differences[low] + (differences[high] - differences[low]) * (index - low);
  };
  return { ...base, draws: settings.draws, reason: null, lower: quantile(0.025), upper: quantile(0.975) };
}

export function analyzeTemplateSensitivity(dataset, journal) {
  // Full journal validation, including empirical baseline freeze, is retained.
  const primaryAnalysis = analyzeJournal(dataset, journal);
  const pairs = templatePairs(dataset, primaryAnalysis);
  const eligible = pairs.filter(pair => pair.eligible);
  const q = mean(eligible.map(pair => pair.development.accuracy));
  const model = mean(eligible.map(pair => pair.evaluation.brier));
  const baseline = eligible.length ? baselineBrier(eligible, q) : null;
  const families = Object.fromEntries([...new Set(pairs.map(pair => pair.family))].sort().map(family => {
    const planned = pairs.filter(pair => pair.family === family);
    return [family, { plannedPairs: planned.length, eligiblePairs: planned.filter(pair => pair.eligible).length }];
  }));
  return {
    schemaVersion: 1, analysisId: 'p01-template-pair-sensitivity-v1',
    status: primaryAnalysis.status, dataKind: journal.dataKind, primaryAnalysis,
    subset: {
      eligibility: 'at_least_one_valid_response_per_item_in_both_phases',
      weighting: 'equal_pairs_after_equal_valid_repetitions_within_each_item',
      plannedPairs: pairs.length, eligiblePairs: eligible.length, excludedPairs: pairs.length - eligible.length,
      validTrials: {
        development: eligible.reduce((sum, pair) => sum + pair.development.validTrials, 0),
        evaluation: eligible.reduce((sum, pair) => sum + pair.evaluation.validTrials, 0)
      },
      families, pairs
    },
    restrictedComparison: {
      baseline: { probability: q, source: 'refitted_on_eligible_development_items_not_the_frozen_baseline' },
      modelBrier: model, baselineBrier: baseline, difference: baseline === null ? null : model - baseline,
      independentInterval: bootstrapIndependentItems(eligible.map(pair => pair.development), eligible.map(pair => pair.evaluation), journal.analysis),
      pairedInterval: pairedBootstrap(eligible, journal.analysis)
    },
    warnings: [
      'Separate descriptive sensitivity; primaryAnalysis remains the original analysis on its original population.',
      'Eligibility uses validity in both phases. The refitted subset baseline is not the baseline frozen before evaluation.',
      'Both sensitivity intervals use the same eligible pairs and weights; comparisons with the primary interval may also reflect selection.',
      'Exclusions and unequal coverage can bias results; resampling conditions on observed eligibility and does not correct that bias.',
      'Pair resampling preserves observed cross-phase association but does not establish independence across templates or families.',
      'Percentile bounds have no guaranteed frequentist coverage or population generalization.',
      'Brier differences do not isolate calibration, discrimination or introspection; they do not demonstrate consciousness.'
    ]
  };
}
