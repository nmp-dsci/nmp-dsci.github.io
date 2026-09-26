---
title: DataAgentBench Loop
short: "DAB"   # the matrix column header on a phone
headline: "Trained on the statement, not the answer: 0.904"
summary: >-
  A Claude Agent SDK analyst on DataAgentBench's 54 public questions, and the loop that took it
  from 0.440 to 0.904 Pass@1 in five days by optimising the SQL it writes, not the answer it gives.
tldr: >-
  One Opus session writes one SQL statement per question; 49 hand-made goldens score the statement;
  an optimiser reads where it breaks and writes one prompt per dataset under four leak guards; five
  rounds, four promotions.
outcome: >-
  An SQL-writing agent on a public benchmark, improved v0 → v8 by a loop that scores the statement
  against a golden and refuses leaked answers.
proof_line: >-
  v8 scores Pass@1 0.904 (48/54, one trial), from v0's 0.440; the public board's top two are 0.947
  and 0.906 over five trials, so this sits third by 0.002.
tags: [Agents, Data]
metric: "0.904"
metric_label: "Pass@1 on the 54, one trial · v0 0.440 · board #2 0.906 over five"
featured: true
order: 2
sections:
  - n: 1
    summary: >-
      0.904 on the board's own number, with the trial count stated beside it.
  - n: 2
    summary: >-
      Three tools and one statement per question, so every failure has an SQL to diff.
  - n: 3
    summary: >-
      Golden SQL makes the statement the target; four guards keep the answer out of the prompt.
  - n: 4
    summary: >-
      Nothing is deployed; the explorer runs locally on the shared platform, and the rows say so.
  - n: 5
    summary: >-
      The agent's role cannot read gold, and the optimiser cannot write it.
  - n: 6
    summary: >-
      486 traces, each priced; v0 → v8 cost about $77 in eval, reading and optimising.
  - n: 7
    summary: >-
      Five of nine: the learning half shipped in full, the operating half is a bench.
stack: [claude-agent-sdk, Opus 5.5 · Sonnet 5 · Haiku 4.5, Postgres 16, MLflow 3, sqlglot, FastAPI, React 18, Vite, Docker]

# ---- skills -----------------------------------------------------------------
skills: [agentic-ai, model-evaluation, prompt-versioning, sql, mlops, prompt-engineering, llms, python]
skills_detail:
  - skill: agentic-ai
    proof: One Claude Agent SDK session per question with three tools on an in-process MCP server, isolated from every file and tool but its own, ending at submit_answer with the statement, a mode and the seven-step plan (src/dab_bench/agent/session.py, src/dab_bench/agent/tools.py, src/dab_bench/agent/isolation.py, agents/v8_sql/agent.yaml).
  - skill: model-evaluation
    proof: 54 questions with gold and the benchmark's own validators, a rescore that reproduces the site's Pass@1 to two decimals, 49 hand-made golden statements that score the SQL and the decision beside the answer, and a promotion rule that gates on leaks before Pass@1 (src/dab_bench/eval/validators.py, src/dab_bench/eval/rescore.py, tests/test_trials.py, src/dab_bench/eval/golden.py, src/dab_bench/eval/scorecard.py, src/dab_bench/eval/promote.py).
  - skill: prompt-versioning
    proof: Each version is a folder of system.md, twelve dataset notes and a frozen agent.yaml, fingerprinted by content, its lineage and round recorded, and the champion's prompt aliased in the MLflow prompt registry (agents/v8_sql/, agents/v8_sql/optimise.json, src/dab_bench/agent/versions.py, src/dab_bench/tracking/prompts.py).
  - skill: sql
    proof: The agent answers with one Postgres statement; the reader describes every statement in seven steps and a sqlglot structure diff cross-checks it; the goldens and the optimiser's playbook are SQL practice, never answers (agents/v8_sql/system.md, src/dab_bench/eval/ledger.py, src/dab_bench/eval/scorecard.py, src/dab_bench/eval/golden.py).
  - skill: mlops
    proof: Every run a folder and an MLflow run, every trial and optimiser session a trace, round outcomes tagged on MLflow and read back as the history, promotions appended to a ledger, CI on every pull request (src/dab_bench/tracking/mlflow_log.py, src/dab_bench/eval/outcome.py, src/dab_bench/eval/history.py, agents/promotions.jsonl, .github/workflows/ci.yml).
  - skill: prompt-engineering
    proof: An optimiser that reads the golden diff and the break step, writes one playbook section per step and one note per dataset, and is refused by a literal guard and an Opus reviewer whenever a write hands over an answer (agents/optimiser/component.md, agents/optimiser/playbook.md, src/dab_bench/agent/optimise.py, src/dab_bench/eval/guards.py, src/dab_bench/eval/review.py).
  - skill: llms
    proof: Three model ids in one file, Haiku 4.5, Sonnet 5 and Opus 5.5, every session on the subscription through the Agent SDK, a billing guard that refuses a per-token key, and the same prompt measured on each tier (src/dab_bench/agent/llm.py, agents/v4_sql/agent.yaml, agents/v5_sql/agent.yaml).
  - skill: python
    proof: A uv-managed package with ruff and strict mypy in CI and 172 test functions across the ingest, the validators, the roles, the guards, the promotion rule and the isolation check (pyproject.toml, tests/test_golden.py, tests/test_s11.py, tests/test_isolation.py, tests/test_promote.py).

# ---- links ------------------------------------------------------------------
links:
  repo: https://github.com/nmp-dsci/DataAgentBench
  demo: ""

# ---- media ------------------------------------------------
media:
  walkthrough: ""
  poster: ""
  captions: ""
  reel: ""

# ---- the AI / agent structure ----------------------------------------------
architecture:
  takeaway: >-
    One session, three tools, one statement: the harness re-runs the SQL, so every miss is a diff, not a retelling.
  diagram: "diagrams/agent/dataagentbench.svg"
  fig_title: "Figure · the v8 agent system, as the explorer's Agent tab draws it"
  # The home row shows the journey: Pass@1 by version against the public board's top two.
  home_diagram: "diagrams/chart/dataagentbench-progression.svg"
  home_fig_title: "Pass@1 by version, v0 → v8, against the public board's top two"
  caption: "question → Opus 5.5 session (≤ 30 turns, 900 s) ⇄ query_db · describe_table as dab_agent → submit_answer(sql, mode, plan), re-run as dab_agent → the question's validate.py. One prompt per dataset: system.md + the tables map + the version's notes + the upstream description and hints."
  loop_diagram: "diagrams/loop/dataagentbench.svg"
  loop_fig_title: "Figure · round 5, v6 → v8, on the seven stages with the round's own counts"
  loop_takeaway: >-
    The optimiser is an agent with a pen; what it may read and what it may write is the design.
  loop_caption: "Source run → scorecard and ledger → every error read → 13 Opus sessions → guards G1–G4 (28 writes, 19 refused) → v8 → 54 trials → promote on the leak gate, then Pass@1. The reader, the reviewer and the history sit off the ring and never inside a trial."

# ---- how and where it runs --------------------------------------------------
production:
  live: false
  bench: true
  order: 2
  surface: >-
    The explorer runs locally (make dev). Overview, Datasets, Query, Validators and Leaderboard read
    the committed index; Golden edits and judges one statement per question; Runs, Run and Trace
    open every trial with its span waterfall; Optimise shows each round as diagnostic → proposal →
    outcome; Agent draws the system and replays a trace. There is no public URL.
  topology: "FastAPI :8091 + React, local · central Postgres (dab, two roles) · central MLflow · one Docker sandbox per v0 trial · no public URL"
  topology_diagram: "diagrams/topology/dataagentbench.svg"
  region: "not deployed"
  cost: "$5.36 per run of the 54 · $0.09 a question at p50"
  rung: 10
  rung_note: "no public URL — the explorer runs locally on the central platform"
  score: "5 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        54 questions with gold and their own validators, vendored and alarm-bounded; the rescore
        reproduces the site's Pass@1 to two decimals; 49 hand-made goldens score the statement itself.
      proof: "data/index/queries.json · src/dab_bench/eval/validators.py · src/dab_bench/eval/rescore.py · tests/test_trials.py · src/dab_bench/eval/golden.py · tests/test_golden.py · data/golden/coverage.json"
    - dimension: judge
      status: na
      how: >-
        Answers are graded by the benchmark's validators. A model reads statements (the reader) and
        reviews prompt text (G1), but neither scores an answer, so neither is counted as a judge.
      proof: "src/dab_bench/eval/ledger.py · src/dab_bench/eval/review.py"
    - dimension: gate
      status: shipped
      how: >-
        dab promote: a challenger passes the leak gate (its round ran G1–G4, and G2 finds no gold
        value in its prompt), then the highest Pass@1 wins; the incumbent always stands. It held v7
        and barred v2–v5. Tests hold every version's prompt to the audit.
      proof: "src/dab_bench/eval/promote.py · agents/promotions.jsonl · tests/test_promote.py · tests/test_s11.py"
    - dimension: loop
      status: shipped
      how: >-
        Five rounds, each from the champion's run only; component and dataset sessions; the history
        built from MLflow and parity-checked against the folders; every round's outcome and every
        session a trace; the Optimise tab shows diagnostic → proposal → outcome.
      proof: "src/dab_bench/agent/optimise.py · src/dab_bench/eval/history.py · src/dab_bench/eval/rounds.py · agents/v8_sql/optimise.json · frontend/src/pages/Optimise.tsx"
    - dimension: guardrails
      status: shipped
      how: >-
        Two Postgres roles and a gold schema the agent role is refused; an isolated session with its
        init checked; a network-off sandbox per trial; the literal guard and G1–G4 over every
        optimiser write; a billing guard. No red-team suite: the leak gate is the adversary, and it
        is tested.
      proof: "infra/roles.sql · src/dab_bench/agent/isolation.py · src/dab_bench/agent/sandbox.py · src/dab_bench/eval/guards.py · src/dab_bench/eval/review.py · tests/test_isolation.py · tests/test_meta.py"
    - dimension: trace
      status: shipped
      how: >-
        One trace per trial, 486 across nine full runs, and one per optimiser session, all on the
        central MLflow; the explorer draws each trial's span waterfall and transcript. No SLO or
        error budget, as on the other systems.
      proof: "src/dab_bench/tracking/mlflow_log.py · src/dab_bench/tracking/tracing.py · frontend/src/pages/TracePage.tsx · runs/*/results.jsonl"
    - dimension: cost
      status: partial
      how: >-
        Cost on every trial, round, ledger and session, but the only cap is the subscription window
        (require_live() refuses a per-token key), the champion runs on the dearest tier, and there is
        no served surface to cap.
      proof: "runs/*/results.jsonl · agents/v8_sql/optimise.json · src/dab_bench/agent/llm.py"
    - dimension: release
      status: partial
      how: >-
        CI on every pull request, ruff, mypy, pytest, tsc, the design lint, vitest and the build,
        and nothing deploys: no IaC, no image, no public URL, no smoke test.
      proof: ".github/workflows/ci.yml · Makefile · frontend/scripts/design_lint.mjs"
    - dimension: scale
      status: designed
      how: >-
        Nothing serves users. The eval runner has a worker semaphore and the data is 8.4 GB in the
        central Postgres; a public read-only explorer would ship as one image with its evidence
        baked in, and it is not built.
      proof: "src/dab_bench/eval/runner.py · Makefile · AGENTS.md"
---

## 1 · Purpose & benefit — 0.904 on the board's number, trial count stated

[DataAgentBench](https://github.com/ucbepic/DataAgentBench) asks 54 natural-language questions over
12 datasets in four engines, each with a gold answer and its own validator, and a public
leaderboard scores them. This build re-hosts the data in Postgres, puts one Claude Agent SDK
analyst on the 54, and optimises what it writes: the SQL statement, not the answer.

<div class="slide" id="slide-1a">
  <h3><span class="n">1a</span>Five promotions in five days: 0.440 → 0.904, on the board's second line</h3>
  <p class="fig-title">Figure · Pass@1 by version in build order; the champion line; the public board's top two</p>
  <div class="dia-frame">{% include diagrams/chart/dataagentbench-progression.svg %}</div>
  <ul>
    <li><b>What moved it?</b> Sonnet +0.166, Opus +0.104; rounds +0.134, +0.049, +0.013. The model switches bought more than the rounds; the rounds made every miss a diff.</li>
    <li><b>The misses?</b> v1 rebuilt to SQL and scored under v0; v3 and v5 were beaten by the next step; v7 tied v6 and lost on SQL, 30 to 33.</li>
    <li><b>Where does it sit?</b> Third on the public board (0.947 · 0.906 · 0.879), 0.002 under second, on one trial where the board runs five. Every top entry is tuned on the 54; so is this.</li>
    <li><b>The skill?</b> Choosing the target, what the optimiser may see, what it may write, and the rule that decides.</li>
  </ul>
</div>

The explorer runs locally over the committed index, the runs and the goldens:

| Surface | What it shows |
|---|---|
| **Overview · Datasets · Query · Validators · Leaderboard** | the 54 questions, their gold, validators and every published answer, rescored |
| **Golden** | one statement per question, run as the agent's role, judged by the validator, saved with its source |
| **Runs · Run · Trace** | every version's run, every trial's tokens and cost, the span waterfall |
| **Optimise · Agent** | each round as diagnostic → proposal → outcome; the agent as a graph, a trace replayed |

[Repository ↗](https://github.com/nmp-dsci/DataAgentBench)

## 2 · Agent architecture — three tools, one statement, and a mode

{% include fig-agent.html %}

- **Session** — an Agent SDK `claude` child · Opus 5.5 at medium effort · at most 30 turns and 900 s · an empty directory, no built-in tools.
- **Prompt** — `system.md` (7.6 k, the seven-step playbook) + the tables map + this dataset's notes (~1.7 k) + the upstream description and hints, about 18 k for crmarenapro; the question alone is the user message.
- **Tools** — `query_db` and `describe_table` as `dab_agent`; `submit_answer(sql, mode, plan)` re-runs the SQL as `dab_agent`, so the result is known exactly.
- **Versus the board** — one prompt per dataset, no per-question text or tool; #1 ships five prompt variants, #2 per-question operators.

Small on purpose: a version differs from its parent in one file and twelve notes, so every gain is a
diff a reviewer can read.

## 3 · Agent loop & evaluation — the statement is the goal, not the answer

{% include fig-loop.html %}

<div class="slide" id="slide-3a">
  <h3><span class="n">3a</span>54 questions over 12 datasets, and a golden statement for 49 of them</h3>
  <p class="fig-title">Figure · the benchmark's data and the golden SQL coverage, one cell per question</p>
  <div class="dia-frame">{% include diagrams/chart/dataagentbench-coverage.svg %}</div>
  <ul>
    <li><b>The data?</b> 12 datasets, 4 engines upstream, 8.4 GB loaded into one Postgres schema of 2,811 tables.</li>
    <li><b>Coverage?</b> 49 of 54: 36 exact, 8 pass but differ from the gold text, 5 evidence goldens for judgment questions; 5 none.</li>
    <li><b>Who wrote them?</b> A person, in the Golden tab, each run as the agent's role and judged by the question's validator; a golden is proof the question is answerable in one statement.</li>
    <li><b>Why none for agnews?</b> Its category lives in no column.</li>
  </ul>
</div>

<div class="slide" id="slide-3b">
  <h3><span class="n">3b</span>Where v8 still breaks: shape and parse, not the data</h3>
  <p class="fig-title">Figure · v8's 54 by scorecard category, the seven build steps in order</p>
  <div class="dia-frame">{% include diagrams/chart/dataagentbench-breaks.svg %}</div>
  <ul>
    <li><b>What is a category?</b> The first step at which the reader says the statement leaves the golden and the result changes; a <code>sqlglot</code> structure diff cross-checks it.</li>
    <li><b>The largest after five rounds?</b> Shape, 6: the right rows in the wrong columns or format.</li>
    <li><b>Never passed, any version?</b> agnews/2, agnews/3 and github_repos/1; two of the three no published entry has passed either.</li>
  </ul>
</div>

| Round | Wrote | Read | Answers · SQL | Verdict |
|---|---|---|---|---|
| 1 → `v2` | dataset notes · Sonnet · $1.11 | v1's failed train questions, with golden diffs | 24 → 30 · 13 → 18 | **promoted** (D30) |
| 2 → `v3` | the seven-step playbook, plan-first · $1.25 | the reader's ledger | 30 → 32 · 18 → 19 | beaten by `v4`, the same prompt on Sonnet: 41 · 27 |
| 3 → `v6` | notes and sections, on Opus · $1.90 | v5's failed train questions | 45 → 46 · 28 → 33 | **promoted** (D36) |
| 4 → `v7` | every error of the 54, guards G1–G4 · $4.39 | 20 misses | 46 → 46 · 33 → 30 | **held** |
| 5 → `v8` | the same, plus each question's history from MLflow · $4.83 | 20 misses | 46 → 48 · 33 → 31 | **promoted** (D46) |

The loop in full, the ledger's seven steps, guards G1–G4 and the three promotion rules, is
[`AGENTS.md` §7 in the repository ↗](https://github.com/nmp-dsci/DataAgentBench/blob/main/AGENTS.md).

## 4 · Deployed architecture — nothing is deployed, and the page says so

{% include fig-topology.html %}

- **Runs on** — FastAPI on `:8091` and a React explorer, locally; the shared platform's central Postgres (`dab`, two roles) and central MLflow; one Docker container per v0 trial, network off.
- **CI** — on every pull request: ruff, mypy, pytest (172 test functions), tsc, a design lint, vitest, the build.
- **Not built** — no IaC, no image, no public URL, no smoke test. Release is `partial`, scale is `designed`, and the row says why.

## 5 · Guardrails & security — the agent reads no gold; the optimiser writes none

- **Roles** — `dab_agent` has SELECT on the benchmark schema and a 60 s statement timeout, and nothing on `dataagentbench_meta`, which holds the gold and the goldens; tests assert the refusal.
- **Isolation** — every session starts in an empty directory with no CLAUDE.md, memory or plugin; its `init` message is recorded, and `dab isolation-check` reads the transcript against an allowlist.
- **Sandbox** — v0's `execute_python` ran in a container with no network and only its own `/work`; the SQL versions have no Python at all.
- **Leak guards** — every optimiser write: no run of eight question words, no gold value, no run of six golden tokens; G1 an Opus reviewer refuses decisive text, G2 audits the finished prompt, G3 wants two errors behind a section, G4 bans naming a question. Round 5: 28 writes, 19 refused.
- **Billing** — `require_live()` refuses a per-token key; every session bills the subscription.
- **Absent** — no red-team suite; the leak gate is the adversary, and it is tested.

## 6 · Observability & cost — 486 traces, each priced; about $77 all in

<div class="slide" id="slide-6a">
  <h3><span class="n">6a</span>Tokens per run fell 7.6×, p95 wall 16×, cost 40%</h3>
  <p class="fig-title">Figure · per run of the 54: tokens billed, p95 wall per trial, cost — by version</p>
  <div class="dia-frame">{% include diagrams/chart/dataagentbench-cost.svg %}</div>
  <ul>
    <li><b>Tokens billed?</b> 18.4 M (v0) → 2.4 M (v8) per run; cache reads are 82% of v8's.</li>
    <li><b>Time?</b> p95 per trial 911 s → 57 s, p50 63 → 22 s; turns p95 25 → 8; timeouts 4 → 0.</li>
    <li><b>Cost?</b> $8.96 → $5.36 per run; v8 $0.09 p50, $0.17 p95, $0.32 at most (agnews/4). Opus tokens cost more; there are far fewer of them.</li>
    <li><b>Trace?</b> One MLflow trace per trial, a span per turn and tool call; every optimiser session a trace too.</li>
  </ul>
</div>

The whole journey: nine eval runs $50.53 · five rounds $13.48 · eight reader ledgers $11.45 · the
curator about $1.40. Every number reads from `runs/*/results.jsonl` and `agents/*/optimise.json`.

## 7 · Production readiness scorecard — five of nine, the learning half in full
