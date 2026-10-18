"""Topic JSON and every Learn response shape (docs/learn-api.md), as pydantic models.

Field names are the contract's camelCase, verbatim, so model_dump() is the wire shape.
schema_file(Model) writes the model's JSON Schema to a temp file for `--output-schema`,
tightened the way structured output wants it: every object closed (additionalProperties
false), every property required (optional ones are nullable instead), no defaults or
length limits in the schema itself. Limits stay on the pydantic side, where we validate.
"""

from __future__ import annotations

import copy
import json
import tempfile
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator

from app.schema import Slug, SpecCase

Verdict = Literal["demonstrated", "unresolved"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Topic JSON
# ---------------------------------------------------------------------------
class ContrastingCase(Strict):
    label: str = Field(max_length=80)
    detail: str = Field(max_length=1200)
    oneLine: str = Field(max_length=140)


class ExtremeCaseDimension(Strict):
    key: Slug
    description: str = Field(max_length=1200)


class ConfusableNeighbor(Strict):
    key: Slug
    label: str = Field(max_length=80)
    question: str = Field(max_length=300)
    correctDistinction: str = Field(max_length=1200)


class Rubric(Strict):
    entities: list[str] = Field(min_length=2, max_length=10)
    causalLinks: list[str] = Field(min_length=1, max_length=10)
    coreRule: str = Field(max_length=700)
    whyRuleMatters: str = Field(max_length=1200)
    whyRuleQuestion: str = Field(max_length=300)
    anchorDescription: str = Field(max_length=400)
    anchorPrompt: str = Field(max_length=300)
    contrastingCases: list[ContrastingCase] = Field(min_length=2, max_length=4)
    extremeCaseDimensions: list[ExtremeCaseDimension] = Field(min_length=3, max_length=5)
    confusableNeighbors: list[ConfusableNeighbor] = Field(max_length=2)
    transferStructuralRequirements: list[str] = Field(min_length=1, max_length=6)
    referenceTransferExample: str = Field(max_length=1200)

    @field_validator("extremeCaseDimensions")
    @classmethod
    def _distinct_keys(cls, dims: list[ExtremeCaseDimension]) -> list[ExtremeCaseDimension]:
        keys = [d.key for d in dims]
        if len(set(keys)) != len(keys):
            raise ValueError("extreme-case dimension keys must be distinct")
        return dims


class Misconception(Strict):
    id: Slug
    label: str = Field(max_length=80)
    tell: str = Field(max_length=300)
    fix: str = Field(max_length=400)


class ExtremeCase(Strict):
    dimension: Slug
    scenario: str = Field(max_length=400)
    correctBehavior: str = Field(max_length=400)


class Visual(Strict):
    widget: Literal["curve", "distribution", "estimate", "stepper"]
    spec: SpecCase


class Authored(Strict):
    """What the author prompt returns: the rubric flat, plus misconceptions and cases."""

    entities: list[str]
    causalLinks: list[str]
    coreRule: str
    whyRuleMatters: str
    whyRuleQuestion: str
    anchorDescription: str
    anchorPrompt: str
    contrastingCases: list[ContrastingCase]
    extremeCaseDimensions: list[ExtremeCaseDimension]
    confusableNeighbors: list[ConfusableNeighbor]
    transferStructuralRequirements: list[str]
    referenceTransferExample: str
    misconceptions: list[Misconception]
    extremeCases: list[ExtremeCase]


class Topic(Strict):
    slug: Slug
    topic: str = Field(min_length=1, max_length=120)
    checked: bool
    rubric: Rubric
    misconceptions: list[Misconception] = Field(min_length=2, max_length=3)
    extremeCases: list[ExtremeCase] = Field(min_length=3, max_length=3)
    visual: Visual | None = None

    @model_validator(mode="after")
    def _cases_fit(self) -> Topic:
        dims = {d.key for d in self.rubric.extremeCaseDimensions}
        used = [c.dimension for c in self.extremeCases]
        if len(set(used)) != 3:
            raise ValueError("the 3 extreme cases must be on 3 different dimensions")
        missing = [d for d in used if d not in dims]
        if missing:
            raise ValueError(f"extreme case dimension not in rubric: {missing}")
        ids = [m.id for m in self.misconceptions]
        if len(set(ids)) != len(ids):
            raise ValueError("misconception ids must be distinct")
        return self

    def neighbor(self, key: str) -> ConfusableNeighbor | None:
        return next((n for n in self.rubric.confusableNeighbors if n.key == key), None)


def _clip_text(text: str, limit: int) -> str:
    """Shorten to `limit` chars, ending at a sentence (or word) boundary when one is close."""
    if len(text) <= limit:
        return text
    cut = text[: limit - 1]
    for end in (". ", "; ", ", ", " "):
        i = cut.rfind(end)
        if i >= limit * 0.6:
            return cut[: i + (1 if end != " " else 0)].rstrip(",; ") + ("" if end == ". " else "…")
    return cut + "…"


def validate_clipped(model: type[BaseModel], data: dict) -> BaseModel:
    """Validate a model-written reply, trimming over-long strings and lists instead of failing.

    The author call writes free text; a line a little over its cap shouldn't throw away the lesson.
    Any other validation error still raises.
    """
    data = copy.deepcopy(data)
    for _ in range(20):
        try:
            return model.model_validate(data)
        except ValidationError as err:
            fixable = [e for e in err.errors() if e["type"] in ("string_too_long", "too_long")]
            if len(fixable) != len(err.errors()):
                raise
            for e in fixable:
                *path, last = e["loc"]
                node = data
                for key in path:
                    node = node[key]
                limit = int(e["ctx"]["max_length"])
                value = node[last]
                node[last] = _clip_text(value, limit) if isinstance(value, str) else value[:limit]
    return model.model_validate(data)


def topic_from_authored(slug: str, name: str, authored: Authored, *, checked: bool) -> Topic:
    data = authored.model_dump()
    misconceptions = data.pop("misconceptions")
    cases = data.pop("extremeCases")
    return Topic(
        slug=slug,
        topic=name,
        checked=checked,
        rubric=validate_clipped(Rubric, data),
        misconceptions=misconceptions,
        extremeCases=cases,
        visual=None,
    )


class TopicSummary(Strict):
    slug: str
    topic: str
    checked: bool


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------
class GuessOut(Strict):
    classification: Literal["concrete", "vague", "tangled"]
    misconceptionId: str | None
    message: str


class AnchorOut(Strict):
    verdict: Verdict
    feedback: str
    followUpQuestion: str | None


class StressOut(Strict):
    verdict: Literal["survives", "breaks"]
    critique: str


class WhyOut(Strict):
    verdict: Verdict
    feedback: str
    followUpQuestion: str | None


class RevealOut(Strict):
    explanation: str
    revealedRule: str
    confirmCase: str


class DrawCriterion(Strict):
    id: Literal["entities", "links", "rule", "why-rule"]
    verdict: Literal["demonstrated", "contradicted", "unresolved"]
    note: str


class DrawOut(Strict):
    criteria: list[DrawCriterion]
    followUpQuestion: str | None


class NeighborOut(Strict):
    verdict: Literal["correct", "partial", "incorrect"]
    feedback: str
    followUpQuestion: str | None


class TransferOut(Strict):
    verdict: Literal["maps", "partial", "too-abstract", "fails"]
    critique: str
    missingPiece: str | None


class StatusOut(Strict):
    codex: Literal["ok", "missing", "unauthenticated"]
    inFlight: int
    topics: int


# ---------------------------------------------------------------------------
# --output-schema files
# ---------------------------------------------------------------------------
_KEEP = {
    "type",
    "properties",
    "required",
    "additionalProperties",
    "items",
    "anyOf",
    "enum",
    "const",
    "$ref",
    "$defs",
    "description",
}


def tighten(schema: dict) -> dict:
    """Close every object, require every property, drop defaults and limits."""

    def walk(node, keyed: bool = False):
        if isinstance(node, list):
            return [walk(n) for n in node]
        if not isinstance(node, dict):
            return node
        if keyed:  # a name -> schema map (properties, $defs): keep every name
            return {k: walk(v) for k, v in node.items()}
        out = {
            k: walk(v, keyed=k in ("properties", "$defs")) for k, v in node.items() if k in _KEEP
        }
        if out.get("type") == "object" and "properties" in out:
            out["additionalProperties"] = False
            out["required"] = list(out["properties"])
        return out

    return walk(schema)


_SCHEMA_DIR: Path | None = None
_files: dict[str, Path] = {}


def schema_file(model: type[BaseModel]) -> Path:
    """The tightened JSON Schema of `model`, on disk, written once per process."""
    global _SCHEMA_DIR
    path = _files.get(model.__name__)
    if path is not None and path.exists():
        return path
    if _SCHEMA_DIR is None or not _SCHEMA_DIR.exists():
        _SCHEMA_DIR = Path(tempfile.mkdtemp(prefix="mm-learn-schemas-"))
    path = _SCHEMA_DIR / f"{model.__name__}.schema.json"
    path.write_text(json.dumps(tighten(model.model_json_schema()), indent=1))
    _files[model.__name__] = path
    return path
