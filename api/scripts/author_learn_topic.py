"""Author one Learn topic with the real Codex CLI and write it to data/learn/<slug>.json.

    uv run python scripts/author_learn_topic.py "compound interest" [--out data/learn]
                                                                    [--fake] [--force]

Runs the author prompt through app.learn.codex (so the invocation, timeout and JSON
parsing are the server's), validates the reply with the Topic model, writes the file with
checked = true and prints a short review summary: read it, fix the JSON by hand if a
line is wrong, commit. --fake uses the canned backend for a dry run of the plumbing.
"""

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pydantic import ValidationError  # noqa: E402

from app.learn import codex, prompts  # noqa: E402
from app.learn.schemas import Authored, Topic, schema_file, topic_from_authored  # noqa: E402
from app.learn.topics import LEARN_DIR, slug_for  # noqa: E402


def author(name: str) -> Topic:
    raw = codex.run_json_sync(
        prompts.author(name),
        task="author",
        schema=schema_file(Authored),
        timeout_s=float(os.environ.get("MM_CODEX_AUTHOR_TIMEOUT_S", codex.AUTHOR_TIMEOUT_S)),
    )
    return topic_from_authored(slug_for(name), name, Authored.model_validate(raw), checked=True)


def summary(t: Topic) -> str:
    r = t.rubric
    lines = [
        f"{t.slug}: {t.topic}",
        f"  entities ({len(r.entities)}): {'; '.join(r.entities)}",
        f"  core rule: {r.coreRule}",
        f"  anchor: {r.anchorDescription}",
        "  contrast:",
        *[f"    - {c.label}: {c.oneLine}" for c in r.contrastingCases[:2]],
        "  extreme cases:",
        *[f"    - [{c.dimension}] {c.scenario} -> {c.correctBehavior}" for c in t.extremeCases],
        "  misconceptions:",
        *[f"    - {m.id}: {m.label} (tell: {m.tell})" for m in t.misconceptions],
        f"  neighbors: {', '.join(n.label for n in r.confusableNeighbors) or '(none)'}",
    ]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("topic")
    ap.add_argument("--out", type=Path, default=LEARN_DIR, help="folder for <slug>.json")
    ap.add_argument("--fake", action="store_true", help="canned backend, no codex call")
    ap.add_argument("--force", action="store_true", help="overwrite an existing file")
    args = ap.parse_args()
    if args.fake:
        os.environ["MM_CODEX_FAKE"] = "1"
    elif codex.status() != "ok":
        print(f"codex is {codex.status()}; run `codex login` first", file=sys.stderr)
        return 2
    name = args.topic.strip()
    path = args.out / f"{slug_for(name)}.json"
    if path.exists() and not args.force:
        print(f"{path} exists; pass --force to overwrite", file=sys.stderr)
        return 2
    try:
        topic = author(name)
    except codex.CodexError as err:
        print(f"codex failed: {err}", file=sys.stderr)
        return 1
    except ValidationError as err:
        print(f"authored topic did not validate:\n{err}", file=sys.stderr)
        return 1
    args.out.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(topic.model_dump(mode="json"), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(summary(topic))
    print(f"\nwrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
