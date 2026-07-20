---
title: CUAD Legal Agent
summary: Contract review at benchmark scale — 41 legal questions × 50 contracts (2,050 scored answers), with full-contract context and four RAG variants raced head-to-head.
tags: [RAG]
metric: "84.5%"
metric_label: "best answer F1 — and it wasn't RAG"
featured: true
order: 4
stack: [LangChain + DeepSeek, DSPy, BM25 + dense + hybrid retrieval, Static HTML dashboards]
skills: [python, rag, llms, embeddings, model-evaluation, prompt-engineering, data-pipelines]
links:
  repo: https://github.com/nmp-dsci/CUAD-agent
media:
  reel: planned
evidence:
  - type: dashboard
    src: /assets/dash/cuad/comparison.html
    caption: The comparison dashboard — every context strategy, side by side
---

## The problem

Contract review is retrieval under adversarial conditions: the answer to "what's
the termination clause?" is three sentences hidden in eighty pages. Which
context strategy actually finds it — and how would you *know* rather than guess?

## The build

A two-layer evaluation over the CUAD benchmark, 41 standard legal questions
across a deterministic 50-contract sample — 2,050 scored answers per mode:

- **Answer accuracy** across five context strategies: full-contract (`raw`) and
  four RAG variants — dense, hybrid (BM25 + dense fused), and two hierarchical
  modes (retrieve leaves → expand sections → rerank). Scored with token-overlap
  F1 against human-labelled golden spans.
- **Retrieval coverage** across six retrievers, measured before any LLM is
  involved: did the gold passage even make the top-k?

## The result

The headline finding is the honest one: **full-contract context won** — 84.5% F1
against 79.9% for the best RAG variant (hierarchical-dense) and 76.3% for the
worst. Coverage explains why: even the best retriever only had all gold spans in
its top-30 for 64.7% of questions. At this scale, retrieval is the bottleneck —
and now that's a measured fact with a dashboard, not an opinion. The harness is
exactly what makes that call correctly *change* when contracts outgrow the
context window.
