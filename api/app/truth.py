"""Backend truth checks. The browser computes what judges see; this module
re-derives the same numbers so the linter and tests can catch bad specs."""

from __future__ import annotations

import ast
import math
import operator

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
    "sqrt": math.sqrt,
    "abs": abs,
    "min": min,
    "max": max,
}


def eval_expr(expr: str, **names: float) -> float:
    """Evaluate the shared mathjs subset: numbers, + - * / ^, a few functions, named vars."""
    tree = ast.parse(expr.replace("^", "**"), mode="eval")

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

    return ev(tree)


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
