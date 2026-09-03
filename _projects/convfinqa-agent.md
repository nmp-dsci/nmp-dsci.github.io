---
title: ConvFinQA Agent
short: "ConvFinQA"   # the matrix column header on a phone
headline: "One agent per cycle, promoted only on unseen evidence"
summary: >-
  Multi-turn financial Q&A over report text and tables — four typed pydantic-ai agents in a
  pipeline, each with its own prompt lineage, and a self-improving eval loop that blames one
  agent per miss, changes only that agent, and promotes only on a sealed test split. The live
  URL is a read-only operator console over the committed evidence the CI gate scores.
tldr: >-
  Four flash-tier agents with per-agent prompt lineage; a pro-tier teacher diagnoses each
  first-wrong turn and proposes a one-agent challenger; a net-positive gate on the unseen test
  split promoted v5 at 79.7% (149/187) over 77.5% and refused v4 the same way.
outcome: >-
  A teacher-driven loop changes one agent per cycle and promotes only on evidence the
  optimiser never saw, or refuses.
proof_line: >-
  v5 was promoted on the unseen test split at 79.7% (149/187) over v3_1's 77.5%, 12 fixed
  against 8 broken with McNemar p 0.50 recorded on the verdict, and v4 was refused the same way.
tags: [Agents]
metric: "79.7%"
metric_label: "unseen test split (149/187) · v5 over 77.5%"
featured: true
order: 2
deep: [eval-loop]
sections:
  - n: 1
    summary: >-
      The benefit is a loop that can say no: every promotion and refusal is on the registry,
      and the demo serves its champion.
  - n: 2
    summary: >-
      A bundle is a composition of four prompt lineages, so a challenger that changes one
      agent is a fact the registry can state.
  - n: 3
    summary: >-
      The teacher blames one agent, the challenger changes one agent, and the gate reads only
      evidence the teacher never saw.
  - n: 4
    summary: >-
      All the evidence is baked into the image, so the public deployment serves the whole
      console with no key, no database and no inference.
  - n: 5
    summary: >-
      One choke point builds every model, the teacher included, so the demo container cannot
      run a cycle any more than a turn.
  - n: 6
    summary: >-
      Every LLM call is a span in MLflow, and serving, demo and eval turns are never blended
      into one flattering number.
  - n: 7
    summary: >-
      Six of the nine dimensions shipped; the three that did not are named with their reasons
      rather than quietly rounded up.
stack: [pydantic-ai ×4 agents + teacher, MLflow 3 (runs · traces · prompts), DeepSeek v4 flash / pro, FastAPI + Typer, React 18 + Vite, Terraform + App Runner]

# ---- skills -----------------------------------------------------------------
skills: [prompt-versioning, model-evaluation, agentic-ai, mlops, prompt-engineering, llms, python]
skills_detail:
  - skill: prompt-versioning
    proof: Each of the four agents has its own prompt lineage keyed by content hash, and a bundle is the composition (t3.p4.r3.c3) — v5 is v3_1 with only preprocess changed (src/convfinqa/tracking/prompt_ledger.py, src/convfinqa/prompts/v5.py, evaluation/registry.json).
  - skill: model-evaluation
    proof: A committed train/test/holdout manifest drawn from conversations no optimiser saw, every run scored per turn with a cascade flag and a gold-derived per-agent panel at zero API calls, prediction CSVs committed so the gate re-scores offline (src/convfinqa/evalloop/splits.py, src/convfinqa/evalloop/stage_scores.py, evaluation/predictions/evalloop/).
  - skill: agentic-ai
    proof: triage → preprocess → retriever → calculator, each a separate pydantic-ai agent with typed outputs; the calculator computes through six explicit arithmetic tools, never free-text maths (src/convfinqa/pipeline/runner.py, src/convfinqa/pipeline/tools.py).
  - skill: mlops
    proof: Append-only registry with champion aliases, a comparator that records the exact McNemar p on every verdict, MLflow tracing of every LLM call, and a CI gate that re-scores the champion from its own committed CSV on every pull request (src/convfinqa/tracking/registry.py, src/convfinqa/tracking/comparator.py, src/convfinqa/tracking/tracing.py, src/convfinqa/tracking/gate.py).
  - skill: prompt-engineering
    proof: The teacher attributes each first-wrong turn to one agent under a frozen failure taxonomy and proposes one additive rule; a prompt-writer merges at most five into a generated one-agent challenger (src/convfinqa/evalloop/teacher.py, src/convfinqa/prompts/v4.py, src/convfinqa/prompts/v5.py).
  - skill: llms
    proof: Deliberate two-tier DeepSeek split behind one choke point — deepseek-v4-flash for all four production agents on every turn, deepseek-v4-pro only for the teacher and prompt-writer (src/convfinqa/llm.py, src/convfinqa/backends/pydantic.py).

# ---- links ------------------------------------------------------------------
links:
  repo: https://github.com/nmp-dsci/ConvFinQA-agent
  demo: https://vrpy25pewm.ap-southeast-1.awsapprunner.com

# ---- media ------------------------------------------------------------------
media:
  walkthrough:
  poster:
  captions:
  reel: ""

# ---- the AI / agent structure ----------------------------------------------
architecture:
  takeaway: >-
    Every turn crosses the same four typed boundaries, and each boundary loads its own prompt lineage, which is what makes a one-agent change attributable.
  diagram: "diagrams/agent/convfinqa-agent.svg"
  caption: "turn → triage → preprocess → retriever → calculator → answer; number turns short-circuit at the retriever; the four prompts compose into one bundle, t3.p4.r3.c3 for the champion"
  loop_diagram: "diagrams/loop/convfinqa-agent.svg"
  loop_takeaway: >-
    The loop changes one agent per cycle and promotes only on evidence the teacher never saw.
  loop_caption: "manifest → run → trace → score → teacher → propose → register → gate → release → deploy → observe, then round again; the choke point and the human checks sit off the ring. Release exists but has never been opened."

# ---- how and where it runs --------------------------------------------------
production:
  live: true
  order: 2
  surface: >-
    Read-only operator console. Chat replays 8 recorded conversations — a real 30–60s turn plays
    in about four seconds. The admin pages are live against the committed evidence: Evaluations,
    Dataset (every split beside its gold), Experiments, Traces, Research, the admin overview and
    the system debrief. Every write answers 403 with a reason (`owner_token_unset`), with the demo
    gate's 501 behind it.
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
        A committed split manifest — train 53 / test 54 / holdout 56 reports, seed 2026,
        stratified on Type II, drawn only from conversations GEPA and s7 never saw — plus
        committed prediction CSVs for every run. Each turn carries numeric and program match, a
        cascade flag, and a per-agent panel derived from gold at zero API calls. The legacy
        770-question corpus and its 309 never-seen questions are still scored for v1–v3_1.
      proof: "evaluation/splits/eval_loop_v1.json · src/convfinqa/evalloop/splits.py · src/convfinqa/evalloop/stage_scores.py · evaluation/predictions/evalloop/"
    - dimension: judge
      status: na
      how: >-
        No judge scores an answer, by task framing: every answer is a number or a DSL program,
        so `numeric_match` and `program_match` are deterministic. The one LLM in the loop's
        judgement path is the teacher, which attributes a miss to an agent and never scores it;
        its trust check is a 30-case human labelling sheet with a bar of κ ≥ 0.7, committed and
        not yet labelled.
      proof: "src/convfinqa/evaluation/metrics.py · src/convfinqa/evalloop/kappa.py · evaluation/diagnostics/evalloop/labelling_sheet_30cases.csv"
    - dimension: gate
      status: shipped
      how: >-
        Promotion needs a net-positive paired comparison on the shared questions of the unseen
        test split — more fixed than broken — with the exact McNemar p recorded on the verdict
        and flagged when the sample cannot support significance; `--promote` is refused on
        train-split evidence. In CI, every PR re-scores the champion from its own committed CSV
        (the test-split CSV for evalloop champions, the 770-row CSV for legacy ones) against
        its recorded floor, and the deploy workflow fires only when CI concluded success.
      proof: "src/convfinqa/tracking/comparator.py · src/convfinqa/evalloop/gate.py · src/convfinqa/tracking/gate.py · .github/workflows/ci.yml · .github/workflows/deploy-aws.yml"
    - dimension: loop
      status: shipped
      how: >-
        A teacher on the pro tier reads each report's first wrong turn and blames one agent
        under a frozen taxonomy; the challenger changes only that agent's prompt, so each agent
        has its own lineage and a bundle is a composition. Two verdicts on the history: v4
        (retriever only) improved retriever recall on the test split and collapsed the
        calculator, refused; v5 (preprocess only) promoted at +2.1 pp, 12 fixed against 8
        broken. The sealed holdout release gate exists and has never been opened.
      proof: "src/convfinqa/evalloop/teacher.py · src/convfinqa/tracking/prompt_ledger.py · src/convfinqa/prompts/v5.py · evaluation/registry.json · src/convfinqa/evalloop/release.py"
    - dimension: guardrails
      status: partial
      how: >-
        Abuse controls rather than policy gates, because a read-only single-tenant demo has no
        data to isolate: one LLM choke point owns the demo gate, the 4-attempt retry policy and
        the 120s call ceiling, and the teacher is built there too; a global in-flight cap of 4
        turns and a per-IP window of 30 requests / 60s shed load before it costs anything;
        admin writes need the owner token *and* a non-demo build; replay declines below its
        match threshold rather than serving another filing's number. No per-user auth, no
        row-level policy, no red-team suite.
      proof: "src/convfinqa/serving/limits.py · src/convfinqa/llm.py · src/convfinqa/serving/demo_pack/store.py"
    - dimension: trace
      status: shipped
      how: >-
        Every eval run traces every LLM call into MLflow — run → report → question → agent
        stage → `Agent.run`, with tokens and the full chat — linked to the run that produced it;
        serving opts in with `MLFLOW_TRACING=1`. Every turn the system answers is also a row in
        the trace store, browsable at `/admin/traces` with per-stage IO, the tool loop, tokens,
        latency, bundle id and the gold comparison. `GET /metrics/production` splits by source
        (serving / demo / eval) and never blends them; an unmeasured tile renders an em dash with
        a reason. The demo container has no tracking server, so spans are a dev and eval surface.
      proof: "src/convfinqa/tracking/tracing.py · src/convfinqa/tracking/traces.py · src/convfinqa/serving/routes/metrics.py · docker-compose.yml"
    - dimension: cost
      status: shipped
      how: >-
        Per-turn token and cost accounting rolled from the metrics the runner already records,
        with DeepSeek prices declared in code so re-scoring an old run cannot silently reprice
        it. Flash tier for all four production agents; the pro tier appears only in the
        teacher's 30 calls per cycle. A cycle is sized with `--n-reports` or `--n-questions`
        rather than run over the corpus, cached evals are free to re-run, and the public
        deployment performs no inference at all on a 1 GB instance sized from measured RSS.
      proof: "src/convfinqa/tracking/cost.py · src/convfinqa/llm.py · src/convfinqa/evalloop/cli.py · infra/terraform/demo/main.tf"
    - dimension: release
      status: shipped
      how: >-
        Merge → CI → deploy, with GitHub OIDC into the deploy role and no stored AWS keys:
        Terraform creates the ECR repo, the image is built and pushed, App Runner auto-deploys
        `:latest`, Terraform reconciles, the workflow waits for RUNNING, and the smoke test
        asserts `mode=demo`, that the served bundle *is* the registry champion, the committed
        evidence, and a 403 on an admin write. Rollback is retagging a previous `:sha`. The
        holdout release gate that would confirm a champion before shipping is built and
        stub-tested, not yet exercised.
      proof: ".github/workflows/deploy-aws.yml · scripts/demo_smoke.sh · infra/terraform/demo/main.tf · src/convfinqa/evalloop/release.py"
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
conversation where "that" and "this change" refer back to earlier turns. The benefit is not a
number but a loop that can say no: every promotion and every refusal sits on an append-only
registry, and the public deployment serves the champion that registry names.

The number the loop produced is small and reported with its denominator: **v5 scores 79.7%
(149/187) on the unseen test split against v3_1's 77.5%**, 12 questions fixed and 8 broken,
McNemar p 0.50 — not significant, and said so on the verdict itself.

The live URL is a read-only operator console, not a chat toy:

| Surface | What a visitor sees |
|---|---|
| **Chat** | 8 recorded conversations replayed over the same SSE events as a live turn, paced to about four seconds |
| **Evaluations** | the 770-question corpus with gold beside v1, v2 and v3_1's answers; the loop's own runs are served at `/eval/loop-runs` over their own denominators |
| **Dataset** | every split's questions beside gold answer and gold program, where the teacher's `gold_suspect` rows get settled |
| **Experiments** | the version trend and a question-by-question diff of any two versions |
| **Traces** | every turn, stage by stage |
| **Research** | the diagnose → propose → verify runs behind the earlier challengers |
| **Admin · System** | the overview and the debrief |

**Every write is refused.** `/admin/registry/promote`, `/admin/registry/challenger` and
`/admin/research/start` answer 403 with a reason (`owner_token_unset`), because an unset token
means refused, not open.

<figure class="evidence">
  <img src="/assets/img/convfinqa/demo-console.png" loading="lazy" alt="The ConvFinQA console landing page in dark mode: a header line reading champion v5, bundle 9a1bbd5900e8, deepseek-v4-flash, code dc3efb2; chips for mode replay · keyless, champion v5 and gate v2 pass; an execution-accuracy tile at 76.2% and a never-seen tile at 73.5%, both labelled v3_1 over the 770-question corpus; latency, cost and error tiles rendering an em dash because no turns were replayed in the last 24 hours; three recorded conversations to replay; and a SOURCES panel explaining that accuracy is recomputed from the committed prediction CSVs with no API calls.">
  <figcaption><strong>The board names its bundle, and it shows the seam the loop opened.</strong> The header and champion chip read v5 from <code>/healthz</code>, but the accuracy tiles still read the 770-question corpus CSVs and so show v3_1, the last version that has one; the loop's own evidence for v5 is served separately. The latency, cost and error tiles render an em dash with a reason rather than a zero. Source: <code>src/convfinqa/serving/routes/metrics.py</code>, <code>evaluation/registry.json</code>.</figcaption>
</figure>

Replaying chat is a cost decision, not an apology: a no-login public URL with a live model is an
unbounded bill. `DEMO_MODE` is baked into the image rather than set in Terraform, so no
infrastructure change can turn the public deployment into a billable one.

[Open the live demo ↗](https://vrpy25pewm.ap-southeast-1.awsapprunner.com) ·
[Repository ↗](https://github.com/nmp-dsci/ConvFinQA-agent)

## 2 · Agent architecture

{% include fig-agent.html %}

Four pydantic-ai agents run in sequence, each with a typed output model rather than parsed prose:

| Agent | Job | Output |
|---|---|---|
| **triage** | classify the turn (`number` or `program`) and the conversation (Type I or II) | typed labels |
| **preprocess** | resolve references against history, decompose into sub-questions and a program | program turns only |
| **retriever** | pull the raw values out of the report's text and table; answer number turns directly | values, or the answer |
| **calculator** | execute the program through six tools (`add`, `subtract`, `multiply`, `divide`, `exp`, `greater`) | the number |

Number turns short-circuit at the retriever and never reach the calculator. Arithmetic never
happens in free text — the difference between a wrong answer you can debug and a plausible one
you cannot.

**Each agent has its own prompt lineage.** A prompt is identified by its content hash and carries
a human label — triage `t1…t3`, preprocess `p1…p4`, retriever `r1…r4`, calculator `c1…c3` — and
a version module is a lockfile of four: `v5` resolves to `t3.p4.r3.c3`. That is what turns "v5 is
v3_1 with only the preprocess prompt changed" from a commit message into a fact the registry can
state and MLflow can filter on.

A bundle adds the rest of what a number depends on — both model ids, the dataset hash, the code
SHA — and `/healthz` names the one it serves, so any number on any screen is attributable to a
build. Today it answers champion `v5`, composition `t3.p4.r3.c3`, code `dc3efb2`.

Every model is constructed in one module, `llm.py`: `deepseek-v4-flash` for the four production
agents on every turn, `deepseek-v4-pro` only for the teacher and the prompt-writer. Nothing may
build a model at import time — a rule that exists because breaking it returned 500 from a
read-only route twice, now pinned by a test.

## 3 · Agent loop & evaluation

{% include fig-loop.html %}

One request: triage labels the turn, preprocess writes the sub-questions and the program, the
retriever fills in the values, the calculator executes. Scoring is deterministic and doubled:
`numeric_match` is execution accuracy, `program_match` asks whether it got there the annotator's
way. A per-agent panel derived from the gold program — turn type, program skeleton, operand
recall, execution given recall — says *which* agent moved, at zero API calls.

The loop runs against a committed manifest, not the corpus the old optimisers trained on:
train 53, test 54 and holdout 56 reports, seed 2026, stratified on Type II, drawn only from
conversations GEPA and s7 never saw. A teacher on the pro tier reads each report's first wrong
turn — later wrongs are cascade, not signal — blames exactly one agent under a frozen failure
taxonomy, and proposes one rule. The challenger changes only that agent.

Promotion is decided on the unseen test split and nowhere else: a net-positive paired comparison
on the shared questions, with the exact McNemar p recorded on the verdict and flagged when the
sample cannot support significance. `--promote` on train evidence is refused by the tool.

| Version | Composition | Where it came from | Evidence | What the gate did |
|---|---|---|---|---|
| `v1` | t1.p1.r1.c1 | the starting prompt set | 770 q: 73.0% | champion, until v2 |
| `v2` | t2.p2.r2.c2 | a real GEPA run (DSPy) | 770 q: 77.1% · never-seen 309: 77.7% | promoted |
| `v3_1` | t3.p3.r3.c3 | the s7 harness, 39 verified rules | 770 q: 76.2% | refused on 770 under the old flip-veto rule; the loop's baseline since |
| `v4` | t3.p3.r4.c3 | teacher, retriever only | test-10: recall .744 → .780, accuracy 79.4% → 67.6% | **refused** — the calculator collapsed downstream |
| `v5` | t3.p4.r3.c3 | teacher, preprocess only, 5 rules from 30 diagnoses | test-50: 77.5% → 79.7% (187 q), 12 fixed / 8 broken, p 0.50 | **promoted** · champion |

**The v3_1 row carries three events, all public on the registry.** Refused on the full 770 under
the flip-veto rule; promoted over v2 on a 44-question train run the morning the loop first
turned; named champion again by the owner's rollback of v4, with the reason that promotion
evidence must come from the test split. That rollback is where the "unseen evidence only" rule
comes from, and v5 is the first promotion made under it.

**The refusal is the point.** v4 improved the exact metric it targeted on unseen data and was
still refused, because the per-agent panel showed the calculator collapsing behind it. A loop
that deletes its failures is marketing; both verdicts keep their bundles, their runs and their
evidence.

[Go deep: the loop's setup, every command, and the cycle log →](/projects/convfinqa-agent/eval-loop/)
· [the eval loop as a practice →](/practices/eval-loop/)

## 4 · Deployed architecture

{% include fig-topology.html %}

One ECR repository, one App Runner service, one CloudWatch alarm. No VPC, no database, no Secrets
Manager: the container is read-only by construction and holds no key. Everything a visitor browses
is baked in at build time: the dataset, the split manifest, the prediction CSVs, the diagnoses,
the registry, the demo pack.

It runs in **ap-southeast-1 rather than Sydney** for an unglamorous reason worth recording: AWS
caps this account at two App Runner services per region and Sydney is already at it, so a
neighbouring region has a fresh allowance. It costs an Australian visitor about 100 ms, which a
replay-backed demo does not notice.

Sizing is measured, not guessed: 225 MiB RSS at rest, 315 MiB with every prediction CSV cached,
which is what the answers explorer does on a first click. 512 MB survives at rest and then OOMs on
that tab, so 1 GB is the floor.

Merge to `main` → CI must conclude success → the workflow assumes its role by OIDC, no stored
keys, pushes the image, App Runner auto-deploys `:latest`, Terraform reconciles. Then
`demo_smoke.sh` asserts the live URL is what it claims:

- `mode=demo`;
- a registered champion, and that the served bundle **is** that champion;
- the `never_seen` split;
- a non-empty demo pack;
- the three-source metrics shape;
- a 403 on a promote.

Rollback is one step: retag a previous `:sha` as `:latest`.

Rung 10, and only rung 10. Sessions and the rate limiter live in process memory and the backend
runs `--workers 1` — the code names that as the seam rather than pretending it is not one.
Terraform pins the instance size but no auto-scaling configuration, so "exactly one instance" is
App Runner's default rather than something the stack asserts. No load test has been run.

[See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security

The honest framing is abuse control, not policy gating: this is a single-tenant read-only demo, so
there is no per-user data to isolate and no tool that can spend money or write anything.

**One choke point.** Every model is constructed in `llm.py` — the four agents and the teacher
alike — which is what makes the demo gate real rather than advisory: a handler cannot route around
a check it does not know exists, and the demo container can no more run a cycle than a turn. The
gate fires *before* the provider is built. A test pins it: every module must import with no API
key.

**Shed load before spending anything on it.** A global in-flight cap of 4 turns rejects instantly
rather than queueing; a visitor told "busy" has a better time than one waiting 90 seconds behind
three strangers. Behind that sits a per-IP sliding window of 30 requests / 60 s, pruned on a
housekeeping loop. `X-Forwarded-For` is trusted only when `trusted_proxy` is set, and the
in-flight cap is deliberately *not* keyed by client so it holds either way.

**Admin writes need the owner token and a non-demo build**, both rather than either — and the
token check is a route dependency, so on the public demo a promote answers 403 `owner_token_unset`
before the handler runs, with the demo gate's 501 behind it.

**Replay would rather decline.** Below its match threshold the demo pack refuses rather than serve
the nearest recording: confidently returning another filing's number is the worst thing a system
about numerical accuracy could do. Absent, and rated `partial` for it: per-user auth, row-level
policy, a red-team suite.

## 6 · Observability & cost

Every LLM call an eval run makes is a span. `mlflow.pydantic_ai.autolog()` records each agent
invocation and the chat inside it; the loop adds the two levels the autologger cannot infer — the
report and the question — and stamps version, split and run name on the trace, so a span joins
back to the experiment run that produced it. Serving opts in with `MLFLOW_TRACING=1`; its Logfire
spans stay on a separate tracer provider, because merging the two crashes pydantic-ai.

<figure class="evidence">
  <img src="/assets/img/convfinqa/mlflow-challenger-trace.jpg" loading="lazy" alt="The MLflow trace view for a challenger eval run: a tree of spans from the run down through a report and a question to the four named agent stages and the Agent.run calls inside them, with tokens and latency per span.">
  <figcaption><strong>A challenger's run is inspectable down to the individual model call.</strong> Run → report → question → named agent stage → <code>Agent.run</code>, with tokens and the full chat on every leaf, in the local MLflow server the loop always writes to. Source: <code>src/convfinqa/tracking/tracing.py</code>, <code>docker-compose.yml</code>.</figcaption>
</figure>

Every turn the system answers is also kept as a row. The trace store is a SQLite file in WAL mode,
browsable at `/admin/traces`, and each row carries the inputs and every stage's output, the
reasoning, the calculator's tool loop, tokens and latency, the bundle id, and correctness where
gold exists. A live serving turn and a scored eval turn write the same structure through the same
code path.

`GET /metrics/production` groups by source and never blends them, because the three are not
measuring the same thing:

- `demo` — a recording paced to four seconds did not take four seconds;
- `eval` — an eval turn ran at concurrency 8 on a warm cache;
- `serving` — only this latency is one a person actually experienced.

A tile with no metered data renders an em dash and a reason rather than a flattering zero, and
the smoke test asserts the *shape* of that payload and never a latency number. The demo container
has no tracking server, so the span tree is a dev and eval surface, not a public one.

Cost is accounted per turn from metrics the runner was already collecting, with DeepSeek prices
declared in code so re-scoring an old run cannot silently reprice it. A cycle is sized, not
sprawling: a 50-report cycle is four runs of about 190 questions on the flash tier plus 30
teacher calls on the pro tier, and `--n-questions` caps a run without touching the manifest.

The public deployment performs no inference, so its worst case is a fixed ceiling of roughly
**$5–15/month** for one 0.5 vCPU / 1 GB instance and an ECR repository keeping five images.

## 7 · Production readiness scorecard
