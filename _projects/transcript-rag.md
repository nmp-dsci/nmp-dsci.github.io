---
title: Transcript RAG
summary: Q&A over indexed YouTube transcripts — showing RAG matches full-transcript answers at ~6× fewer tokens, with single-hop, recursive and agentic retrieval profiled side by side.
tags: [RAG]
metric: "6.1×"
metric_label: "fewer tokens at 0.93 answer similarity"
featured: true
order: 5
stack: [LangChain + LangGraph, ChromaDB, MiniLM embeddings, DeepSeek, FastAPI, MLflow]
skills: [python, rag, llms, agentic-ai, embeddings, vector-databases, model-evaluation]
links:
  repo: https://github.com/nmp-dsci/transcript-rag-agent
media:
  reel: planned
evidence:
  - type: image
    src: /assets/img/transcript-rag/architecture.svg
    caption: The pipeline — Supadata ingestion, chunking + MiniLM embeddings into ChromaDB, then query-time retrieval with recursive fan-out
  - type: dashboard
    src: /assets/dash/transcript-rag/comparison.html
    caption: Single-hop vs recursive vs agentic — the committed comparison dashboard
---

## The problem

"Just put the whole transcript in the context window" is the default answer for
video Q&A — and it's expensive at scale. But the counter-claim that RAG does
better deserves a measurement, not an assertion. This project measures it.

## The build

Transcripts are ingested via Supadata, chunked and embedded (MiniLM) into
ChromaDB, then queried through three increasingly agentic designs: **single-hop**
(top-30 chunks, one LLM call), **recursive** (fan-out follow-up retrieval), and
**agentic** (a LangGraph ReAct loop that decides its own retrieval calls). The
same questions also run against the full raw transcript as the brute-force
baseline, with every run's tokens, chunks, calls and answers recorded.

## The result

Two honest findings. First, against the full-transcript baseline, single-video
RAG produced near-identical answers (0.93 cosine similarity) from **6.1× fewer
prompt tokens** (~3.0k vs ~18.3k) — parity at a fraction of the cost, which is
the claim that actually holds. Second, agency isn't free: the agentic loop
consumed ~35k tokens and 11 LLM calls where single-hop used ~9.6k and one, with
no measured quality win — a useful caution against reaching for the fanciest
retrieval mode by default.
