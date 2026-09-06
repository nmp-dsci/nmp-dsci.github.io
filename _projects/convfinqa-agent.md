---
title: ConvFinQA Agent
short: "ConvFinQA"   # the matrix column header on a phone
headline: "Optimised to 90.5%, promoted only on significance"
summary: >-
  Multi-turn financial Q&A over report text and tables — four typed pydantic-ai agents in a
  pipeline, a prompt-optimisation loop on MLflow that changes one agent per experiment and
  promotes only when a cluster-corrected McNemar test says the gain is real, and a runtime
  test that distilled the champion's four prompts into one Claude Agent SDK session. The live
  URL is a read-only operator console over the committed evidence the CI gate scores.
tldr: >-
  Four typed agents, a teacher that rewrites one prompt per experiment, a significance gate on
  349 unseen questions that promoted v8, and a runtime test that scored 90.5% in one session.
outcome: >-
  A loop that optimises one agent's prompt at a time, promotes only on significant unseen
  evidence, and measured a runtime change the same way.
proof_line: >-
  sdk_v1 scored 90.5% (316/349) over the v8 pipeline's 81.7% on the same unseen gate questions,
  +8.9 pp with one-sided clustered McNemar p 0.0003; v8 itself was the one campaign promotion
  in seven, +4.6 pp over v2 at p 0.040.
tags: [Agents]
metric: "90.5%"
metric_label: "unseen gate split (316/349) · one session over the 81.7% pipeline"
featured: true
order: 2
deep: [eval-loop, sdk-vs-llm]
sections:
  - n: 1
    summary: >-
      Four named causes take the number from 73% to 90.5%, and the two caveats are on the same slide.
  - n: 2
    summary: >-
      A bundle is a composition of four prompt lineages, which is what makes a one-agent change attributable.
  - n: 3
    summary: >-
      The gate promoted two of nine challengers on the same 349 questions and rolled back three earlier ones.
  - n: 4
    summary: >-
      All the evidence is baked into the image, so the public deployment serves the whole
      console with no key, no database and no inference.
  - n: 5
    summary: >-
      One choke point builds every model, teacher and SDK session included, so the demo
      container cannot run a cycle any more than a turn.
  - n: 6
    summary: >-
      Every LLM call is a span in MLflow, every gate pass has a price, and serving, demo and eval
      turns are never blended.
  - n: 7
    summary: >-
      Six of the nine dimensions shipped; the three that did not are named with their reasons
      rather than quietly rounded up.
stack: [pydantic-ai ×4 agents, claude-agent-sdk (Opus 5 teacher · Sonnet 5 session), MLflow 3 (runs · traces · prompts), DeepSeek v4 flash / pro, FastAPI + Typer, React 18 + Vite, Terraform + App Runner]

# ---- skills -----------------------------------------------------------------
skills: [prompt-versioning, model-evaluation, agentic-ai, mlops, prompt-engineering, llms, python]
skills_detail:
  - skill: prompt-versioning
    proof: Each of the four agents has its own prompt lineage keyed by content hash, and a bundle is the composition (t2.p2.r5.c2) — v8 is v2 with only the retriever changed; the sdk_v* lineage is registered the same way under its own alias (src/convfinqa/tracking/prompt_ledger.py, src/convfinqa/prompts/v8.py, src/convfinqa/prompts/sdk_v1.py, evaluation/registry.json).
  - skill: model-evaluation
    proof: A committed 100 / 100-report manifest drawn from conversations no optimiser saw, every run scored per turn with a cascade flag and a gold-derived per-agent panel at zero API calls, a paired comparison with a cluster-corrected McNemar test and a bootstrap CI on every verdict, prediction CSVs committed so the gate re-scores offline (src/convfinqa/evalloop/splits.py, src/convfinqa/evalloop/stage_scores.py, src/convfinqa/tracking/comparator.py, evaluation/predictions/evalloop/).
  - skill: agentic-ai
    proof: triage → preprocess → retriever → calculator, each a separate pydantic-ai agent with typed outputs, and a second runtime that answers the whole conversation in one Claude Agent SDK session with the same six arithmetic tools, writing the same capture shape so the two can be gated against each other (src/convfinqa/pipeline/runner.py, src/convfinqa/pipeline/tools.py, src/convfinqa/backends/agent_sdk.py).
  - skill: mlops
    proof: Append-only registry with champion aliases, three append-only ledgers for diagnoses, rewrites and verdicts joined by id, MLflow tracing of every LLM call, campaigns of up to five experiments against one fixed gate split, and a CI gate that re-scores the champion from its committed CSV on every pull request (src/convfinqa/tracking/registry.py, src/convfinqa/evalloop/campaign.py, src/convfinqa/tracking/tracing.py, src/convfinqa/tracking/gate.py).
  - skill: prompt-engineering
    proof: The teacher files each first-wrong turn under a frozen failure taxonomy and blames one agent; a prompt-writer rewrites only that agent's prompt in tagged areas; a distillation prompt turns four agent prompts into one session prompt while keeping the knowledge and dropping the hand-off plumbing (src/convfinqa/evalloop/teacher.py, src/convfinqa/evalloop/sdk_teacher.py, src/convfinqa/prompts/v8.py).
  - skill: llms
    proof: Three tiers behind one choke point — deepseek-v4-flash for the four production agents on every turn, claude-opus-5 through the Agent SDK for the teacher and prompt-writer with no inherited repo instructions, claude-sonnet-5 for the single-session runtime with per-question cost recorded (src/convfinqa/llm.py, src/convfinqa/backends/pydantic.py, src/convfinqa/evalloop/sdk.py).

# ---- links ------------------------------------------------------------------
links:
  repo: https://github.com/nmp-dsci/ConvFinQA-agent
  demo: https://vrpy25pewm.ap-southeast-1.awsapprunner.com

# ---- media ------------------------------------------------
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
  caption: "turn → triage → preprocess → retriever → calculator → answer; number turns short-circuit at the retriever; the four prompts compose into one bundle, t2.p2.r5.c2 for the champion"
  loop_diagram: "diagrams/loop/convfinqa-agent.svg"
  loop_takeaway: >-
    The loop changes one agent per experiment and promotes only when the unseen evidence is significant.
  loop_caption: "manifest → run → trace → score → teacher → propose → register → gate → release → deploy → observe, then the next experiment; a campaign is up to five against one fixed gate split. The choke point and the human checks sit off the ring. Release exists but has never been opened."

# ---- how and where it runs --------------------------------------------------
production:
  live: true
  order: 2
  surface: >-
    Read-only operator console. Chat replays 8 recorded conversations — a real 30–60s turn plays
    in about four seconds. The admin pages are live against the committed evidence: Evaluations,
    Dataset (every split beside its gold), Experiments, Campaigns, Runtimes, Traces, Research,
    the admin overview and the system debrief. Every write answers 403 with a reason
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
        A committed split manifest — train 100 / gate 100 reports (368 / 349 questions), seed
        2026, stratified on Type II, drawn only from conversations GEPA and s7 never saw, the
        holdout reserved as the untouched remainder of the pool — plus committed prediction CSVs
        for every run of both runtimes. Each turn carries numeric and program match, a cascade
        flag, and a per-agent panel derived from gold at zero API calls. The legacy 770-question
        corpus is still scored for v1–v3_1.
      proof: "evaluation/splits/eval_loop_v2.json · src/convfinqa/evalloop/splits.py · src/convfinqa/evalloop/stage_scores.py · evaluation/predictions/evalloop/"
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
        Promotion needs a net-positive paired comparison on the fixed unseen gate split *and* a
        one-sided McNemar p below 0.05, cluster-corrected by conversation, with a bootstrap 95%
        CI on every verdict; `--promote` is refused on train-split evidence. Under that rule the
        three earlier promotions were rolled back and v8 is the first that passed. In CI, every
        PR re-scores the champion from its own committed CSV; v8's registry metrics are empty,
        so today that check runs against a −0.5% floor and cannot fail — an open defect.
      proof: "src/convfinqa/tracking/comparator.py · src/convfinqa/evalloop/gate.py · evaluation/diagnostics/evalloop/gates.jsonl · src/convfinqa/tracking/gate.py · .github/workflows/ci.yml"
    - dimension: loop
      status: shipped
      how: >-
        A teacher on Opus 5 files each report's first wrong turn under a frozen taxonomy and
        blames one agent; the challenger rewrites only that agent's prompt; a campaign runs up
        to five such experiments against one gate split and rotates a target off after two
        rejections. Three campaigns, seven experiments, one promotion (v8, retriever). The same
        loop then ran a runtime arm: sdk_v1 promoted to `sdk_champion`, sdk_v2 rejected. The
        sealed holdout release gate exists and has never been opened.
      proof: "src/convfinqa/evalloop/teacher.py · src/convfinqa/evalloop/campaign.py · src/convfinqa/evalloop/sdk_teacher.py · evaluation/registry.json · src/convfinqa/evalloop/release.py"
    - dimension: guardrails
      status: partial
      how: >-
        Abuse controls rather than policy gates, because a read-only single-tenant demo has no
        data to isolate: one LLM choke point owns the demo gate, the 4-attempt retry policy and
        the 120s call ceiling, and the teacher and the SDK session are built there too; a global
        in-flight cap of 4 turns and a per-IP window of 30 requests / 60s shed load before it
        costs anything; admin writes need the owner token *and* a non-demo build; replay
        declines below its match threshold rather than serving another filing's number. No
        per-user auth, no row-level policy, no red-team suite.
      proof: "src/convfinqa/serving/limits.py · src/convfinqa/llm.py · src/convfinqa/serving/demo_pack/store.py"
    - dimension: trace
      status: shipped
      how: >-
        Every pipeline eval run traces every LLM call into MLflow — run → report → question →
        agent stage → `Agent.run`, with tokens and the full chat; Agent SDK calls run as a CLI
        subprocess, so their spans are opened by hand and prompts stored by reference. Every
        turn the system answers is also a row in the trace store, browsable at `/admin/traces`
        with per-stage IO, the tool loop, tokens, latency, bundle id and the gold comparison.
        `GET /metrics/production` splits by source and never blends them. The demo container
        has no tracking server, so spans are a dev and eval surface.
      proof: "src/convfinqa/tracking/tracing.py · src/convfinqa/evalloop/sdk.py · src/convfinqa/tracking/traces.py · src/convfinqa/serving/routes/metrics.py · docker-compose.yml"
    - dimension: cost
      status: shipped
      how: >-
        Per-turn token and cost accounting rolled from the metrics the runner already records,
        with DeepSeek prices declared in code so re-scoring an old run cannot silently reprice
        it, and the SDK arm's cost recorded per question on its run. A gate pass costs about
        $1–2 on the pipeline and $27.62 on the Sonnet 5 session; the teacher's few dozen calls
        per cycle run on Opus 5 through subscription billing. The public deployment performs no
        inference at all on a 1 GB instance sized from measured RSS.
      proof: "src/convfinqa/tracking/cost.py · src/convfinqa/llm.py · evaluation/story.json · infra/terraform/demo/main.tf"
    - dimension: release
      status: shipped
      how: >-
        Merge → CI → deploy, with GitHub OIDC into the deploy role and no stored AWS keys:
        Terraform creates the ECR repo, the image is built and pushed, App Runner auto-deploys
        `:latest`, Terraform reconciles, the workflow waits for RUNNING, and the smoke test
        asserts `mode=demo`, that the served bundle *is* the registry champion (v8 at
        `5af229e` today), the committed evidence, and a 403 on an admin write. Rollback is
        retagging a previous `:sha`. The holdout release gate that would confirm a champion
        before shipping is built and stub-tested, not yet exercised.
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
conversation where "that" and "this change" refer back to earlier turns. The benefit here is
an optimisation loop that can be trusted: every gain has a named cause, a registry row and a
p-value, and the same loop measured a change of runtime the way it measures a change of prompt.

<div class="slide" id="slide-progression">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-progression.svg %}</div>
  <div class="tx">
    <p class="n">§1 · slide 1</p>
    <h3>From 73% to 90.5%, in four named causes</h3>
    <p>Each bar is a registry event. v2 came from a GEPA run over DSPy. v8 came from the eval loop: a teacher blamed the retriever, one prompt changed, and a significance gate promoted it on 349 unseen questions. sdk_v1 is those four prompts distilled into one Claude session.</p>
    <p><b>Same slide, same breath.</b> The SDK step changed model and architecture together, and the 349-question split is drawn from the paper's public train pool, so the human line is orientation. The claim is a win at equal optimisation effort, not human-level reasoning.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/eval-loop/">how v8 was promoted</a> · <a href="/projects/convfinqa-agent/sdk-vs-llm/">how the runtime was tested</a></p>
  </div>
</div>

The live URL is a read-only operator console, not a chat toy:

| Surface | What a visitor sees |
|---|---|
| **Chat** | 8 recorded conversations replayed over the same SSE events as a live turn, paced to about four seconds |
| **Evaluations · Dataset** | the corpus and every split's questions beside gold; the loop's runs served at `/eval/loop-runs` over their own denominators |
| **Experiments · Campaigns** | the version trend, a question-by-question diff of any two versions, and every campaign verdict |
| **Runtimes** | the pipeline and the SDK session side by side on the gate split |
| **Traces · Research · System** | every turn stage by stage, the earlier challenger runs, the overview and the debrief |

**Every write is refused.** `/admin/registry/promote`, `/admin/registry/challenger` and
`/admin/research/start` answer 403 with a reason (`owner_token_unset`), because an unset token
means refused, not open. Replaying chat is a cost decision: a no-login public URL with a live
model is an unbounded bill, and `DEMO_MODE` is baked into the image so no infrastructure change
can turn the deployment into a billable one.

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
a human label — triage `t1…t3`, preprocess `p1…p4`, retriever `r1…r5`, calculator `c1…c3` — and
a version module is a lockfile of four: `v8` resolves to `t2.p2.r5.c2`. That is what turns "v8 is
v2 with only the retriever prompt changed" from a commit message into a fact the registry can
state and MLflow can filter on.

`/healthz` names the bundle it serves — champion `v8`, composition `t2.p2.r5.c2`, code
`5af229e` — so any number on any screen is attributable to a build.

<div class="slide" id="slide-runtimes">
  <div class="dia-frame">{% include diagrams/runtime/convfinqa-agent.svg %}</div>
  <div class="tx">
    <p class="n">§2 · slide 2</p>
    <h3>Four agents, or one session with the same six tools</h3>
    <p>The second runtime answers a whole conversation in one Claude Agent SDK session: the report arrives in the first message, each question is one more, and the six calculator functions are its only tools. It writes the same per-turn capture as the pipeline, so the two can be gated against each other on the same questions.</p>
    <p>Its prompt was not written by hand. The teacher <i>distilled</i> v8's four prompts into one — keep the turn-type criteria, the reference rules, the retrieval conventions and the calculator discipline; drop the hand-off plumbing that only makes sense for an agent that cannot see the conversation.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/sdk-vs-llm/">the runtime test in full</a></p>
  </div>
</div>

Every model is constructed in one module, `llm.py`: `deepseek-v4-flash` for the four production
agents, `claude-opus-5` through the Agent SDK for the teacher and prompt-writer, `claude-sonnet-5`
for the single session. Nothing may build a model at import time — a rule that exists because
breaking it returned 500 from a read-only route twice, now pinned by a test.

## 3 · Agent loop & evaluation

{% include fig-loop.html %}

One experiment: run the baseline on the train split, let the teacher file each report's first
wrong turn under a frozen taxonomy and blame one agent, rewrite that agent's prompt, run both
versions on the fixed gate split, decide. A campaign is up to five experiments against the same
gate split, and a target agent rotates off after two consecutive rejections.

Scoring is deterministic and doubled: `numeric_match` is execution accuracy, `program_match`
asks whether it got there the annotator's way. A per-agent panel derived from the gold program
says *which* agent moved, at zero API calls.

<div class="slide" id="slide-gates">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-gates.svg %}</div>
  <div class="tx">
    <p class="n">§3 · slide 3</p>
    <h3>Nine verdicts, two promotions, all on the same 349 questions</h3>
    <p>The rule since 2026-09-03: net positive on the shared gate questions <b>and</b> one-sided, cluster-corrected McNemar p &lt; 0.05, clustered by conversation because a wrong turn poisons the turns below it. Seven challengers moved the number and were refused; v8 and sdk_v1 cleared the bar.</p>
    <p>Re-judged under this rule, v3_1, v4 and v5 were rolled back to v2 the same day. v5's p was 0.207 with a CI of [−3.2, +7.6] that contains zero: the evidence was never wrong, it was never sufficient.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/eval-loop/">the loop's setup, every command, the cycle log</a></p>
  </div>
</div>

<div class="slide" id="slide-turn-types">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-turn-types.svg %}</div>
  <div class="tx">
    <p class="n">§3 · slide 4</p>
    <h3>The whole SDK gain is on the reasoning turns</h3>
    <p>Number turns are a lookup and both runtimes already get 95.5%. Program turns need a plan, retrieval and arithmetic across the conversation: the single session lifted them 75.2% → 88.2%, 35 fixed against 4 broken. Program-match stayed near 41%, so it reaches the right numbers without reproducing the gold programs.</p>
    <p>Swapping the model under the same prompt cost 3.2 pp (Haiku 4.5 at 87.4%, p 0.051, not significant) and $10 a pass. The architecture half of the confound stays open: the four-agent pipeline was never run on a Claude model.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/sdk-vs-llm/">both arms, the model swap, every SDK experiment</a></p>
  </div>
</div>

| Subject | Deliverable | Accuracy | Verdict |
|---|---|---|---|
| `v1` · t1.p1.r1.c1 | the starting prompt set | 770 q: 73.0% | champion, until v2 |
| `v2` · t2.p2.r2.c2 | a GEPA run over DSPy, all four prompts | 770 q: 77.1% · gate 349 q: 77.1% | champion again after the rollback; baseline of campaign c01 |
| `v3_1` · `v4` · `v5` | s7 harness; teacher, retriever only; teacher, preprocess only | v5: 187 q: 79.7%, clustered p 0.207 | **rolled back** to v2 on 2026-09-03 — promoted under the retired net-positive rule |
| `v6` · `v7` | c01 preprocess rewrites | 349 q: 79.4% · 79.7% · p 0.19 · 0.13 | rejected |
| `v8` · t2.p2.r5.c2 | c01-e03, retriever rewrite · `prompts/v8.py` | 349 q: 77.1% → 81.7% · 34 fixed / 18 broken · p 0.040 | **promoted** · champion |
| `v9` … `v12` | c02 and c03 rewrites against v8 | 349 q: 81.7 · 82.2 · 83.1 · 81.4% · p 0.50 · 0.39 · 0.25 · 0.55 | rejected — v11's +1.4 pp was not enough |
| `sdk_v1` · s1 | v8's four prompts distilled into one Claude session · `prompts/sdk_v1.py` | 349 q: 81.7% → 90.5% · 38 fixed / 7 broken · p 0.0003 | **promoted** · `sdk_champion` |
| `sdk_v2` · s2 | the SDK teacher's calculator rewrite | 349 q: 90.5% → 87.7% · 6 fixed / 16 broken · p 0.917 | rejected |

**The refusals are the point.** Seven of nine challengers kept their bundles, their runs and their
verdicts on the ledger, and three earlier champions lost their alias when the rule got stricter.
A loop that deletes its failures is marketing.

[Go deep: the loop's setup, every command, and the cycle log →](/projects/convfinqa-agent/eval-loop/)
· [Go deep: the runtime test →](/projects/convfinqa-agent/sdk-vs-llm/)
· [the eval loop as a practice →](/practices/eval-loop/)

## 4 · Deployed architecture

{% include fig-topology.html %}

One ECR repository, one App Runner service, one CloudWatch alarm. No VPC, no database, no Secrets
Manager: the container is read-only by construction and holds no key. Everything a visitor browses
is baked in at build time: the dataset, the split manifest, the prediction CSVs of both runtimes,
the three ledgers, the registry, the demo pack.

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
- a registered champion, and that the served bundle **is** that champion — `v8` today;
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

**One choke point.** Every model is constructed in `llm.py` — the four agents, the teacher and the
SDK session alike — which is what makes the demo gate real rather than advisory: a handler cannot
route around a check it does not know exists, and the demo container can no more run a cycle than
a turn. The gate fires *before* the provider is built. A test pins it: every module must import
with no API key.

**The teacher inherits nothing.** The Agent SDK session that judges the pipeline is opened with
`setting_sources=[]`, so this repository's `CLAUDE.md`, settings and skills never become part of
its prompt. It is asked to judge a pipeline, not to behave like a contributor.

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

Every LLM call a pipeline eval run makes is a span. `mlflow.pydantic_ai.autolog()` records each
agent invocation and the chat inside it; the loop adds the two levels the autologger cannot infer —
the report and the question — and stamps version, split and run name on the trace, so a span joins
back to the experiment run that produced it.

Agent SDK calls run as a CLI subprocess the autologger cannot see, so `evalloop/sdk.py` opens
their spans by hand and stores their prompts by reference.

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
declared in code so re-scoring an old run cannot silently reprice it, and the SDK arm's spend
recorded per question on its run. The runtime test made the price of a gate pass explicit:

| Runtime | Model | Gate pass (349 q) | Wall | Throughput |
|---|---|---|---|---|
| pipeline v8 | deepseek-v4-flash, in process | ~$1–2 | 344 s | 61 q/min |
| session sdk_v1 | claude-sonnet-5, CLI subprocess | $27.62 | 787 s | 27 q/min |
| session sdk_v1 | claude-haiku-4-5, CLI subprocess | $17.14 | 882 s | 24 q/min |

The teacher's few dozen calls per cycle run on Opus 5 through subscription billing. The public
deployment performs no inference, so its worst case is a fixed ceiling of roughly **$5–15/month**
for one 0.5 vCPU / 1 GB instance and an ECR repository keeping five images.

## 7 · Production readiness scorecard
