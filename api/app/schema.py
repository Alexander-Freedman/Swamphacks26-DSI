"""Round schema: one topic's playable package.

The generator only writes this spec. Truth numbers are computed by code
(the browser for display, the backend linter for checks), never taken from
model text. Keep field names stable: web/ builds against the exported JSON
Schema in shared/schema/round.schema.json.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

SCHEMA_VERSION = 1

Slug = Annotated[str, Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$", max_length=60)]


class Misconception(BaseModel):
    id: Slug
    label: str = Field(max_length=80, description="Short name, e.g. 'Random means evenly mixed'")
    why_tempting: str = Field(max_length=280)
    refutation: str = Field(max_length=400, description="Right model in <=2 sentences")
    source_url: str | None = None
    source_note: str | None = Field(default=None, max_length=200)


class InputType(StrEnum):
    slider = "slider"
    choice = "choice"
    sketch = "sketch"
    order = "order"


class SliderSpec(BaseModel):
    min: float
    max: float
    step: float = 1
    unit: str = ""

    @model_validator(mode="after")
    def _range(self) -> SliderSpec:
        if self.max <= self.min or self.step <= 0:
            raise ValueError("slider needs min < max and step > 0")
        return self


class Option(BaseModel):
    id: Slug
    text: str = Field(max_length=200)
    misconception_id: Slug | None = Field(
        default=None, description="None means this is the correct option"
    )


class Band(BaseModel):
    """A numeric range of answers that maps to one misconception (or to correct)."""

    min: float
    max: float
    misconception_id: Slug | None = None


class SketchRuleKind(StrEnum):
    alternation_rate_gt = "alternation_rate_gt"
    alternation_rate_lt = "alternation_rate_lt"
    max_run_lt = "max_run_lt"
    max_run_gt = "max_run_gt"
    value_at_gt = "value_at_gt"
    value_at_lt = "value_at_lt"
    slope_sign_at = "slope_sign_at"


class SketchRule(BaseModel):
    """Deterministic shape check from a fixed vocabulary; the generator only chooses rules."""

    kind: SketchRuleKind
    threshold: float
    x: float | None = Field(default=None, description="0-1 position for *_at rules")
    misconception_id: Slug


class Sampler(StrEnum):
    coin_longest_run = "coin_longest_run"
    base_rate_test = "base_rate_test"
    birthday_match = "birthday_match"
    binomial_count = "binomial_count"
    dice_sum = "dice_sum"


class SamplerParams(BaseModel):
    n: int | None = Field(default=None, ge=1, le=10000)
    p: float | None = Field(default=None, ge=0, le=1)
    population: int | None = Field(default=None, ge=1, le=100000)
    base_rate: float | None = Field(default=None, ge=0, le=1)
    sensitivity: float | None = Field(default=None, ge=0, le=1)
    false_positive_rate: float | None = Field(default=None, ge=0, le=1)
    group_size: int | None = Field(default=None, ge=1, le=366)
    dice: int | None = Field(default=None, ge=1, le=10)
    trials: int = Field(default=10000, ge=100, le=100000)


class DistributionTruth(BaseModel):
    widget: Literal["distribution"] = "distribution"
    sampler: Sampler
    params: SamplerParams
    x_label: str = ""


class CurvePreset(StrEnum):
    birthday_match_probability = "birthday_match_probability"


class CurveTruth(BaseModel):
    widget: Literal["curve"] = "curve"
    expr: str | None = Field(
        default=None, max_length=200, description="mathjs subset in x (and the explore param)"
    )
    preset: CurvePreset | None = None
    x_min: float
    x_max: float
    x_label: str = ""
    y_label: str = ""

    @model_validator(mode="after")
    def _one_source(self) -> CurveTruth:
        if (self.expr is None) == (self.preset is None):
            raise ValueError("curve needs exactly one of expr or preset")
        if self.x_max <= self.x_min:
            raise ValueError("curve needs x_min < x_max")
        return self


class StepperTruth(BaseModel):
    """Honest fallback for topics we can't compute: a sourced worked example."""

    widget: Literal["stepper"] = "stepper"
    steps: list[str] = Field(min_length=2, max_length=8)
    source_url: str | None = None


Truth = Annotated[DistributionTruth | CurveTruth | StepperTruth, Field(discriminator="widget")]


class Explore(BaseModel):
    param: str = Field(max_length=40)
    label: str = Field(max_length=60)
    min: float
    max: float
    step: float = 1


class Item(BaseModel):
    id: Slug
    prompt: str = Field(max_length=300)
    input_type: InputType
    slider: SliderSpec | None = None
    options: list[Option] = Field(default_factory=list, max_length=6)
    bands: list[Band] = Field(default_factory=list, max_length=8)
    sketch_rules: list[SketchRule] = Field(default_factory=list, max_length=6)
    truth: Truth
    answer_expr: str | None = Field(
        default=None, max_length=200, description="mathjs-subset expression for the true value"
    )
    answer_claimed: float | None = Field(
        default=None, description="Generator's own number; only cross-checked"
    )
    explore: Explore | None = None
    targets: list[Slug] = Field(
        default_factory=list, description="Misconception ids this item is built to test"
    )

    @model_validator(mode="after")
    def _input_fits(self) -> Item:
        if self.input_type is InputType.slider and self.slider is None:
            raise ValueError("slider item needs slider spec")
        if self.input_type in (InputType.choice, InputType.order) and len(self.options) < 2:
            raise ValueError("choice/order item needs >= 2 options")
        if self.input_type is InputType.choice:
            correct = [o for o in self.options if o.misconception_id is None]
            if len(correct) != 1:
                raise ValueError("choice item needs exactly one correct option")
        if self.input_type is InputType.sketch and not self.sketch_rules:
            raise ValueError("sketch item needs sketch rules")
        return self


class Round(BaseModel):
    schema_version: Literal[1] = SCHEMA_VERSION
    slug: Slug
    topic: str = Field(max_length=120)
    concept: str = Field(max_length=300)
    reviewed: bool = Field(default=False, description="True only for hand-checked showcase rounds")
    misconceptions: list[Misconception] = Field(min_length=1, max_length=8)
    items: list[Item] = Field(min_length=1, max_length=5)

    @model_validator(mode="after")
    def _refs_resolve(self) -> Round:
        known = {m.id for m in self.misconceptions}
        for item in self.items:
            refs = [o.misconception_id for o in item.options]
            refs += [b.misconception_id for b in item.bands]
            refs += [r.misconception_id for r in item.sketch_rules]
            refs += item.targets
            missing = {r for r in refs if r is not None} - known
            if missing:
                raise ValueError(f"item {item.id} references unknown misconceptions {missing}")
        return self
