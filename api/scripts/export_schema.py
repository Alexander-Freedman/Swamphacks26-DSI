"""Write the round JSON Schema for web/ and for Gemini structured output."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.schema import Round  # noqa: E402

out = Path(__file__).resolve().parents[2] / "shared" / "schema" / "round.schema.json"
out.write_text(json.dumps(Round.model_json_schema(), indent=2) + "\n")
print(f"wrote {out}")
