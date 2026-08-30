---
title: Data Pilot
summary: >-
  A conversational data agent over ~3.2M rows of NSW property data — ask in plain
  English, get governed SQL, a chart and a written report, over only the rows you
  are allowed to see. It runs on AWS as a walk-in demo: Explore and the SQL editor
  are live against the real marts, and chat replays recorded agent runs.
tldr: >-
  Governed NL→SQL in production — Postgres row-level security and an sqlglot AST guard decide what the model may touch, and merging to main deploys the whole stack under GitHub OIDC with no stored keys.
tags: [Agents, Data]
metric: "9 / 9"
metric_label: "rubric dimensions shipped · rung-100 sizing measured"
featured: true
order: 1
stack: [pydantic-ai, FastAPI, Aurora Serverless v2 + pgvector, React 19, dlt + dbt, Pyodide/WASM sandbox, Terraform · App Runner · CloudFront]

skills: [agentic-ai, governance, mlops, sql, rag, model-evaluation, product-ui]
skills_detail:
  - skill: governance
    proof: Postgres row-level security keyed to per-user dataset grants, set per request and enforced through a read-only role, plus a three-layer SQL guard whose sqlglot AST walk rejects DML hidden in a CTE and privileged calls like set_config (db/init/02_rls.sql, services/data-agent/agent/sql_guardrails.py).
  - skill: agentic-ai
    proof: A pydantic-ai loop plans extract → sandboxed pandas analysis → report, with tools for dbt-manifest schema knowledge, value lookup and per-user memory, under a 22-request / 600k-token budget (services/data-agent/agent/sandbox_agent.py).
  - skill: mlops
    proof: Merge to main runs one OIDC-authenticated workflow — images, Terraform, ECS migrate + dlt/dbt pipeline, App Runner, CloudFront, then a smoke test against the live URL — with zero stored AWS keys (.github/workflows/deploy-aws.yml, scripts/cloud_smoke.sh).
  - skill: rag
    proof: Per-user pgvector memory and dbt-manifest knowledge grounding, embedded on-box with fastembed bge-small (384-dim) — recall with no embedding API (services/data-agent/agent/memory.py, services/data-agent/agent/embeddings.py).
  - skill: model-evaluation
    proof: Golden Examples are authored inside the product and exported to a version-controlled pack; deterministic graders G1–G3 plus a cross-family judge that refuses to grade its own model family (services/data-agent/agent/eval_graders.py, services/data-agent/agent/eval_judge.py).
  - skill: sql
    proof: Every answer carries the single read-only SELECT that produced it, run under RLS with a statement timeout and a row cap; the same governed executor backs the SQL editor and the chart-to-query links (services/backend-api/app/sql_exec.py, services/backend-api/app/routers/sql.py).
  - skill: product-ui
    proof: A React 19 product with nine feature areas in light and dark, plus non-UI front doors — a key-authenticated webhook, an HMAC-signed Slack slash command and @mention bot, and an MCP server — all funnelling through one run_question() (frontend/src/features/, services/backend-api/app/routers/integrations.py).

links:
  repo: https://github.com/nmp-dsci/data-qa-agent
  demo: https://deqfc8b0u8s64.cloudfront.net

media:
  walkthrough: ""
  poster: ""
  captions: ""
  reel: planned

architecture:
  diagram: "diagrams/agent/data-pilot.svg"
  caption: "question → pydantic-ai loop → AST guard → governed SELECT under RLS → WASM sandbox → typed report"

production:
  live: true
  order: 1
  surface: >-
    No login and no sign-up. Explore and the SQL editor run live against the real
    marts; chat replays eight recorded agent runs as paced SSE (plan, then charts,
    then report, in about 5–10 seconds); the Ops deck, Evaluations and Golden
    Examples are readable exhibits with every write refused server-side. The first
    Explore call after an idle hour waits ~30s while Aurora resumes, and the UI
    narrates it.
  topology: "CloudFront + S3 → App Runner backend ×1 → Aurora Serverless v2 · ECS Fargate one-shot jobs"
  topology_diagram: "diagrams/topology/data-pilot.svg"
  region: "ap-southeast-2"
  cost: "~$8–18/mo · $0 inference"
  rung: 10
  rung_note: "rung-100 sizing measured — the s42 worker sweep held drain time to within 6% of ⌈N/W⌉×S across all nine grid cells"
  score: "9 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        Goldens are authored inside the product stage by stage — ① SQL extract,
        ② sandbox objects, ③ report — then exported to a version-controlled pack:
        32 cases across nsw_sales, nsw_rent and nsw_yield on a T1–T7 question
        ladder, each carrying golden SQL, a grader spec and an expected report
        shape. Deterministic graders G1–G3 score extraction, preparation and
        report structure, and every run records the pack's content hash, so a
        score can never be silently compared against a different specification.
        Curation is the honest limit: two cases are promoted to `ready` so far
        and the rest are agent-drafted first passes the runner skips by default,
        because scoring against ground truth nobody has reviewed is worse than
        not scoring at all.
      proof: "evals/cases/nsw_sales.yaml · services/data-agent/agent/eval_graders.py · scripts/eval_pack.py · scripts/eval_run.py"

    - dimension: judge
      status: shipped
      how: >-
        The insight half of the presentation grade is scored by an LLM judge
        against a frozen rubric whose text is hashed onto every run, so it cannot
        drift without the score changing identity. The judge must be
        cross-family — with DeepSeek answering, Claude grades — and it refuses to
        score a model of its own family, recording a skipped verdict rather than
        a flattering one. Insight is reported but never gates a case on its own,
        because its agreement with a human rater has not been measured yet.
      proof: "services/data-agent/agent/eval_judge.py · scripts/eval_run.py"

    - dimension: gate
      status: shipped
      how: >-
        The regression gate blocks on any single case flipping pass → fail,
        whatever the headline average did, and refuses to compare two runs graded
        under different pack versions or judges rather than quietly reporting a
        delta. Under it sits a zero-LLM, zero-network pack lint that blocks every
        merge — unique case keys, dispatchable grader specs, no real user ids or
        oversized data dumps reaching git — beside a security-guard regression
        suite. Scoring itself needs a live stack and a provider key, so it is a
        deliberate command rather than a CI job.
      proof: "scripts/eval_compare.py · tests/test_eval_pack.py · .github/workflows/ci.yml"

    - dimension: loop
      status: shipped
      how: >-
        Every answer is stamped with a composed build fingerprint — provider,
        model, and a content hash each for prompts, skills and knowledge — so a
        base-versus-candidate run proves exactly one lever moved. The diagnoser
        reads a scored run's traces and proposes one-lever hypotheses; it is
        read-only by design and never writes a fix. Three cycles are written up
        including the one that failed: 001 fixed extraction grain, 002 cut turn
        cost through the system prompt and lost accuracy doing it, 003 got the
        same saving by scoping the guidance to a retrieved knowledge page.
      proof: "services/data-agent/agent/version.py · scripts/eval_diagnose.py · docs/evals/cycle-002.md · docs/evals/cycle-003.md"

    - dimension: guardrails
      status: shipped
      how: >-
        Google OIDC and role gating sit in front of Postgres row-level security,
        set per request, and the agent connects as a read-only role — a bug in
        application code still cannot reach another user's rows. Generated SQL
        passes a shape check, a keyword denylist and an sqlglot AST walk that
        rejects DML/DDL hidden in a CTE plus privileged functions like
        set_config and pg_read_file; analysis code runs in Pyodide/WASM with no
        network and no filesystem. A deterministic injection suite gates every
        merge and a four-class promptfoo red team drives real model traffic at
        the same boundary; writing the deterministic suite found two real
        defects in the guard.
      proof: "SECURITY.md · services/data-agent/agent/sql_guardrails.py · tests/security/test_injection.py · security/promptfoo/redteam.yaml"

    - dimension: trace
      status: shipped
      how: >-
        Both services are instrumented with OpenTelemetry through Logfire, and
        every ask stamps its trace id onto the query_runs audit row, so a slow
        row on the deck is one lookup from its span waterfall; locally the spans
        land in a self-hosted Jaeger with no external account. The Operations tab
        is the fleet view — latency and time-to-first-page percentiles, error and
        degraded rates, cost per answer, two SLOs with 28-day error-budget burn,
        marts freshness, red-team pass rates by attack class, deploy timeline and
        saturation. It reads one pre-aggregated Postgres row rather than scanning
        the audit trail, so it stays up when the AWS APIs do not, and the runbook
        is keyed off its lamps.
      proof: "services/backend-api/app/tracing.py · services/backend-api/app/ops_rollup.py · frontend/src/features/ops/OpsPage.tsx · docs/runbook.md"

    - dimension: cost
      status: shipped
      how: >-
        Cost per answer on the deck is cache-adjusted — most input tokens are
        prompt-cache hits, so naive token counting overstates spend several-fold —
        and the panel says how many asks were actually priced instead of implying
        the total. Spend is capped in three independent places: daily LLM budgets
        per identity (5 free, 10 paid, 200 for a service key), 22 requests and
        600k tokens per agent run, and a CloudWatch billing alarm to SNS.
        Embeddings run on-box with fastembed, and demo mode deletes the agent
        service outright — a measured 60–70% reduction, roughly $36–66 down to
        $8–18 a month.
      proof: "services/backend-api/app/ops_rollup.py · services/backend-api/app/limits.py · infra/terraform/foundations/alarms.tf · .lavish/s38_demo-mode-prod-plan.html"

    - dimension: release
      status: shipped
      how: >-
        Merging to main runs one workflow authenticated by GitHub OIDC with no
        stored AWS keys: build and push the service images, terraform apply, run
        the Alembic migration and the dlt/dbt pipeline as ECS one-shot tasks,
        wait for the App Runner deployments, publish the Vite build to S3 and
        CloudFront, then smoke-test the live URL. The smoke asserts the backend's
        auth mode, that a bad token is rejected, that the MCP surface is mounted
        and gated (401, not 404) and that the SPA and its fallback route both
        answer 200 — and hands its pass count to the deploy record, so the ops
        timeline shows how much was checked. Rollback retags App Runner to the
        previous image digest.
      proof: ".github/workflows/deploy-aws.yml · scripts/cloud_smoke.sh · scripts/demo_smoke.py · scripts/rollback_apprunner.sh"

    - dimension: scale
      status: shipped
      how: >-
        Today is rung 10 — one App Runner instance at 0.25 vCPU / 512 MB with
        max_concurrency 100, Aurora at 0–1 ACU, sessions and rate limits in
        process memory because that is correct at one instance. Rung 100's sizing
        was measured rather than guessed: a Redis Streams queue in front of the
        agent was swept across 1/3/5 workers × 10/30/60s service times at 15
        users per cell, and drain time tracked the closed form ⌈N/W⌉×S to within
        0.5–6% in every one of the nine grid cells — 3 workers 2.97–2.99×, 5
        workers 4.87–4.98×, 150 of 150 answers served with nothing shed. The
        dashboard signal is named too: queue wait p95 rising while service p95
        stays flat means add slots.
      proof: "out/wsweep/summary.json · .lavish/s42_worker-scaling-results.html · scripts/wsweep.py · load/k6/chat.js"
---

## 1 · Purpose & benefit

An analyst who needs a number from NSW property data has two bad options: wait
for someone who writes SQL, or be handed a dashboard that answers last quarter's
question. Data Pilot is the third — ask in plain English over ~3.2M sales and
rental-bond rows, and get back a chart, a written report, and the exact query
that produced them.

The benefit is not the natural language, it is the governance around it. Row-level
security decides what each user can see before the agent runs, the agent connects
as a read-only role, and every answer carries its SQL, so a result can be checked
rather than believed. The same `run_question()` path serves the web app, a
key-authenticated webhook, a Slack slash command, an @mention bot and an MCP
server — one set of caps, one audit trail, five front doors.

The public deployment runs in demo mode, and that is a decision rather than a
limitation. A no-login app with a live LLM has an unbounded abuse bill, so the
LLM surfaces replay eight recorded agent runs while everything deterministic —
Explore, the SQL editor, the governed executor — stays genuinely live against
the real marts. Caching is what makes "no login" affordable at all.

<figure class="evidence">
  <img src="/assets/img/data-pilot/demo-landing.png" alt="The Data Pilot demo entry screen: an RLS ACTIVE / AUDIT ON status rail, a portfolio demo panel with WAREHOUSE LIVE, AGENT REPLAYS RECORDED RUNS and NO ACCOUNT NEEDED chips, and four panels describing what the product does" loading="lazy">
  <figcaption>The front door states the split up front — warehouse live, chat replayed, no account needed</figcaption>
</figure>

[Open the live demo ↗](https://deqfc8b0u8s64.cloudfront.net) · [Repository ↗](https://github.com/nmp-dsci/data-qa-agent)

## 2 · Agent architecture

{% include fig-agent.html %}

One pydantic-ai loop does the work: it plans an extract, writes a single
read-only `SELECT`, runs sandboxed pandas over the rows it gets back, and
assembles a typed report. Its tools are deliberately narrow — schema knowledge
grounded in the dbt manifest rather than a raw catalogue dump, value lookup for
resolving named suburbs, per-user memory, and a chart builder. A second, isolated
title agent runs on the data-agent service from a background task, so naming a
conversation never adds latency to an answer and can never break one.

The model sits behind an abstraction: DeepSeek by default, Claude reachable
through the same interface, and a deterministic NL→SQL stub with no key at all —
which is why the whole product is testable for free and why CI can boot the
stack. Claude is used as the eval judge, never as the agent it grades.

Memory and knowledge are embedded on-box with fastembed (bge-small, 384-dim) into
pgvector, so recall costs no embedding API call and a user's memories are
RLS-scoped exactly like their data. Prompts live in code rather than templates,
and every run is fingerprinted with a content hash per behaviour surface —
prompts, skills, knowledge — plus provider, model and image tag, so any two runs
can be told apart by what actually changed.

<figure class="evidence">
  <img src="/assets/img/data-pilot/chat-report-light.png" alt="Data Pilot answering a question with results, a chart and a written report" loading="lazy">
  <figcaption>One question, one governed query, one typed report — streamed page by page as it lands</figcaption>
</figure>

## 3 · Agent loop & evaluation

One request end to end: the backend sets `app.current_user_id` on the connection
so RLS scopes everything that follows, the agent recalls relevant memory, plans,
and writes a single read-only `SELECT`; the guard checks it; the query runs as a
read-only role; the rows go through the WASM sandbox; report pages stream back
over SSE as they are built, and the full trace, SQL and pages persist to
`query_runs` for audit and replay.

The eval loop is a product surface, not a script. Goldens are authored in the app
stage by stage — SQL extract, then sandbox objects, then the report — and
exported to `evals/cases/*.yaml`: 32 cases across three governed datasets on a
T1–T7 question ladder, two of them curated to `ready` and the rest drafts the
runner skips until someone promotes them. Graders G1–G3 handle extraction,
preparation and report structure deterministically; the insight half is judged
cross-family against a hashed rubric, and it is scored but never allowed to fail
a case on its own until its agreement with a human rater is measured. The gate
blocks on any case flipping pass → fail regardless of the average, and a free
pack lint blocks every merge on the specification itself.
Three improvement cycles are written up, including cycle 002, which the gate
refused. That is [the eval loop →](/practices/eval-loop/) in one system.

<figure class="evidence">
  <img src="/assets/img/data-pilot/goldens-light.png" alt="Golden Examples eval authoring inside the product" loading="lazy">
  <figcaption>Golden Examples — the eval set is a product surface, not a script</figcaption>
</figure>

## 4 · Deployed architecture

{% include fig-topology.html %}

One FastAPI service on App Runner carries every front door: the web API, the
`dpk_`-keyed webhook, the HMAC-signed Slack surfaces, the MCP server at `/mcp`,
the ops and admin routes, and — in demo mode — the replay pack and the governed
SQL executor that was ported out of the data-agent so live SQL survives that
service's deletion.
`/health` and `/openapi.json` are public; everything else is session, bearer or
`dpk_` key gated. State is Aurora Serverless v2 (Postgres 16, pgvector) with
schemas `app` / `raw` / `staging` / `marts`; RLS policies and per-role statement
timeouts are applied by Alembic migrations, and dlt + dbt rebuild the marts as
ECS Fargate one-shot tasks that stream the full CSVs from S3. The React build
sits in a private S3 bucket behind CloudFront.

Merging to main is the deploy: images, Terraform, the two ECS jobs, App Runner,
the frontend, then a smoke test against the live URL whose pass count lands in
the deploy record. Region is ap-southeast-2; demo sizing is one backend instance
at 0.25 vCPU / 512 MB with `max_concurrency` 100 and Aurora at 0–1 ACU, about
$8–18 a month. That is rung 10. Rung 100 is sized from measurement, not
guesswork: a Redis Streams queue in front of the agent was swept across 1/3/5
workers, and drain time followed ⌈N/W⌉×S to within 0.5–6% in all nine cells —
3 workers 2.97–2.99×, 5 workers 4.87–4.98×, 150 of 150 answers served, nothing
shed. [See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security

Enforcement is layered, and no layer is a prompt. Google OIDC establishes who you
are; role gating decides which routes you may call; Postgres row-level security,
set per request from the session, decides which rows exist for you. The agent
connects as a read-only role, so an application bug is still not a data leak, and
the isolation is asserted end to end in CI — a user with no dataset grant asks the
same question and gets zero rows, through both `/ask` and the SQL editor.

Generated and hand-typed SQL both pass the same three-layer guard: a shape check,
a keyword denylist that blanks quoted spans first, and an sqlglot AST walk that
rejects DML/DDL hidden inside a CTE along with `set_config`, `pg_read_file` and
the other read-only-in-form, privileged-in-effect calls. Analysis code executes in
Pyodide/WASM with no network and no filesystem, under attempt budgets, row caps
and per-role statement timeouts.

It is tested two ways. A deterministic, zero-LLM injection suite runs beside the
golden-pack gate on every PR — writing it found two real guard defects, one that
let a query rewrite the RLS context and one that refused a legitimate query
containing the address `'GRANT ST'`, because over-blocking is a defect too. Above
it, a four-class promptfoo red team (rls-bypass, jailbreak-to-dml,
prompt-injection, pii-exfil) drives real model traffic at the same boundary and
writes per-class pass rates to the ops deck.

<figure class="evidence">
  <img src="/assets/img/data-pilot/sql-editor-light.png" alt="The governed SQL surface" loading="lazy">
  <figcaption>The governed SQL surface — read-only, single-statement, guardrail-checked</figcaption>
</figure>

## 6 · Observability & cost

Both services emit OpenTelemetry through Logfire; locally the spans go to a
self-hosted Jaeger instead, so tracing needs no external account. Every ask
stamps its trace id onto its `query_runs` row, so a slow answer on the dashboard
is one lookup from its span waterfall — and a request id comes back on every
response whether tracing is switched on or not.

The Operations tab is the one screen that answers "is it healthy, safe, fast and
affordable": latency and time-to-first-page percentiles, error and degraded
rates, cost per answer, two SLOs with 28-day error-budget burn (99% of asks
served; p95 time-to-first-page under 3s), marts freshness, red-team pass rates by
attack class, the deploy timeline and infra saturation. It reads one
pre-aggregated Postgres row rather than the audit trail, so it survives the AWS
APIs being slow or throttled, and panels with no data say "no data" instead of
rendering a flattering zero. `docs/runbook.md` is written against its lamps.

Cost is measured before it is capped. Cost per answer on the deck is
cache-adjusted, because most input tokens are prompt-cache hits and naive
counting overstates spend several times over. The caps then sit at three
independent levels: a daily LLM budget per identity (5 free, 10 paid,
200 for a service key), a hard 22-request and 600k-token ceiling on any single
agent run, and a CloudWatch billing alarm to SNS as the backstop. Embeddings run
on-box, so recall costs nothing per query, and demo mode deletes the 2 vCPU / 4 GB
agent service outright — the biggest idle line on the bill — for a measured
60–70% saving.

## 7 · Production readiness scorecard
