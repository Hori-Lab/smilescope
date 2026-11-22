import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import initialiseRDKit from '@rdkit/rdkit';
import { MAX_SMILES_LENGTH, PROPERTIES, calculate, checkInput, formatValue } from '../site/properties.mjs';

const engine = await initialiseRDKit();
const reference = JSON.parse(await readFile(new URL('../data/processed/reference.json', import.meta.url)));
const tolerance = { CrippenClogP: 0.005, amw: 0.005, tpsa: 0.005, FractionCSP3: 1e-4 };
const byName = (name) => PROPERTIES.find(({ label }) => label === name);

test('RDKit.js and Python RDKit share a release', () => {
  const release = (version) => version.split('.').map(Number).join('.');
  assert.equal(release(engine.version()), release(reference.rdkit));
});

test('RDKit.js values match Python RDKit descriptors', () => {
  for (const molecule of reference.molecules) {
    const result = calculate(engine, molecule.smiles);
    assert.equal(result.status, 'ok', molecule.name);
    assert.equal(result.canonical, molecule.canonical, molecule.name);
    for (const { key } of PROPERTIES) {
      const expected = molecule.values[key];
      const actual = result.values[key];
      if (key in tolerance) {
        assert.ok(Math.abs(actual - expected) <= tolerance[key], `${molecule.name} ${key}: ${actual} vs ${expected}`);
      } else {
        assert.equal(actual, expected, `${molecule.name} ${key}`);
      }
    }
  }
});

test('aspirin matches published RDKit values', () => {
  const { values } = calculate(engine, 'CC(=O)Oc1ccccc1C(=O)O');
  assert.deepEqual(
    PROPERTIES.map((property) => formatValue(property, values[property.key])),
    ['1.31', '180.16', '63.60', '1', '3', '2', '0.11'],
  );
});

test('rejects empty, malformed, extended and overlong input', () => {
  for (const [input, status] of [
    ['', 'empty'],
    ['   ', 'empty'],
    ['C1CC', 'invalid'],
    ['C(C)(C)(C)(C)C', 'invalid'],
    ['CCO ethanol', 'invalid'],
    ['CCO>>CC=O', 'invalid'],
    ['C[C@H](O)CC |&1:1|', 'invalid'],
    ['C'.repeat(MAX_SMILES_LENGTH + 1), 'too-long'],
  ]) {
    assert.equal(calculate(engine, input).status, status, JSON.stringify(input.slice(0, 20)));
  }
  assert.deepEqual(checkInput('  CCO\n'), { status: 'ok', smiles: 'CCO' });
});

test('draws an SVG with stereo wedges for chiral input', () => {
  // RDKit draws a hashed wedge as many short strokes that share one bond class.
  const strokesPerBond = (svg) => {
    const counts = {};
    for (const [, bond] of svg.matchAll(/<path class='(bond-\d+) /gu)) counts[bond] = (counts[bond] ?? 0) + 1;
    return Math.max(...Object.values(counts));
  };
  const plain = calculate(engine, 'CC(N)C(=O)O');
  assert.match(plain.svg, /^<\?xml[\s\S]*<svg[\s\S]*<\/svg>\s*$/u);
  assert.ok(strokesPerBond(plain.svg) <= 4);
  const chiral = calculate(engine, 'C[C@H](N)C(=O)O');
  assert.ok(strokesPerBond(chiral.svg) > 10);
});

test('formats values with fixed precision and no negative zero', () => {
  assert.equal(formatValue(byName('logP'), -1.0293), '-1.03');
  assert.equal(formatValue(byName('logP'), -0.001), '0.00');
  assert.equal(formatValue(byName('H-bond acceptors'), 3), '3');
  assert.equal(formatValue(byName('Fsp3'), 0.88888), '0.89');
  assert.equal(formatValue(byName('TPSA'), undefined), '—');
});
