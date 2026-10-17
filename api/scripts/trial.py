"""Generate rounds for a list of topics and record pass/fail stats (live calls)."""

import json
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.gen import GenerationError, Usage, generate_round  # noqa: E402

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
print(json.dumps({"usage": Usage().snapshot()}))
