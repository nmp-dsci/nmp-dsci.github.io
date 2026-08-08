---
title: CUAD Legal Agent
summary: Contract review at benchmark scale — 41 legal questions × 50 contracts, with full-contract context and four RAG variants raced head-to-head. The honest finding — full context won.
tldr: A two-layer eval harness over the CUAD benchmark — 10,250 scored predictions across five context strategies, with retrieval coverage measured separately so the bottleneck is a fact, not a guess.
tags: [RAG]
metric: "84.5%"
metric_label: "best answer F1 — and it wasn't RAG"
featured: true
order: 3
stack: [LangChain + DeepSeek, DSPy, BM25 + TF-IDF dense + hybrid retrieval, Static HTML dashboards]
skills: [model-evaluation, rag, embeddings, prompt-engineering, data-pipelines, python]
skills_detail:
  - skill: model-evaluation
    proof: 10,250 predictions scored — 41 questions × 50 contracts × 5 context modes — on token-overlap F1 and correct@0.5 against human-labelled golden spans, with retrieval coverage@k measured as its own layer (outputs/, rag_ranking_summary.csv).
  - skill: rag
    proof: Dense, hybrid (BM25 + dense fused by reciprocal rank) and two hierarchical retrieve→expand→rerank variants built and raced against full-contract context (src/cuad_agent/rag/retrievers.py).
  - skill: embeddings
    proof: Dense retrieval runs on local TF-IDF vectors (scikit-learn) — the whole retrieval benchmark costs zero embedding API spend (src/cuad_agent/rag/indexes.py).
  - skill: prompt-engineering
    proof: v1 → v2 → autoresearch prompt generations compared on the identical grid, with an autonomous prompt-optimisation loop (prompts/system_prompts_v2.py, autoresearch.py).
  - skill: data-pipelines
    proof: Chunk → index → coverage → answer pipeline with persistent caches, resumable incremental JSONL results, and a no-LLM dry-run mode (outputs/rag_cache/, README).
links:
  repo: https://github.com/nmp-dsci/CUAD-agent
media:
  reel: planned
---

## Architecture

Two evaluation layers, deliberately separated. The **retrieval layer** benchmarks
six retrievers on coverage — did the gold passage even reach the top-k? — before
any LLM is involved. The **answer layer** then scores five context strategies
end-to-end: full-contract (`raw`) and four RAG variants.

The headline is the honest one: **full-contract context won** — 84.5% F1 against
79.9% for the best RAG variant (hierarchical-dense) and 76.3% for the worst.
Coverage explains why: even the best retriever had all gold spans in its top-30
for only 64.7% of questions. At 50-contract scale, retrieval is the measured
bottleneck — and this harness is exactly what will show when that changes.

<figure class="evidence">
  <div class="dash-embed"><iframe src="/assets/dash/cuad/comparison.html" loading="lazy" title="CUAD context-strategy comparison dashboard"></iframe></div>
  <figcaption>The comparison dashboard — every context strategy, side by side · <a href="/assets/dash/cuad/comparison.html" target="_blank" rel="noopener">open full-screen ↗</a></figcaption>
</figure>

## Cost

An eval this size is a cost-engineering exercise in itself:

- **Flash-tier model, temperature 0** — the full grid runs on deepseek-v4-flash.
- **Zero-cost retrieval experiments.** Embeddings are local TF-IDF; chunk and
  index caches persist under `outputs/rag_cache/`, so retrieval work is never
  paid for twice.
- **Interrupt-safe evals.** Results stream to incremental JSONL with
  resume-from-partial, and a dry-run mode exercises the whole pipeline without a
  single LLM call.
- **Optional enrichment degrades gracefully** — query enrichment uses the LLM
  when a key exists and falls back to deterministic offline terms when it doesn't.
