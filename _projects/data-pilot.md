---
title: Data Pilot
short: "Pilot"   # the matrix column header on a phone
summary: >-
  A conversational data agent over ~3.2M rows of NSW property data: plain English in,
  governed SQL, a chart and a written report out, over only the rows you may see. A
  walk-in demo on AWS, with Explore and the SQL editor live against the real marts and
  chat replaying recorded agent runs.
tldr: >-
  Governed NL→SQL in production: Postgres RLS and an sqlglot AST guard decide what the model may touch; merging to main deploys the stack under GitHub OIDC, no stored keys.
headline: "<em>Governed</em> NL→SQL in production"
outcome: >-
  Governed natural-language → SQL over ~3.2M rows of NSW property data, with row-level
  security deciding what the model may touch.
proof_line: >-
  Nine of nine rubric dimensions shipped, 32 golden cases across three governed datasets with 2 promoted to `ready`, and rung-100 drain time within 0.5–6% of ⌈N/W⌉×S in all nine grid cells.
sections:
  - n: 1
    summary: "The natural language is not the product; the governance around it makes an answer checkable rather than believed."
  - n: 2
    summary: "Narrow tools and a swappable model interface, so any two runs differ only by what the build fingerprint says changed."
  - n: 3
    summary: "The eval set is a product surface, and a golden nobody has reviewed is worse than no golden at all."
  - n: 4
    summary: "One service carries every front door, merging to main is the deploy, and the next rung is sized from measurement."
  - n: 5
    summary: "No layer of the enforcement is a prompt, and refusing a legitimate query counts as a defect too."
  - n: 6
    summary: "Cost is measured before it is capped, and a panel with no data says so instead of rendering a flattering zero."
  - n: 7
    summary: "Nine dimensions rated in the open, with the curation and judge-agreement limits named rather than quietly left out."
tags: [Agents, Data]
metric: "9 / 9"
metric_label: "rubric dimensions shipped · rung-100 sizing measured"
featured: true
order: 1
stack: [pydantic-ai, FastAPI, Aurora Serverless v2, pgvector, React 19, dlt, dbt, Pyodide, Terraform, App Runner, CloudFront]

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
  reel: ""

architecture:
  takeaway: >-
    The model never touches the database directly.
  diagram: "diagrams/agent/data-pilot.svg"
  caption: "question → pydantic-ai loop → AST guard → governed SELECT under RLS → WASM sandbox → typed report"

production:
  live: true
  order: 1
  surface: >-
    No login, no sign-up: Explore and the SQL editor run live against the real marts; chat
    replays eight recorded agent runs as paced SSE (plan, charts, report, ~5–10 s); the Ops
    deck, Evaluations and Golden Examples are readable exhibits with every write refused
    server-side. The first Explore call after an idle hour waits ~30 s while Aurora
    resumes, and the UI narrates it.
  topology: "CloudFront + S3 → App Runner backend ×1 → Aurora Serverless v2 · ECS Fargate one-shot jobs"
  topology_diagram: "diagrams/topology/data-pilot.svg"
  region: "ap-southeast-2"
  cost: "~$8–18/mo · $0 inference"
  rung: 10
  rung_note: "rung-100 sizing measured · s42 worker sweep · drain time within 6% of ⌈N/W⌉×S · all nine grid cells"
  score: "9 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        Goldens authored in the product stage by stage (① SQL extract, ② sandbox objects,
        ③ report) and exported to a version-controlled pack: 32 cases across nsw_sales,
        nsw_rent and nsw_yield on a T1–T7 ladder, each with golden SQL, a grader spec and an
        expected report shape. Deterministic graders G1–G3 score extraction, preparation and
        report structure; every run records the pack's content hash. Curation is the limit:
        2 cases promoted to `ready`, the rest agent-drafted first passes the runner skips by
        default, because scoring against unreviewed ground truth is worse than not scoring.
      proof: "evals/cases/nsw_sales.yaml · services/data-agent/agent/eval_graders.py · scripts/eval_pack.py · scripts/eval_run.py"

    - dimension: judge
      status: shipped
      how: >-
        The insight half of the presentation grade is scored by an LLM judge against a
        frozen rubric whose text is hashed onto every run. The judge must be cross-family
        (DeepSeek answers, Claude grades) and records a skipped verdict rather than grade
        its own family. Insight never gates a case on its own, because its agreement with a
        human rater has not been measured yet.
      proof: "services/data-agent/agent/eval_judge.py · scripts/eval_run.py"

    - dimension: gate
      status: shipped
      how: >-
        Blocks on any single case flipping pass → fail, whatever the average did, and
        refuses to compare runs graded under different pack versions or judges. A zero-LLM,
        zero-network pack lint blocks every merge (unique case keys, dispatchable grader
        specs, no real user ids or oversized dumps in git) beside a security-guard regression
        suite. Scoring needs a live stack and a provider key, so it is a deliberate command,
        not a CI job.
      proof: "scripts/eval_compare.py · tests/test_eval_pack.py · .github/workflows/ci.yml"

    - dimension: loop
      status: shipped
      how: >-
        Every answer carries a composed build fingerprint (provider, model, content hash
        each for prompts, skills and knowledge), so base-versus-candidate proves one lever
        moved. The diagnoser reads a scored run's traces and proposes one-lever hypotheses;
        read-only, never writes a fix. Three cycles written up including the failure: 001
        fixed extraction grain, 002 cut turn cost via the system prompt and lost accuracy,
        003 got the same saving by scoping guidance to a retrieved knowledge page.
      proof: "services/data-agent/agent/version.py · scripts/eval_diagnose.py · docs/evals/cycle-002.md · docs/evals/cycle-003.md"

    - dimension: guardrails
      status: shipped
      how: >-
        Google OIDC and role gating in front of Postgres RLS set per request, with the agent
        on a read-only role, so an application bug still cannot reach another user's rows.
        Generated SQL passes a shape check, a keyword denylist and an sqlglot AST walk that
        rejects DML/DDL hidden in a CTE plus set_config and pg_read_file; analysis runs in
        Pyodide/WASM with no network and no filesystem. A deterministic injection suite gates
        every merge (writing it found two real guard defects) and a four-class promptfoo red
        team drives real model traffic at the same boundary.
      proof: "SECURITY.md · services/data-agent/agent/sql_guardrails.py · tests/security/test_injection.py · security/promptfoo/redteam.yaml"

    - dimension: trace
      status: shipped
      how: >-
        Both services emit OpenTelemetry through Logfire; every ask stamps its trace id on
        the query_runs audit row, so a slow row is one lookup from its span waterfall;
        locally spans land in self-hosted Jaeger. The Operations tab is the fleet view:
        latency and time-to-first-page percentiles, error and degraded rates, cost per
        answer, two SLOs with 28-day error-budget burn, marts freshness, red-team pass rates
        by attack class, deploy timeline, saturation. It reads one pre-aggregated Postgres
        row, so it stays up when the AWS APIs do not, and the runbook is keyed off its lamps.
      proof: "services/backend-api/app/tracing.py · services/backend-api/app/ops_rollup.py · frontend/src/features/ops/OpsPage.tsx · docs/runbook.md"

    - dimension: cost
      status: shipped
      how: >-
        Cost per answer is cache-adjusted (most input tokens are prompt-cache hits, so naive
        counting overstates spend several-fold) and the panel says how many asks were priced.
        Three independent caps: daily LLM budgets per identity (5 free, 10 paid, 200 for a
        service key), 22 requests and 600k tokens per agent run, a CloudWatch billing alarm
        to SNS. Embeddings run on-box with fastembed; demo mode deletes the agent service
        outright, a measured 60–70% cut, roughly $36–66 down to $8–18 a month.
      proof: "services/backend-api/app/ops_rollup.py · services/backend-api/app/limits.py · infra/terraform/foundations/alarms.tf · .lavish/s38_demo-mode-prod-plan.html"

    - dimension: release
      status: shipped
      how: >-
        Merge to main runs one GitHub OIDC workflow with no stored AWS keys: build and push
        images, terraform apply, Alembic migration and dlt/dbt pipeline as ECS one-shot tasks,
        wait for App Runner, publish the Vite build to S3 and CloudFront, smoke-test the live
        URL. The smoke asserts the auth mode, a bad token rejected, MCP mounted and gated (401,
        not 404), SPA and fallback route both 200, and hands its pass count to the deploy
        record. Rollback retags App Runner to the previous image digest.
      proof: ".github/workflows/deploy-aws.yml · scripts/cloud_smoke.sh · scripts/demo_smoke.py · scripts/rollback_apprunner.sh"

    - dimension: scale
      status: shipped
      how: >-
        Rung 10 today: one App Runner instance at 0.25 vCPU / 512 MB, max_concurrency 100,
        Aurora at 0–1 ACU, sessions and rate limits in process memory because that is
        correct at one instance. Rung 100 was measured: a Redis Streams queue in front of
        the agent swept across 1/3/5 workers × 10/30/60s service times at 15 users per cell,
        drain time within 0.5–6% of ⌈N/W⌉×S in all nine cells (3 workers 2.97–2.99×, 5
        workers 4.87–4.98×, 150 of 150 served, nothing shed). The dashboard signal: queue
        wait p95 rising while service p95 stays flat means add slots.
      proof: "out/wsweep/summary.json · .lavish/s42_worker-scaling-results.html · scripts/wsweep.py · load/k6/chat.js"
---

## 1 · Purpose & benefit — governance is the product, not a feature

Ask in plain English over ~3.2M NSW sales and rental-bond rows; get a chart, a written report and the exact query behind them.

- **The old options** — wait for someone who writes SQL, or a dashboard answering last quarter's question.
- **The benefit** — the governance, not the natural language.
- **Before** — row-level security decides what each user can see.
- **During** — the agent connects as a read-only role.
- **After** — every answer carries its SQL: checked, not believed.
- **Five front doors** — web app, key-authenticated webhook, Slack slash command, @mention bot, MCP server; one `run_question()` path, one set of caps, one audit trail.

Demo mode is a decision, not a limitation:

- **Why?** A no-login app with a live LLM has an unbounded abuse bill.
- **Replayed** — the LLM surfaces play eight recorded agent runs.
- **Live** — Explore, the SQL editor and the governed executor, against the real marts.
- **Caching** makes "no login" affordable at all.

<figure class="evidence">
  <img src="/assets/img/data-pilot/demo-landing.png" alt="The Data Pilot demo entry screen: an RLS ACTIVE / AUDIT ON status rail, a portfolio demo panel with WAREHOUSE LIVE, AGENT REPLAYS RECORDED RUNS and NO ACCOUNT NEEDED chips, and four panels describing what the product does" loading="lazy">
  <figcaption><b>The demo declares its split at the front door.</b> Source: the entry screen of the live demo, <code>deqfc8b0u8s64.cloudfront.net</code>.</figcaption>
</figure>

[Open the live demo ↗](https://deqfc8b0u8s64.cloudfront.net) · [Repository ↗](https://github.com/nmp-dsci/data-qa-agent)

## 2 · Agent architecture — the model never touches the database

{% include fig-agent.html %}

One pydantic-ai loop: plan an extract, write one read-only `SELECT`, run sandboxed pandas over the rows, assemble a typed report.

- **Four narrow tools** — schema knowledge from the dbt manifest (not a raw catalogue dump), value lookup for named suburbs, per-user memory, a chart builder.
- **Title agent** — isolated, a background task on the data-agent service; naming a conversation never slows or breaks an answer.
- **Memory and knowledge** — embedded on-box with fastembed (bge-small, 384-dim) into pgvector; no embedding API, memories RLS-scoped like data.
- **Prompts** — in code, not templates.
- **Fingerprint** — content hash per surface (prompts, skills, knowledge) plus provider, model, image tag, so two runs differ by what changed.

Three model backends behind one abstraction:

- **DeepSeek** — the default
- **Claude** — same interface; the eval judge, never the agent it grades
- **Deterministic NL→SQL stub** — no key, so the product is testable for free and CI can boot the stack

<figure class="evidence">
  <img src="/assets/img/data-pilot/chat-report-light.png" alt="Data Pilot answering a question with results, a chart and a written report" loading="lazy">
  <figcaption><b>Every answer arrives with the one governed query that produced it.</b> Source: the chat surface of the live demo, replaying one of the eight recorded runs over SSE.</figcaption>
</figure>

## 3 · Agent loop & evaluation — goldens are authored inside the product

One request, end to end:

1. backend sets `app.current_user_id` on the connection; RLS scopes everything after
2. agent recalls memory, plans, writes one read-only `SELECT`
3. the guard checks it
4. the query runs as a read-only role
5. rows go through the WASM sandbox
6. report pages stream back over SSE as built
7. trace, SQL and pages persist to `query_runs` for audit and replay

The eval loop is a product surface, not a script:

- **Authored in the app** — SQL extract, then sandbox objects, then report.
- **Exported** — `evals/cases/*.yaml`: 32 cases, three governed datasets, a T1–T7 ladder.
- **Curated** — 2 of 32 `ready`; the other 30 are drafts the runner skips until promoted.
- **G1–G3, deterministic** — extraction, preparation, report structure.
- **Judge, cross-family** — the insight half against a hashed rubric; never fails a case alone until its agreement with a human rater is measured.
- **Gate** — blocks on any case flipping pass → fail, whatever the average.
- **Pack lint** — free, blocks every merge on the specification itself.
- **Cycles** — three written up, including 002, which the gate refused: [the eval loop →](/practices/eval-loop/) in one system.

<figure class="evidence">
  <img src="/assets/img/data-pilot/goldens-light.png" alt="Golden Examples eval authoring inside the product" loading="lazy">
  <figcaption><b>The people who know the answers write the cases.</b> Source: the Golden Examples tab of the live demo; <code>evals/cases/*.yaml</code>.</figcaption>
</figure>

## 4 · Deployed architecture — one service, and merging to main is the deploy

{% include fig-topology.html %}

One FastAPI service on App Runner carries every front door:

- the web API
- the `dpk_`-keyed webhook
- the HMAC-signed Slack surfaces
- the MCP server at `/mcp`
- the ops and admin routes
- in demo mode, the replay pack and governed SQL executor, ported out of the data-agent so live SQL survives its deletion

- **Public** — `/health`, `/openapi.json`; all else session, bearer or `dpk_` key gated.
- **State** — Aurora Serverless v2 (Postgres 16, pgvector); schemas `app` / `raw` / `staging` / `marts`.
- **Migrations** — RLS policies and per-role statement timeouts via Alembic.
- **Marts** — dlt + dbt as ECS Fargate one-shot tasks streaming the full CSVs from S3.
- **Frontend** — React build in a private S3 bucket behind CloudFront.

Merging to main is the deploy, one workflow in order:

1. build and push the service images
2. `terraform apply`
3. Alembic migration and dlt/dbt pipeline as ECS one-shot tasks
4. wait for the App Runner deployments
5. publish the Vite build to S3 and CloudFront
6. smoke-test the live URL; pass count lands in the deploy record

- **Region** — ap-southeast-2.
- **Rung 10** — one instance at 0.25 vCPU / 512 MB, `max_concurrency` 100, Aurora 0–1 ACU; ~$8–18 a month against $36–66 with the agent service running.
- **Rung 100, measured** — Redis Streams queue before the agent, swept 1/3/5 workers × 10/30/60s service times, 15 users per cell.
- **Result** — drain time within 0.5–6% of ⌈N/W⌉×S in all nine cells; 3 workers 2.97–2.99×, 5 workers 4.87–4.98×; 150 of 150 served, nothing shed.

<figure class="fig">
  <div class="dia-frame">{% include diagrams/chart/data-pilot-sizing.svg %}</div>
  <figcaption><b>The next rung is sized by measurement, not by guess.</b> Every one of the nine
  cells drained within 6% of ⌈N/W⌉×S, the worst error is the shortest run, and nothing was shed.
  Source: <code>scripts/wsweep.py</code>, <code>out/wsweep/summary.json</code>.</figcaption>
</figure>

[See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security — six layers, and a bug is still not a leak

Enforcement is layered, and no layer is a prompt.

| Layer | What it decides |
|---|---|
| Google OIDC | who you are |
| Role gating | which routes you may call |
| Postgres row-level security, set per request from the session | which rows exist for you |
| A read-only database role for the agent | that an application bug is still not a data leak |
| The three-layer SQL guard | which queries may run at all |
| Pyodide/WASM, no network and no filesystem | what analysis code may reach |

- **Asserted in CI** — a user with no dataset grant gets zero rows, through both `/ask` and the SQL editor.
- **Sandbox budgets** — attempt budgets, row caps, per-role statement timeouts.

Generated and hand-typed SQL pass the same three-layer guard:

1. a shape check
2. a keyword denylist that blanks quoted spans first
3. an sqlglot AST walk rejecting DML/DDL hidden in a CTE, plus `set_config`, `pg_read_file` and the other read-only-in-form, privileged-in-effect calls

Tested two ways:

- **Deterministic, zero-LLM injection suite** — beside the golden-pack gate on every PR.
- **Two real defects found writing it** — a query could rewrite the RLS context; a legitimate query with the address `'GRANT ST'` was refused. Over-blocking is a defect too.
- **promptfoo red team** — real model traffic at the same boundary; per-class pass rates on the ops deck.
- **Four attack classes** — rls-bypass, jailbreak-to-dml, prompt-injection, pii-exfil.

<figure class="evidence">
  <img src="/assets/img/data-pilot/sql-editor-light.png" alt="The governed SQL surface" loading="lazy">
  <figcaption><b>Hand-typed SQL passes exactly the same guard as SQL the model wrote.</b> Source: the SQL editor of the live demo; <code>services/data-agent/agent/sql_guardrails.py</code>.</figcaption>
</figure>

## 6 · Observability & cost — every identity has a daily budget in code

- **Spans** — both services emit OpenTelemetry through Logfire; locally a self-hosted Jaeger, no external account.
- **Trace id** — on every `query_runs` row, so a slow answer is one lookup from its span waterfall.
- **Request id** — on every response, tracing on or off.

The Operations tab answers "is it healthy, safe, fast and affordable":

- latency and time-to-first-page percentiles
- error and degraded rates
- cost per answer
- two SLOs with 28-day error-budget burn — 99% of asks served, p95 time-to-first-page under 3s
- marts freshness
- red-team pass rates by attack class
- the deploy timeline and infra saturation

- **One pre-aggregated Postgres row** — not the audit trail, so it survives slow or throttled AWS APIs.
- **No data, no zero** — an empty panel says "no data".
- **Runbook** — `docs/runbook.md` is written against its lamps.
- **Cost is measured before it is capped** — cache-adjusted, because most input tokens are prompt-cache hits and naive counting overstates spend several times over.

| Cap | Limit |
|---|---|
| Daily LLM budget per identity | 5 free, 10 paid, 200 for a service key |
| Ceiling on any one agent run | 22 requests and 600k tokens |
| CloudWatch billing alarm to SNS | the backstop |

- **Embeddings on-box** — recall costs nothing per query.
- **Demo mode** — deletes the 2 vCPU / 4 GB agent service, the biggest idle line: a measured 60–70% saving, $36–66 down to $8–18 a month.

## 7 · Production readiness scorecard — nine of nine, each with its path
