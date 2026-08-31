---
# ============================================================================
# CASE-STUDY SCAFFOLD — copy to _projects/<slug>.md and fill every key.
#
#   Contract:  every number has a repo path · all nine rubric dimensions
#              present · anything not `shipped` says why · the seven H2s
#              below appear in order, none skipped · one `sections:` summary
#              per H2 · no body paragraph over 80 words · no placeholder in
#              `media:`. DESIGN.md is the brief behind all of it.
#   Validate:  uv run --with pyyaml --no-project python scripts/lint_case_study.py \
#                _projects/<slug>.md --repo ../<repo-dir>
#   Generate:  /case-study ../<repo-dir>   (see .claude/skills/case-study/)
#
# Comments say what goes in each field and where to find it in a repo.
# ============================================================================

title: ""                    # Product name as it appears everywhere on the site

# ---- the three lines a scanner reads ----------------------------------------
# headline    ≤ 9 WORDS, outcome-led, and never the title again. First line of
#             the home-page card and of the page header: what the system
#             achieves, not what it is called.
# outcome     ONE sentence, ≤ 25 words, under the headline on the card. The
#             achievement with its stake — what would go wrong without it —
#             not a feature list.
# proof_line  ONE sentence for the TL;DR "Proof" cell. It MUST carry a number,
#             and that number carries its baseline or denominator in the same
#             sentence: "77.1%, up from 73.0% (594/770)", never a bare "77.1%".
headline: ""
outcome: >-
  ""
proof_line: >-
  ""

summary: >-                  # ≤ 2 sentences. What it is + the one thing that makes it notable.
  ""                         # Source: repo README first paragraph, rewritten for a hiring engineer.
tldr: >-                     # ONE line for the 30-second strip. The claim, with its mechanism.
  ""

# ---- section summaries ------------------------------------------------------
# One entry per H2 below, `n` matching the number in the heading, 1..7 in order.
# Each `summary` is ONE sentence of ≤ 24 words that states the POINT of the
# section, not its topic: "Governance is the product, not a feature" —
# never "This section covers governance". They render in the reading rail.
sections:
  - {n: 1, summary: ""}
  - {n: 2, summary: ""}
  - {n: 3, summary: ""}
  - {n: 4, summary: ""}
  - {n: 5, summary: ""}
  - {n: 6, summary: ""}
  - {n: 7, summary: ""}
tags: []                     # Display chips on the card, e.g. [Agents, Data] / [RAG]
metric: ""                   # The headline number, e.g. "77.1%" or "6.1×"
metric_label: ""             # What the number means, e.g. "accuracy · up from 73.0% (594/770)"
featured: true               # true only for systems shown on the home page
order: 1                     # Card order on the home page (1 = first)
stack: []                    # Technologies, most distinctive first. Source: README, pyproject/package.json, infra/

# ---- skills -----------------------------------------------------------------
# Keys MUST exist in _data/skills.yml. skills_detail proof lines carry file paths.
skills: []
skills_detail:
  - skill: ""                # key from _data/skills.yml
    proof: ""                # one sentence + the path(s) that prove it, in parentheses

# ---- links ------------------------------------------------------------------
links:
  repo: ""                   # https://github.com/<org>/<repo>
  demo: ""                   # The live URL. MUST answer 200 (demo builds answer mode: demo).

# ---- media (optional) -------------------------------------------------------
# A path or nothing. DESIGN.md rule 5: no placeholder for media that does not
# exist — if it is not recorded, the slot is not rendered, so it is not promised
# either. "planned", "tbd", "coming" and friends fail the lint; "" is correct.
media:
  walkthrough: ""            # /assets/video/<slug>/walkthrough.mp4
  poster: ""                 # /assets/img/<slug>/poster.png
  captions: ""               # /assets/video/<slug>/walkthrough.vtt
  reel: ""                   # /assets/video/<slug>/reel.mp4

# ---- the AI / agent structure ----------------------------------------------
# The visual identity of the system: what the MODEL does. Shown on the home
# card AND under "## 2 · Agent architecture". Never the AWS diagram.
architecture:
  diagram: "diagrams/agent/<slug>.svg"      # path under _includes/, inlined by the layout
  caption: ""                # e.g. "question → agent loop → guarded SELECT → sandbox → report"

# ---- how and where it runs --------------------------------------------------
production:
  live: true                 # true = a real deployed URL; drives the live badge and the matrix
  order: 1                   # order in the rubric matrix
  surface: ""                # What a visitor can actually do in the demo, incl. what is replayed
  topology: ""               # One line, e.g. "App Runner → Aurora v2 · ECS jobs"
  topology_diagram: "diagrams/topology/<slug>.svg"   # DEPLOY diagram — case study §4 only
  region: ""                 # e.g. ap-southeast-2. Source: infra/terraform/
  cost: ""                   # measured monthly range in demo mode, e.g. "~$5–15/mo"
  rung: 10                   # 10 | 100 | 1000 — key in _data/rubric.yml rungs
  rung_note: ""              # e.g. "rung-100 sizing measured (.lavish/s42)"
  score: "0 / 9"             # count of `shipped` rows out of 9 — the lint recomputes this

  # ---- the scorecard ---------------------------------------------------------
  # ALL NINE dimensions, keys from _data/rubric.yml, in that order.
  #   status: shipped | partial | designed | na
  #   how:    how THIS system performs THIS dimension. Anything not `shipped`
  #           must carry its reason here — a hollow dot with a reason reads as
  #           engineering judgement; nine green dots reads as marketing.
  #   proof:  " · "-separated repo paths the lint can find under --repo.
  rubric:
    - {dimension: evals,      status: shipped, how: "", proof: ""}
    - {dimension: judge,      status: shipped, how: "", proof: ""}
    - {dimension: gate,       status: shipped, how: "", proof: ""}
    - {dimension: loop,       status: shipped, how: "", proof: ""}
    - {dimension: guardrails, status: shipped, how: "", proof: ""}
    - {dimension: trace,      status: shipped, how: "", proof: ""}
    - {dimension: cost,       status: shipped, how: "", proof: ""}
    - {dimension: release,    status: shipped, how: "", proof: ""}
    - {dimension: scale,      status: shipped, how: "", proof: ""}

# Screenshots, dashboards and other figures go INLINE in the body below, as
# <figure class="evidence"> blocks, next to the claim they support. A caption
# states the TAKEAWAY first and then its source:
#   **The model never touches the database directly.** Every path from question
#   to report passes the AST guard and then RLS.
#   Source: db/init/02_rls.sql, agent/sql_guardrails.py
#
# Two prose rules the lint enforces in the body below:
#   · No paragraph over 80 words. Split at the natural seam; delete nothing.
#   · Enumerations become lists or tables. Three or more parallel items in one
#     sentence (three cost caps, four tools, graders G1–G3) belong in a markdown
#     list or table, not in the sentence.
---

## 1 · Purpose & benefit

<!-- Who it is for · the problem · the benefit in one number · what you can
     actually do in the live demo (and what is replayed, said as a decision).
     Close with the demo + repo links. Source: README intro, demo-mode plan. -->

## 2 · Agent architecture

{% include fig-agent.html %}

<!-- The line above renders architecture.diagram + its caption. Keep it directly
     under this heading.
     Agents / stages · LLM(s) and tiers · tools · retrieval · prompts · memory.
     Source: src/agents|pipeline, prompts/, backends/, README §Architecture. -->

## 3 · Agent loop & evaluation

<!-- First: one request end to end. Then the eval loop —
     golden set → graders / judge → gate → learning loop.
     Source: evals/, tests/, .github/workflows/, docs/evals/. -->

## 4 · Deployed architecture

{% include fig-topology.html %}

<!-- The line above renders production.topology_diagram. Keep it directly under
     this heading.
     API surfaces · database / storage · CI-CD + smoke · region and sizing ·
     scale rung with what has actually been measured.
     Source: infra/terraform/, .github/workflows/deploy-*.yml, scripts/*smoke*. -->

## 5 · Guardrails & security

<!-- What sits between the model and the data, the tools, the money, other
     users. Deterministic gates first, then abuse limits, then how they are
     tested. Source: SECURITY.md, guard/limits modules, tests/security/. -->

## 6 · Observability & cost

<!-- Per-request traces and the health surface; then cost per answer, the caps,
     and what the demo deployment actually costs.
     Source: tracking/, ops/, docs/runbook.md, README §Cost. -->

## 7 · Production readiness scorecard

<!-- Leave this section EMPTY. The layout renders it from production.rubric so
     the scorecard and the home-page matrix can never disagree. -->
