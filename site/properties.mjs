export const MAX_SMILES_LENGTH = 2000;

// Keys refer to the JSON returned by RDKit.js `get_descriptors()`.
export const PROPERTIES = [
  { key: 'CrippenClogP', label: 'logP', note: 'Wildman–Crippen', digits: 2 },
  { key: 'amw', label: 'Molecular weight', note: 'g/mol', digits: 2 },
  { key: 'tpsa', label: 'TPSA', note: 'Å²', digits: 2 },
  { key: 'NumHBD', label: 'H-bond donors', note: 'HBD', digits: 0 },
  { key: 'NumHBA', label: 'H-bond acceptors', note: 'HBA', digits: 0 },
  { key: 'NumRotatableBonds', label: 'Rotatable bonds', digits: 0 },
  { key: 'FractionCSP3', label: 'Fsp3', digits: 2 },
];

export function formatValue(property, value) {
  if (!Number.isFinite(value)) return '—';
  const fixed = value.toFixed(property.digits);
  // Avoid showing "-0.00" for values that round to zero.
  return Number(fixed) === 0 ? (0).toFixed(property.digits) : fixed;
}

export function checkInput(input) {
  const trimmed = input.trim();
  if (!trimmed) return { status: 'empty' };
  if (trimmed.length > MAX_SMILES_LENGTH) return { status: 'too-long' };
  if (/[\s|{}>]/u.test(trimmed)) return { status: 'invalid' };
  return { status: 'ok', smiles: trimmed };
}

export function calculate(engine, input, { width = 680, height = 420 } = {}) {
  const checked = checkInput(input);
  if (checked.status !== 'ok') return checked;

  const molecule = engine.get_mol(checked.smiles);
  if (!molecule) return { status: 'invalid' };
  try {
    if (!molecule.is_valid()) return { status: 'invalid' };
    const descriptors = JSON.parse(molecule.get_descriptors());
    const values = Object.fromEntries(PROPERTIES.map(({ key }) => [key, descriptors[key]]));
    return {
      status: 'ok',
      canonical: molecule.get_smiles(),
      values,
      svg: molecule.get_svg(width, height),
    };
  } finally {
    molecule.delete();
  }
}
