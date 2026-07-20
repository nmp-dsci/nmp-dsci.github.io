---
title: Data Pilot
summary: A conversational data agent — natural language in, governed SQL out, only over the data you're allowed to see. Three services, Postgres row-level security, and its own eval harness.
tags: [Agents, Data]
metric: "NL → SQL"
metric_label: "governed by Postgres RLS"
featured: true
order: 1
stack: [pydantic-ai, FastAPI ×3, Postgres + pgvector, React 19, dlt + dbt, Terraform/AWS]
skills: [agentic-ai, governance, sql, rag, model-evaluation, docker, product-ui]
links:
  repo: https://github.com/nmp-dsci/data-qa-agent
media:
  reel: planned
evidence:
  - type: image
    src: /assets/img/data-pilot/chat-report-light.png
    caption: Ask in natural language — the agent answers with results, a chart and a written report
  - type: image
    src: /assets/img/data-pilot/chat-report-dark.png
    caption: The same conversation in dark mode — full light/dark theming across every screen
  - type: image
    src: /assets/img/data-pilot/sql-editor-light.png
    caption: The governed SQL surface — read-only, single-statement, guardrail-checked
  - type: image
    src: /assets/img/data-pilot/goldens-light.png
    caption: Golden Examples — authoring the eval set from inside the product
  - type: image
    src: /assets/img/data-pilot/login-light.png
    caption: The front door — Google Sign-in or a dev stub, switchable without a rebuild
---

## The problem

Business users can't self-serve data questions without SQL, and most text-to-SQL
tools answer by ignoring the harder half of the problem: governance. An agent that
happily queries any table is a data-leak generator, not a product.

## The build

Data Pilot is three FastAPI services in front of Postgres: a React frontend, a
backend API that validates the user and orchestrates, and a data agent that turns
questions into answers. Governance is enforced in layers, not prompts:

- **Row-level security at the database.** Every query runs under Postgres RLS
  keyed to the signed-in user's dataset grants, through a read-only role. A user
  with no grants gets zero rows — the demo seeds prove it.
- **SQL guardrails in code.** Generated SQL is parsed to an AST (sqlglot) and
  rejected unless it's a single read-only SELECT — DML hidden in a CTE doesn't get through.
- **A real agent loop.** A pydantic-ai agent plans extract → analyse (sandboxed
  pandas) → report, with tools for schema knowledge, value lookup, and per-user
  memory recalled via pgvector embeddings.
- **Evals as a product surface.** Admins author Golden Examples in the UI;
  deterministic graders plus a cross-family LLM-as-judge (Claude judging the
  DeepSeek agent, against a frozen rubric) score every version.

Around the core: an admin dashboard, per-user daily AI usage caps, full run
auditing, a dlt + dbt data pipeline, and Terraform-provisioned AWS deployment
with GitHub OIDC CI/CD.

## The result

A working, governed data agent demonstrated on real NSW property sales and rent
data — 10+ polished screens in light and dark. It even runs offline: a
deterministic NL→SQL stub answers with no API key, so the governance and product
layers are testable without burning tokens. The interesting engineering isn't
generating SQL — it's making the agent *unable to overreach* even when the model
tries.

*Walkthrough video coming — screenshots below are the real product.*
