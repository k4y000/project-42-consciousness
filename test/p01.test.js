import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepare, validateDataset } from '../research/p01/prepare.mjs';
const dataset = JSON.parse(await readFile(new URL('../research/p01/items.json', import.meta.url)));
const manifest = JSON.parse(await readFile(new URL('../research/p01/manifest.template.json', import.meta.url)));

test('qualification schedule accounts for every planned trial without fabricating responses', () => {
  const plan = prepare(dataset, manifest);
  const trials = Object.values(plan.phases).flat();
  assert.equal(trials.length, 72);
  assert.equal(new Set(trials.map(t => t.trialId)).size, 72);
  for (const item of dataset.items) {
    const rows = trials.filter(t => t.itemId === item.id);
    assert.equal(rows.length, 3);
    for (const row of rows) {
      assert.equal(row.split, item.split);
      assert.equal(row.request.user, item.question);
      assert.equal(row.response, null);
      assert.equal(row.status, 'pending');
      assert.ok(!('referenceAnswer' in row));
      assert.deepEqual(Object.keys(row.request).sort(), ['system', 'user']);
    }
  }
  assert.deepEqual(plan, prepare(dataset, manifest));
  assert.notDeepEqual(plan.phases.development.map(t => t.trialId), prepare(dataset, { ...manifest, orderSeed: 42002 }).phases.development.map(t => t.trialId));
});

test('rejects corrupt stimuli and unsupported manifest instead of silently changing the plan', () => {
  const duplicate = structuredClone(dataset);
  duplicate.items[1].id = duplicate.items[0].id;
  assert.throws(() => validateDataset(duplicate), /duplicate/);
  const wrongSplit = structuredClone(dataset);
  wrongSplit.items[0].split = 'evaluation';
  assert.throws(() => validateDataset(wrongSplit), /four items/);
  assert.throws(() => prepare(dataset, { ...manifest, repetitions: 4 }), /three repetitions/);
  assert.throws(() => prepare(dataset, { ...manifest, status: 'COLLECTED' }), /drafts only/);
});

test('gold answers independently checked with integer arithmetic and exhaustive enumeration', () => {
  const dev = [391,330,218,16,42,36,6,14,35,28,24,10];
  const evalAnswers = [513,385,296,15,48,60,4,13,56,36,60,15];
  const gcd = (a,b) => b ? gcd(b,a % b) : a;
  const primes = (a,b) => Array.from({length:b-a+1},(_,i)=>i+a).filter(n=>n>1 && !Array.from({length:Math.max(0,Math.floor(Math.sqrt(n))-1)},(_,i)=>i+2).some(d=>n%d===0)).length;
  const combinations = (n,k) => Array.from({length:2**n},(_,i)=>i.toString(2)).filter(bits=>[...bits].filter(b=>b==='1').length===k).length;
  assert.deepEqual(dev,[17*23,(84-29)*6,7**3-5**3,(18+27+35)/5,gcd(84,126),12*18/gcd(12,18),primes(10,30),Math.floor(100/7),combinations(7,3),combinations(8,2),3*4*2,combinations(5,2)]);
  assert.deepEqual(evalAnswers,[19*27,(93-38)*7,8**3-6**3,(22+31+37)/6,gcd(96,144),15*20/gcd(15,20),primes(20,40),Math.floor(120/9),combinations(8,3),combinations(9,2),4*5*3,combinations(6,2)]);
  for(const [split,answers] of [['development',dev],['evaluation',evalAnswers]]) {
    assert.deepEqual(dataset.items.filter(item=>item.split===split).map(item=>item.referenceAnswer),answers);
  }
});
