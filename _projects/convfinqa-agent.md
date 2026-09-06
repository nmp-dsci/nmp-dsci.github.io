---
title: ConvFinQA Agent
short: "ConvFinQA"   # the matrix column header on a phone
headline: "Optimised to 90.5%, promoted only on significance"
summary: >-
  Multi-turn financial Q&A over filings. Four typed agents, an MLflow optimisation loop that
  promotes only on significance, and a runtime test that put the champion's prompts in one
  Claude session.
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
    Read-only operator console: chat replays 8 recorded conversations; Evaluations, Dataset,
    Experiments, Campaigns, Runtimes and Traces read the committed evidence. Every write
    answers 403 (`owner_token_unset`).
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
        Committed manifest — train 100 / gate 100 reports (368 / 349 questions), seed 2026,
        drawn only from conversations GEPA and s7 never saw — plus committed prediction CSVs for
        every run of both runtimes. Each turn carries numeric and program match, a cascade flag
        and a gold-derived per-agent panel.
      proof: "evaluation/splits/eval_loop_v2.json · src/convfinqa/evalloop/splits.py · src/convfinqa/evalloop/stage_scores.py · evaluation/predictions/evalloop/"
    - dimension: judge
      status: na
      how: >-
        No judge, by task framing: every answer is a number or a program, so matching is
        deterministic. The teacher attributes a miss to an agent and never scores it; its trust
        check is a 30-case κ sheet (bar 0.7), committed and not yet labelled.
      proof: "src/convfinqa/evaluation/metrics.py · src/convfinqa/evalloop/kappa.py · evaluation/diagnostics/evalloop/labelling_sheet_30cases.csv"
    - dimension: gate
      status: shipped
      how: >-
        Net positive on the fixed unseen split *and* one-sided cluster-corrected McNemar p <
        0.05, with a bootstrap CI on every verdict; `--promote` refused on train evidence. Three
        earlier promotions rolled back under it; v8 is the first that passed. CI re-scores the
        champion from its CSV on every PR — but v8's registry metrics are empty, so that floor
        is −0.5% and cannot fail. Open defect.
      proof: "src/convfinqa/tracking/comparator.py · src/convfinqa/evalloop/gate.py · evaluation/diagnostics/evalloop/gates.jsonl · src/convfinqa/tracking/gate.py · .github/workflows/ci.yml"
    - dimension: loop
      status: shipped
      how: >-
        A teacher on Opus 5 blames one agent per first-wrong turn; the challenger rewrites only
        that prompt; a campaign is up to five experiments, target rotated off after two
        rejections. Three campaigns, seven experiments, one promotion (v8). The runtime arm
        promoted sdk_v1 to `sdk_champion` and rejected sdk_v2. Holdout release gate built,
        never opened.
      proof: "src/convfinqa/evalloop/teacher.py · src/convfinqa/evalloop/campaign.py · src/convfinqa/evalloop/sdk_teacher.py · evaluation/registry.json · src/convfinqa/evalloop/release.py"
    - dimension: guardrails
      status: partial
      how: >-
        Abuse controls, not policy gates: one LLM choke point owns the demo gate, retries and the
        120 s ceiling; an in-flight cap of 4 and a per-IP window of 30 / 60 s; admin writes need
        the owner token *and* a non-demo build; replay declines below its match threshold. No
        per-user auth, no row-level policy, no red-team suite.
      proof: "src/convfinqa/serving/limits.py · src/convfinqa/llm.py · src/convfinqa/serving/demo_pack/store.py"
    - dimension: trace
      status: shipped
      how: >-
        Every pipeline LLM call is an MLflow span linked to its run; SDK spans opened by hand.
        Every served turn is a row at `/admin/traces` with per-stage IO, tokens, latency and
        bundle id. `GET /metrics/production` splits by source and never blends. The demo
        container has no tracking server.
      proof: "src/convfinqa/tracking/tracing.py · src/convfinqa/evalloop/sdk.py · src/convfinqa/tracking/traces.py · src/convfinqa/serving/routes/metrics.py · docker-compose.yml"
    - dimension: cost
      status: shipped
      how: >-
        Per-turn cost from the runner's own metrics, prices declared in code; the SDK arm's spend
        recorded per question. A gate pass is ~$1–2 on the pipeline, $27.62 on the Sonnet 5
        session. The public deployment performs no inference.
      proof: "src/convfinqa/tracking/cost.py · src/convfinqa/llm.py · evaluation/story.json · infra/terraform/demo/main.tf"
    - dimension: release
      status: shipped
      how: >-
        Merge → CI → OIDC deploy to ECR and App Runner, no stored keys; the smoke test asserts
        `mode=demo`, served bundle == champion (`v8`), the evidence, and a 403 on a write.
        Rollback is retagging a `:sha`. The holdout release gate is stub-tested, not exercised.
      proof: ".github/workflows/deploy-aws.yml · scripts/demo_smoke.sh · infra/terraform/demo/main.tf · src/convfinqa/evalloop/release.py"
    - dimension: scale
      status: designed
      how: >-
        Rung 10 only. One instance, `--workers 1`, sessions and rate-limit state in process
        memory — and the code names that as the seam. No auto-scaling asserted, no load test;
        rungs 100 and 1,000 are design only.
      proof: "src/convfinqa/serving/limits.py · CLAUDE.md · infra/terraform/demo/main.tf"
---

## 1 · Purpose & benefit

ConvFinQA asks multi-step numerical questions about a filing, across a conversation where
"that" and "this change" point back at earlier turns. The benefit is a loop whose every gain
has a named cause, a registry row and a p-value.

<div class="slide" id="slide-progression">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-progression.svg %}</div>
  <div class="tx">
    <p class="n">§1 · slide 1</p>
    <h3>From 73% to 90.5%, in four named causes</h3>
    <p>v2: a GEPA run. v8: the loop blamed the retriever, changed one prompt, and a significance gate promoted it on 349 unseen questions. sdk_v1: those four prompts distilled into one Claude session.</p>
    <p><b>The caveats sit here too.</b> The SDK step changed model and architecture together, and the split is drawn from the paper's public train pool. This is a win at equal optimisation effort, not human-level reasoning.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/eval-loop/">how v8 was promoted</a> · <a href="/projects/convfinqa-agent/sdk-vs-llm/">how the runtime was tested</a></p>
  </div>
</div>

The live URL is a read-only operator console over the committed evidence:

| Surface | What a visitor sees |
|---|---|
| **Chat** | 8 recorded conversations replayed over the same SSE events as a live turn |
| **Evaluations · Dataset** | every split beside its gold; the loop's runs at `/eval/loop-runs` |
| **Experiments · Campaigns** | the version trend, a diff of any two versions, every campaign verdict |
| **Runtimes** | the pipeline and the SDK session side by side on the gate split |
| **Traces · Research · System** | every turn stage by stage, the earlier challengers, the debrief |

Every write answers 403 with a reason (`owner_token_unset`). `DEMO_MODE` is baked into the
image, so no infrastructure change can turn the public URL into a bill.

[Open the live demo ↗](https://vrpy25pewm.ap-southeast-1.awsapprunner.com) ·
[Repository ↗](https://github.com/nmp-dsci/ConvFinQA-agent)

## 2 · Agent architecture

{% include fig-agent.html %}

Four pydantic-ai agents in sequence, each with a typed output rather than parsed prose:

| Agent | Job | Output |
|---|---|---|
| **triage** | classify the turn (`number` or `program`) and the conversation (Type I or II) | typed labels |
| **preprocess** | resolve references against history; write sub-questions and a program | program turns only |
| **retriever** | pull the raw values out of the report; answer number turns directly | values, or the answer |
| **calculator** | execute the program through six tools (`add`, `subtract`, `multiply`, `divide`, `exp`, `greater`) | the number |

Arithmetic never happens in free text. Each agent has its own prompt lineage keyed by content
hash, and a version is a lockfile of four: `v8` is `t2.p2.r5.c2`, v2 with only the retriever
changed. `/healthz` names the bundle it serves — `v8`, code `5af229e`.

<div class="slide" id="slide-runtimes">
  <div class="dia-frame">{% include diagrams/runtime/convfinqa-agent.svg %}</div>
  <div class="tx">
    <p class="n">§2 · slide 2</p>
    <h3>Four agents, or one session with the same six tools</h3>
    <p>The second runtime answers a whole conversation in one Claude Agent SDK session, with the six calculator functions as its only tools. It writes the same per-turn capture as the pipeline, so the two can be gated on the same questions.</p>
    <p>Its prompt was distilled from v8's four by the teacher: keep the rules, drop the hand-off plumbing.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/sdk-vs-llm/">the runtime test in full</a></p>
  </div>
</div>

Every model is built in one module, `llm.py`:

- `deepseek-v4-flash` — the four production agents, every turn;
- `claude-opus-5` via the Agent SDK — the teacher and prompt-writer;
- `claude-sonnet-5` — the single session.

## 3 · Agent loop & evaluation

{% include fig-loop.html %}

One experiment, one command:

1. run the baseline on the train split;
2. the teacher files each report's first wrong turn under a frozen taxonomy and blames one agent;
3. rewrite that agent's prompt, and only that one;
4. run both versions on the fixed gate split;
5. gate — net positive **and** one-sided cluster-corrected McNemar p < 0.05.

A campaign is up to five experiments against one gate split; a target agent rotates off after
two rejections. Scoring is deterministic (`numeric_match`, `program_match`) and a gold-derived
per-agent panel says which agent moved.

<div class="slide" id="slide-gates">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-gates.svg %}</div>
  <div class="tx">
    <p class="n">§3 · slide 3</p>
    <h3>Nine verdicts, two promotions, same 349 questions</h3>
    <p>Seven challengers moved the number and were refused. v8 and sdk_v1 cleared the bar.</p>
    <p>Under this rule v3_1, v4 and v5 were rolled back the same day. v5's p was 0.207 with a CI of [−3.2, +7.6]: the evidence was never wrong, it was never sufficient.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/eval-loop/">setup, every command, the cycle log</a></p>
  </div>
</div>

<div class="slide" id="slide-turn-types">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-turn-types.svg %}</div>
  <div class="tx">
    <p class="n">§3 · slide 4</p>
    <h3>The whole SDK gain is on the reasoning turns</h3>
    <p>Number turns are a lookup; both runtimes get 95.5%. Program turns went 75.2% → 88.2%, 35 fixed against 4 broken.</p>
    <p>Same prompt on Haiku 4.5: 87.4%, −3.2 pp, not significant, $10 cheaper a pass. The pipeline was never run on a Claude model, so the architecture half of the confound stays open.</p>
    <p class="go">↳ <a href="/projects/convfinqa-agent/sdk-vs-llm/">both arms, the model swap, every SDK experiment</a></p>
  </div>
</div>

| Subject | Deliverable | Accuracy | Verdict |
|---|---|---|---|
| `v1` · t1.p1.r1.c1 | the starting prompt set | 770 q: 73.0% | champion, until v2 |
| `v2` · t2.p2.r2.c2 | a GEPA run over DSPy | 770 q: 77.1% · gate 349 q: 77.1% | champion again after the rollback |
| `v3_1` · `v4` · `v5` | s7 harness; teacher, one agent each | v5: 187 q: 79.7%, clustered p 0.207 | **rolled back** 2026-09-03 |
| `v6` · `v7` | c01 preprocess rewrites | 349 q: 79.4% · 79.7% · p 0.19 · 0.13 | rejected |
| `v8` · t2.p2.r5.c2 | c01-e03, retriever rewrite | 349 q: 77.1% → 81.7% · 34 / 18 · p 0.040 | **promoted** · champion |
| `v9` … `v12` | c02, c03 rewrites against v8 | 349 q: 81.7 · 82.2 · 83.1 · 81.4% · p ≥ 0.25 | rejected |
| `sdk_v1` · s1 | v8 distilled into one session | 349 q: 81.7% → 90.5% · 38 / 7 · p 0.0003 | **promoted** · `sdk_champion` |
| `sdk_v2` · s2 | the SDK teacher's rewrite | 349 q: 90.5% → 87.7% · 6 / 16 · p 0.917 | rejected |

Refusals keep their bundles, runs and verdicts on the ledger. A loop that deletes its failures
is marketing.

[Go deep: the eval loop →](/projects/convfinqa-agent/eval-loop/)
· [the runtime test →](/projects/convfinqa-agent/sdk-vs-llm/)
· [the eval loop as a practice →](/practices/eval-loop/)

## 4 · Deployed architecture

{% include fig-topology.html %}

One ECR repository, one App Runner service, one CloudWatch alarm. No VPC, no database, no key
in the container. The dataset, splits, prediction CSVs, ledgers, registry and demo pack are baked
in at build time.

- **Region** ap-southeast-1, not Sydney: the account's Sydney App Runner quota was full. About
  100 ms for an Australian visitor.
- **Sizing** measured: 225 MiB at rest, 315 MiB with every CSV cached; 512 MB OOMs, so 1 GB.
- **Deploy** merge → CI → OIDC role → push image → App Runner takes `:latest` → Terraform
  reconciles → `demo_smoke.sh` asserts `mode=demo`, served bundle == champion (`v8`), the
  committed evidence, a 403 on a promote.
- **Rollback** retag a previous `:sha`.
- **Rung 10** only: sessions and rate limits are process memory, `--workers 1`, no load test.

[See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security

A single-tenant read-only demo has no user data to isolate, so these are abuse controls:

- **One choke point.** Every model — agents, teacher, SDK session — is built in `llm.py`,
  where the demo gate fires before a provider exists. A test asserts every module imports with
  no API key.
- **The teacher inherits nothing.** Its SDK session opens with `setting_sources=[]`; the repo's
  `CLAUDE.md` and skills never reach its prompt.
- **Shed load first.** A global in-flight cap of 4 turns rejects instantly; a per-IP window of
  30 requests / 60 s sits behind it. `X-Forwarded-For` is trusted only behind a declared proxy.
- **Admin writes** need the owner token *and* a non-demo build: 403 before the handler runs.
- **Replay declines** below its match threshold rather than serve another filing's number.
- **Absent**, rated `partial`: per-user auth, row-level policy, a red-team suite.

## 6 · Observability & cost

Every pipeline LLM call is an MLflow span — run → report → question → agent stage →
`Agent.run` — stamped with version, split and run name. SDK calls are a subprocess, so their
spans are opened by hand.

<figure class="evidence">
  <img src="/assets/img/convfinqa/mlflow-challenger-trace.jpg" loading="lazy" alt="The MLflow trace view for a challenger eval run: a tree of spans from the run down through a report and a question to the four named agent stages and the Agent.run calls inside them, with tokens and latency per span.">
  <figcaption><strong>A challenger's run is inspectable down to the individual model call.</strong> Run → report → question → agent stage → <code>Agent.run</code>, with tokens and the full chat on every leaf. Source: <code>src/convfinqa/tracking/tracing.py</code>, <code>docker-compose.yml</code>.</figcaption>
</figure>

Every served turn is also a row at `/admin/traces`: per-stage IO, the tool loop, tokens,
latency, bundle id, correctness where gold exists. `GET /metrics/production` splits by source
and never blends them:

- `demo` — a recording paced to four seconds did not take four seconds;
- `eval` — ran at concurrency 8 on a warm cache;
- `serving` — the only latency a person experienced.

A tile with no data renders an em dash and a reason. Cost is per turn, with prices declared in
code so an old run cannot be silently repriced:

| Runtime | Model | Gate pass (349 q) | Wall | Throughput |
|---|---|---|---|---|
| pipeline v8 | deepseek-v4-flash, in process | ~$1–2 | 344 s | 61 q/min |
| session sdk_v1 | claude-sonnet-5, CLI subprocess | $27.62 | 787 s | 27 q/min |
| session sdk_v1 | claude-haiku-4-5, CLI subprocess | $17.14 | 882 s | 24 q/min |

The public deployment performs no inference: roughly **$5–15/month** for one 0.5 vCPU / 1 GB
instance and an ECR repository keeping five images.

## 7 · Production readiness scorecard
