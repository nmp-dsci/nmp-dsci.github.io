---
name: design-audit
description: Score nmp-dsci.github.io against its own design rubric and the DESIGN.md never-list, using measurements from a real browser rather than judgement. Produces a comparable number and a fix list ordered by impact. Use before shipping a visual change, or when the user asks for a design audit, a design review, or invokes /design-audit.
argument-hint: [--quick] [--url <base>] [--pages <n>]
user-invocable: true
---

# design-audit

The site scored **137/145 (94%)** once, by hand, in
`.lavish/s05_design-evaluation-redesign.html`. A score that is never re-run is a
score that quietly stops being true: the next change can undo it and nothing
says so. This skill makes it repeatable.

It is the composition counterpart to `scripts/contrast_audit.py`. That script
already proves colour in CI; this proves layout, type and rhythm — the parts a
machine can measure — and asks for judgement only on the parts it cannot.

**Authorities, in order.** When this file disagrees with one of them, it is
wrong:

- `DESIGN.md` — the brief, and the numbered "Never do this" list
- `assets/css/tokens.css` — the scale, the palette, the `@contrast` contract
- `.lavish/s05_design-evaluation-redesign.html` — the twelve-dimension rubric
  and the 137/145 baseline
- `.lavish/s06_studio-design-upgrade-plan.html` — the s20 lever scoring and what
  was deliberately rejected

## Run it

```bash
# 1 · the two checks that already gate CI — start here, they are cheap
uv run --no-project python scripts/contrast_audit.py
uv run --with pyyaml --no-project python scripts/lint_case_study.py --all --no-net

# 2 · build, and serve the build (never audit the source)
docker run --rm -e JEKYLL_NO_BUNDLER_REQUIRE=true \
  -v "$PWD":/site -w /site ghp-jekyll:local jekyll build -d /site/_o -q
(cd _o && python3 -m http.server 8792 &)
```

Then sweep **all eight pages** — `/`, `/about/`, three `/projects/*/`, three
`/practices/*/` — at **390 / 768 / 1280 px**, in **both themes**.

## The measured floor

Every one of these is pass/fail and none of them needs an opinion. A failure
here is a bug, not a preference.

| # | Check | Passes when |
|---|---|---|
| M1 | Type floor (DESIGN.md rule 2) | 0 text nodes render under 12.8px, inline `code` and SVG labels included |
| M2 | Horizontal overflow | `documentElement.scrollWidth <= clientWidth` at every width |
| M3 | Contained overflow | Any element wider than its parent has an ancestor with `overflow-x:auto` |
| M4 | SVG labels | No `<text>` exceeds its box — check with `getBBox()`, not by eye |
| M5 | Type scale | Every rendered `font-size` resolves to a `--t-*` token; 6–9 distinct sizes per page |
| M6 | Contrast | `contrast_audit.py` reports 0 failing across both themes |
| M7 | Reduced motion | With `prefers-reduced-motion: reduce`, no element animates |
| M8 | Reveal safety | With every animation frozen at its start state, **nothing is invisible** — 0 cells under 50% opacity, 0 SVG connectors left dashed |
| M9 | Focus | Every interactive element shows a visible ring with an offset |
| M10 | No-JS | With scripting off: the page reads, the nav dropdown still opens, no content is hidden |

**M8 is not optional.** A reveal that hides content until it completes has made
the animation load-bearing. That bug shipped once in this repo — the matrix
cascade faded opacity from 0 under `animation-fill-mode: backwards` — and it is
exactly the failure this row exists to catch.

## The judged half

Score each out of the weight in the s05 rubric, then total against 145. Say what
you measured; never assert a score you did not check.

1. **First viewport** — does it answer "who, what, can he run it?" without scrolling?
2. **Hierarchy** — one main character per section, or several competing?
3. **Typography** — three tiers with distinct treatment; exactly one decorated keyword
4. **Colour discipline** — accent only for action, link and "shipped"; amber only for partial
5. **Rhythm** — does the layout change shape as the page progresses, with a reason?
6. **Scan layer** — can a 60-second visitor get the point without reading a paragraph?
7. **Evidence** — every number carrying its denominator, every figure captioning its takeaway
8. **Motion** — micro only, one signature moment, nothing load-bearing
9. **Wayfinding** — nav, dropdown and page tree agree, and none is hand-maintained
10. **Mobile** — real device widths, not a shrunk desktop
11. **Consistency** — one radius, one shadow, one ladder; no orphan values in `main.css`
12. **Performance & a11y** — page weight, font strategy, landmarks, heading order

## Then check the never-list

Walk all fourteen items in `DESIGN.md §3` explicitly and report each as held or
broken. They encode decisions already made and paid for; a "small improvement"
that breaks one is a regression, not an improvement.

## Report

- The total against 145, beside the 137/145 baseline, and **the delta**
- Every measured failure with the file and line that causes it
- A fix list ordered by impact, not by ease
- What you could not check, and why — an unmeasured dimension is reported as
  unmeasured, never scored on a guess

Lighthouse and axe have no runner in this repo. If they have not been run
against the live URL, dimension 12 is reported as partial with that reason
stated, not scored out of optimism.
