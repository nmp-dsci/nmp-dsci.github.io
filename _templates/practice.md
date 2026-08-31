---
# ============================================================================
# PRACTICE SCAFFOLD — copy to _practices/<slug>.md.
#
#   A practice is a generalised case study: one pattern, shown across all three
#   production systems. Same visual language as a case study, different spine.
#
#   Contract:  every count and claim carries the repo (and the command that
#              reproduces it) · `systems` and `rubric` keys must resolve ·
#              the five H2s below appear in order · no body paragraph over
#              80 words. DESIGN.md is the brief behind all of it.
#   Validate:  uv run --with pyyaml --no-project python scripts/lint_case_study.py \
#                _practices/<slug>.md --practice
#   Generate:  /case-study practice <name>
# ============================================================================

title: ""                    # e.g. "The eval loop"

# ---- the card lines ---------------------------------------------------------
# Optional on a practice — it has no system card — but linted the same way as a
# case study's whenever they are present, so fill them or delete them.
# headline    ≤ 9 WORDS, outcome-led, never the title again.
# outcome     ONE sentence, ≤ 25 words: what the practice buys, with its stake.
# proof_line  ONE sentence that MUST carry a number, and that number carries its
#             baseline or denominator in the same sentence.
headline: ""
outcome: >-
  ""
proof_line: >-
  ""

summary: >-                  # ≤ 2 sentences — the pattern and why it matters.
  ""
tldr: >-                     # One line for the practice card on the home page.
  ""

# One entry per H2 below, `n` 1..5 in order. Each `summary` is ONE sentence of
# ≤ 24 words stating the POINT of the section, not its topic. Optional here;
# linted when present. They render in the reading rail.
sections:
  - {n: 1, summary: ""}
  - {n: 2, summary: ""}
  - {n: 3, summary: ""}
  - {n: 4, summary: ""}
  - {n: 5, summary: ""}

order: 1                     # Order in the practices strip
kicker: ""                   # Short mono label above the title, e.g. "practice · evaluation"
systems: []                  # Slugs of the _projects this draws on, e.g. [data-pilot, convfinqa-agent, transcript-rag]
rubric: []                   # Dimension keys from _data/rubric.yml that this practice explains
evidence_note: >-            # How the numbers on this page were produced, so a reader can re-run them.
  ""

# Prose rules the lint enforces in the body below:
#   · No paragraph over 80 words. Split at the natural seam; delete nothing.
#   · Enumerations become lists or tables — three or more parallel items in one
#     sentence belong in a markdown list, not in the sentence.
#   · A figure caption states the TAKEAWAY first, then its source:
#     **The gate blocks a better average that hides a regression.** …
#     Source: .github/workflows/eval.yml
---

## Problem

<!-- What goes wrong without this practice. Concrete, from experience, not
     abstract. One paragraph. -->

## Pattern

<!-- The practice itself, as a sequence a reader could adopt. Name the steps.
     If there is a figure, it belongs here. -->

## In the three systems

<!-- One subsection (###) per system: how that system instantiates the pattern,
     with paths. Differences are the interesting part — say where one system
     does less and why. -->

## Evidence

<!-- Counts, commands, files. Every number here must be reproducible:
     give the `git log --grep`, the `ls`, the workflow, the run directory. -->

## Failure modes

<!-- Where this practice goes wrong, including where it went wrong here.
     A named failure with a fix reads as experience; a list of virtues does not. -->
