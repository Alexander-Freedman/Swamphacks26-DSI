"""Backend truth checks. The browser computes what judges see; this module
re-derives the same numbers so the linter and tests can catch bad specs."""

from __future__ import annotations

import ast
import math
import operator
import re

_BIN = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
}
_FUNCS = {
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "exp": math.exp,
    "log": math.log,
    "log2": math.log2,
    "log10": math.log10,
    "sqrt": math.sqrt,
    "abs": abs,
    "min": min,
    "max": max,
    "pow": pow,
}


def eval_expr(expr: str, **names: float) -> float:
    """Evaluate the shared mathjs subset: numbers, + - * / ^, a few functions, named vars."""
    if len(expr) > 200 or "**" in expr or re.search(r"\d_\d", expr):
        raise ValueError("expression outside the shared subset")
    try:
        tree = ast.parse(expr.replace("^", "**"), mode="eval")
    except (SyntaxError, RecursionError) as err:
        raise ValueError(f"unparseable expression: {type(err).__name__}") from err

    def ev(node: ast.AST) -> float:
        if isinstance(node, ast.Expression):
            return ev(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.BinOp) and type(node.op) in _BIN:
            return _BIN[type(node.op)](ev(node.left), ev(node.right))
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
            v = ev(node.operand)
            return -v if isinstance(node.op, ast.USub) else v
        if isinstance(node, ast.Name) and node.id in names:
            return float(names[node.id])
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id in _FUNCS
            and not node.keywords
        ):
            return float(_FUNCS[node.func.id](*(ev(a) for a in node.args)))
        raise ValueError(f"unsupported expression: {ast.dump(node)[:80]}")

    try:
        return ev(tree)
    except RecursionError as err:
        raise ValueError("expression too deep") from err


def coin_longest_run_expected(n: int) -> float:
    """Exact expected longest run (either side) in n fair flips, by DP over run length."""
    total = 0.0
    for k in range(1, n + 1):
        total += 1 - p_longest_run_below(n, k)
    return total


def p_longest_run_below(n: int, k: int) -> float:
    """P(longest run < k) in n fair flips."""
    if k <= 1:
        return 0.0
    dist = [0.0] * k
    dist[1] = 1.0
    for _ in range(n - 1):
        new = [0.0] * k
        for r in range(1, k):
            new[1] += dist[r] / 2
            if r + 1 < k:
                new[r + 1] += dist[r] / 2
        dist = new
    return sum(dist)


def positive_test_chance(base_rate: float, sensitivity: float, false_positive_rate: float) -> float:
    hit = base_rate * sensitivity
    return hit / (hit + (1 - base_rate) * false_positive_rate)


def birthday_match_probability(group_size: int, days: int = 365) -> float:
    p_none = 1.0
    for i in range(group_size):
        p_none *= (days - i) / days
    return 1 - p_none


def band_for(bands, value: float):
    """The band a slider answer falls in: bands sorted by min, inclusive, first match.

    Mirrored in the frontend; documented in shared/schema/README.md.
    """
    for b in sorted(bands, key=lambda b: b.min):
        if b.min <= value <= b.max:
            return b
    return None


def dice_sum_pmf(dice: int) -> dict[int, float]:
    """Exact distribution of the sum of `dice` fair d6."""
    dist = {0: 1.0}
    for _ in range(dice):
        new: dict[int, float] = {}
        for total, p in dist.items():
            for face in range(1, 7):
                new[total + face] = new.get(total + face, 0.0) + p / 6
        dist = new
    return dist


def binomial_pmf(n: int, p: float) -> dict[int, float]:
    if p in (0.0, 1.0):
        return {k: float(k == round(n * p)) for k in range(n + 1)}
    log_c = math.lgamma(n + 1)
    lp, lq = math.log(p), math.log(1 - p)
    return {
        k: math.exp(log_c - math.lgamma(k + 1) - math.lgamma(n - k + 1) + k * lp + (n - k) * lq)
        for k in range(n + 1)
    }


MAX_RUN_N = 2000  # the longest-run DP is O(n * k); bigger n would stall a request


def sampler_stat(sampler: str, params: dict, stat: str, k: float | None = None) -> float:
    """The number a sampler question asks about, computed exactly (probabilities in percent).

    Raises ValueError for a stat that doesn't fit the sampler or missing params.
    """

    def need(name: str):
        v = params.get(name)
        if v is None:
            raise ValueError(f"sampler {sampler} needs {name}")
        return v

    if sampler == "coin_longest_run":
        n = int(need("n"))
        if params.get("p") not in (None, 0.5):
            raise ValueError("coin_longest_run is a fair coin (p = 0.5)")
        if n > MAX_RUN_N:
            raise ValueError(f"coin_longest_run n > {MAX_RUN_N}")
        if stat == "mean_longest_run":
            return coin_longest_run_expected(n)
        if stat == "p_run_at_least" and k is not None:
            return 100 * (1 - p_longest_run_below(n, math.ceil(k)))
    elif sampler == "base_rate_test" and stat == "p_true_positive":
        return 100 * positive_test_chance(
            need("base_rate"), need("sensitivity"), need("false_positive_rate")
        )
    elif sampler == "birthday_match" and stat == "p_match":
        return 100 * birthday_match_probability(int(need("group_size")))
    elif sampler in ("binomial_count", "dice_sum"):
        if sampler == "dice_sum":
            pmf = dice_sum_pmf(int(need("dice")))
        else:
            n = int(need("n"))
            if n > 10000:
                raise ValueError("binomial n too big")
            pmf = binomial_pmf(n, float(need("p")))
        if stat == "mean":
            return sum(x * p for x, p in pmf.items())
        if stat == "mode":
            best = max(pmf.values())
            modes = [x for x, p in pmf.items() if math.isclose(p, best, rel_tol=1e-9)]
            if len(modes) != 1:
                raise ValueError("no single most likely value")
            return float(modes[0])
        if stat == "p_at_least" and k is not None:
            return 100 * sum(p for x, p in pmf.items() if x >= k - 1e-9)
        if stat == "p_equals" and k is not None:
            return 100 * sum(p for x, p in pmf.items() if abs(x - k) < 1e-9)
    raise ValueError(f"stat {stat} doesn't fit sampler {sampler}")
