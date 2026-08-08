---
title: Transcript RAG
summary: A retrieval-strategy lab over YouTube transcripts — seven configurations ablated with IR metrics, and RAG matching full-transcript answers at 6.1× fewer tokens.
tldr: Retrieval engineering measured properly — HyDE, multi-query, contextual retrieval and rank fusion ablated across seven configs with recall@k/MRR/NDCG, on a local-first embedding stack.
tags: [RAG]
metric: "6.1×"
metric_label: "fewer tokens at 0.93 answer parity"
featured: true
order: 5
stack: [LangChain + LangGraph, ChromaDB, MiniLM embeddings + local reranker, DeepSeek flash, FastAPI, MLflow]
skills: [rag, model-evaluation, embeddings, vector-databases, agentic-ai, llms]
skills_detail:
  - skill: rag
    proof: HyDE and multi-query transforms, Anthropic-style contextual retrieval, and reciprocal-rank fusion of BM25 + semantic — seven configurations raced on the same questions (src/rag/query_transform.py, contextualize.py, fusion.py).
  - skill: model-evaluation
    proof: A dedicated IR harness scores every config on recall@k, MRR and NDCG — retrieval quality is a measured number, not a feeling (src/evals/ir_metrics.py, evals/runs/ablation-20260801).
  - skill: embeddings
    proof: MiniLM embeddings and a cross-encoder reranker both run locally — the entire retrieval stack costs nothing per query (src/config.py).
  - skill: vector-databases
    proof: ChromaDB chunk store with a parallel contextualised index, so plain and context-enriched retrieval are directly comparable (src/rag/contextualize.py).
  - skill: agentic-ai
    proof: A LangGraph ReAct agent decides its own retrieval calls — and live runs show it costing 3–5× single-hop tokens with no measured quality gain, a caution the dashboard makes visible (src/agents/rag_agent.py, dashboard/chat_history.json).
  - skill: llms
    proof: DeepSeek flash behind an OpenAI-compatible client — the LLM is the only remote dependency in the stack (src/config.py).
links:
  repo: https://github.com/nmp-dsci/transcript-rag-agent
media:
  walkthrough: /assets/video/transcript-rag/walkthrough.mp4
  captions: /assets/video/transcript-rag/walkthrough.vtt
  reel: planned
---

## Architecture

Transcripts are ingested via Supadata, chunked and embedded (MiniLM) into
ChromaDB — with a second, contextualised index where each chunk is enriched
with its surrounding meaning before embedding. Query time is where the lab
lives: single-hop, recursive fan-out, HyDE, multi-query, contextual retrieval
and RRF fusion of semantic + BM25, plus a LangGraph ReAct agent that plans its
own retrieval. Every configuration runs through the same IR eval harness.

<figure class="evidence">
  <img src="/assets/img/transcript-rag/architecture.svg" alt="Pipeline architecture: ingestion, chunking and embeddings into ChromaDB, then query-time retrieval with recursive fan-out" loading="lazy">
  <figcaption>The pipeline — ingestion, indexing, and query-time retrieval with recursive fan-out</figcaption>
</figure>

<figure class="evidence">
  <div class="dash-embed"><iframe src="/assets/dash/transcript-rag/comparison.html" loading="lazy" title="Retrieval strategy comparison dashboard"></iframe></div>
  <figcaption>Single-hop vs recursive vs agentic — the committed comparison dashboard · <a href="/assets/dash/transcript-rag/comparison.html" target="_blank" rel="noopener">open full-screen ↗</a></figcaption>
</figure>

## Cost

This project's central finding *is* a cost finding:

- **6.1× fewer prompt tokens than full-transcript prompting** (~3.0k vs ~18.3k)
  at 0.93 answer similarity — parity at a fraction of the spend.
- **Per-strategy token budgets are recorded**, not estimated: single-hop lands
  around 3.1k tokens (semantic) up to ~12.8k, recursive 6.3–12.7k.
- **Agency isn't free**: the ReAct agent's live runs consumed 3–5× the tokens
  of single-hop with no measured quality win — a documented argument against
  defaulting to the fanciest retrieval mode.
- **The only metered component is the flash-tier LLM.** Embeddings and
  reranking run locally; retrieval experiments cost nothing per query.
