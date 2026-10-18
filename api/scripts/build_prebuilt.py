"""Compile the hand-checked v4 specs in data/specs/ into reviewed rounds in data/rounds/extra/.

Each data/specs/<slug>.json is {"aliases": [...], "spec": ModelSpec}. The spec is the
source of truth: fix a spec by hand, then rerun this (no model call). The round gets
reviewed = true, so the API's reviewed-extra short-circuit and the static topic box
serve it as is. tests/test_prebuilt.py checks the stored rounds match their specs.

    uv run python scripts/build_prebuilt.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.rounds import EXTRA_DIR, ROUNDS_DIR  # noqa: E402
from app.schema import ModelSpec  # noqa: E402
from app.spec import compile_spec  # noqa: E402

SPECS_DIR = ROUNDS_DIR.parent / "specs"


def build(path: Path) -> dict:
    data = json.loads(path.read_text())
    spec = ModelSpec.model_validate(data["spec"])
    compiled = compile_spec(spec)
    if compiled.report.dropped:
        raise SystemExit(f"{path.name}: dropped {compiled.report.dropped}")
    r = compiled.round.model_copy(update={"reviewed": True})
    return {**r.model_dump(mode="json"), "aliases": data["aliases"]}


if __name__ == "__main__":
    for path in sorted(SPECS_DIR.glob("*.json")):
        out = build(path)
        assert out["slug"] == path.stem, path
        (EXTRA_DIR / f"{path.stem}.json").write_text(json.dumps(out, indent=2) + "\n")
        print(f"{path.stem}: {out['items'][0]['truth_value']:.6g}")
