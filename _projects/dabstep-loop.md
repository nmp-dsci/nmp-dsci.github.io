---
title: DABstep Loop
short: "DABstep"   # the matrix column header on a phone
headline: "Two loops improve one agent: with gold, then without"
summary: >-
  A Claude Agent SDK agent on the DABstep benchmark, and the system that optimises it: a
  supervised loop that learns from the ten gold tasks, an unsupervised loop that learns from the
  440 without answers, and a gate on each that has held two of three challengers.
tldr: >-
  One Haiku agent, one python tool, two editable files per version. A Sonnet optimiser is shown
  gold failures (supervised) or gold-free family cards from a probe of the 450 (unsupervised);
  a McNemar gate promoted v2, and gate A held v3 when every signal improved but two gold tasks broke.
outcome: >-
  An agent optimised by two loops, one on gold and one without, where the gate decides and the
  gold anchor catches what gold-free signals cannot.
proof_line: >-
  Five cycles on the ledger: v2 promoted at 9/10 (p 0.031); v3, written from gold-free signals
  that all improved on 47 probed tasks, held because 2 of 10 gold tasks broke.
tags: [Agents]
metric: "5 cycles"
metric_label: "3 supervised on ten gold · 2 unsupervised on the 450 · one promoted, two held"
featured: true
order: 5
deep: [eval-loop]
sections:
  - n: 1
    summary: >-
      One agent, two optimisation loops, and a gate on each; the number is the by-product, the design is the point.
  - n: 2
    summary: >-
      The agent is small on purpose: two editable files per version, so every gain is attributable to a diff.
  - n: 3
    summary: >-
      The supervised loop learns from gold; the unsupervised loop from invariants and consistency; gold still has the veto.
  - n: 4
    summary: >-
      The image bakes in the runs, the ledger and demo mode, so the public URL cannot bill anyone.
  - n: 5
    summary: >-
      The optimiser may write two files under one folder, and a checksum voids the cycle if anything else moved.
  - n: 6
    summary: >-
      Every task in every run carries its cost, and the held v3 was the cheapest version, which is why cost is not the gate.
  - n: 7
    summary: >-
      Six of nine shipped; the gold-free signals are not a judge, the sandbox is not one, and scale is a design.
stack: [claude-agent-sdk, Haiku 4.5 · Sonnet 5, MLflow 3, FastAPI, React 18, Vite, Terraform, AWS App Runner]

# ---- skills -----------------------------------------------------------------
skills: [agentic-ai, model-evaluation, prompt-versioning, mlops, prompt-engineering, llms, python]
skills_detail:
  - skill: agentic-ai
    proof: One Claude Agent SDK session per task with a single stateful execute_python tool served as an in-process MCP server, a persistent namespace with pandas preloaded, a per-version helper module loaded from file, and NVIDIA's loop-breaker on repeated code (src/dabstep_loop/agent/session.py, src/dabstep_loop/agent/tools/python_executor.py, agents/v0/agent.yaml).
  - skill: model-evaluation
    proof: The benchmark's scorer vendored verbatim, a committed ten-task gold split with the 450 locked behind a confirmation, four gold-free signals over a seeded probe of the 450 including metamorphic invariants between sibling answers, and two promotion rules, a one-sided exact McNemar test and gate A (src/dabstep_loop/eval/scorer.py, data/tasks/dev.jsonl, src/dabstep_loop/loop/signals.py, src/dabstep_loop/loop/invariants.py, src/dabstep_loop/eval/compare.py, runs/).
  - skill: prompt-versioning
    proof: Each version is a folder of exactly three files, the prompt and helper editable and agent.yaml frozen, fingerprinted by content so the registry, the run and the folder can be checked against each other in CI (agents/v0/, agents/v2/, src/dabstep_loop/agent/versions.py, src/dabstep_loop/tracking/gate.py).
  - skill: mlops
    proof: A champion/challenger registry with an append-only history, an append-only ledger of every diagnosis, change and verdict, MLflow as the index of every eval run, and a CI gate that re-scores the champion's committed results on every push (loop/registry.json, loop/ledger.jsonl, src/dabstep_loop/tracking/mlflow_log.py, .github/workflows/ci.yml).
  - skill: prompt-engineering
    proof: The optimiser reads both champion surfaces and either every failed trace with its gold or twelve family cards with every failed invariant's two traces, must file a diagnosis, and is shown the ledger and any held challenger so a failed fix is not retried unchanged (src/dabstep_loop/loop/optimiser.py, src/dabstep_loop/loop/ureflect.py, loop/families/F10.json, agents/v2/diagnosis.json, agents/v3/diagnosis.json).
  - skill: llms
    proof: Three model ids in one file, Haiku 4.5 for the agent under test and Sonnet 5 at high effort for the optimiser and the reflection pass, behind a billing guard that refuses to build a model in the demo image and strips the API key from a subscription session (src/dabstep_loop/agent/llm.py, .env.example, Dockerfile).
  - skill: python
    proof: uv-managed package, ruff and strict mypy in CI, 33 tests including the gate arithmetic, every invariant in both directions on synthetic answers, the sampler, the executor's loop-breaker and the demo's refusal to answer an unrecorded question (pyproject.toml, tests/test_eval.py, tests/test_signals.py, tests/test_families.py, tests/test_agent_units.py, tests/test_api.py).

# ---- links ------------------------------------------------------------------
links:
  repo: https://github.com/nmp-dsci/DABStep-loop
  demo: https://xqcd7prnag.ap-southeast-1.awsapprunner.com

# ---- media ------------------------------------------------
media:
  walkthrough: ""
  poster: ""
  captions: ""
  reel: ""

# ---- the AI / agent structure ----------------------------------------------
architecture:
  takeaway: >-
    A version can differ from its parent in two files only, which is what makes a cycle's gain a diff a reviewer can read.
  diagram: "diagrams/agent/dabstep-loop.svg"
  # The home row shows the design lesson: gold-free signals up on every axis, and the gold anchor that still held.
  home_diagram: "diagrams/chart/dabstep-signals.svg"
  home_fig_title: "The unsupervised gate · gold-free signals before and after v3, beside the ten gold tasks"
  caption: "task → Haiku 4.5 session ⇄ execute_python (helper.py loaded per version) → one-line JSON answer → the vendored scorer; agent.yaml is frozen at 20 turns, 270 s, 120 s per call"
  loop_diagram: "diagrams/loop/dabstep-loop.svg"
  loop_takeaway: >-
    One ring, two modes: the input, the scoring, the gate and the reflection change; the optimiser and its guards do not.
  loop_caption: "Supervised: dev split → run → score → optimise on failures → gate by McNemar. Unsupervised: probe 47 of the 450 → gold-free signals → cards → optimise on cards → gate A. Both: write v(N+1) in two files, register the verdict, deploy, reflect. Five cycles: one promoted, two held."

# ---- how and where it runs --------------------------------------------------
production:
  live: true
  order: 5
  surface: >-
    Read-only viewer over the committed evidence. Overview, Architecture and Data describe the
    benchmark and the agent; Tasks lists all 450; Runs, Trace and Compare open every run,
    every task's turns and cost, and the gate between any two runs; Loop and Evolution show the
    ledger and a diff of any two versions with the optimiser's reasoning; Families shows the
    twelve families, their cards and the paired signals per cycle. Ask replays the ten recorded
    questions and declines anything else.
  topology: "GitHub OIDC → ECR → App Runner (1 instance, 0.5 vCPU / 1 GB) · CloudWatch 5xx alarm · no VPC, no database"
  topology_diagram: "diagrams/topology/dabstep-loop.svg"
  region: ap-southeast-1
  cost: "~$5–15/mo · $0.06 a question (262k in · 3.6k out)"
  rung: 10
  rung_note: "one uvicorn worker · evidence read from the image · no load test"
  score: "6 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        Ten gold tasks committed and the leaderboard scorer vendored so it cannot drift; for the
        440 without gold, four signals computed from a probe run alone, the invariants unit-tested
        in both directions. The 450 are never scored, and a probe writes no submission.
      proof: "data/tasks/dev.jsonl · src/dabstep_loop/eval/scorer.py · src/dabstep_loop/loop/signals.py · src/dabstep_loop/loop/invariants.py · runs/*/results.jsonl · tests/test_signals.py"
    - dimension: judge
      status: na
      how: >-
        Every DABstep answer is a number or a short string scored by exact match. The Sonnet
        reflector audits probe traces per family, but it writes cards for the optimiser and never
        scores an answer, so it is not a judge and is not counted as one.
      proof: "src/dabstep_loop/eval/scorer.py · src/dabstep_loop/loop/ureflect.py"
    - dimension: gate
      status: shipped
      how: >-
        Two rules in one file: a one-sided exact McNemar test on dev flips at α 0.05, and gate A,
        which promotes only if no dev task broke and the paired gold-free signals improved. Both
        have held a challenger. CI re-scores the champion and checks every card's evidence run.
      proof: "src/dabstep_loop/eval/compare.py · src/dabstep_loop/tracking/gate.py · .github/workflows/ci.yml · tests/test_eval.py"
    - dimension: loop
      status: shipped
      how: >-
        Versioned agent folders, one optimiser session per cycle, a champion/challenger registry,
        and a ledger with five kinds of entry: cycle, reflect, ureflect, ucycle and the verdict on
        each. The unsupervised loop adds a seeded sampler, a per-family card and a paired re-probe.
      proof: "src/dabstep_loop/loop/optimiser.py · src/dabstep_loop/loop/sampler.py · src/dabstep_loop/loop/ureflect.py · loop/ledger.jsonl · loop/registry.json · loop/families/F01.json"
    - dimension: guardrails
      status: partial
      how: >-
        A PreToolUse hook confines the optimiser to agents/v(N+1)/, a checksum over the guarded
        paths (loop/families/ included) voids the cycle if anything else moved, and CI refuses a
        version whose prompt quotes a leaderboard question. But the python tool is exec() with
        caps, not a sandbox, and nothing is red-teamed.
      proof: "src/dabstep_loop/loop/optimiser.py · src/dabstep_loop/agent/llm.py · src/dabstep_loop/agent/tools/python_executor.py · Dockerfile"
    - dimension: trace
      status: shipped
      how: >-
        Every task in every run has a committed trace with turns, tokens, cost, duration and
        terminal reason; a probe adds signals.json beside it and the ledger carries the paired
        signals per family. No SLO or error budget, as on the other three systems.
      proof: "runs/*/traces/*.json · runs/*/signals.json · src/dabstep_loop/tracking/mlflow_log.py · frontend/src/pages/Families.tsx"
    - dimension: cost
      status: shipped
      how: >-
        Cost per task and per run in the committed traces, optimiser, reflector and eval tokens
        per cycle in the ledger, and a demo whose worst day is $0 because BILLING=none is baked
        into the image.
      proof: "runs/*/run.json · loop/ledger.jsonl · src/dabstep_loop/agent/llm.py · Dockerfile"
    - dimension: release
      status: shipped
      how: >-
        Terraform for ECR, App Runner and the alarm; a keyless OIDC deploy that runs only after CI
        is green on main; a smoke test that asserts demo mode, 450 tasks served and a declined
        question; rollback by retagging the previous image.
      proof: "infra/terraform/demo/main.tf · .github/workflows/deploy-aws.yml · scripts/demo_smoke.sh · scripts/aws_build_push.sh"
    - dimension: scale
      status: designed
      how: >-
        Rung 10: one App Runner instance, one uvicorn worker, no load test. The eval runner has a
        worker semaphore, but that scales the loop, not the demo.
      proof: "infra/terraform/demo/main.tf · src/dabstep_loop/eval/runner.py · Dockerfile"
---

## 1 · Purpose & benefit — one agent, two loops, a gate on each

DABstep is 450 tabular-QA tasks over a payments dataset: a 138k-row `payments.csv`, 1,000 fee
rules and a 22 KB manual. Ten tasks ship with gold answers; 440 do not. The agent is the smaller
half of this build. The larger half is the system that optimises it: a supervised loop on the
ten, an unsupervised loop on the 440, and a gate on each.

<div class="slide" id="slide-1a">
  <h3><span class="n">1a</span>Five cycles on the ledger, one promoted, two held</h3>
  <p class="fig-title">Figure · pass count on the ten gold tasks by version, supervised cycles left of the line, unsupervised right</p>
  <div class="dia-frame">{% include diagrams/chart/dabstep-progression.svg %}</div>
  <ul>
    <li><b>What is supervised here?</b> The optimiser is shown each failed dev trace with its gold answer. v1 and v2 came from that; the McNemar gate held one and promoted the other.</li>
    <li><b>What is unsupervised?</b> The optimiser is shown twelve family cards written from a probe of the 450 with no answers. v3 came from that, and gate A held it.</li>
    <li><b>Why build the second loop?</b> Six of the twelve question families, 188 hard tasks, contain no gold task at all. Nothing supervised can reach them.</li>
    <li><b>What is the skill on display?</b> Designing what an optimiser sees, what it may write, and the rule that decides. The pass counts are the by-product.</li>
  </ul>
  <p class="go">↳ <a href="/projects/dabstep-loop/eval-loop/">both loops in full, every command, the cycle log</a></p>
</div>

The live URL is a read-only viewer over the committed evidence:

| Surface | What a visitor sees |
|---|---|
| **Overview · Architecture · Data** | the benchmark, the agent, the files it reads |
| **Tasks · Runs · Trace** | all 450 tasks; every run; every task's turns, tokens and cost |
| **Compare · Loop · Evolution** | the gate between any two runs; the ledger; a diff of any two versions beside the optimiser's reasoning |
| **Families** | the twelve families, their cards, the three-lens confusion matrix, and each family's paired signals per cycle |
| **Ask** | the ten recorded questions replayed; anything else is declined |

`DEMO_MODE=1` and `BILLING=none` are baked into the image.

[Open the live demo ↗](https://xqcd7prnag.ap-southeast-1.awsapprunner.com) ·
[Repository ↗](https://github.com/nmp-dsci/DABStep-loop)

## 2 · Agent architecture — one model, one tool, two editable surfaces

{% include fig-agent.html %}

| Piece | What it is | Path |
|---|---|---|
| **model** | `claude-haiku-4-5`, one Agent SDK session per task | `src/dabstep_loop/agent/llm.py` |
| **tool** | `execute_python`: an in-process MCP server, persistent namespace, pandas preloaded | `agent/tools/python_executor.py` |
| **prompt** | `system.md` — v0 is NVIDIA's inference prompt, nine lines; v2 forty; v3 sixty-six | `agents/vN/system.md` |
| **helper** | `helper.py`, imported as `helper` inside the tool — 57, 325, 440, then 563 lines | `agents/vN/helper.py` |
| **config** | `agent.yaml`, frozen: 20 turns, 270 s per task, 120 s per call | `agents/v0/agent.yaml` |

The agent is small on purpose. A version differs from its parent in two files, so a cycle's
change is a diff a reviewer can read, the optimiser can be confined to it, and both loops write
the same two surfaces.

The tool truncates output over 12,000 characters, returns `STOP` on the third identical call,
and serialises execution behind one lock at 120 s per call.

Models, in one file: `haiku` for the agent under test; `sonnet` at high effort for the
optimiser and both reflectors; `opus` defined and unused.

## 3 · Agent loop & evaluation — supervised on gold, unsupervised without

{% include fig-loop.html %}

The two loops share the ring. What changes is what the optimiser is shown and what the gate
reads:

| Stage | Supervised · `make loop` | Unsupervised · `make uloop` |
|---|---|---|
| **input** | the ten dev tasks, scored | a seeded probe: 47 of the 450 by family, two passes, `correct: null` |
| **evidence** | every failed trace with its gold | S1 method consistency · S2 pass agreement · S3 invariants · S5 format, per family |
| **reflector** | `reflect.py` over the dev traces | `ureflect.py` writes one card per family: canonical method, entry point, prompt rule, status |
| **optimiser sees** | failures, ledger, any held challenger | cards worst-first, both traces of every failed invariant, ledger |
| **may verify against** | the dev gold, in-session | an invariant, never a leaderboard answer |
| **gate** | one-sided exact McNemar on dev flips, p < 0.05 | gate A: no dev task broke *and* the paired signals improved |
| **on the ledger** | `cycle`, `reflect` | `ureflect`, `ucycle` with signals before, after, and per family |

<div class="slide" id="slide-3a">
  <h3><span class="n">3a</span>Six of twelve families have no gold, so a second loop was needed</h3>
  <p class="fig-title">Figure · the 450 tasks by operation family; filled bars contain a gold task, hollow bars do not</p>
  <div class="dia-frame">{% include diagrams/chart/dabstep-families.svg %}</div>
  <ul>
    <li><b>How were families found?</b> An ordered regex table over the 106 question templates; an embedding lens and a Sonnet lens only say how far to trust it per task (ARI 0.58, 0.66).</li>
    <li><b>What is an invariant?</b> A relation between two answers that holds whatever the truth is: <code>ids(day) ⊆ ids(month)</code>, <code>fees(month) ≤ fees(year)</code>. A failure is a proven bug with no gold needed.</li>
    <li><b>What makes a re-probe paired?</b> The sampler is seeded: k per family, boundary tasks first, never a dev id, plus each invariant's siblings.</li>
  </ul>
</div>

<div class="slide" id="slide-3b">
  <h3><span class="n">3b</span>Every gold-free signal improved, and the gold still held v3</h3>
  <p class="fig-title">Figure · four signals on the same 47 probed tasks before and after cycle 5, beside the ten gold tasks</p>
  <div class="dia-frame">{% include diagrams/chart/dabstep-signals.svg %}</div>
  <ul>
    <li><b>What did v3 do well?</b> Invariants 17/21 → 21/21, method consistency 0.43 → 0.69, agreement 0.66 → 0.89, errors 3 → 0, turns 721 → 481 on the probe.</li>
    <li><b>What broke?</b> Task 49 answered in a sentence where the scorer wants <code>B. BE</code>; task 1681 returned a different fee-id list in three turns. Both passed under v2.</li>
    <li><b>Why does the gate have both halves?</b> With one dev failure left, McNemar alone can never clear 0.05 again. Signals alone would have promoted v3. Gate A needs both, and the gold had the veto.</li>
    <li><b>And the supervised gate?</b> v1: five fixed, 1871 broken, p 0.109, held. v2: the same five, no break, p 0.031, promoted.</li>
  </ul>
  <p class="go">↳ <a href="/projects/dabstep-loop/eval-loop/">the gate arithmetic and the cycle log</a></p>
</div>

| Cycle | Kind | Subject | Deliverable | Dev 10 | Verdict |
|---|---|---|---|---|---|
| 1 | supervised | `v1` | four prompt rules, thirteen helper functions; 40 turns, 3.85 M in | 4 → 8 · +5 −1 · p 0.109 | **held** |
| 2 | reflect | v1's traces | 9 turns, read-only; 1871's cause named | — | recorded |
| 3 | supervised | `v2` | v1's helper minus one function plus three; 27 turns, 2.05 M in | 4 → 9 · +5 −0 · p 0.031 | **promoted** · champion |
| 4 | ureflect | v2's probe | twelve cards: 6 verified, 1 provisional, 5 open; 99 k in | — | recorded |
| 5 | unsupervised | `v3` | a routing row per family, three helpers; 29 turns, 2.31 M in | 9 → 7 · broke 49, 1681 | **held** by gate A |

CI runs `tracking/gate.py` on every push: it re-scores the champion's committed results, checks
its fingerprint against the registry and every card's evidence run, and refuses a prompt that
quotes a leaderboard question verbatim.

[Go deep: both loops →](/projects/dabstep-loop/eval-loop/)
· [the eval loop as a practice →](/practices/eval-loop/)

## 4 · Deployed architecture — the image cannot bill anyone

{% include fig-topology.html %}

- **Stack** — one ECR repository, one App Runner service, one CloudWatch 5xx alarm; no VPC, no database, no key.
- **Evidence** — `agents/`, `runs/`, `loop/`, the task lists and the data sample baked in at build.
- **Region** — ap-southeast-1; the account is at the two-service App Runner cap in Sydney.
- **Deploy** — CI green on `main` → OIDC role → build and push → Terraform apply → wait for `RUNNING` → smoke.
- **Smoke** — `mode=demo`, a champion registered, 450 tasks served, the ledger non-empty, an unknown question declined.
- **Rollback** — retag a previous `:sha` as `:latest`.
- **Rung 10** — one instance, one worker, no load test.

[See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security — the optimiser can write two files

Three things need guarding: an optimiser with a shell, a test set that must stay unanswered, and a public URL.

- **Write guard** — a `PreToolUse` hook denies any write outside `agents/v(N+1)/`, and any write to `agent.yaml`.
- **Checksum** — the guarded paths, `loop/families/` among them, are hashed before and after the session; any change voids the cycle.
- **Test-set lock** — `eval --split all` asks for confirmation; a probe has `correct: null` on every row and writes no submission; CI refuses a prompt that quotes a leaderboard question.
- **Billing guard** — `require_live()` refuses to build a model under `DEMO_MODE=1`; a subscription session has `ANTHROPIC_API_KEY` stripped from its environment.
- **Execution caps** — 20 turns, 270 s per task, 120 s per call, 12k characters, the loop-breaker.
- **Absent**, rated `partial` — the python tool is `exec()` in-process with caps, not a sandbox; no red-team suite; no `SECURITY.md`.

## 6 · Observability & cost — the cheapest version was the one held

- **Traces** — one JSON per task per run: turns, tokens, cost, duration, terminal reason, final text. Two hundred and twenty-eight committed across six runs.
- **Signals** — `signals.json` beside every probe run; the ledger carries before, after and per family, so the Families page and gate A read the same numbers.
- **MLflow** — the index, never the record; if the server is down the eval still completes.
- **Ledger** — optimiser, reflector and eval tokens per cycle, beside the verdict.

<div class="slide" id="slide-6a">
  <h3><span class="n">6a</span>Cost fell every cycle, which is why cost is not the gate</h3>
  <p class="fig-title">Figure · cost and agent turns per ten-task dev run, by version</p>
  <div class="dia-frame">{% include diagrams/chart/dabstep-cost.svg %}</div>
  <ul>
    <li><b>Per dev run?</b> $0.754 → $0.634 → $0.632 for v0, v1, v2, and 90 → 79 → 75 turns; the held v3 ran the same ten for $0.279 and 28 turns.</li>
    <li><b>Where is the saving?</b> Helper functions replace hand-loops over 1,000 fee rules. v3's routing table made the agent fast and, on two tasks, fast and wrong.</li>
    <li><b>What did improving cost?</b> Optimiser sessions of 3.85 M, 2.05 M and 2.31 M input tokens, about $1.97, $1.27 and $1.23. A 94-trace probe of v2 cost $5.77; the same probe of v3, $3.67.</li>
    <li><b>And the public URL?</b> App Runner about $5–15 a month, and it replays rather than infers; a live question on the champion costs $0.06 — 262k input and 3.6k output tokens on Haiku 4.5, the dev-10 mean, and $0.061 across the 94 probe traces.</li>
  </ul>
  <p class="go">↳ <a href="/projects/dabstep-loop/eval-loop/">the ledger fields and the trace shape</a></p>
</div>

## 7 · Production readiness scorecard — six of nine, and n is ten
