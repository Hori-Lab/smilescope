# SMILEScope

Calculate molecular properties from SMILES at <https://hori-lab.github.io/smilescope/>.

Enter a SMILES and select **Calculate**. SMILEScope draws the two-dimensional structure and reports logP, molecular weight, TPSA, H-bond donors, H-bond acceptors, rotatable bonds and Fsp3.

## Run locally

Use Conda or Mamba to create a dedicated environment.

```sh
conda env create -f environment.yml
conda activate smilescope
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

Open `http://127.0.0.1:8000/` in a browser. The build assembles the website and RDKit.js in `dist/`. The preview serves only `dist/`.

## Calculated properties

RDKit.js computes every value in the browser. The SMILES is not sent to a server.

| Property | RDKit descriptor | Python equivalent |
|---|---|---|
| logP | Wildman–Crippen logP | `Descriptors.MolLogP` |
| Molecular weight | Average molecular weight (g/mol) | `Descriptors.MolWt` |
| TPSA | Topological polar surface area (Å²), N and O only | `Descriptors.TPSA` |
| HBD | `CalcNumHBD` | `Descriptors.NumHDonors` |
| HBA | `CalcNumHBA` | `Descriptors.NumHAcceptors` |
| Rotatable bonds | Strict definition | `Descriptors.NumRotatableBonds` |
| Fsp3 | Fraction of sp3 carbons | `Descriptors.FractionCSP3` |

HBD and HBA use the RDKit definitions, not the Lipinski N/O counts. A SMILES with several components, such as a salt, is calculated as one entry including every component. CXSMILES extensions and reaction SMILES are not accepted.

## Deployment

GitHub Actions builds, tests and deploys the site to GitHub Pages on every push to `main`. RDKit.js (`@rdkit/rdkit`) and Python RDKit are pinned to the same release, and the tests check that both give the same values.
