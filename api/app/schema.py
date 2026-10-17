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
    ask_x: float | None = Field(
        default=None, description="x the question asks about; the answer is the curve's y there"
    )
    ask_y: float | None = Field(
        default=None, description="y the question asks about; the answer is the x reaching it"
    )
    # Engine v4 calculus views (optional): what to draw on top of the curve.
    show: Literal["tangent", "riemann", "limit"] | None = Field(
        default=None,
        description="tangent: answer = slope at ask_x; riemann: answer = area from area_from "
        "to area_to, explore param = number of rectangles; limit: answer = limit at ask_x",
    )
    area_from: float | None = None
    area_to: float | None = None

    @model_validator(mode="after")
    def _one_source(self) -> CurveTruth:
        if (self.expr is None) == (self.preset is None):
            raise ValueError("curve needs exactly one of expr or preset")
        if self.x_max <= self.x_min:
            raise ValueError("curve needs x_min < x_max")
        return self


class EstimateTruth(BaseModel):
    """A single computed number shown on a number line against the guess."""

    widget: Literal["estimate"] = "estimate"
    unit: str = ""
    source_url: str | None = None


class StepperTruth(BaseModel):
    """Honest fallback for topics we can't compute: a sourced worked example."""

    widget: Literal["stepper"] = "stepper"
    steps: list[str] = Field(min_length=2, max_length=8)
    source_url: str | None = None


Truth = Annotated[
    DistributionTruth | CurveTruth | EstimateTruth | StepperTruth, Field(discriminator="widget")
]


class Explore(BaseModel):
    param: str = Field(max_length=40)
    label: str = Field(max_length=60)
    min: float
    max: float
    step: float = 1
    default: float | None = Field(
        default=None, description="Value of param for the question as asked (curve exprs use it)"
    )


VarName = Annotated[str, Field(pattern=r"^[A-Za-z][A-Za-z0-9_]{0,23}$")]


class Variable(BaseModel):
    """A named number in a model spec, shown with its plain meaning and unit."""

    name: VarName
    meaning: str = Field(max_length=120)
    unit: str = Field(default="", max_length=30)
    value: float


class Extreme(BaseModel):
    """A setting worth trying after the reveal (engine v4)."""

    param: VarName = Field(description="The knob, sampler param or variable to set")
    value: float
    watch: str = Field(max_length=160, description="One line: what to watch at this setting")
    truth_value: float | None = Field(
        default=None, description="The item's answer at this setting, computed by code"
    )


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
    # Engine v4 (all optional, so older rounds still validate):
    variables: list[Variable] = Field(default_factory=list, max_length=8)
    extremes: list[Extreme] = Field(default_factory=list, max_length=3)
    truth_value: float | None = Field(
        default=None, description="The true answer, computed by code from the spec"
    )
    computed: bool | None = Field(
        default=None,
        description="True: truth_value computed by code from the spec. None: older rounds",
    )
    approximate: bool | None = Field(
        default=None,
        description="True: a simplified picture of the main relationship; label it "
        "'approximate picture, not a full model'. None: older rounds",
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
        if self.truth.widget == "estimate" and not self.answer_expr:
            raise ValueError("estimate item needs answer_expr")
        return self


class Compare(BaseModel):
    """Compare screen: a second case that looks different but works the same."""

    topic: str = Field(max_length=120)
    item_id: Slug | None = Field(
        default=None, description="The second case's item in round.items, if it has one"
    )
    prompt: str = Field(default="What's the same about how these work?", max_length=200)
    shared_principle: str = Field(max_length=300)


class Round(BaseModel):
    schema_version: Literal[1] = SCHEMA_VERSION
    slug: Slug
    topic: str = Field(max_length=120)
    concept: str = Field(max_length=300)
    reviewed: bool = Field(default=False, description="True only for hand-checked showcase rounds")
    misconceptions: list[Misconception] = Field(min_length=1, max_length=8)
    items: list[Item] = Field(min_length=1, max_length=5)
    spec_version: int | None = Field(default=None, description="4 for engine v4 rounds")
    compare: Compare | None = None

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
        if self.compare and self.compare.item_id:
            if self.compare.item_id not in {i.id for i in self.items}:
                raise ValueError("compare.item_id is not an item")
        return self


# ---------------------------------------------------------------------------
# Engine v4: the model spec. The generator fills this; code validates it,
# computes every truth from it and compiles it to a Round (app/spec.py).


class SpecWidget(StrEnum):
    curve = "curve"
    sampler = "sampler"


class SamplerStat(StrEnum):
    """What number the question asks about; computed exactly in app/truth.py."""

    mean_longest_run = "mean_longest_run"  # coin_longest_run (fair coin)
    p_run_at_least = "p_run_at_least"  # coin_longest_run, k; percent
    p_true_positive = "p_true_positive"  # base_rate_test; percent
    p_match = "p_match"  # birthday_match; percent
    mean = "mean"  # binomial_count, dice_sum
    mode = "mode"  # binomial_count, dice_sum
    p_at_least = "p_at_least"  # binomial_count, dice_sum, k; percent
    p_equals = "p_equals"  # binomial_count, dice_sum, k; percent


SAMPLER_STATS: dict[Sampler, tuple[SamplerStat, ...]] = {
    Sampler.coin_longest_run: (SamplerStat.mean_longest_run, SamplerStat.p_run_at_least),
    Sampler.base_rate_test: (SamplerStat.p_true_positive,),
    Sampler.birthday_match: (SamplerStat.p_match,),
    Sampler.binomial_count: (
        SamplerStat.mean,
        SamplerStat.mode,
        SamplerStat.p_at_least,
        SamplerStat.p_equals,
    ),
    Sampler.dice_sum: (
        SamplerStat.mean,
        SamplerStat.mode,
        SamplerStat.p_at_least,
        SamplerStat.p_equals,
    ),
}


class SpecCurve(BaseModel):
    expr: str = Field(max_length=200, description="y in x, the knob param and variable names")
    mode: Literal["value", "slope", "area", "limit"] = Field(
        default="value",
        description="value: y at ask_x (or the x reaching ask_y); slope: derivative at ask_x; "
        "area: integral from area_from to area_to (knob = rectangles); limit: limit at ask_x",
    )
    x_min: float
    x_max: float
    x_label: str = Field(default="", max_length=60)
    y_label: str = Field(default="", max_length=60)
    ask_x: float | None = None
    ask_y: float | None = None
    area_from: float | None = None
    area_to: float | None = None
    knob: Explore

    @model_validator(mode="after")
    def _ask_fits(self) -> SpecCurve:
        if self.x_max <= self.x_min:
            raise ValueError("curve needs x_min < x_max")
        if self.mode == "value" and (self.ask_x is None) == (self.ask_y is None):
            raise ValueError("value curve needs exactly one of ask_x or ask_y")
        if self.mode in ("slope", "limit"):
            if self.ask_x is None or not self.x_min <= self.ask_x <= self.x_max:
                raise ValueError(f"{self.mode} curve needs ask_x inside the x range")
        if self.mode == "area":
            lo, hi = self.area_from, self.area_to
            if lo is None or hi is None or not self.x_min <= lo < hi <= self.x_max:
                raise ValueError("area curve needs x_min <= area_from < area_to <= x_max")
        k = self.knob
        if k.max <= k.min or k.default is None or not k.min <= k.default <= k.max:
            raise ValueError("knob needs min < max and a default inside the range")
        return self


class SpecSampler(BaseModel):
    sampler: Sampler
    params: SamplerParams
    stat: SamplerStat
    k: float | None = Field(default=None, description="Threshold for p_* stats")
    x_label: str = Field(default="", max_length=60)

    @model_validator(mode="after")
    def _stat_fits(self) -> SpecSampler:
        if self.stat not in SAMPLER_STATS[self.sampler]:
            raise ValueError(f"stat {self.stat.value} doesn't fit sampler {self.sampler.value}")
        if self.stat.value.startswith("p_") and self.stat not in (
            SamplerStat.p_true_positive,
            SamplerStat.p_match,
        ):
            if self.k is None:
                raise ValueError(f"stat {self.stat.value} needs k")
        return self


class SpecOption(BaseModel):
    id: Slug
    text: str = Field(max_length=200)
    value: float | None = Field(
        default=None, description="The number this option stands for (needed on the correct one)"
    )
    misconception_id: Slug | None = None


class Prediction(BaseModel):
    prompt: str = Field(max_length=300)
    input: Literal["slider", "choice"]
    slider: SliderSpec | None = None
    options: list[SpecOption] = Field(default_factory=list, max_length=6)

    @model_validator(mode="after")
    def _fits(self) -> Prediction:
        if self.input == "slider" and self.slider is None:
            raise ValueError("slider prediction needs a slider")
        if self.input == "choice":
            if len(self.options) < 2:
                raise ValueError("choice prediction needs >= 2 options")
            if sum(o.misconception_id is None for o in self.options) != 1:
                raise ValueError("choice prediction needs exactly one correct option")
        return self


class SpecExtreme(BaseModel):
    param: VarName
    value: float
    watch: str = Field(max_length=160)


class SpecCase(BaseModel):
    """One runnable case: a widget, its numbers, a prediction and how to read it."""

    widget: SpecWidget
    approximate: bool = Field(
        default=False,
        description="True: a simplified picture of the main relationship, not an established "
        "formula; shown as 'approximate picture, not a full model'",
    )
    variables: list[Variable] = Field(default_factory=list, max_length=8)
    curve: SpecCurve | None = None
    sampler: SpecSampler | None = None
    prediction: Prediction
    bands: list[Band] = Field(default_factory=list, max_length=8)
    extremes: list[SpecExtreme] = Field(default_factory=list, max_length=3)
    answer_claimed: float | None = Field(
        default=None, description="The generator's own number: cross-checked, never shown"
    )

    @model_validator(mode="after")
    def _widget_body(self) -> SpecCase:
        bodies = {"curve": self.curve, "sampler": self.sampler}
        if bodies[self.widget.value] is None:
            raise ValueError(f"{self.widget.value} case needs its {self.widget.value} block")
        if self.prediction.input == "slider" and not self.bands:
            raise ValueError("slider prediction needs bands")
        names = [v.name for v in self.variables]
        if len(set(names)) != len(names):
            raise ValueError("variable names must be unique")
        return self


class SpecCompare(BaseModel):
    topic: str = Field(max_length=120)
    prompt: str = Field(default="What's the same about how these work?", max_length=200)
    shared_principle: str = Field(max_length=300)
    case: SpecCase | None = Field(
        default=None, description="Same widget kind as the main case, different surface"
    )


class ModelSpec(BaseModel):
    """Engine v4: what the generator writes for a typed topic."""

    spec_version: Literal[4] = 4
    slug: Slug
    topic: str = Field(max_length=120)
    concept: str = Field(max_length=300, description="The idea in plain words")
    definition: str = Field(
        max_length=300, description="One plain sentence defining the topic (real concepts only)"
    )
    case: SpecCase
    misconceptions: list[Misconception] = Field(
        min_length=1, max_length=3, description="The first one is the main named mistake"
    )
    compare: SpecCompare | None = None

    @model_validator(mode="after")
    def _consistent(self) -> ModelSpec:
        if self.compare and self.compare.case and self.compare.case.widget != self.case.widget:
            raise ValueError("compare case must use the same widget as the main case")
        known = {m.id for m in self.misconceptions}
        cases = [self.case] + ([self.compare.case] if self.compare and self.compare.case else [])
        for c in cases:
            refs = [b.misconception_id for b in c.bands]
            refs += [o.misconception_id for o in c.prediction.options]
            missing = {r for r in refs if r is not None} - known
            if missing:
                raise ValueError(f"unknown misconceptions {missing}")
        return self
