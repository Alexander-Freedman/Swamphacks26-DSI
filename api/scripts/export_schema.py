"""Write the JSON Schemas web/ builds against: the Round and the engine v4 model spec."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.schema import ModelSpec, Round  # noqa: E402

out_dir = Path(__file__).resolve().parents[2] / "shared" / "schema"
for name, model in (("round", Round), ("model-spec", ModelSpec)):
    out = out_dir / f"{name}.schema.json"
    out.write_text(json.dumps(model.model_json_schema(), indent=2) + "\n")
    print(f"wrote {out}")
