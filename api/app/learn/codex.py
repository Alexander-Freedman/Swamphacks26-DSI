"""Thin async wrapper around `codex exec` (the Codex CLI run non-interactively).

Every Learn judgment goes through run_json() so the invocation is right in one place:

    codex exec --json --output-schema <schema> --skip-git-repo-check --sandbox read-only
               --ephemeral -C <empty scratch dir> [-m MODEL] [-i input.png] "<prompt>"

- --json: events as JSONL on stdout; the final agent_message is the answer.
- --output-schema: the response shape (schemas.py writes one file per model).
- read-only sandbox + an empty scratch dir + --ephemeral: a judgment, never a shell
  command, a file edit or a saved session.
- The prompt is the positional argument (verified on the production box). On Windows
  the npm shim is a .cmd, and cmd.exe mangles long quoted prompts, so there it goes
  over stdin instead (codex reads stdin when no prompt argument is given).

Env: MM_CODEX_BIN (path; default: resolved on PATH), MM_CODEX_MODEL (unset = the CLI's
default), MM_CODEX_CONCURRENCY (2), MM_CODEX_TIMEOUT_S (60; authoring passes its own),
MM_CODEX_FAKE=1 (canned replies by task name, so tests and CI never need codex;
MM_CODEX_FAKE_VISUAL=none makes the fake visual call answer "no curve fits").
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import weakref
from pathlib import Path
from typing import Literal

log = logging.getLogger("mm.learn.codex")

DEFAULT_TIMEOUT_S = 60
AUTHOR_TIMEOUT_S = 120
STATUS_TTL_S = 60

Status = Literal["ok", "missing", "unauthenticated"]


class CodexError(Exception):
    """codex exec failed, produced no JSON, or timed out."""


class CodexTimeout(CodexError):
    pass


def fake() -> bool:
    return os.environ.get("MM_CODEX_FAKE") == "1"


def binary() -> str | None:
    override = os.environ.get("MM_CODEX_BIN")
    if override:
        return override if Path(override).exists() or shutil.which(override) else None
    names = ["codex.cmd", "codex.exe", "codex"] if sys.platform == "win32" else ["codex"]
    for name in names:
        found = shutil.which(name)
        if found:
            return found
    return None


# ---------------------------------------------------------------------------
# status: "ok" | "missing" | "unauthenticated", cached for 60 s
# ---------------------------------------------------------------------------
_status_cache: tuple[float, Status] | None = None


def status() -> Status:
    global _status_cache
    if fake():
        return "ok"
    now = time.monotonic()
    if _status_cache and now - _status_cache[0] < STATUS_TTL_S:
        return _status_cache[1]
    bin_ = binary()
    if bin_ is None:
        result: Status = "missing"
    else:
        try:
            rc = subprocess.run(
                [bin_, "login", "status"], capture_output=True, timeout=20, check=False
            ).returncode
            result = "ok" if rc == 0 else "unauthenticated"
        except (OSError, subprocess.TimeoutExpired):
            result = "unauthenticated"
    _status_cache = (now, result)
    return result


def reset_status_cache() -> None:
    global _status_cache
    _status_cache = None


# ---------------------------------------------------------------------------
# concurrency + in-flight count
# ---------------------------------------------------------------------------
_sems: weakref.WeakKeyDictionary[asyncio.AbstractEventLoop, asyncio.Semaphore]
_sems = weakref.WeakKeyDictionary()
_in_flight = 0


def _semaphore() -> asyncio.Semaphore:
    loop = asyncio.get_running_loop()
    sem = _sems.get(loop)
    if sem is None:
        sem = asyncio.Semaphore(int(os.environ.get("MM_CODEX_CONCURRENCY", "2")))
        _sems[loop] = sem
    return sem


def in_flight() -> int:
    return _in_flight


# ---------------------------------------------------------------------------
# the call
# ---------------------------------------------------------------------------
def build_args(
    bin_: str, schema: Path | None, scratch: Path, image: Path | None, prompt: str | None
) -> list[str]:
    """The exact argv. prompt=None means it goes over stdin."""
    args = [bin_, "exec", "--json"]
    if schema is not None:
        args += ["--output-schema", str(schema)]
    args += ["--skip-git-repo-check", "--sandbox", "read-only", "--ephemeral", "-C", str(scratch)]
    model = os.environ.get("MM_CODEX_MODEL")
    if model:
        args += ["-m", model]
    if image is not None:
        args += ["-i", str(image)]
    if prompt is not None:
        args.append(prompt)
    return args


async def run_json(
    prompt: str,
    *,
    task: str,
    schema: Path | None = None,
    image: bytes | None = None,
    timeout_s: float | None = None,
) -> dict:
    """Run one judgment and return the parsed JSON object codex answered with."""
    global _in_flight
    if fake():
        return fake_reply(task, prompt)
    timeout_s = timeout_s or float(os.environ.get("MM_CODEX_TIMEOUT_S", DEFAULT_TIMEOUT_S))
    bin_ = binary()
    if bin_ is None:
        raise CodexError("codex binary not found")
    async with _semaphore():
        _in_flight += 1
        scratch = Path(tempfile.mkdtemp(prefix="mm-codex-"))
        try:
            image_path = None
            if image is not None:
                image_path = scratch / "input.png"
                image_path.write_bytes(image)
            via_stdin = sys.platform == "win32"
            args = build_args(bin_, schema, scratch, image_path, None if via_stdin else prompt)
            started = time.monotonic()
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE if via_stdin else asyncio.subprocess.DEVNULL,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(scratch),
            )
            try:
                out, err = await asyncio.wait_for(
                    proc.communicate(prompt.encode("utf-8") if via_stdin else None),
                    timeout=timeout_s,
                )
            except TimeoutError:
                _kill(proc)
                raise CodexTimeout(
                    f"codex exec ({task}) timed out after {timeout_s:.0f}s"
                ) from None
            text = out.decode("utf-8", errors="replace")
            took = time.monotonic() - started
            log.info("codex %s: exit %s in %.1fs", task, proc.returncode, took)
            message = last_agent_message(text)
            if message is None:
                tail = err.decode("utf-8", errors="replace")[-800:]
                raise CodexError(f"codex exec ({task}) exit {proc.returncode}, no answer: {tail}")
            try:
                return extract_json(message)
            except ValueError as e:
                raise CodexError(f"codex exec ({task}): {e}") from None
        finally:
            _in_flight -= 1
            shutil.rmtree(scratch, ignore_errors=True)


def _kill(proc: asyncio.subprocess.Process) -> None:
    try:
        if sys.platform == "win32":
            # The .cmd shim spawns node; kill the whole tree, not just cmd.exe.
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True, check=False
            )
        proc.kill()
    except ProcessLookupError:
        pass


def run_json_sync(prompt: str, **kw) -> dict:
    """Same call for scripts (the authoring CLI)."""
    return asyncio.run(run_json(prompt, **kw))


# ---------------------------------------------------------------------------
# output parsing
# ---------------------------------------------------------------------------
def last_agent_message(stdout: str) -> str | None:
    """The text of the last agent_message in a --json event stream.

    Falls back to the raw stdout when it isn't JSONL at all (an older CLI or a
    plain run), so extract_json still gets a chance at it.
    """
    last = None
    saw_event = False
    for line in stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            event = json.loads(line)
        except ValueError:
            continue
        saw_event = True
        item = event.get("item") if isinstance(event, dict) else None
        if isinstance(item, dict) and item.get("type") == "agent_message":
            last = item.get("text")
    if last is None and not saw_event and stdout.strip():
        return stdout
    return last


_FENCE = re.compile(r"```(?:json)?\s*([\s\S]*?)```")


def extract_json(raw: str) -> dict:
    """json.loads, or the first balanced {...} block (fences stripped)."""
    text = (raw or "").strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except ValueError:
        pass
    m = _FENCE.search(text)
    if m:
        text = m.group(1).strip()
    start = text.find("{")
    if start == -1:
        raise ValueError("no JSON object in codex output: " + text[:300])
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                data = json.loads(text[start : i + 1])
                if not isinstance(data, dict):
                    raise ValueError("codex output is not a JSON object")
                return data
    raise ValueError("unbalanced JSON object in codex output: " + text[:300])


# ---------------------------------------------------------------------------
# MM_CODEX_FAKE=1: one plausible canned reply per task, shaped like the contract
# ---------------------------------------------------------------------------
def _quoted(prompt: str, label: str) -> str:
    """The learner text the prompt put under `label:` between triple quotes."""
    m = re.search(re.escape(label) + r'(?: \([^)]*\))?:\s*"""(.*?)"""', prompt, re.S)
    return (m.group(1) if m else "").strip()


def _listed_ids(prompt: str, heading: str) -> list[str]:
    """kebab ids from `  - id: ...` lines right after a heading line."""
    after = prompt.split(heading, 1)[1] if heading in prompt else ""
    ids = []
    for line in after.splitlines()[1:]:
        m = re.match(r"\s+- ([a-z0-9]+(?:-[a-z0-9]+)*):", line)
        if not m:
            break
        ids.append(m.group(1))
    return ids


def fake_reply(task: str, prompt: str) -> dict:
    if task == "help":
        return {"answer": "Look at the fact on screen. Try one small prediction from it."}
    if task == "author":
        m = re.search(r'The concept to author is: "(.*?)"', prompt)
        return fake_authored(m.group(1) if m else "the topic")
    if task == "guess":
        text = _quoted(prompt, "The learner's guess")
        words = len(text.split())
        ids = _listed_ids(prompt, "Pre-authored misconceptions")
        if words < 4 or "know" in text.lower():
            return {
                "classification": "vague",
                "misconceptionId": None,
                "message": "That names the topic but not how it works. Next you get one true "
                "fact about it and predict from that.",
            }
        return {
            "classification": "concrete",
            "misconceptionId": ids[0] if ids else None,
            "message": f'"{text[:60]}" names something testable. Next we test it against '
            "the real thing.",
        }
    if task in ("anchor", "why"):
        text = _quoted(prompt, "The learner's answer")
        if len(text.split()) >= 6:
            return {
                "verdict": "demonstrated",
                "feedback": f'Your line "{text[:50]}" follows from the fact given.',
                "followUpQuestion": None,
            }
        return {
            "verdict": "unresolved",
            "feedback": f'"{text[:50]}" does not say what changes, or which way.',
            "followUpQuestion": "Using only that one fact, what happens one step later?",
        }
    if task == "stress":
        fix = _quoted(prompt, "The learner's fix")
        if len(fix.split()) >= 6:
            return {
                "verdict": "survives",
                "critique": f'Applied as written, "{fix[:40]}" holds here.',
                "piece": None,
            }
        return {
            "verdict": "breaks",
            "critique": f'"{fix[:40]}" gives no definite answer in this case.',
            "piece": "each step builds on the amount there now",
        }
    if task == "reveal":
        m = re.search(r"The correct rule is: (.*?)\.\n", prompt, re.S)
        rule = m.group(1).strip() if m else "the rule"
        return {
            "explanation": "Your first fix treated every step the same and your second ignored "
            f"the starting amount; both break on the extremes. The rule: {rule}.",
            "revealedRule": rule,
            "confirmCase": "Try it with a huge starting amount and a tiny rate, then the reverse.",
        }
    if task == "draw":
        rule = _quoted(prompt, "Rule written on the canvas") or "(empty)"
        return {
            "criteria": [
                {"id": "entities", "verdict": "demonstrated", "note": "All the pieces are there."},
                {"id": "links", "verdict": "demonstrated", "note": "Arrows point the right way."},
                {"id": "rule", "verdict": "unresolved", "note": f'"{rule[:40]}" leaves out time.'},
                {"id": "why-rule", "verdict": "unresolved", "note": "No why written."},
            ],
            "followUpQuestion": "What in your rule makes later steps bigger than earlier ones?",
        }
    if task == "neighbor":
        text = _quoted(prompt, "The learner's answer")
        if "both" in text.lower() or len(text.split()) >= 10:
            return {
                "verdict": "correct",
                "feedback": "You named the seam between the two, not just what one lacks.",
                "followUpQuestion": None,
            }
        return {
            "verdict": "partial",
            "feedback": f'"{text[:50]}" says what the neighbor lacks, not how they relate.',
            "followUpQuestion": "Where do the two meet in one real situation?",
        }
    if task == "transfer":
        text = _quoted(prompt, "The learner's invented analogy")
        if len(text.split()) < 6:
            return {
                "verdict": "too-abstract",
                "critique": f'"{text[:40]}" restates the idea without a concrete case.',
                "missingPiece": None,
            }
        return {
            "verdict": "maps",
            "critique": "Your example keeps a base, a rate and repeated steps that feed back.",
            "missingPiece": None,
        }
    if task == "visual":
        if os.environ.get("MM_CODEX_FAKE_VISUAL") == "none":
            return {"fits": False, "visual": None}
        return fake_visual(_listed_ids(prompt, "Misconception ids"))
    raise CodexError(f"no fake reply for task {task!r}")


def fake_visual(ids: list[str]) -> dict:
    """A curve that passes every check for the fake authored topic (steps that compound).

    MM_CODEX_FAKE_VISUAL=none makes the fake say no curve fits instead.
    """
    same, once = (ids + ["same-amount-each-step", "one-step-only"])[:2]
    spec = {
        "widget": "curve",
        "approximate": False,
        "variables": [{"name": "A", "meaning": "amount at the start", "unit": "", "value": 100}],
        "curve": {
            "expr": "A*(1+r/100)^x",
            "mode": "value",
            "x_min": 0,
            "x_max": 20,
            "x_label": "steps",
            "y_label": "amount",
            "ask_x": 10,
            "ask_y": None,
            "area_from": None,
            "area_to": None,
            "knob": {
                "param": "r",
                "label": "share added each step (%)",
                "min": 0,
                "max": 30,
                "step": 1,
                "default": 10,
            },
        },
        "sampler": None,
        "prediction": {
            "prompt": "Start with 100. Each step adds 10% of what is there now. After 10 steps, "
            "how much is there?",
            "input": "slider",
            "slider": {"min": 0, "max": 600, "step": 10, "unit": ""},
            "options": [],
        },
        "bands": [
            {"min": 0, "max": 150, "misconception_id": once},
            {"min": 160, "max": 230, "misconception_id": same},
            {"min": 240, "max": 290, "misconception_id": None},
            {"min": 300, "max": 600, "misconception_id": same},
        ],
        "extremes": [
            {"param": "r", "value": 0, "watch": "At 0% nothing is ever added: still 100."},
            {"param": "r", "value": 30, "watch": "At 30% a step, 10 steps reach about 1,379."},
        ],
        "answer_claimed": 259.37,
    }
    return {"fits": True, "visual": {"widget": "curve", "spec": spec}}


def _fake_predict(question: str, texts: list[str], piece: str) -> dict:
    """A predict card whose first choice is the correct one; the second is tied."""
    ids = [None, "same-amount-each-step", None]
    return {
        "question": question,
        "choices": [
            {"text": t, "correct": i == 0, "misconceptionId": ids[i]} for i, t in enumerate(texts)
        ],
        "piece": piece,
    }


def fake_authored(name: str) -> dict:
    """A structurally complete authored topic for any name (content is a placeholder)."""
    return {
        "entities": [
            f"the amount of {name}",
            "the rate it changes at",
            "time",
            "the starting amount",
        ],
        "causalLinks": [
            "a higher rate makes the amount grow faster each step",
            "more time means more steps, so the change compounds",
            "a bigger starting amount makes every later step bigger",
        ],
        "coreRule": f"each step of {name} acts on the current amount, not the starting one",
        "whyRuleMatters": "Because each step's result feeds the next step, the growth per step "
        "keeps getting bigger instead of staying flat.",
        "whyRuleQuestion": "Why does each step build on the current amount instead of the "
        "starting one?",
        "anchorDescription": f"In {name}, one step changes the amount by a fixed share of what "
        "is there now.",
        "anchorPrompt": "If one step adds 10% to what is there now, what is there after two "
        "steps, starting from 100?",
        "contrastingCases": [
            {
                "label": "Same share every step",
                "detail": "100 grows by 10% of the current amount each step: 100, 110, 121.",
                "oneLine": "10% of what is there now",
            },
            {
                "label": "Same amount every step",
                "detail": "100 grows by 10 each step: 100, 110, 120.",
                "oneLine": "10 added each time",
            },
        ],
        "extremeCaseDimensions": [
            {"key": "many-steps", "description": "a very large number of steps"},
            {"key": "zero-rate", "description": "a rate of exactly zero"},
            {"key": "tiny-start", "description": "a starting amount near zero"},
        ],
        "confusableNeighbors": [
            {
                "key": "linear-growth",
                "label": "Linear growth",
                "question": f"How is {name} different from adding the same amount every step?",
                "correctDistinction": "Linear growth adds a fixed amount; here the amount added "
                "is a share of the current total, so the two agree only on the first step.",
            }
        ],
        "transferStructuralRequirements": [
            "a quantity that persists between steps",
            "a per-step change that is a share of the current quantity",
            "repeated steps whose results feed the next",
        ],
        "referenceTransferExample": "A rumor: each person who hears it tells 10% more people "
        "than heard it the day before, so the daily spread keeps growing.",
        "misconceptions": [
            {
                "id": "same-amount-each-step",
                "label": "Same amount each step",
                "tell": "They add a fixed number every step.",
                "fix": "The step size is a share of what is there now, so it grows.",
            },
            {
                "id": "one-step-only",
                "label": "It happens once",
                "tell": "They apply the change a single time.",
                "fix": "The change repeats every step and builds on the last one.",
            },
        ],
        "extremeCases": [
            {
                "dimension": "many-steps",
                "scenario": "100 grows by 1% a step for 10,000 steps.",
                "correctBehavior": "The amount becomes enormous; late steps dwarf early ones.",
                "predict": _fake_predict(
                    "What happens to the amount after 10,000 steps?",
                    ["It becomes enormous", "It grows by 100 each step", "It grows once"],
                    "more steps means each step adds more than the last",
                ),
            },
            {
                "dimension": "zero-rate",
                "scenario": "100 at a rate of 0% for any number of steps.",
                "correctBehavior": "Nothing changes; the amount stays 100.",
                "predict": _fake_predict(
                    "What happens to the 100 over time?",
                    ["It stays 100", "It grows a little each step", "It shrinks to 0"],
                    "a zero rate adds nothing, however long you wait",
                ),
            },
            {
                "dimension": "tiny-start",
                "scenario": "0.01 grows by 50% a step for 20 steps.",
                "correctBehavior": "It still multiplies the same way; only the scale is small.",
                "predict": _fake_predict(
                    "How does the tiny start grow?",
                    ["It multiplies the same way", "It barely moves", "It grows by 0.5 a step"],
                    "the start size sets the scale, not the pattern",
                ),
            },
        ],
    }
