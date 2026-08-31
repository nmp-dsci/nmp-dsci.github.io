#!/usr/bin/env python3
"""contrast_audit.py — fail the build when a declared text/surface pair misses WCAG AA.

The design tokens live in one file (assets/css/tokens.css). Every pair that has to
pass a contrast ratio is declared there in `@contrast` comment lines, e.g.

    /* @contrast --faint --bg 4.5 | --accent --panel 4.5 | --line-2 --bg 3.0 */

This script resolves each token in both themes — the `:root` block (light, the
reference palette) and the `:root[data-theme="dark"]` block, which inherits any
token it does not redefine — computes the WCAG 2.x contrast ratio, and exits
non-zero if any declared pair falls short.

    uv run --no-project python scripts/contrast_audit.py
    uv run --no-project python scripts/contrast_audit.py assets/css/tokens.css --quiet

No third-party dependencies: it runs anywhere Python 3 does, including CI.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

HEX = re.compile(r"^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$")
DECL = re.compile(r"(--[\w-]+)\s*:\s*([^;}]+)")
CONTRAST = re.compile(r"@contrast([^*]+)")
PAIR = re.compile(r"(--[\w-]+)\s+(--[\w-]+)\s+([0-9.]+)")


def _expand(h: str) -> str:
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return h


def relative_luminance(hex_colour: str) -> float:
    h = _expand(hex_colour)
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))

    def channel(v: float) -> float:
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4

    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast_ratio(fg: str, bg: str) -> float:
    a, b = relative_luminance(fg), relative_luminance(bg)
    lighter, darker = max(a, b), min(a, b)
    return (lighter + 0.05) / (darker + 0.05)


def _strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", " ", css, flags=re.S)


def read_block(css: str, selector: str) -> dict[str, str]:
    """Return the hex-valued custom properties declared in one top-level block."""
    start = css.find(selector)
    while start != -1:
        # Make sure we matched the whole selector, not a prefix of a longer one.
        after = css[start + len(selector) :].lstrip()
        if after.startswith("{"):
            break
        start = css.find(selector, start + 1)
    if start == -1:
        return {}
    open_brace = css.index("{", start)
    depth, i = 0, open_brace
    while i < len(css):
        if css[i] == "{":
            depth += 1
        elif css[i] == "}":
            depth -= 1
            if depth == 0:
                break
        i += 1
    body = _strip_comments(css[open_brace + 1 : i])
    out: dict[str, str] = {}
    for name, value in DECL.findall(body):
        value = value.strip()
        if HEX.match(value):
            out[name] = value
    return out


def read_pairs(css: str) -> list[tuple[str, str, float]]:
    pairs: list[tuple[str, str, float]] = []
    for block in CONTRAST.findall(css):
        for fg, bg, need in PAIR.findall(block):
            pairs.append((fg, bg, float(need)))
    return pairs


def audit(path: Path, quiet: bool = False) -> int:
    css = path.read_text(encoding="utf-8")
    light = read_block(css, ":root")
    dark = {**light, **read_block(css, ':root[data-theme="dark"]')}
    themes = {"light": light, "dark": dark}

    pairs = read_pairs(css)
    if not pairs:
        print(f"contrast_audit: no @contrast declarations found in {path}", file=sys.stderr)
        return 1
    if not light:
        print(f"contrast_audit: no :root token block found in {path}", file=sys.stderr)
        return 1

    failures = 0
    checked = 0
    for theme, tokens in themes.items():
        for fg, bg, need in pairs:
            checked += 1
            if fg not in tokens or bg not in tokens:
                missing = fg if fg not in tokens else bg
                print(f"  {theme:<5} {fg:<16} on {bg:<16}  UNRESOLVED ({missing} is not a hex token)")
                failures += 1
                continue
            ratio = contrast_ratio(tokens[fg], tokens[bg])
            ok = ratio + 1e-9 >= need
            if not ok or not quiet:
                mark = "ok  " if ok else "FAIL"
                print(
                    f"  {theme:<5} {fg:<16} on {bg:<16}  "
                    f"{tokens[fg]} / {tokens[bg]}  {ratio:5.2f}:1  need {need:.1f}  {mark}"
                )
            failures += not ok

    print(f"\ncontrast_audit: {checked} pairs checked across {len(themes)} themes, {failures} failing")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("tokens", nargs="?", default="assets/css/tokens.css", type=Path)
    ap.add_argument("--quiet", action="store_true", help="print only failures")
    args = ap.parse_args()
    if not args.tokens.exists():
        print(f"contrast_audit: {args.tokens} not found", file=sys.stderr)
        return 1
    return audit(args.tokens, args.quiet)


if __name__ == "__main__":
    raise SystemExit(main())
