---
title: ConvFinQA Agent
summary: Multi-turn financial Q&A over report text and tables — four specialised agents in a pipeline, where versioned, optimiser-tuned prompts lifted accuracy from 73.0% to 77.1%.
tldr: Four flash-tier agents in a typed pipeline, with prompts versioned like code — a GEPA-optimised version lifted accuracy 73.0% → 77.1%, and the same eval caught the next version regressing.
tags: [Agents]
metric: "77.1%"
metric_label: "accuracy · up from 73.0% (594/770)"
featured: true
order: 4
stack: [pydantic-ai ×4 agents, DSPy/GEPA, FastAPI + Typer, React 18, MLflow, Logfire]
skills: [prompt-versioning, model-evaluation, agentic-ai, prompt-engineering, llms, python]
skills_detail:
  - skill: prompt-versioning
    proof: Prompt sets live as versioned code modules (v1, v2, v3.1), auto-discovered by the loader and evaluated per version before anything ships (src/convfinqa/prompts/, prompts_loader.py).
  - skill: model-evaluation
    proof: A 770-question held-out eval with committed prediction CSVs — REUSE_CACHE reproduces any result offline with zero API calls, and it's how the v3.1 regression (76.2%) was caught (evaluation/).
  - skill: agentic-ai
    proof: triage → preprocess → retriever → calculator, each a separate pydantic-ai agent with typed outputs; the calculator computes through explicit arithmetic tools, not free-text math (pipeline/runner.py, tools.py).
  - skill: prompt-engineering
    proof: v2's prompts came from GEPA optimisation (DSPy) — 1,964 metric calls moved the validation baseline 56.5 → 65.3 (+8.8 pts) before the held-out test confirmed the gain (runs/gepa_real_20260502/dspy_summary.json).
  - skill: llms
    proof: Deliberate two-tier DeepSeek split — every production stage runs on flash; the pro tier is reserved for the diagnose→propose→verify optimisation harness where reasoning depth pays (backends/pydantic.py).
media:
  reel: planned
---

## Architecture

Four specialised agents run in sequence — **triage → preprocess → retriever →
calculator** — each a pydantic-ai agent with typed outputs. Simple number-lookup
turns short-circuit at the retriever; computation turns run the full pipeline
into a calculator with explicit arithmetic tools.

The differentiator is prompt management: **prompts are versioned like code**,
evaluated like releases. A later diagnose → propose → verify harness generates
candidate versions automatically — and the eval is what keeps it honest: the
auto-generated v3.1 scored 76.2%, *below* v2's 77.1%, so v2 stays shipped.
Improvement here is measured, not assumed.

<figure class="evidence">
  <div class="dash-embed"><iframe src="/assets/dash/convfinqa/predictions-v2.html" loading="lazy" title="ConvFinQA v2 evaluation dashboard"></iframe></div>
  <figcaption>The real v2 eval dashboard — all 770 questions, scored · <a href="/assets/dash/convfinqa/predictions-v2.html" target="_blank" rel="noopener">open full-screen ↗</a></figcaption>
</figure>

## Cost

- **Flash tier everywhere it matters.** All four production agents run on
  deepseek-v4-flash; the expensive pro tier is reserved for the optimisation
  harness, where reasoning quality is the product.
- **Evals are free to re-run.** Committed prediction CSVs + `REUSE_CACHE` mean
  the full 770-question eval reproduces offline with zero API calls; the DSPy
  LM cache does the same for optimisation runs.
- **Optimisation spend is bounded and recorded** — the GEPA run that produced
  v2 logged its 1,964 metric calls and 65 full validation evals, so the cost of
  the +4.1-point production gain is inspectable, not folklore.
