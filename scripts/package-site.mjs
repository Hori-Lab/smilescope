import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const rdkit = dirname(require.resolve('@rdkit/rdkit'));
const output = join(root, 'dist');
const vendor = join(output, 'vendor');

await rm(output, { recursive: true, force: true });
await cp(join(root, 'site'), output, { recursive: true });
await mkdir(vendor);
await Promise.all([
  copyFile(join(rdkit, 'RDKit_minimal.js'), join(vendor, 'RDKit_minimal.js')),
  copyFile(join(rdkit, 'RDKit_minimal.wasm'), join(vendor, 'RDKit_minimal.wasm')),
  // The npm package omits RDKit's BSD licence, so ship the copy kept in this repository.
  copyFile(join(root, 'licenses', 'RDKit-LICENSE.txt'), join(vendor, 'LICENSE')),
]);
