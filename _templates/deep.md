---
# ============================================================================
# DEEP-PAGE SCAFFOLD — copy to _deep/<project-slug>/<name>.md.
#
#   A deep page is one system's setup in full: the level under a case study.
#   The case study is the 60–90 second scan and keeps the card lines, the
#   rubric and the headline number; this page is allowed to be long,
#   command-heavy and dated, and it is maintained every cycle.
#
#   Contract:  `project` resolves to _projects/<slug>.md AND that case study
#              lists this page under `deep:` (the link runs both ways) ·
#              `rubric` keys resolve · `updated` is the date the numbers were
#              last re-run and `evidence_note` carries that date · the five
#              H2s below appear in order · no body paragraph over 80 words ·
#              every number sits beside the command that reproduces it.
#              Not a second README: paste only the commands that reproduce a
#              number, link the README for the rest. DESIGN.md is the brief.
#   URL:       _deep/<project-slug>/<name>.md → /projects/<project-slug>/<name>/
#   Validate:  uv run --with pyyaml --no-project python scripts/lint_case_study.py \
#                _deep/<project-slug>/<name>.md
# ============================================================================

title: ""                    # e.g. "The ConvFinQA eval loop"
short: ""                    # the label the footer page tree prints
kicker: "deep dive"          # crumb text after the parent's title
project: ""                  # _projects/<slug>.md this page belongs to
rubric: []                   # dimension keys from _data/rubric.yml this page explains
summary: >-                  # ≤ 2 sentences — what the page is, who it is for.
  ""
tldr: >-                     # One line.
  ""
updated: 2026-01-01          # the date every number on the page was last re-run
evidence_note: >-            # How to re-run the numbers; MUST name the `updated` date.
  ""

# Optional, linted the same way as a case study's when present.
sections:
  - {n: 1, summary: ""}
  - {n: 2, summary: ""}
  - {n: 3, summary: ""}
  - {n: 4, summary: ""}
  - {n: 5, summary: ""}
---

## Setup

<!-- What has to exist before a cycle can run: the tracking server, the split
     manifest, the environment variables, the one choke point. Commands that
     create state, with the file each one writes. -->

## One cycle

<!-- The steps in order, each with the command, the artefact it writes and the
     library doing the work. Tables over prose. -->

## Gate & promote

<!-- The rule, the statistic recorded on every verdict, what is refused, and
     the append-only history it lands on. -->

## Cycle log

<!-- One row per cycle, newest first: date · version · what changed · split ·
     n · fixed / broken · p · verdict. Refusals are rows too. -->

## What changed since

<!-- Dated protocol changes, newest first, each with the commit or path that
     made it. This is the section that grows. -->
