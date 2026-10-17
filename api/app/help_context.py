"""What the help chat knows about each screen of the three showcase sessions.

Screens and guidance lines follow docs/experience.md. True values are computed
here from app/truth.py and the round files, never taken from the client.
`guards` list what must not appear in an answer before lock-in.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from functools import cache

from app.rounds import showcase_rounds
from app.truth import (
    birthday_match_probability,
    coin_longest_run_expected,
    positive_test_chance,
)


@dataclass(frozen=True)
class NumGuard:
    """A number that leaks the answer if it shows up within `tol` of `value`."""

    value: float
    tol: float


@dataclass(frozen=True)
class Screen:
    id: str
    round_slug: str
    guidance: str  # the one-line "what to do and why" from the storyboard
    on_screen: str  # what the learner sees and can touch
    hint: str  # static hint: offline/capped fallback and leak replacement
    truth_text: str  # shared with the model only after lock-in
    question: str = ""  # the guess asked on this screen, if any
    nums: tuple[NumGuard, ...] = ()
    patterns: tuple[str, ...] = ()  # regexes (case-insensitive) that leak
    allowed: tuple[str, ...] = field(default=())  # extra text whose numbers are fine to repeat


# --- true values (computed, not typed in) ---------------------------------


def _first_n_at_least(p: float) -> int:
    n = 1
    while birthday_match_probability(n) < p:
        n += 1
    return n


B_HALF = _first_n_at_least(0.5)  # 23
B_HALF_P = birthday_match_probability(B_HALF) * 100  # 50.7
B_PAIRS = B_HALF * (B_HALF - 1) // 2  # 253
B_99 = _first_n_at_least(0.99)  # 57
B_CLASS = 30
B_CLASS_P = birthday_match_probability(B_CLASS) * 100  # 70.6

C_RUN = coin_longest_run_expected(100)  # 6.977

P1_CHANCE = positive_test_chance(0.01, 0.9, 0.09) * 100  # 9.17
P1_POSITIVES = round(10 * 0.9 + 990 * 0.09)  # 98
P6_CHANCE = positive_test_chance(0.02, 0.95, 0.05) * 100  # 27.9
P6_POSITIVES = round(20 * 0.95 + 980 * 0.05)  # 68


def _correct_option(round_slug: str, item_id: str) -> str:
    item = next(i for i in showcase_rounds()[round_slug].items if i.id == item_id)
    return next(o.id for o in item.options if o.misconception_id is None)


@cache
def screens() -> dict[str, Screen]:
    bday_q = showcase_rounds()["birthday"].items[0].prompt
    coin_q = showcase_rounds()["coin-streak"].items[0].prompt
    real_item = next(i for i in showcase_rounds()["coin-streak"].items if i.id == "which-is-real")
    real = _correct_option("coin-streak", "which-is-real").upper()
    fake = "A" if real == "B" else "B"
    ptest_q = showcase_rounds()["positive-test"].items[0].prompt

    b_guard = dict(
        nums=(
            NumGuard(B_HALF, 0.5),
            NumGuard(B_HALF_P, 0.5),
            NumGuard(B_PAIRS, 0.5),
        ),
        patterns=(r"twenty[- ]three",),
    )
    b_truth = (
        f"{B_HALF} people give a {B_HALF_P:.1f}% chance of a shared birthday "
        f"({B_PAIRS} pairs); {B_99} people give 99%."
    )
    c_guard = dict(
        nums=(NumGuard(C_RUN, 0.55), NumGuard(97, 0.5)),
        patterns=(r"\bseven\b",),
    )
    c_truth = (
        f"In 100 fair flips the longest run averages about {C_RUN:.1f}; "
        "a run of 5 or more shows up about 97% of the time. "
        "Doubling the flips adds only about 1 to the typical longest run."
    )
    p1_guard = dict(
        nums=(NumGuard(P1_CHANCE, 0.6), NumGuard(P1_POSITIVES, 0.5)),
        patterns=(
            r"(about|around|roughly|only|just|nearly|~)\s*9\b",
            r"\b1 in 11\b",
            r"\b9 (out )?of (the |about |roughly )?(98|99|100)\b",
            r"\b(under|less than|below) 10 ?(%|percent)",
            r"\bnine percent\b",
            r"\bmost (of the )?positives? (are|come from|would be) (false|healthy)",
        ),
    )
    p1_truth = (
        f"Of 1,000 people, 10 are sick: 9 test positive, plus about 89 healthy false alarms, "
        f"so about {P1_POSITIVES} positives. Chance you have it after a positive: "
        f"{P1_CHANCE:.1f}%."
    )

    rows = [
        # Birthday
        Screen(
            "B1",
            "birthday",
            "Guess first: how many people until it's a coin flip that two share a birthday? "
            "Your guess stays on screen.",
            "A slider from 2 to 366 and a confidence choice; nothing is revealed yet.",
            "Think about pairs, not people: every new person can match everyone already in "
            "the room. Set the slider to your honest guess; the next screens show you.",
            b_truth,
            question=bday_q,
            **b_guard,
        ),
        Screen(
            "B2",
            "birthday",
            "Add people one by one. Each line is a pair that could share a birthday: notice "
            "how fast pairs pile up.",
            "A 365-day calendar strip and a room. 'Add a person' drops someone on their "
            "birthday; lines join every pair; a counter shows people and pairs.",
            "Tap 'Add a person' a few times and watch the pairs counter: it grows much faster "
            "than the people count.",
            b_truth,
        ),
        Screen(
            "B3",
            "birthday",
            "A match! Empty the room and try again a few times: how many people does it "
            "usually take?",
            "When two people land on the same day it circles in yellow. A small dot plot "
            "collects how many people it took each time; your guess tick sits on it.",
            "Empty the room and fill it again 3 or 4 times, then look where the dots bunch up "
            "compared with your tick.",
            b_truth,
        ),
        Screen(
            "B4",
            "birthday",
            "Draw how you think the chance grows as the room fills. There's no wrong drawing; "
            "it's your model.",
            "Empty axes: people (2-80) across, chance of a match (0-100%) up. You draw your "
            "curve with a finger.",
            "Draw what you believe; no need to be right. Ask yourself: does adding the 20th "
            "person add the same as adding the 2nd?",
            b_truth,
            question="Draw how the chance of a shared birthday grows from 2 to 80 people.",
            nums=(*b_guard["nums"], NumGuard(B_99, 0.5)),
            patterns=(*b_guard["patterns"], r"\bs[- ]?(curve|shaped)\b"),
        ),
        Screen(
            "B5",
            "birthday",
            "Here's the real curve over yours. Drag the group size to see where your model and "
            "reality part.",
            "The real curve (ink) drawn over your pencil curve, the gap shaded yellow, and a "
            "group-size slider moving a dot along the real curve with a pairs counter.",
            f"Drag the group size to {B_HALF} and then to {B_99} and watch the dot and the "
            "pairs counter.",
            b_truth,
        ),
        Screen(
            "B6",
            "birthday",
            "This is the mistake your guess points to, and the one idea that fixes it.",
            "A stamped verdict and a card naming the likely mistake, why it's tempting and "
            "the right idea.",
            "Read the card: the trap is thinking about your own birthday. The room counts "
            "every pair.",
            b_truth,
        ),
        Screen(
            "B7",
            "birthday",
            "One more, with new numbers: does the idea stick?",
            "A rematch question: in a class of 30, is a shared birthday more or less likely "
            "than not?",
            "Count the pairs in a class of 30 and compare with the room you filled earlier.",
            f"In a class of {B_CLASS} a shared birthday has a {B_CLASS_P:.1f}% chance, so it is "
            "more likely than not.",
            question="In a class of 30, is a shared birthday more or less likely than not?",
            nums=(NumGuard(B_CLASS_P, 1.0), NumGuard(B_CLASS * (B_CLASS - 1) / 2, 0.5)),
            patterns=(r"more likely than not", r"\blikely,? yes\b", r"\bit'?s more likely\b"),
        ),
        # Coin streak
        Screen(
            "C1",
            "coin-streak",
            "Make up 20 coin flips the way you think a fair coin looks. We'll compare yours "
            "with real ones.",
            "An empty row of 20 coin slots. You tap each one H or T; your longest run gets "
            "underlined.",
            "Just tap out 20 flips the way a fair coin feels to you; there's no wrong row here.",
            c_truth,
            **c_guard,
        ),
        Screen(
            "C2",
            "coin-streak",
            "Your row on top, real flips below. Flip again a few times: which one clumps?",
            "Your row and 20 real flips under it; the longest run in each row is underlined "
            "and a tally compares them. A 'Flip again' button deals new real flips.",
            "Press 'Flip again' 3 or 4 times and compare the underlined runs: which row has "
            "the longer ones?",
            c_truth,
            **c_guard,
        ),
        Screen(
            "C3",
            "coin-streak",
            "Guess first: in 100 flips, what's the longest run of the same side? Your guess "
            "stays on screen.",
            "A slider from 1 to 20 and a confidence choice; nothing is revealed yet.",
            "Remember the real rows on the last screen: they had longer runs than yours. "
            "Now picture 5 times as many flips and set the slider.",
            c_truth,
            question=coin_q,
            **c_guard,
        ),
        Screen(
            "C4",
            "coin-streak",
            "Each dot is one real round of 100 flips. See where most of them land compared "
            "with your guess.",
            "A histogram of the longest run from 10,000 simulated rounds of 100 flips, a mean "
            "line, your pencil tick on top. Tap a bar to see one of its rounds.",
            "Find the tallest bars and compare them with your tick; tap a bar to see a real "
            "row of 100 flips with its run highlighted.",
            c_truth,
        ),
        Screen(
            "C5",
            "coin-streak",
            "Drag to flip more or fewer coins. Watch how slowly, but surely, streaks grow.",
            "A flips slider from 10 to 10,000 (log scale) and the real curve of the typical "
            "longest run; you can draw your own curve first.",
            "Drag the flips slider from 100 to 200 to 400 and watch the dot: each doubling "
            "adds only about one to the longest run.",
            c_truth,
        ),
        Screen(
            "C6",
            "coin-streak",
            "This is the mistake your guess points to, and the one idea that fixes it.",
            "A stamped verdict and a card naming the likely mistake, why it's tempting and "
            "the right idea.",
            "Read the card: real randomness clumps. Evenly mixed rows are what people make up.",
            c_truth,
        ),
        Screen(
            "C7",
            "coin-streak",
            "One more: spot the real coin. Does the idea stick?",
            "Two rows of 20 flips, A and B; you tap the one you think is real.",
            "Look at the longest run in each row. Which one looks like the real rows you "
            "flipped on screen two?",
            f"Row {real} is the real coin; row {fake} switches too often, which is what people "
            "make up.",
            question=real_item.prompt,
            patterns=(
                rf"\b(row |option )?{real}\b[^.]{{0,25}}\b(is|was|looks)\b[^.]{{0,15}}"
                r"\b(real|flipped|genuine|the coin)",
                rf"\b(real|flipped|genuine)( one| coin| row)? (is|was)\b[^.]{{0,10}}"
                rf"\b(row |option )?{real}\b",
                rf"\b(row |option )?{fake}\b[^.]{{0,25}}\b(is|was|looks)\b[^.]{{0,15}}"
                r"\b(made up|fake|invented|human)",
                rf"\b(pick|choose|tap|go with) (row |option )?{real}\b",
            ),
        ),
        # Positive test
        Screen(
            "P1",
            "positive-test",
            "Guess first: you tested positive. What's the chance you actually have it? Your "
            "guess stays on screen.",
            "The question with a 0-100% slider and a confidence choice; nothing is revealed yet.",
            "Picture 1,000 people: how many are sick, and how many healthy people would the "
            "test wrongly flag? Set the slider to your gut answer.",
            p1_truth,
            question=ptest_q,
            **p1_guard,
        ),
        Screen(
            "P2",
            "positive-test",
            "Here are 1,000 people; 10 are sick. Test everyone and watch who comes up positive.",
            "A grid of 1,000 dots, 10 sick ones in ink. 'Test everyone' lights up the "
            "positives row by row.",
            "Tap 'Test everyone' and count how many lit dots are ink (sick) and how many are "
            "grey (healthy).",
            p1_truth,
        ),
        Screen(
            "P3",
            "positive-test",
            "These are all the positives. Tap a few: how many are actually sick?",
            "Only the positive dots gather into one pile: a few ink (sick) among many grey "
            "(healthy). Tapping a dot says 'sick, caught' or 'healthy, false alarm'.",
            "Tap a handful of dots in the pile; most say 'false alarm'. Compare the ink share "
            "with your guess.",
            p1_truth,
        ),
        Screen(
            "P4",
            "positive-test",
            "Drag how common the condition is. Watch what a positive result really means change.",
            "A slider for how common it is (0.1% to 50%). The grid re-deals live and a curve "
            "shows the chance you have it after a positive; your guess is a flat pencil line.",
            "Drag 'how common' from 1% up to 20% and watch the curve climb away from your flat "
            "line.",
            p1_truth,
        ),
        Screen(
            "P5",
            "positive-test",
            "This is the mistake your guess points to, and the one idea that fixes it.",
            "A stamped verdict and a card naming the likely mistake, why it's tempting and "
            "the right idea.",
            "Read the card: the test's accuracy is not your chance. How rare the condition is "
            "matters most.",
            p1_truth,
        ),
        Screen(
            "P6",
            "positive-test",
            "Same test, new numbers: does the idea stick?",
            "Same story with new numbers: 2% have it, the test catches 95%, and 5% of healthy "
            "people get a false alarm. A slider and a mini grid of 1,000 people.",
            "Picture 1,000 people again: 20 sick, 980 healthy. Count the true positives and "
            "the false alarms before you slide.",
            f"Of 1,000 people about {P6_POSITIVES} test positive and 19 of them are sick: "
            f"{P6_CHANCE:.1f}%.",
            question="2% of people have it, the test catches 95% and false-alarms on 5%. "
            "You test positive. Chance you have it?",
            nums=(NumGuard(P6_CHANCE, 0.6), NumGuard(P6_POSITIVES, 0.5)),
            patterns=(r"\babout a quarter\b", r"\bone in (3|4|four|three)\b"),
            allowed=("20 sick, 980 healthy, 1,000 people",),
        ),
    ]
    return {s.id: s for s in rows}


SESSION_ALIASES = {
    "birthday": "birthday",
    "bday": "birthday",
    "coin": "coin-streak",
    "coin-streak": "coin-streak",
    "positive-test": "positive-test",
    "ptest": "positive-test",
}

_NUM = re.compile(r"\d[\d,]*(?:\.\d+)?")


def _numbers(text: str) -> list[float]:
    out = []
    for m in _NUM.finditer(text or ""):
        try:
            out.append(float(m.group().replace(",", "")))
        except ValueError:
            continue
    return out


def leaks(screen: Screen, text: str) -> bool:
    """True if `text` gives away this screen's answer (numbers already on screen are fine)."""
    allowed = set(
        _numbers(" ".join((screen.question, screen.on_screen, screen.guidance, *screen.allowed)))
    )
    for n in _numbers(text):
        if n in allowed:
            continue
        if any(abs(n - g.value) <= g.tol for g in screen.nums):
            return True
    return any(re.search(p, text or "", re.IGNORECASE) for p in screen.patterns)
