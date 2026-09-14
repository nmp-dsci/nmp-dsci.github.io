---
title: DABstep Loop
short: "DABstep"   # the matrix column header on a phone
headline: "Built, scored, improved: 4/10 to 9/10 at p 0.031"
summary: >-
  A Claude Agent SDK agent on the DABstep tabular-QA benchmark, and the loop that rewrites its
  prompt and helper from its own failed traces. Two cycles took Haiku 4.5 from 4 to 9 of the 10
  gold tasks; the gate held the first and promoted the second.
tldr: >-
  One Haiku agent with one python tool, one Sonnet optimiser session per cycle confined to two
  files, and a McNemar gate on per-task flips that held v1 (+5 −1, p 0.109) and promoted v2
  (+5 −0, p 0.031).
outcome: >-
  A Haiku agent on DABstep, and a loop that rewrites its prompt and helper from its own failures,
  promoting only on a significant gain.
proof_line: >-
  v2 passed 9/10 dev tasks over v0's 4/10, five fixed and none broken, one-sided McNemar p 0.031;
  v1 fixed the same five but broke task 1871 (8/10, p 0.109) and was held.
tags: [Agents]
metric: "9 / 10"
metric_label: "dev split · up from 4 / 10 · p 0.031 · the 450 unscored"
featured: true
order: 4
deep: [eval-loop]
sections:
  - n: 1
    summary: >-
      Two cycles took ten gold tasks from four to nine, and the caveats sit on the same slide as the number.
  - n: 2
    summary: >-
      The agent is small on purpose: two editable files per version, so every gain is attributable to a diff.
  - n: 3
    summary: >-
      A better total was held because it broke one task; the same five fixes without the break were promoted.
  - n: 4
    summary: >-
      The image bakes in the runs, the ledger and demo mode, so the public URL cannot bill anyone.
  - n: 5
    summary: >-
      The optimiser may write two files under one folder, and a checksum voids the cycle if anything else moved.
  - n: 6
    summary: >-
      Every task in every run carries its cost and turns, and the champion answers ten tasks for less than the baseline.
  - n: 7
    summary: >-
      Six of nine shipped; the judge is not needed, the sandbox is not one, and scale is a design.
stack: [claude-agent-sdk, Haiku 4.5 · Sonnet 5, MLflow 3, FastAPI, React 18, Vite, Terraform, AWS App Runner]

# ---- skills -----------------------------------------------------------------
skills: [agentic-ai, model-evaluation, prompt-versioning, mlops, prompt-engineering, llms, python]
skills_detail:
  - skill: agentic-ai
    proof: One Claude Agent SDK session per task with a single stateful execute_python tool served as an in-process MCP server, a persistent namespace with pandas preloaded, a per-version helper module loaded from file, and NVIDIA's loop-breaker on repeated code (src/dabstep_loop/agent/session.py, src/dabstep_loop/agent/tools/python_executor.py, agents/v0/agent.yaml).
  - skill: model-evaluation
    proof: The benchmark's scorer vendored verbatim and excluded from lint, a committed ten-task gold split with the 450 locked behind a confirmation, per-run results and per-task traces committed so every score re-computes offline, and a one-sided exact McNemar test on paired flips as the promotion rule (src/dabstep_loop/eval/scorer.py, data/tasks/dev.jsonl, src/dabstep_loop/eval/compare.py, runs/).
  - skill: prompt-versioning
    proof: Each version is a folder of exactly three files, the prompt and helper editable and agent.yaml frozen, fingerprinted by content so the registry, the run and the folder can be checked against each other in CI (agents/v0/, agents/v2/, src/dabstep_loop/agent/versions.py, src/dabstep_loop/tracking/gate.py).
  - skill: mlops
    proof: A champion/challenger registry with an append-only history, an append-only ledger of every diagnosis, change and verdict, MLflow as the index of every eval run, and a CI gate that re-scores the champion's committed results on every push (loop/registry.json, loop/ledger.jsonl, src/dabstep_loop/tracking/mlflow_log.py, .github/workflows/ci.yml).
  - skill: prompt-engineering
    proof: The optimiser reads both champion surfaces and every failed trace, must file a diagnosis with a per-edit change log, and is shown the ledger and any held challenger so a failed fix is not retried unchanged; v2's prompt states fees are additive across matching rules, the rule 1871 needed (src/dabstep_loop/loop/optimiser.py, agents/v2/system.md, agents/v2/diagnosis.json).
  - skill: llms
    proof: Three model ids in one file, Haiku 4.5 for the agent under test and Sonnet 5 at high effort for the optimiser and the reflection pass, behind a billing guard that refuses to build a model in the demo image and strips the API key from a subscription session (src/dabstep_loop/agent/llm.py, .env.example, Dockerfile).
  - skill: python
    proof: uv-managed package, ruff and strict mypy in CI, 17 tests including the gate arithmetic, the executor's state and loop-breaker, and the demo's refusal to answer an unrecorded question (pyproject.toml, tests/test_eval.py, tests/test_agent_units.py, tests/test_api.py).

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
  # The home row shows the result: three bars and the verdict on each.
  home_diagram: "diagrams/chart/dabstep-progression.svg"
  home_fig_title: "Improving the DABstep agent · pass count on the ten gold tasks, by version"
  caption: "task → Haiku 4.5 session ⇄ execute_python (helper.py loaded per version) → one-line JSON answer → the vendored scorer; agent.yaml is frozen at 20 turns, 270 s, 120 s per call"
  loop_diagram: "diagrams/loop/dabstep-loop.svg"
  loop_takeaway: >-
    One Sonnet session sees every failure, may write two files, and a gate on per-task flips decides.
  loop_caption: "dev split → run → trace → score → optimise → write v(N+1) → run → gate → register → deploy → reflect, then the next cycle. The choke point and the write guard sit off the ring. Two cycles so far: one held, one promoted."

# ---- how and where it runs --------------------------------------------------
production:
  live: true
  order: 4
  surface: >-
    Read-only viewer over the committed evidence. Overview, Architecture and Data describe the
    benchmark and the agent; Tasks lists all 450; Runs, Trace and Compare open the three runs,
    every task's turns and cost, and the gate between any two runs; Loop and Evolution show the
    ledger and a diff of any two versions with the optimiser's reasoning. Ask replays the ten
    recorded questions and declines anything else.
  topology: "GitHub OIDC → ECR → App Runner (1 instance, 0.5 vCPU / 1 GB) · CloudWatch 5xx alarm · no VPC, no database"
  topology_diagram: "diagrams/topology/dabstep-loop.svg"
  region: ap-southeast-1
  cost: "~$5–15/mo · $0 inference"
  rung: 10
  rung_note: "one uvicorn worker · evidence read from the image · no load test"
  score: "6 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        Ten gold tasks committed, the leaderboard scorer vendored and excluded from lint so it
        cannot drift, every run's results.jsonl committed so the score re-computes offline. Ten
        is the limit of the gold; the 450 are never scored in this build.
      proof: "data/tasks/dev.jsonl · src/dabstep_loop/eval/scorer.py · runs/*/results.jsonl · tests/test_scorer.py"
    - dimension: judge
      status: na
      how: >-
        Every DABstep answer is a number or a short string scored by exact match in the
        benchmark's own scorer. There is no open-ended answer to judge, and no judge was built.
      proof: "src/dabstep_loop/eval/scorer.py · src/dabstep_loop/eval/score.py"
    - dimension: gate
      status: shipped
      how: >-
        Promotion is a one-sided exact McNemar test on per-task flips at α 0.05, so a better
        total that breaks a case is held; CI re-scores the champion's committed results with the
        vendored scorer and checks its fingerprint against the registry on every push.
      proof: "src/dabstep_loop/eval/compare.py · src/dabstep_loop/tracking/gate.py · .github/workflows/ci.yml · tests/test_eval.py"
    - dimension: loop
      status: shipped
      how: >-
        Versioned agent folders, one optimiser session per cycle that must file a diagnosis and a
        change log, a champion/challenger registry, and a ledger that records the held cycle and
        the reflection that explained it.
      proof: "src/dabstep_loop/loop/optimiser.py · src/dabstep_loop/loop/reflect.py · loop/ledger.jsonl · loop/registry.json · agents/v2/diagnosis.json"
    - dimension: guardrails
      status: partial
      how: >-
        A PreToolUse hook confines the optimiser to agents/v(N+1)/ and a checksum over ten
        guarded paths voids the cycle if anything else moved; a billing guard and the demo image
        stop any public inference. But the python tool is exec() with caps, not a sandbox, and
        nothing is red-teamed.
      proof: "src/dabstep_loop/loop/optimiser.py · src/dabstep_loop/agent/llm.py · src/dabstep_loop/agent/tools/python_executor.py · Dockerfile"
    - dimension: trace
      status: shipped
      how: >-
        Every task in every run has a committed trace with turns, tokens, cost, duration and
        terminal reason; MLflow indexes runs and the viewer replays any trace. No SLO or error
        budget, as on the other three systems.
      proof: "runs/*/traces/*.json · src/dabstep_loop/tracking/mlflow_log.py · loop/mlflow_snapshot.json · frontend/src/pages/Trace.tsx"
    - dimension: cost
      status: shipped
      how: >-
        Cost per task and per run in the committed traces, optimiser and eval tokens per cycle in
        the ledger, and a demo whose worst day is $0 because BILLING=none is baked into the image.
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

## 1 · Purpose & benefit — 4/10 to 9/10, and the gate decided

DABstep is 450 tabular-QA tasks over a payments dataset: a 138k-row `payments.csv`, 1,000 fee
rules and a 22 KB manual. Ten tasks ship with gold answers; the other 440 do not. This build
answers the ten, scores them with the benchmark's own scorer, and improves the agent from its
failures. The benefit is a loop whose every gain is a diff, a verdict and a p-value.

<div class="slide" id="slide-1a">
  <h3><span class="n">1a</span>Two cycles, one held, one promoted</h3>
  <p class="fig-title">Figure · pass count by version on the ten gold tasks, with the gate's verdict</p>
  <div class="dia-frame">{% include diagrams/chart/dabstep-progression.svg %}</div>
  <ul>
    <li><b>Why ten?</b> Only the dev split has gold. The 450 are locked behind a confirmation, and no answer key is derived from other teams' submissions.</li>
    <li><b>Why is v2 measured against v0?</b> v1 was held, so the champion stayed v0. v2's five fixes are the same five; the difference is the unbroken 1871.</li>
    <li><b>How blunt is the gate?</b> At n = 10, five fixes and no break is the smallest result that clears α 0.05 (p = 1/32).</li>
    <li><b>What about the leaderboard?</b> NVIDIA's Data Explorer reports 87.5 easy / 90.0 hard on the 450 with the same model. Context, not a comparison.</li>
  </ul>
  <p class="go">↳ <a href="/projects/dabstep-loop/eval-loop/">the loop in full, every command, the cycle log</a></p>
</div>

The live URL is a read-only viewer over the committed evidence:

| Surface | What a visitor sees |
|---|---|
| **Overview · Architecture · Data** | the benchmark, the agent, the files it reads |
| **Tasks · Runs · Trace** | all 450 tasks; the three runs; every task's turns, tokens and cost |
| **Compare · Loop · Evolution** | the gate between any two runs; the ledger; a diff of any two versions beside the optimiser's reasoning |
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
| **prompt** | `system.md` — v0 is NVIDIA's inference prompt, nine lines; v2 is forty | `agents/vN/system.md` |
| **helper** | `helper.py`, imported as `helper` inside the tool — 57, 325, then 440 lines | `agents/vN/helper.py` |
| **config** | `agent.yaml`, frozen: 20 turns, 270 s per task, 120 s per call | `agents/v0/agent.yaml` |

The agent is small on purpose. A version differs from its parent in two files, so a cycle's
change is a diff a reviewer can read, and the optimiser can be confined to it. `agent.yaml` is
byte-checked after every cycle.

The tool's caps, from `python_executor.py`:

- output over 12,000 characters is truncated to its head and tail;
- the same code run three times returns `STOP` and asks for the final answer;
- execution is serialised behind one lock, 120 s per call.

Models, in one file: `haiku` for the agent under test; `sonnet` at high effort for the optimiser
and the reflection pass; `opus` defined and unused.

## 3 · Agent loop & evaluation — one cycle held, one promoted, n = 10

{% include fig-loop.html %}

One cycle, one command, `make loop`:

1. run the champion on the dev split; commit the run;
2. one Sonnet session reads every failed trace and both champion surfaces;
3. it writes `agents/v(N+1)/system.md` and `helper.py`, verifying against the gold in-session, and files `diagnosis.json`;
4. run the challenger on the same ten;
5. gate — one-sided exact McNemar on the paired flips, promote at p < 0.05; the verdict goes on the ledger either way.

<div class="slide" id="slide-3a">
  <h3><span class="n">3a</span>The held cycle and the promoted one differ by one cell</h3>
  <p class="fig-title">Figure · pass or fail per task, three versions, ten gold tasks</p>
  <div class="dia-frame">{% include diagrams/chart/dabstep-flips.svg %}</div>
  <ul>
    <li><b>What did v1 break?</b> Task 1871, a fee delta. It let one most-specific rule win where the gold sums every matching rule: −0.80 against −0.95.</li>
    <li><b>How was that found?</b> An offline reflection pass over v1's traces, nine turns, recorded on the ledger before cycle 2 ran.</li>
    <li><b>What did v2 change?</b> Kept v1's helper, removed <code>best_matching_fee</code>, added <code>fee_total_for_rule</code> and <code>total_fees_paid</code>, and left 2697 alone rather than guess.</li>
    <li><b>What never passed?</b> 2697, in all three versions. Cycle 2's diagnosis records "not found": closest 16.63 against a gold of 13.57.</li>
  </ul>
  <p class="go">↳ <a href="/projects/dabstep-loop/eval-loop/">the gate arithmetic and the cycle log</a></p>
</div>

| Subject | Deliverable | Dev 10 | Verdict |
|---|---|---|---|
| `v0` | NVIDIA's prompt, a 57-line helper | 4 / 10 · 1 easy, 3 hard | champion, by baseline |
| `v1` · cycle 1 | four prompt rules, thirteen helper functions; 40 turns, 3.85 M input tokens | 8 / 10 · +5 −1 · p 0.109 | **held** |
| reflect | read-only pass over v1's traces; 9 turns | — | recorded · 1871's cause named |
| `v2` · cycle 2 | v1's helper minus one function plus three; 27 turns, 2.05 M tokens | 9 / 10 · +5 −0 · p 0.031 | **promoted** · champion |

CI runs `tracking/gate.py` on every push: it re-scores the champion's committed results with the
vendored scorer and fails if the count, the agent folder's fingerprint or the registry disagree,
or a cycle is left pending.

[Go deep: the loop →](/projects/dabstep-loop/eval-loop/)
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

Two things need guarding: an optimiser that is an agent with a shell, and a public URL.

- **Write guard** — a `PreToolUse` hook denies any write outside `agents/v(N+1)/`, and any write to `agent.yaml`.
- **Checksum** — ten guarded paths are hashed before and after the session; any change voids the cycle.
- **Billing guard** — `require_live()` refuses to build a model under `DEMO_MODE=1`; a subscription session has `ANTHROPIC_API_KEY` stripped from its environment.
- **Test-set lock** — `eval --split all` asks for confirmation; no answer key is derived from the leaderboard.
- **Execution caps** — 20 turns, 270 s per task, 120 s per call, 12k characters, the loop-breaker.
- **Absent**, rated `partial` — the python tool is `exec()` in-process with caps, not a sandbox; no red-team suite; no `SECURITY.md`.

## 6 · Observability & cost — $0.63 a run, and every task has a price

- **Traces** — one JSON per task per run: turns, tokens, cost, duration, terminal reason, final text. Thirty committed.
- **MLflow** — the index, never the record: one run per eval with agent, fingerprint, model and code SHA. If the server is down the eval still completes.
- **Ledger** — optimiser turns, duration and tokens per cycle, beside the verdict.
- **Viewer** — Runs, Trace, Compare and Evolution read the same files the CI gate does.

<div class="slide" id="slide-6a">
  <h3><span class="n">6a</span>The champion is cheaper as well as better</h3>
  <p class="fig-title">Figure · cost and agent turns per ten-task run, by version</p>
  <div class="dia-frame">{% include diagrams/chart/dabstep-cost.svg %}</div>
  <ul>
    <li><b>Per run?</b> $0.754 → $0.634 → $0.632, and 90 → 79 → 75 turns, on the same ten tasks.</li>
    <li><b>Where is the saving?</b> Helper functions replace hand-loops over 1,000 fee rules. Task 1681 went from a max-turns error at $0.17 to a pass at $0.10.</li>
    <li><b>What did improving cost?</b> Cycle 1's optimiser read 3.85 M input tokens, about $1.97; cycle 2 read 2.05 M, about $1.27. Each session cost more than the eval it improved.</li>
    <li><b>And the public URL?</b> $0 inference by construction; App Runner about $5–15 a month.</li>
  </ul>
  <p class="go">↳ <a href="/projects/dabstep-loop/eval-loop/">the ledger fields and the trace shape</a></p>
</div>

## 7 · Production readiness scorecard — six of nine, and n is ten
