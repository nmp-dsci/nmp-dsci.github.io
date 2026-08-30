---
# ============================================================================
# PRACTICE SCAFFOLD — copy to _practices/<slug>.md.
#
#   A practice is a generalised case study: one pattern, shown across all three
#   production systems. Same visual language as a case study, different spine.
#
#   Contract:  every count and claim carries the repo (and the command that
#              reproduces it) · `systems` and `rubric` keys must resolve ·
#              the five H2s below appear in order.
#   Validate:  uv run --with pyyaml --no-project python scripts/lint_case_study.py \
#                _practices/<slug>.md --practice
#   Generate:  /case-study practice <name>
# ============================================================================

title: ""                    # e.g. "The eval loop"
summary: >-                  # ≤ 2 sentences — the pattern and why it matters.
  ""
tldr: >-                     # One line for the practice card on the home page.
  ""
order: 1                     # Order in the practices strip
kicker: ""                   # Short mono label above the title, e.g. "practice · evaluation"
systems: []                  # Slugs of the _projects this draws on, e.g. [data-pilot, convfinqa-agent, transcript-rag]
rubric: []                   # Dimension keys from _data/rubric.yml that this practice explains
evidence_note: >-            # How the numbers on this page were produced, so a reader can re-run them.
  ""
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
