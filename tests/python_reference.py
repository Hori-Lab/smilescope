"""Write Python RDKit reference values for the molecules in data/reference.csv."""

import csv
import json
from pathlib import Path

from rdkit import Chem, rdBase
from rdkit.Chem import Descriptors

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "processed"

# Keys match the RDKit.js get_descriptors() names used by site/properties.mjs.
CALCULATORS = {
    "CrippenClogP": Descriptors.MolLogP,
    "amw": Descriptors.MolWt,
    "tpsa": Descriptors.TPSA,
    "NumHBD": Descriptors.NumHDonors,
    "NumHBA": Descriptors.NumHAcceptors,
    "NumRotatableBonds": Descriptors.NumRotatableBonds,
    "FractionCSP3": Descriptors.FractionCSP3,
}

with (ROOT / "data" / "reference.csv").open(encoding="utf-8-sig", newline="") as handle:
    rows = list(csv.DictReader(handle))

molecules = []
for row in rows:
    mol = Chem.MolFromSmiles(row["smiles"])
    assert mol is not None, row
    molecules.append({
        "name": row["name"],
        "smiles": row["smiles"],
        "canonical": Chem.MolToSmiles(mol),
        "values": {key: calculate(mol) for key, calculate in CALCULATORS.items()},
    })

OUTPUT.mkdir(parents=True, exist_ok=True)
(OUTPUT / "reference.json").write_text(
    json.dumps({"rdkit": rdBase.rdkitVersion, "molecules": molecules}, indent=2) + "\n",
    encoding="utf-8",
)
print(f"Wrote Python RDKit {rdBase.rdkitVersion} reference values for {len(molecules)} molecules.")
