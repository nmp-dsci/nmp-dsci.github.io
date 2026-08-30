---
title: ConvFinQA Agent
summary: >-
  Multi-turn financial Q&A over report text and tables — four typed pydantic-ai agents in a
  pipeline, with the prompts versioned and promoted like releases. The live URL is a read-only
  operator console: recorded chat, and six admin surfaces reading the same committed evidence
  the CI gate scores.
tldr: >-
  Four flash-tier agents in a typed pipeline with prompts versioned as code — a GEPA-tuned v2
  lifted accuracy 73.0% → 77.1%, and the same promotion contract then refused v3_1 at 76.2%.
tags: [Agents]
metric: "77.1%"
metric_label: "accuracy · up from 73.0% (594/770)"
featured: true
order: 2
stack: [pydantic-ai ×4 agents, DSPy/GEPA, FastAPI + Typer, React 18 + Vite, MLflow, Terraform + App Runner]

# ---- skills -----------------------------------------------------------------
skills: [prompt-versioning, model-evaluation, agentic-ai, prompt-engineering, llms, python]
skills_detail:
  - skill: prompt-versioning
    proof: Prompt sets live as versioned code modules (v1, v2, v3_1), auto-discovered by the loader and evaluated per version before anything ships (src/convfinqa/prompts/, src/convfinqa/pipeline/prompts_loader.py).
  - skill: model-evaluation
    proof: A 770-question scored set with committed prediction CSVs — REUSE_CACHE=1 reproduces any version offline with zero API calls, and it is how the v3_1 regression (76.2%) was caught (evaluation/predictions/, src/convfinqa/evaluation/metrics.py).
  - skill: agentic-ai
    proof: triage → preprocess → retriever → calculator, each a separate pydantic-ai agent with typed outputs; the calculator computes through six explicit arithmetic tools, never free-text math (src/convfinqa/pipeline/runner.py, src/convfinqa/pipeline/tools.py).
  - skill: prompt-engineering
    proof: v2's prompts came from a real GEPA run (DSPy) — 1,964 metric calls and 65 full validation evals moved the optimiser's own held-out score 56.5 → 65.3 before the scored set confirmed the gain (runs/gepa_real_20260502_005251/dspy_summary.json).
  - skill: llms
    proof: Deliberate two-tier DeepSeek split behind one choke point — every production stage runs on deepseek-v4-flash; deepseek-v4-pro is reserved for the diagnose→propose→verify harness where reasoning depth pays (src/convfinqa/llm.py).

# ---- links ------------------------------------------------------------------
links:
  repo: https://github.com/nmp-dsci/ConvFinQA-agent
  demo: https://vrpy25pewm.ap-southeast-1.awsapprunner.com

# ---- media ------------------------------------------------------------------
media:
  walkthrough:
  poster:
  captions:
  reel: planned

# ---- the AI / agent structure ----------------------------------------------
architecture:
  diagram: "diagrams/agent/convfinqa-agent.svg"
  caption: "turn → triage → preprocess → retriever → calculator → answer; number turns short-circuit at the retriever, and all four agents load one versioned prompt set"

# ---- how and where it runs --------------------------------------------------
production:
  live: true
  order: 2
  surface: >-
    Read-only operator console. Chat replays 8 recorded conversations — a real 30–60s turn plays
    in about four seconds. All six admin pages are live against the committed evidence:
    Evaluations (770 questions, gold beside every version's answer), Experiments, Traces,
    Research, the admin overview and the system debrief. Every write answers 403 with a reason
    (`owner_token_unset`), with the demo gate's 501 behind it.
  topology: "ECR → App Runner (1 instance, 0.5 vCPU / 1 GB) · CloudWatch 5xx alarm · no VPC, no database"
  topology_diagram: "diagrams/topology/convfinqa-agent.svg"
  region: ap-southeast-1
  cost: "~$5–15/mo · $0 inference"
  rung: 10
  rung_note: >-
    Rung 10 only. The seam is named in the code: sessions and the rate limiter are process
    memory and the backend needs `--workers 1` (src/convfinqa/serving/limits.py, Dockerfile CMD).
    No load test has been run.
  score: "6 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        200 sampled conversations / 770 questions, scored deterministically, with a genuinely
        never-seen 309-question subset kept separate from the headline. Prediction CSVs are
        committed, so `REUSE_CACHE=1` reproduces v1 73.0% → v2 77.1% → v3_1 76.2% offline with
        zero API calls, and the sweep cuts by turn type, conversation type and turn depth.
      proof: "evaluation/predictions/ · src/convfinqa/data/loader.py · src/convfinqa/evaluation/runner.py"
    - dimension: judge
      status: na
      how: >-
        No judge, by task framing rather than omission. Every answer is a number or a DSL
        program, so both oracles are deterministic: `numeric_match` is execution accuracy,
        `program_match` is program accuracy — did the system reach the number the way the
        annotator did. The gap between them is the honest measure of how much of the score is
        reasoning and how much is luck, and an LLM judge could only make that measurement worse.
      proof: "src/convfinqa/evaluation/metrics.py · tests/test_program_accuracy.py"
    - dimension: gate
      status: shipped
      how: >-
        A CI job on every PR re-scores the committed CSVs: each version's `correct` column must
        agree with re-scoring its own answers against gold, the champion must hold its recorded
        floor, and any challenger's per-question pass→fail flips are printed by name. The deploy
        workflow fires on `workflow_run` and only when CI concluded success — a red main cannot ship.
      proof: "src/convfinqa/tracking/gate.py · src/convfinqa/tracking/comparator.py · .github/workflows/ci.yml · .github/workflows/deploy-aws.yml"
    - dimension: loop
      status: shipped
      how: >-
        Prompts are versioned as code (v1, v2, v3_1). A real GEPA run — 1,964 metric calls, 65 full
        validation evals — produced v2. The s7 diagnose → propose → verify harness then promoted
        39 verified rules over the 95 first-wrong cases and assembled v3_1, which scored 76.2% and
        was refused: promotion needs accuracy ≥ champion *and* no pass→fail flips. The failed
        challenger keeps its bundle, its runs and its evidence in the registry.
      proof: "src/convfinqa/prompts/ · src/convfinqa/diagnosis/ · src/convfinqa/tracking/registry.py · runs/gepa_real_20260502_005251/dspy_summary.json"
    - dimension: guardrails
      status: partial
      how: >-
        Abuse controls rather than policy gates, because a read-only single-tenant demo has no
        data to isolate: one LLM choke point owns the demo gate, the 4-attempt retry policy and
        the 120s call ceiling; a global in-flight cap of 4 turns and a per-IP window of 30
        requests / 60s shed load before it costs anything; admin writes need the owner token
        *and* a non-demo build; replay declines below its match threshold rather than serving
        another filing's number. No per-user auth, no row-level policy, no red-team suite.
      proof: "src/convfinqa/serving/limits.py · src/convfinqa/llm.py · src/convfinqa/serving/demo_pack/store.py"
    - dimension: trace
      status: shipped
      how: >-
        Every turn the system answers is stored and browsable at `/admin/traces` — inputs,
        per-stage outputs, reasoning, the calculator's tool loop, tokens, latency, bundle id and
        the gold comparison — through the same code path for a live turn and a scored one.
        `GET /metrics/production` splits by source (serving / demo / eval) and never blends them;
        an unmeasured tile renders an em dash with a reason rather than a flattering zero.
      proof: "src/convfinqa/tracking/traces.py · src/convfinqa/serving/routes/metrics.py · src/convfinqa/serving/routes/traces.py"
    - dimension: cost
      status: shipped
      how: >-
        Per-turn token and cost accounting rolled from the metrics the runner already records,
        with DeepSeek prices declared in code so re-scoring an old run cannot silently reprice it.
        Flash tier for all four production agents, pro tier only inside the optimisation harness.
        Cached evals are free to re-run, the public deployment performs no inference at all, and
        the 1 GB instance was sized from measured RSS (225 MiB at rest → 315 MiB with every
        prediction CSV cached).
      proof: "src/convfinqa/tracking/cost.py · src/convfinqa/llm.py · infra/terraform/demo/main.tf"
    - dimension: release
      status: shipped
      how: >-
        Merge → CI → deploy, with GitHub OIDC into the deploy role and no stored AWS keys:
        Terraform creates the ECR repo, the image is built and pushed, App Runner auto-deploys
        `:latest`, Terraform reconciles, the workflow waits for RUNNING, and the smoke test
        asserts `mode=demo`, a registered champion, the `never_seen` split, a non-empty demo pack,
        the three-source metrics shape and a 403 on an admin write. Rollback is retagging a
        previous `:sha` as `:latest`.
      proof: ".github/workflows/deploy-aws.yml · scripts/demo_smoke.sh · infra/terraform/demo/main.tf"
    - dimension: scale
      status: designed
      how: >-
        Rung 10 and nothing beyond it has been measured. One App Runner instance, `--workers 1`,
        sessions and rate-limit state in process memory — correct at N=1, and the code says so
        rather than pretending otherwise: "if that ever changes, these two classes are the seam."
        Terraform pins the instance size but no auto-scaling configuration, so single-instance is
        App Runner's default rather than something the stack asserts. No load test; rungs 100 and
        1,000 are design only.
      proof: "src/convfinqa/serving/limits.py · CLAUDE.md · infra/terraform/demo/main.tf"
---

## 1 · Purpose & benefit

ConvFinQA asks a model multi-step numerical questions about a financial filing, across a
conversation where "that" and "this change" refer back to earlier turns. The benefit claim is one
number with its provenance: **77.1% execution accuracy on the 770-question scored set, up from
73.0%** — and every point of that lift came from prompts, not from a bigger model. The four
production agents run on the same flash-tier model before and after.

The live URL is a read-only operator console, not a chat toy. What a visitor can actually do:

- **Chat** replays 8 recorded conversations. A real turn takes 30–60 seconds because four model
  calls run in sequence; the replay emits the same SSE events, paced so a turn plays in about
  four seconds and still shows the stages resolving one after another.
- **All six admin pages are live** against the evidence baked into the image — Evaluations (all
  770 questions, gold beside each version's answer), Experiments (accuracy trend and a
  question-by-question version diff), Traces (every turn, stage by stage), Research, the admin
  overview and the system debrief.
- **Every write is refused.** `/admin/registry/promote`, `/admin/registry/challenger` and
  `/admin/research/start` all answer 403 with a reason — `owner_token_unset`, "Admin writes are
  disabled" — because an unset token means refused, not open.

<figure class="evidence">
  <img src="/assets/img/convfinqa/demo-console.png" loading="lazy" alt="The ConvFinQA console landing page: status chips reading MODE replay · keyless, CHAMPION v2 and GATE v3_1 refused; an execution-accuracy tile at 77.1% and a never-seen-accuracy tile at 77.7%; four latency, cost, turns and error tiles rendering an em dash because no turns were replayed in the last 24 hours; a SOURCES panel explaining that accuracy is recomputed from the committed prediction CSVs with no API calls; and a triage → preprocess → retriever → calculator pipeline strip.">
  <figcaption>The landing console, live. The two accuracy figures sit side by side and are never averaged: 77.1% is all 770 scored questions, seen and never-seen mixed; 77.7% is the 309 no optimizer ever saw. The latency, cost and error tiles render an em dash with a reason — nothing replayed in 24 hours — rather than a zero that would read as a measurement.</figcaption>
</figure>

Replaying chat is a cost decision, not an apology: a no-login public URL with a live model is an
unbounded bill. `DEMO_MODE` is baked into the image rather than set in Terraform, so no
infrastructure change can turn the public deployment into a billable one.

[Open the live demo ↗](https://vrpy25pewm.ap-southeast-1.awsapprunner.com) ·
[Repository ↗](https://github.com/nmp-dsci/ConvFinQA-agent)

## 2 · Agent architecture

{% include fig-agent.html %}

Four pydantic-ai agents run in sequence, each with a typed output model rather than parsed prose:

- **triage** classifies the turn — `number` or `program`, Type I or Type II conversation.
- **preprocess** resolves the references against history and decomposes the question into
  retrieval sub-questions plus a calculation program. Program turns only.
- **retriever** pulls the raw values out of the report's text and table, and answers number turns
  directly — those short-circuit here and never reach the calculator.
- **calculator** executes the program through six explicit tools (`add`, `subtract`, `multiply`,
  `divide`, `exp`, `greater`), never arithmetic in free text — the difference between a wrong
  answer you can debug and a plausible one you cannot.

The differentiator sits above the agents. **Prompts are not strings next to the call site** — each
version is its own module (`prompts/v1.py`, `v2.py`, the generated `v3_1.py`), auto-discovered by
`prompts.latest_all()`, so a new variant appears in the comparison table and at `GET /eval/runs`
with no registration step. A "version" here is a *bundle* — prompt set, GEPA overlay, both model
ids, dataset hash, code SHA — and `/healthz` names the one it is serving (`65c8a3edd210`: prompts
v2, flash and pro, code `bec0e68`), so a number on a screen is attributable to the build behind it.

Every model is constructed in one module, `llm.py`: `deepseek-v4-flash` for all four production
agents on every turn, `deepseek-v4-pro` only inside the optimisation harness. Nothing may build a
model at import time — a rule that exists because breaking it returned 500 from a read-only route
twice, now pinned by a test.

## 3 · Agent loop & evaluation

One request: triage labels the turn, preprocess writes the sub-questions and the program, the
retriever fills in the values, the calculator executes. The capture goes to the trace store with
the bundle id and the gold comparison. The evaluation is 200 sampled conversations, 770 questions;
prediction CSVs are committed, so `REUSE_CACHE=1` reproduces v1 73.0%, v2 77.1% and v3_1 76.2%
offline with no key — the only reason the gate can run on every pull request.

<figure class="evidence">
  <div class="dash-embed"><iframe src="/assets/dash/convfinqa/predictions-v2.html" loading="lazy" title="ConvFinQA v2 evaluation report"></iframe></div>
  <figcaption>The real v2 eval report — all 770 questions scored, each stage's IO inspectable · <a href="/assets/dash/convfinqa/predictions-v2.html" target="_blank" rel="noopener">open full-screen ↗</a></figcaption>
</figure>

Scoring is deterministic and doubled: `numeric_match` is execution accuracy, `program_match` asks
whether it got there the annotator's way. "Held out" has to be earned — GEPA trained on 120 of
the 200 conversations, so 770 is reported as *overall*, never held out, and the never-seen
subset is 309 questions where v2 scores 77.7% against v1's 72.8%. The two same-seed 60/40 splits
in the codebase agree on only 78 of 120 conversations, and `optimizer_split()` is the one GEPA
actually ran against.

GEPA (DSPy) — 1,964 metric calls, 65 full validation evals — moved the optimiser's own held-out
score 56.5 → 65.3 and produced v2. The s7 harness ran **diagnose → propose → verify**
over the 95 first-wrong cases, promoting 39 verified rules into `prompts/v3_1.py`.

**v3_1 scored 76.2% and was refused.** Promotion needs accuracy ≥ champion *and* no per-question
pass→fail flips, and the cuts say why: +2.1 pp on number turns, −2.7 on program turns, −5.4 on
Type II. 24 of the 39 rules target preprocess, and a rule verified against one case does not gate
the damage it does elsewhere. The challenger keeps its evidence, because a loop that deletes its
failures is marketing.

[the eval loop →](/practices/eval-loop/)

## 4 · Deployed architecture

{% include fig-topology.html %}

One ECR repository, one App Runner service, one CloudWatch alarm. No VPC, no database, no Secrets
Manager: the container is read-only by construction and holds no key. Everything a visitor browses
is baked in at build time: the dataset, the prediction CSVs, the s7 diagnostics, the registry, the
demo pack.

It runs in **ap-southeast-1 rather than Sydney** for an unglamorous reason worth recording: AWS
caps this account at two App Runner services per region and Sydney is already at it, so a
neighbouring region has a fresh allowance. It costs an Australian visitor about 100 ms, which a
replay-backed demo does not notice. Sizing is measured: 225 MiB RSS at rest, 315 MiB with every
prediction CSV cached — which is what the answers explorer does on a first click. 512 MB survives
at rest and then OOMs on that tab, so 1 GB is the floor.

Merge to `main` → CI must conclude success → the workflow assumes its role by OIDC, no stored
keys, pushes the image, App Runner auto-deploys `:latest`, Terraform reconciles, and
`demo_smoke.sh` asserts the live URL is what it claims: `mode=demo`, a registered champion, the
`never_seen` split, a non-empty demo pack, the three-source metrics shape, a 403 on a promote.
Rollback: retag a previous `:sha` as `:latest`.

Rung 10, and only rung 10. Sessions and the rate limiter live in process memory and the backend
runs `--workers 1` — the code names that as the seam rather than pretending it is not one.
Terraform pins the instance size but no auto-scaling configuration, so "exactly one instance" is
App Runner's default rather than something the stack asserts. No load test has been run.

[See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security

The honest framing is abuse control, not policy gating: this is a single-tenant read-only demo, so
there is no per-user data to isolate and no tool that can spend money or write anything.

**One choke point.** Every model is constructed in `llm.py`, which is what makes the demo gate
real rather than advisory — a handler cannot route around a check it does not know exists. The
gate fires *before* the provider is built, because the demo container has no key for a failing
call to use. A test pins it: every module must import with no API key.

**Shed load before spending anything on it.** A global in-flight cap of 4 turns rejects instantly
rather than queueing; a visitor told "busy" has a better time than one waiting 90 seconds behind
three strangers. Then a per-IP sliding window of 30 requests / 60 s, pruned on a housekeeping loop
so it cannot leak an entry per IP forever. `X-Forwarded-For` is trusted only when `trusted_proxy`
is set, and the in-flight cap is deliberately *not* keyed by client so it holds either way.

**Admin writes need the owner token and a non-demo build**, both rather than either — and the
token check is a route dependency, so on the public demo a promote answers 403 `owner_token_unset`
before the handler runs, with the demo gate's 501 behind it.

**Replay would rather decline.** Below its match threshold the demo pack refuses rather than serve
the nearest recording: confidently returning another filing's number is the worst thing a system
about numerical accuracy could do. Absent, and rated `partial` for it: per-user auth, row-level
policy, a red-team suite.

## 6 · Observability & cost

Every turn the system answers is kept. The trace store is a SQLite file in WAL mode, one row per
turn — inputs, per-stage outputs, reasoning, the calculator's tool loop, tokens, latency, bundle
id, correctness where gold exists — browsable at `/admin/traces` and filterable by report,
session, correctness and bundle. A live serving turn and a scored eval turn write the same
structure through the same code path, so "why did it answer that" is a question the product
answers about itself rather than one you take to a vendor dashboard.

`GET /metrics/production` groups by source — `serving`, `demo`, `eval` — and never blends them. A
recording paced to four seconds did not take four seconds; an eval turn ran at concurrency 8 on a
warm cache; only a serving turn's latency is one a person experienced. All three groups are always
present with their own counts, and a tile with no metered data renders an em dash and a reason
rather than a flattering zero — the smoke test asserts the *shape* of that payload and never a
latency number. Not built: per-call spans, which are constructed and dropped in-process.

Cost is accounted per turn from metrics the runner was already collecting and throwing away, with
DeepSeek prices declared in code rather than fetched so re-scoring an old run cannot silently
reprice it. Cached evals cost nothing to re-run, and the public deployment performs no inference at
all, so the worst case is a fixed ceiling: roughly **$5–15/month** for one 0.5 vCPU / 1 GB instance
plus an ECR repository that keeps five images.

## 7 · Production readiness scorecard
