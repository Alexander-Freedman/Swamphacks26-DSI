"""Generate rounds for a list of topics and record pass/fail stats (live calls).

Topics come one per line on stdin. Set MM_CACHE_DIR to a temp dir so trial
rounds and the trial's usage counter stay out of the production cache.
"""

import json
import logging
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import gen  # noqa: E402
from app.gen import GenerationError, Usage, generate_round  # noqa: E402

if os.environ.get("MM_CACHE_DIR"):
    gen.CACHE_DIR = Path(os.environ["MM_CACHE_DIR"])

# Hard stop on generation calls for this run (MM_TRIAL_MAX_CALLS, default 30).
_max_calls = int(os.environ.get("MM_TRIAL_MAX_CALLS", "30"))
_real_call = gen._call_model
_calls = 0


def _capped_call(model: str, topic: str) -> str:
    global _calls
    if _calls >= _max_calls:
        raise GenerationError("trial call cap reached")
    _calls += 1
    raw = _real_call(model, topic)
    # Keep the raw reply so dropped items can be re-checked offline later.
    with open(gen.CACHE_DIR / "raw.jsonl", "a") as f:
        f.write(json.dumps({"topic": topic, "model": model, "raw": raw}) + "\n")
    return raw


gen._call_model = _capped_call
gen.CACHE_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(level=logging.INFO, format="%(name)s %(message)s")
topics = [line.strip() for line in sys.stdin if line.strip()]
rows = []
for t in topics:
    start = time.monotonic()
    try:
        res = generate_round(t)
        r = res.round
        rows.append(
            {
                "topic": t,
                "ok": True,
                "source": res.source,
                "seconds": round(res.seconds, 1),
                "items": len(r.items),
                "widgets": [i.truth.widget for i in r.items],
                "knobs": sum(1 for i in r.items if i.explore is not None),
                "dropped": (res.checks or {}).get("dropped", []),
                "misconceptions": [m.label for m in r.misconceptions],
            }
        )
    except GenerationError as err:
        rows.append(
            {
                "topic": t,
                "ok": False,
                "error": str(err)[:200],
                "seconds": round(time.monotonic() - start, 1),
            }
        )
    print(json.dumps(rows[-1]), flush=True)
print(json.dumps({"generation_calls": _calls, "usage": Usage().snapshot()}))
