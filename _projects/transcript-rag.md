---
title: Transcript RAG
short: "RAG"   # the matrix column header on a phone
summary: >-
  An evaluation-first RAG workbench over 102 YouTube transcripts: hybrid BM25 + dense retrieval,
  cross-encoder reranking and a Neo4j entity/claim graph, with four answer paths raced on one
  chunk-labelled golden set. Live on AWS as a read-only workbench.
tldr: >-
  RAG matches full-transcript answers at 6.1× fewer tokens — a chunk-labelled golden set, an 8-config ablation, a CI gate that re-scores every committed run.
headline: "Retrieval you can <em>prove</em>, at 6.1× fewer tokens"
outcome: >-
  A RAG workbench over 102 transcripts where eight retrieval configurations are raced on a
  chunk-labelled golden set, and CI re-scores every committed run.
proof_line: >-
  RAG answers match full-transcript prompting at 0.93 similarity while spending 2,997 prompt
  tokens against 18,295 — 6.1× fewer.
sections:
  - n: 1
    summary: "Which retrieval configuration ranks the evidence best is empirical, so the workbench answers it with a golden set, not by feel."
  - n: 2
    summary: "Retrieve wide, rerank narrow: fuse by rank not score, then hand the same chunks to four answer paths returning one shape."
  - n: 3
    summary: "Chunk-level labels give what reference-free metrics cannot, and show plain hybrid still beating every clever addition."
  - n: 4
    summary: "Read-only by construction, not policy: no keys, no database, the index baked into the image."
  - n: 5
    summary: "Denying by HTTP method rather than route list refuses a new endpoint before anyone adds it to a list."
  - n: 6
    summary: "Cost is the finding: more agency spends more tokens, and whether it buys anything depends on which rubric scores it."
  - n: 7
    summary: "Five of nine dimensions shipped; the judge, loop, guardrails and scale gaps are named with their reasons."

tags: [RAG]
metric: "6.1×"
metric_label: "fewer tokens at 0.93 answer parity"
featured: true
order: 3
stack: [LangChain, LangGraph, ChromaDB, BM25, MiniLM, ms-marco cross-encoder, Neo4j GraphRAG, RAGAS, DeepSeek, FastAPI, React 19, Terraform, AWS App Runner]

skills: [rag, model-evaluation, embeddings, vector-databases, agentic-ai, llms]
skills_detail:
  - skill: rag
    proof: HyDE and multi-query transforms on the query side, Anthropic-style contextual retrieval on the index side, and reciprocal-rank fusion of BM25 + semantic — eight configurations raced over the same 20 labelled questions (src/rag/query_transform.py, src/rag/contextualize.py, src/rag/fusion.py, src/evals/ablation.py).
  - skill: model-evaluation
    proof: A dedicated IR harness scores every config on recall@k, MRR and NDCG@10 from chunk ids alone — deterministic, free, and re-checked in CI against the committed snapshots (src/evals/ir_metrics.py, tests/evals/test_committed_runs.py, evals/runs/).
  - skill: embeddings
    proof: MiniLM embeddings and the ms-marco cross-encoder reranker both run locally on CPU, so retrieval and the whole ablation sweep cost nothing per query (src/config.py, src/rag/rerank.py).
  - skill: vector-databases
    proof: ChromaDB holds the chunk store plus a parallel contextualised collection and per-video summaries, so plain and context-enriched retrieval are directly comparable (src/rag/storage.py, src/rag/contextualize.py).
  - skill: agentic-ai
    proof: A LangGraph ReAct agent plans its own retrieval calls — and the committed matrix shows it spending ~24.5k tokens against single-hop's ~3.1k, buying depth but nothing on grounding, which is why it is not the default (src/agents/rag_agent.py, evals/runs/matrix-20260809-071818-depth-v2.json).
  - skill: llms
    proof: DeepSeek flash behind an OpenAI-compatible client is the only remote dependency in the stack, and the public deployment carries no key for it at all (src/agents/llm.py, src/config.py).

links:
  repo: https://github.com/nmp-dsci/transcript-rag-agent
  demo: https://iibze7vuqr.ap-southeast-2.awsapprunner.com

media:
  walkthrough: /assets/video/transcript-rag/walkthrough.mp4
  poster: ""
  captions: /assets/video/transcript-rag/walkthrough.vtt
  reel: ""

architecture:
  takeaway: >-
    Retrieval is a pipeline of interchangeable parts — which is the only reason eight configurations can be compared at all.
  diagram: "diagrams/agent/transcript-rag.svg"
  caption: "question → HyDE / multi-query → semantic + BM25 top-30 → RRF fusion → cross-encoder rerank → one of four answer paths, all graded on the same golden set"

production:
  live: true
  order: 3
  surface: >-
    Read-only workbench: the corpus tree, the Retrieval Lab (semantic vs BM25 vs graph side by
    side), the chunk-similarity graph, a 2,000-entity knowledge-graph snapshot, 30 Themes,
    7 Disagreements, the Scoreboard over committed matrix runs, and 66 recorded conversations
    (113 answers) each carrying its own execution trace. No composer, no ingestion, no System
    Design tab — every write is a 403.
  topology: "S3 demo data → ECR → App Runner ×1 · no VPC, no database"
  topology_diagram: "diagrams/topology/transcript-rag.svg"
  region: "ap-southeast-2"
  cost: "~$8–12/mo · $0 inference"
  rung: 10
  rung_note: "Chroma corpus and graph snapshot baked into the image · a second instance is a second copy of the corpus, not a second reader · rung 100 starts by moving both behind a shared store"
  score: "5 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        A 20-entry golden set hand-curated with chunk-level labels — 14 local, 4 global, 2 temporal
        across four domains, 69 labelled chunk ids — scored by a deterministic recall@k / MRR /
        NDCG@10 harness: pure id arithmetic, no LLM, no API key, reproducible offline. An 8-config
        ablation sweeps semantic, hybrid, rerank, HyDE, multi-query and contextual retrieval over
        the same questions. 16 run snapshots are committed, so a reviewer opens the exact numbers
        rather than a summary of them.
      proof: "src/evals/golden_dataset.json · src/evals/ir_metrics.py · src/evals/ablation.py · evals/runs/ · docs/golden-set-curation.md"
    - dimension: judge
      status: partial
      how: >-
        Two frozen rubrics — RAGAS ragas-v1 (faithfulness, answer relevancy, context precision)
        and depth-v2 (grounding 40%, five LLM-judged depth metrics 60%, hard cap when faithfulness
        drops below 0.6) — and every score keeps its intermediates. Independence is the gap: the
        shipped judge defaults to the same DeepSeek model that writes the answers, so the run the
        live Scoreboard ranks is self-graded and says so in a banner. One cross-provider re-judge
        (gpt-5.5 on the depth metrics) reproduced the ranking exactly, but it is a validation
        artifact, not the default.
      proof: "src/evals/judge.py · src/evals/rejudge.py · demo/validate/artifacts/v0_independent_judge/ · evals/runs/matrix-20260809-071818-depth-v2.json"
    - dimension: gate
      status: shipped
      how: >-
        An eval-gate CI job re-scores the committed ablation and golden snapshots from their
        stored chunk ids against the current golden labels — no corpus, no API key, no retrieval
        re-run. It catches a snapshot whose numbers no longer reconcile with its ids, a golden-set
        edit that silently invalidates a committed run, and a real drop below a claimed floor
        (video_recall ≥ 0.9, context_recall ≥ 0.45, NDCG@10 ≥ 0.45, hybrid still beating semantic
        at recall@3). Underneath: ruff, mypy over the retrieval and eval core, 1,567 Python tests,
        a frontend typecheck, 513 Vitest tests and a production build.
      proof: "tests/evals/test_committed_runs.py · .github/workflows/ci.yml · evals/runs/README.md"
    - dimension: loop
      status: partial
      how: >-
        The machinery is there: a written curation process for growing the golden set per domain,
        a per-cell eval cache fingerprinted on the question, the answering and judging config and
        a digest of the corpus (so a stale score is never silently reused), and an Experiments tab
        that starts a judged head-to-head and commits the run. Missing is the half that makes a
        change traceable to one lever: no prompt-optimisation harness, no versioned prompt
        registry with a champion/challenger promotion contract, no written-up diagnose → propose
        → verify cycles. Improvement is still a human reading a table.
      proof: "docs/golden-set-curation.md · src/evals/matrix_cache.py · src/api/matrix_runner.py · src/agents/prompts.py"
    - dimension: guardrails
      status: partial
      how: >-
        Deny-by-default on HTTP method: every non-GET returns 403 {"detail":"demo"}, which covers
        ask/judge/index/eval and any POST added later without touching that file, with two
        carve-outs stated in the code. The STT WebSocket re-checks separately (the HTTP middleware
        never sees it) and closes 1008 with a 110s client cap against a 120s server cap; document
        fetch sits behind SSRF guards that re-check scheme, address and every redirect hop and
        reject any host with a private answer; analytics needs three gates open. What it is not: a
        single-tenant workbench with no per-user auth, no tenancy and no data isolation — deliberate
        for a read-only corpus that is public in the repo anyway, but scope, not a control.
      proof: "src/api/main.py · src/api/stt.py · frontend/src/chat/useSpeechToText.ts · src/documents/fetch.py · frontend/src/analytics.ts"
    - dimension: trace
      status: shipped
      how: >-
        Every answer persists an ordered execution trace built only from what the code measured:
        the graph route decision, each retrieve/rerank/merge stage with the chunk ids it kept and
        the query it really searched for (a follow-up is rewritten), every LLM call with its model
        and elapsed time. It is saved with the history entry rather than session state, so it
        survives a reload, is readable on the live demo under any recorded answer, and a run that
        errors keeps whatever it had recorded. MLflow covers CLI runs; fleet health is one
        CloudWatch alarm on sustained 5xx — proportionate to one service, but no SLO dashboard.
      proof: "src/agents/models.py · src/chat/history.py · src/observability.py · infra/terraform/demo/main.tf"
    - dimension: cost
      status: shipped
      how: >-
        The headline finding is a cost finding: 6.1× fewer tokens than full-transcript prompting
        (2,997 vs 18,295) at 0.93 answer similarity. Per-strategy token budgets are recorded rather
        than estimated on every matrix cell, and the Scoreboard ranks setups by composite per 1k
        tokens, so a setup that spends more to score lower is visible. Embeddings and reranking
        run locally on CPU, the eval cache re-scores only new cells, and the public deployment
        performs no inference, so its worst case is a fixed App Runner bill.
      proof: "dashboard/evaluation.json · evals/runs/ · frontend/src/scoreboard/ · src/evals/matrix_cache.py"
    - dimension: release
      status: shipped
      how: >-
        Merge to main is the deploy, over GitHub OIDC with no stored AWS keys: sync the non-git
        demo data from S3, build and push the linux/amd64 image to ECR (App Runner auto-deploys
        :latest), terraform apply, poll until the service reports RUNNING, then smoke the live URL.
        The smoke test fails the deploy unless /api/health says mode: demo, /api/corpus serves a
        non-empty corpus, POST /api/ask returns 403 with the demo refusal body, and the React shell
        renders. An ECR lifecycle policy keeps the last five images as the rollback window.
      proof: ".github/workflows/deploy-aws.yml · scripts/demo_smoke.sh · scripts/upload_demo_data.sh · infra/terraform/demo/main.tf"
    - dimension: scale
      status: designed
      how: >-
        Rung 10 only: one App Runner instance at 0.5 vCPU / 1 GB, read-only, index baked into the
        image, sized from a measured 539 MiB RSS at rest — which is why 1 GB is the floor rather
        than a guess. The write path already has an ingestion queue with three concurrent workers,
        so the concurrency model exists for indexing. Nothing has been load-tested; rungs 100 and
        1,000 are design only.
      proof: "infra/terraform/demo/main.tf · src/api/ingestion_queue.py · src/config.py"
---

## 1 · Purpose & benefit

transcript·lab answers the question demos skip: *which* retrieval configuration ranks the evidence best, and how would you know?

- **Corpus** — 102 YouTube videos, 2,827 chunks, 61 channels.
- **Golden set** — questions carry chunk-level labels.
- **IR metrics** — scored from chunk ids alone, no LLM in the loop.
- **Ablation** — eight configurations over the same questions.
- **CI gate** — re-scores every committed run.
- **The number** — RAG matches full-transcript prompting at **0.93 similarity for 6.1× fewer tokens**.

The live deployment is the same app in demo mode: read-only, keyless, no inference.

- **Why no live LLM?** A no-login public app with a live LLM has an unbounded abuse bill; the evidence is the interesting surface.

| Surface | What a visitor sees |
|---|---|
| **Corpus** | the corpus tree |
| **Retrieval Lab** | semantic, BM25 and graph ranked side by side for any query |
| **Graphs** | the chunk-similarity graph and a 2,000-entity knowledge-graph snapshot |
| **Themes · Disagreements** | 30 cross-video Themes and 7 Disagreements |
| **Scoreboard** | engines ranked over committed matrix runs |
| **Conversations** | 66 recorded, each answer carrying its own execution trace |

No composer, no ingestion: every write is a 403.

[Open the demo ↗](https://iibze7vuqr.ap-southeast-2.awsapprunner.com) ·
[repo ↗](https://github.com/nmp-dsci/transcript-rag-agent)

<figure class="evidence">
  <img src="/assets/img/transcript-rag/demo-chat.png" alt="A recorded answer in the demo: single-hop RAG answer with timestamped citations, a token and latency strip, and a footer saying new questions are disabled" loading="lazy">
  <figcaption><strong>Every answer here is a replay of a judged run, not a live call.</strong> Tokens, chunks, LLM calls and latency come from the stored trace; new questions are disabled. Source: <code>src/chat/history.py</code>, <code>src/agents/models.py</code>, <code>src/api/main.py</code>.</figcaption>
</figure>

## 2 · Agent architecture

{% include fig-agent.html %}

- **Ingest** — chunk at ~1,200 characters with 150 overlap so a chunk keeps its timestamps; embed locally with MiniLM; write to ChromaDB.
- **Contextual collection** — the same chunks embedded with an LLM-written situating sentence: Anthropic-style contextual retrieval, ablatable.
- **Query rewrite** — HyDE writes the passage that would answer; multi-query fans out paraphrases; both cached per question.
- **Retrieve wide** — semantic and BM25 each return 30 candidates.
- **Fuse by rank** — reciprocal-rank fusion; cosine distance and Okapi BM25 are not on comparable scales.
- **Rerank narrow** — a local cross-encoder cuts the survivors to top-k.

Four answer paths, one retrieval, one typed answer shape:

| Path | What it does |
|---|---|
| **single-hop** | the shipped default |
| **recursive multi-hop** | acts on its own proposed subtopics |
| **LangGraph ReAct agent** | chooses its own retrieval calls |
| **GraphRAG agent** | routes to `local`, `global` or `temporal`; answers over a Neo4j entity/claim graph with Leiden communities and pre-built summaries |

DeepSeek flash is the only remote dependency; embeddings and reranking are local.

<figure class="evidence">
  <img src="/assets/img/transcript-rag/architecture.svg" alt="Pipeline architecture: ingestion, chunking and embeddings into ChromaDB, then query-time retrieval with recursive fan-out" loading="lazy">
  <figcaption><strong>Retrieve wide, rerank narrow.</strong> Fan out, fuse two rankings by rank, cut to top-k before any model sees the evidence. Source: <code>src/rag/contextualize.py</code>, <code>src/rag/fusion.py</code>, <code>src/rag/rerank.py</code>.</figcaption>
</figure>

## 3 · Agent loop & evaluation

- **One request** — embed, search, fuse, rerank to ten chunks, answer with timestamped citations.
- **Citations** — built from the labels the answer actually cites, not reference JSON the model was trusted to emit.
- **Golden set** — twenty questions label which `chunk:<video>:<index>` a good retriever must surface.
- **The honest finding** — plain hybrid fusion still wins recall@10, MRR and NDCG@10.

| Configuration | Where it acts | What the sweep found |
|---|---|---|
| Semantic only | retrieval | the floor hybrid has to beat at recall@3, which CI checks on every run |
| Hybrid fusion — RRF over BM25 + semantic | retrieval | wins recall@10, MRR and NDCG@10: the plain baseline is still the best ranker |
| Cross-encoder rerank over a bi-encoder ranking | post-retrieval | it helps: +0.058 recall@3 |
| Cross-encoder rerank over a fused ranking | post-retrieval | it hurts: −0.061 recall@10, because fusion had already done that reordering with a second retriever's opinion |
| HyDE | query side | best recall@1 and worst `video_recall`: a precision instrument with a hallucination failure mode |
| Multi-query | query side | — |
| Contextual retrieval | index side | — |

- **Snapshots** — the numbers behind each cell are committed under `evals/runs/`.
- **Answer grading** — RAGAS plus `depth-v2`: grounding 40% / depth 60%, capped hard when faithfulness falls below 0.6.
- **Self-graded, and says so** — the Scoreboard's run was judged by the model that wrote the answers; a banner says so, and that its corpus digest (71 videos) is not the header's.
- **CI** — re-scores every committed snapshot from its stored chunk ids; fails on a floor breach or a golden-set edit that invalidates a run; no corpus, no API key.

[The eval loop →](/practices/eval-loop/)

<figure class="evidence">
  <img src="/assets/img/transcript-rag/demo-scoreboard.png" alt="The Scoreboard on the live demo: 20 of 20 questions judged under the RAGAS rubric, an efficiency panel ranking composite per 1k tokens, and warning banners about self-grading and a corpus mismatch" loading="lazy">
  <figcaption><strong>The Scoreboard argues against its own numbers.</strong> 20 of 20 judged, ranked by composite per 1k tokens, under two warnings it raises itself: self-graded, and scored on 71 videos. Source: <code>frontend/src/scoreboard/</code>, <code>evals/runs/matrix-20260809-071818-depth-v2.json</code>.</figcaption>
</figure>

## 4 · Deployed architecture

{% include fig-topology.html %}

- **Stack** — one App Runner service in `ap-southeast-2`, 0.5 vCPU / 1 GB; no VPC, no database, no Secrets Manager, no provider keys.
- **Baked in** — React bundle, Chroma index, committed eval runs, chat history, the exported knowledge-graph snapshot standing in for live Neo4j; read-only by construction.
- **Deploy** — merge to `main` → GitHub OIDC, no stored AWS keys → sync demo data from S3 → push linux/amd64 image to ECR → `:latest` auto-deploys → Terraform reconciles → poll to `RUNNING` → smoke.
- **Smoke** — `mode: demo`, non-empty corpus, `POST /api/ask` 403 with the demo refusal body, the React shell renders.
- **Rollback** — ECR lifecycle keeps the last five images.
- **Alarm** — one CloudWatch alarm on sustained 5xx.
- **Sizing** — 539 MiB RSS measured at rest; 1 GB is the floor, 0.5 GB would OOM on the first burst.
- **Rung 10** — nothing load-tested.

[See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security

- **Deny by method** — every non-GET returns `403 {"detail":"demo"}`: ask, judge, index, eval and any POST added later, without touching that file.
- **Carve-out, allowed** — `POST /api/chunk-graph` builds a layout from stored vectors alone; the query overlay, which would load the embedding stack, is refused.
- **Carve-out, refused** — the matrix and ingestion streams are GETs that do work rather than read.
- **WebSocket** — HTTP middleware never sees the handshake, so speech-to-text accepts then closes `1008`; a 110s client cap inside a 120s server cap.
- **SSRF** — document review re-checks scheme, credentials, port and address before *every* redirect hop; any private, loopback or link-local DNS answer rejects the host.
- **Analytics** — three gates: the server saying `demo`, a key baked in at build, init not already run; no autocapture, no session recording.
- **Scope, not a control** — no per-user auth, no data isolation; one corpus, public in the repo; the first thing to change.

## 6 · Observability & cost

Every answer carries its own trace, built only from what the code measured:

- **Route** — the routing decision.
- **Stages** — each retrieval and rerank stage with the chunk ids it kept.
- **Query** — the one actually searched; a follow-up is rewritten, and a trace must show it.
- **LLM calls** — each with model and elapsed time.
- **Empty means unmeasured** — never a guess.
- **Storage** — with the history entry, not session state; survives a reload, readable on the live demo.
- **MLflow** — instruments the CLI; the server never opens a run.

Cost is the finding, not a footnote:

| Answer path | Prompt tokens | What that spend returns |
|---|---|---|
| Full-transcript prompting | 18,295 | the baseline the others are compared against |
| Single-hop RAG | 2,997 | 0.93 similarity to that baseline at 6.1× fewer tokens — the shipped default |
| Recursive multi-hop | ~10.4k | a *lower* composite than single-hop |
| ReAct agent | ~24.5k | below single-hop under grounding-only RAGAS; clearly ahead only under `depth-v2` |

- **Why ship single-hop?** Agency costs more, and what it buys depends on the rubric; single-metric leaderboards hide that.
- **Free to repeat** — embeddings and reranking are local.
- **Worst case** — no inference on the demo; a fixed ~$8–12/month App Runner bill.

<figure class="evidence">
  <div class="dash-embed"><iframe src="/assets/dash/transcript-rag/comparison.html" loading="lazy" title="Retrieval strategy comparison dashboard"></iframe></div>
  <figcaption><strong>More agency costs more tokens and does not buy grounding.</strong> Single-hop, recursive and agentic on one question, each carrying its own token cost. Source: <code>evals/runs/</code>, <code>dashboard/evaluation.json</code> · <a href="/assets/dash/transcript-rag/comparison.html" target="_blank" rel="noopener">open full-screen ↗</a></figcaption>
</figure>

## 7 · Production readiness scorecard
