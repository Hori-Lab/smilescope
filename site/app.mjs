import { PROPERTIES, calculate, formatValue, MAX_SMILES_LENGTH } from './properties.mjs';

const byId = (id) => document.getElementById(id);
const form = byId('smiles-form');
const input = byId('smiles-input');
const calculateButton = byId('calculate');
const examples = [...document.querySelectorAll('.example')];
const engineStatus = byId('engine-status');
const retryEngine = byId('retry-engine');
const feedback = byId('feedback-card');
const resultMessage = byId('result-message');
const results = byId('results');
const structure = byId('structure-image');
const rows = byId('property-rows');
const canonical = byId('canonical-smiles');
const rdkitUrl = new URL('./vendor/RDKit_minimal.js', import.meta.url);
const messages = {
  empty: 'Enter a SMILES to calculate its properties.',
  'too-long': `The SMILES is too long. Enter up to ${MAX_SMILES_LENGTH} characters.`,
  invalid: 'Invalid SMILES. Check the syntax.',
  error: 'The properties could not be calculated. Try again.',
};
let engine;
let enginePromise;
let structureUrl;

async function initialiseEngine() {
  if (!window.initRDKitModule) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = rdkitUrl.href;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(new Error('RDKit script could not load.'));
      };
      document.head.append(script);
    });
  }
  return window.initRDKitModule({ locateFile: (name) => new URL(name, rdkitUrl).href });
}

function setReady(ready) {
  calculateButton.disabled = !ready;
  for (const button of examples) button.disabled = !ready;
}

function loadEngine() {
  if (engine || enginePromise) return;
  retryEngine.hidden = true;
  engineStatus.textContent = 'Loading RDKit…';
  enginePromise = initialiseEngine()
    .then((module) => {
      engine = module;
      engineStatus.textContent = '';
      setReady(true);
    })
    .catch((error) => {
      console.error(error);
      engineStatus.textContent = 'RDKit could not be loaded.';
      retryEngine.hidden = false;
    })
    .finally(() => { enginePromise = undefined; });
}

function buildRows() {
  rows.replaceChildren(...PROPERTIES.map((property) => {
    const row = document.createElement('tr');
    const name = document.createElement('th');
    name.scope = 'row';
    name.textContent = property.label;
    if (property.note) {
      const note = document.createElement('span');
      note.className = 'property-note';
      note.textContent = property.note;
      name.append(note);
    }
    const value = document.createElement('td');
    value.className = 'property-value';
    value.dataset.key = property.key;
    row.append(name, value);
    return row;
  }));
}

function showError(status) {
  results.hidden = true;
  feedback.hidden = false;
  resultMessage.textContent = messages[status];
  input.setAttribute('aria-invalid', 'true');
}

function clearError() {
  feedback.hidden = true;
  resultMessage.textContent = '';
  input.removeAttribute('aria-invalid');
}

function showStructure(svg, smiles) {
  if (structureUrl) URL.revokeObjectURL(structureUrl);
  structureUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  structure.src = structureUrl;
  structure.alt = `Two-dimensional chemical structure of ${smiles}`;
}

function run() {
  if (!engine) return;
  let result;
  try {
    result = calculate(engine, input.value);
  } catch (error) {
    console.error(error);
    showError('error');
    return;
  }
  if (result.status !== 'ok') {
    showError(result.status);
    input.focus();
    return;
  }
  clearError();
  for (const property of PROPERTIES) {
    rows.querySelector(`[data-key="${property.key}"]`).textContent = formatValue(property, result.values[property.key]);
  }
  canonical.textContent = result.canonical;
  showStructure(result.svg, result.canonical);
  results.hidden = false;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  run();
});
for (const button of examples) {
  button.addEventListener('click', () => {
    input.value = button.dataset.smiles;
    run();
  });
}
input.addEventListener('input', () => {
  if (!feedback.hidden) clearError();
});
retryEngine.addEventListener('click', loadEngine);

buildRows();
loadEngine();
