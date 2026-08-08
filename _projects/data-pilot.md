---
title: Data Pilot
summary: A conversational data agent — natural language in, governed SQL out, only over the data you're allowed to see. Now deployed end-to-end on AWS with a Slack bot on top.
tldr: Governed NL→SQL agent in production — Postgres row-level security and AST guardrails decide what the model may touch, and a 10-stage OIDC pipeline ships every merge to AWS.
tags: [Agents, Data]
metric: "NL → SQL"
metric_label: "governed · live on AWS App Runner"
featured: true
order: 2
stack: [pydantic-ai, FastAPI ×3, Aurora Postgres + pgvector, React 19, dlt + dbt, Terraform · App Runner · CloudFront]
skills: [agentic-ai, governance, mlops, sql, rag, model-evaluation, product-ui]
skills_detail:
  - skill: governance
    proof: Postgres row-level security keyed to per-user dataset grants through a read-only role, plus sqlglot AST guardrails that reject anything but a single read-only SELECT — DML hidden in a CTE doesn't get through (db/init/02_rls.sql, sql_guardrails.py).
  - skill: agentic-ai
    proof: A pydantic-ai loop plans extract → sandboxed pandas analysis → report, with tools for schema knowledge, value lookup and per-user memory (agent/sandbox_agent.py).
  - skill: mlops
    proof: Merge to main triggers a ~10-stage deploy — images, Terraform, ECS migrate + data pipeline, two App Runner services, CloudFront, then a live-URL smoke test — authenticated by GitHub OIDC with zero stored AWS keys (deploy-aws.yml).
  - skill: rag
    proof: Per-user pgvector memory and dbt-manifest knowledge grounding, embedded locally with fastembed — recall without an embedding API (agent/memory.py, agent/knowledge.py).
  - skill: model-evaluation
    proof: Golden Examples are authored inside the product; deterministic graders plus a cross-family LLM judge — Claude grading the DeepSeek agent against a frozen rubric (agent/eval_judge.py).
  - skill: product-ui
    proof: React 19 product with 10+ screens in light and dark, plus a three-rung Slack integration — webhook, slash command, and an @mention bot that answers in-thread (frontend/, routers/integrations.py).
links:
  repo: https://github.com/nmp-dsci/data-qa-agent
media:
  reel: planned
---

## Architecture

Three FastAPI services in front of Aurora Postgres: a React frontend served from
CloudFront, a backend API that validates the user and orchestrates, and a data
agent that turns questions into answers. Governance is enforced in layers, not
prompts — RLS at the database, AST guardrails on generated SQL, per-run auditing,
and daily usage caps. Observability is self-hosted OpenTelemetry tracing into
Jaeger, so every agent run is inspectable end to end.

The same `run_question` pipeline serves the web UI and the Slack bot — cap
checks, RLS and audit apply identically whether you ask in the app or @mention
Data Pilot in a channel.

<figure class="evidence">
  <img src="/assets/img/data-pilot/chat-report-light.png" alt="Data Pilot answering a question with results, a chart and a written report" loading="lazy">
  <figcaption>Ask in natural language — results, a chart and a written report</figcaption>
</figure>

<figure class="evidence">
  <img src="/assets/img/data-pilot/sql-editor-light.png" alt="The governed SQL surface" loading="lazy">
  <figcaption>The governed SQL surface — read-only, single-statement, guardrail-checked</figcaption>
</figure>

<figure class="evidence">
  <img src="/assets/img/data-pilot/goldens-light.png" alt="Golden Examples eval authoring inside the product" loading="lazy">
  <figcaption>Golden Examples — the eval set is a product surface, not a script</figcaption>
</figure>

## Cost

Cost control is designed in, not bolted on:

- **Cheap by default, judged cross-family.** The agent runs on DeepSeek; Claude
  is used only as the eval judge. With no API key at all, a deterministic NL→SQL
  stub keeps the whole product testable for free.
- **Local embeddings.** Memory and knowledge grounding embed with fastembed
  (bge-small, 384-dim) on-box — no embedding API spend.
- **Hard backstops.** Daily ask caps (5 free / 10 paid / 200 service), a 22-request
  limit and a 600k-token cap per run.
- **Right-sized infra, measured.** App Runner is pinned to exactly one instance
  per service; the agent's bump to 2 vCPU / 4 GB was made after measuring a
  111-second production run against 22 seconds in dev — roughly +$11/month for a
  5× latency win.
