"""Build v4 model specs for a list of topics and record pass/fail stats (live calls).

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
from app.gen import GenerationError, NoFit, Usage, generate_round  # noqa: E402

if os.environ.get("MM_CACHE_DIR"):
    gen.CACHE_DIR = Path(os.environ["MM_CACHE_DIR"])

# Hard stop on generation calls for this run (MM_TRIAL_MAX_CALLS, default 30).
_max_calls = int(os.environ.get("MM_TRIAL_MAX_CALLS", "30"))
_real_call = gen._call_model
_calls = 0


def _capped_call(model: str, topic: str, feedback: str | None = None) -> str:
    global _calls
    if _calls >= _max_calls:
        raise GenerationError("trial call cap reached")
    _calls += 1
    raw = _real_call(model, topic, feedback)
    # Keep the raw reply so dropped items can be re-checked offline later.
    with open(gen.CACHE_DIR / "raw.jsonl", "a") as f:
        row = {"topic": topic, "model": model, "retry": bool(feedback), "raw": raw}
        f.write(json.dumps(row) + "\n")
    return raw


gen._call_model = _capped_call
gen.CACHE_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(level=logging.INFO, format="%(name)s %(message)s")
topics = [line.strip() for line in sys.stdin if line.strip()]
rows = []
for t in topics:
    start = time.monotonic()
    calls_before = _calls
    try:
        res = generate_round(t)
        r, spec = res.round, res.spec
        main = r.items[0]
        rows.append(
            {
                "topic": t,
                "ok": True,
                "source": res.source,
                "seconds": round(res.seconds, 1),
                "calls": _calls - calls_before,
                "widget": spec.case.widget.value if spec else None,
                "truth": main.truth.widget,
                "truth_value": main.truth_value,
                "claimed": main.answer_claimed,
                "extremes": len(main.extremes),
                "compare": r.compare.model_dump() if r.compare else None,
                "items": len(r.items),
                "dropped": (res.checks or {}).get("dropped", []),
                "misconception": r.misconceptions[0].label,
            }
        )
    except GenerationError as err:
        rows.append(
            {
                "topic": t,
                "ok": False,
                "no_fit": isinstance(err, NoFit),
                "error": str(err)[:200],
                "calls": _calls - calls_before,
                "seconds": round(time.monotonic() - start, 1),
            }
        )
    print(json.dumps(rows[-1]), flush=True)
print(json.dumps({"generation_calls": _calls, "usage": Usage().snapshot()}))
