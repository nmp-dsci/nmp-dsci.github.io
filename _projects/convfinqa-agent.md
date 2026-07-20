---
title: ConvFinQA Agent
summary: Multi-turn financial Q&A over report text and tables — four specialised agents in a pipeline, where versioned, optimiser-tuned prompts lifted accuracy from 73.0% to 77.1%.
tags: [Agents]
metric: "77.1%"
metric_label: "accuracy · up from 73.0% (594/770)"
featured: true
order: 3
stack: [pydantic-ai ×4 agents, DSPy/GEPA, FastAPI + Typer, React 18, MLflow, Logfire]
skills: [python, llms, agentic-ai, prompt-engineering, prompt-versioning, model-evaluation, typescript]
links:
  repo: https://github.com/nmp-dsci/ConvFinQA-agent
media:
  reel: planned
evidence:
  - type: dashboard
    src: /assets/dash/convfinqa/predictions-v2.html
    caption: The real v2 eval dashboard — every one of the 770 questions, scored
---

## The problem

Answering multi-turn questions over financial reports compounds two hard things:
numerical reasoning and conversational state. ConvFinQA is the benchmark that
punishes hand-waving on both — and the score only moves if the whole pipeline
moves.

## The build

Four specialised agents run in sequence — **triage → preprocess → retriever →
calculator** — each a separate pydantic-ai agent with typed outputs. Simple
number-lookup turns short-circuit at the retriever; computation turns run the
full pipeline into a calculator with explicit arithmetic tools.

The differentiator is how prompts are managed: **like code**. Prompt sets live
as versioned modules (v1, v2, v3.1…), auto-discovered and evaluated against a
held-out sample of 200 conversations / 770 questions, with results cached and
rendered to a static dashboard per version. v2's prompts came from GEPA
optimisation (DSPy); a later diagnose → propose → verify harness generates
candidate versions automatically.

## The result

Versioned prompt optimisation lifted accuracy **73.0% → 77.1%** (562 → 594 of
770 correct) — verified from the committed prediction files, not the README. The
honest footnote: the auto-generated v3.1 scored 76.2%, *below* v2 — which is
precisely why every version gets an eval dashboard before it ships. Improvement
here is measured, not assumed.
