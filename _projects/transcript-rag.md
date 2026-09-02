---
title: Transcript RAG
summary: >-
  An evaluation-first RAG workbench over 102 YouTube transcripts — hybrid BM25 + dense
  retrieval, cross-encoder reranking and a Neo4j entity/claim graph, with four answer paths
  raced on one chunk-labelled golden set. Live on AWS as a read-only workbench.
tldr: >-
  RAG matches full-transcript answers at 6.1× fewer tokens — measured on a chunk-labelled
  golden set with an 8-config retrieval ablation and a CI gate that re-scores every committed run.
headline: "Retrieval you can <em>prove</em>, at 6.1× fewer tokens"
outcome: >-
  A RAG workbench over 102 transcripts where eight retrieval configurations are raced on a
  chunk-labelled golden set, and CI re-scores every committed run.
proof_line: >-
  RAG answers match full-transcript prompting at 0.93 similarity while spending 2,997 prompt
  tokens against 18,295 — 6.1× fewer.
sections:
  - n: 1
    summary: "Which retrieval configuration ranks the evidence best is an empirical question, so the workbench answers it with a golden set rather than by feel."
  - n: 2
    summary: "Retrieve wide, rerank narrow: fuse by rank rather than score, then hand the same chunks to four answer paths that return the same shape."
  - n: 3
    summary: "Chunk-level labels are what reference-free metrics cannot give you, and they show the plain hybrid baseline still beating every clever addition."
  - n: 4
    summary: "The service is read-only by construction — no keys, no database, the index baked into the image — rather than by policy."
  - n: 5
    summary: "Denying by HTTP method rather than by route list refuses a new endpoint before anyone remembers to add it to a list."
  - n: 6
    summary: "Cost is the finding: more agency spends more tokens, and whether it buys anything depends entirely on which rubric scores it."
  - n: 7
    summary: "Five of nine dimensions shipped; the judge, loop, guardrails and scale gaps are named with their reasons rather than rounded up."

tags: [RAG]
metric: "6.1×"
metric_label: "fewer tokens at 0.93 answer parity"
featured: true
order: 3
stack: [LangChain + LangGraph, ChromaDB + BM25, MiniLM embeddings + local cross-encoder, Neo4j GraphRAG, RAGAS + depth-v2 judge, FastAPI + React 19, Terraform · App Runner]

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
    Read-only workbench. Browse the corpus tree and the Retrieval Lab (semantic vs BM25 vs graph
    side by side), the chunk-similarity graph, a 2,000-entity knowledge-graph snapshot, 30 Themes,
    7 Disagreements, the Scoreboard over committed matrix runs, and 66 recorded conversations
    (113 answers) each carrying its own execution trace. No composer, no ingestion, no System
    Design tab — every write is a 403.
  topology: "S3 demo data → ECR → App Runner ×1 · no VPC, no database"
  topology_diagram: "diagrams/topology/transcript-rag.svg"
  region: "ap-southeast-2"
  cost: "~$8–12/mo · $0 inference"
  rung: 10
  rung_note: >-
    The seam is the baked-in index: the Chroma corpus and the graph snapshot ship inside the
    image, so a second instance is a second copy of the corpus rather than a second reader of it.
    Rung 100 starts by moving both behind a shared store.
  score: "5 / 9"

  rubric:
    - dimension: evals
      status: shipped
      how: >-
        A 20-entry golden set hand-curated with chunk-level labels — 14 local, 4 global, 2 temporal
        across four domains, 69 labelled chunk ids — scored by a deterministic recall@k / MRR /
        NDCG@10 harness that is pure id arithmetic: no LLM, no API key, reproducible offline.
        An 8-config ablation sweeps semantic, hybrid, rerank, HyDE, multi-query and contextual
        retrieval over the same questions, and 16 run snapshots are committed so a reviewer opens
        the exact numbers rather than a summary of them.
      proof: "src/evals/golden_dataset.json · src/evals/ir_metrics.py · src/evals/ablation.py · evals/runs/ · docs/golden-set-curation.md"
    - dimension: judge
      status: partial
      how: >-
        Two frozen rubrics exist — RAGAS ragas-v1 (faithfulness, answer relevancy, context
        precision) and depth-v2, which keeps grounding at 40% and spends 60% on five LLM-judged
        depth metrics under a hard cap when faithfulness drops below 0.6 — and every score keeps
        the intermediates it was derived from. Independence is the gap: the shipped judge defaults
        to the same DeepSeek model that writes the answers, so the run the live Scoreboard ranks
        is self-graded and says so in a banner. One cross-provider re-judge has been run and
        committed (gpt-5.5 on the depth metrics) and it reproduced the ranking exactly, but that
        is a validation artifact, not the default.
      proof: "src/evals/judge.py · src/evals/rejudge.py · demo/validate/artifacts/v0_independent_judge/ · evals/runs/matrix-20260809-071818-depth-v2.json"
    - dimension: gate
      status: shipped
      how: >-
        A dedicated eval-gate CI job re-scores the committed ablation and golden snapshots from
        their stored retrieved chunk ids against the current golden labels, so it catches three
        things without re-running retrieval: a snapshot whose numbers no longer reconcile with its
        ids, a golden-set edit that silently invalidates a committed run, and a real drop below a
        claimed floor (video_recall ≥ 0.9, context_recall ≥ 0.45, NDCG@10 ≥ 0.45, hybrid still
        beating semantic at recall@3). It needs no corpus and no API key. Underneath it sits the
        ordinary floor: ruff, mypy over the retrieval and eval core, 1,567 Python tests, and a
        frontend typecheck, 513 Vitest tests and a production build.
      proof: "tests/evals/test_committed_runs.py · .github/workflows/ci.yml · evals/runs/README.md"
    - dimension: loop
      status: partial
      how: >-
        The machinery for a loop is there — a written curation process for growing the golden set
        per domain, a per-cell eval cache fingerprinted on the question, the answering and judging
        config and a digest of the corpus itself (so a stale score is never silently reused), and
        an Experiments tab that starts a judged head-to-head and commits the run. What is missing
        is the half that makes changes traceable to one lever: no prompt-optimisation harness, no
        versioned prompt registry with a champion/challenger promotion contract, and no written-up
        diagnose → propose → verify cycles. Improvement here is still a human reading a table.
      proof: "docs/golden-set-curation.md · src/evals/matrix_cache.py · src/api/matrix_runner.py · src/agents/prompts.py"
    - dimension: guardrails
      status: partial
      how: >-
        The public deployment's boundary is deny-by-default on HTTP method — every non-GET returns
        403 {"detail":"demo"}, which covers ask/judge/index/eval and any POST added later without
        touching that file, with two carve-outs stated in the code. The STT WebSocket re-checks
        separately (the HTTP middleware never sees it) and closes 1008, with a 110s client cap
        against a 120s server cap. Document fetch is behind SSRF guards that re-check scheme,
        address and every redirect hop and reject any host with a private answer. Analytics needs
        three gates open. What it is not: a single-tenant workbench with no per-user auth, no
        tenancy and no data isolation — deliberate for a read-only corpus that is public in the
        repo anyway, but it is scope, not a control.
      proof: "src/api/main.py · src/api/stt.py · frontend/src/chat/useSpeechToText.ts · src/documents/fetch.py · frontend/src/analytics.ts"
    - dimension: trace
      status: shipped
      how: >-
        Every answer persists an ordered execution trace built only from what the code actually
        measured — the graph route decision, each retrieve/rerank/merge stage with the chunk ids it
        kept and the query it really searched for (a follow-up is rewritten), every LLM call with
        its model and elapsed time. It is saved with the history entry rather than session state,
        so it survives a reload and is readable on the live demo under any recorded answer; a run
        that errors keeps whatever it had recorded. MLflow covers CLI runs. Fleet health is one
        CloudWatch alarm on sustained 5xx — proportionate to one service, but there is no SLO
        dashboard.
      proof: "src/agents/models.py · src/chat/history.py · src/observability.py · infra/terraform/demo/main.tf"
    - dimension: cost
      status: shipped
      how: >-
        The headline finding is a cost finding — 6.1× fewer tokens than full-transcript prompting
        (2,997 vs 18,295) at 0.93 answer similarity. Per-strategy token budgets are recorded rather
        than estimated on every matrix cell, and the Scoreboard ranks setups by composite per 1k
        tokens so a setup that spends more to score lower is visible. Embeddings and reranking run
        locally on CPU, so the entire ablation is free to repeat; the eval cache means adding one
        question re-scores only the new cells. The public deployment performs no inference at all,
        which makes its worst case a fixed App Runner bill.
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
        Rung 10 only: one App Runner instance at 0.5 vCPU / 1 GB, read-only, with the index baked
        into the image — sized from a measured 539 MiB RSS at rest, which is why 1 GB is the floor
        rather than a guess. The write path already has an ingestion queue with three concurrent
        workers, so the concurrency model exists for indexing; nothing has been load-tested, and
        rungs 100 and 1,000 are design only.
      proof: "infra/terraform/demo/main.tf · src/api/ingestion_queue.py · src/config.py"
---

## 1 · Purpose & benefit

Anyone building RAG has to answer a question the demos skip: *which* retrieval
configuration ranks the evidence best, and how would you know? transcript·lab is
the workbench built to answer it. It indexes a real corpus — 102 YouTube videos,
2,827 chunks, 61 channels — and treats retrieval as an experiment rather than a
setting you tune by feel:

- a golden set whose questions carry chunk-level labels;
- IR metrics scored from chunk ids alone, with no LLM in the loop;
- an eight-configuration ablation harness over those same questions;
- a CI gate that re-scores every committed run.

The benefit in one number: RAG answers match full-transcript prompting at
**0.93 similarity for 6.1× fewer tokens**.

The live deployment is that same app in demo mode: read-only, keyless, no
inference. That is a decision, not a limitation — a no-login public app with a
live LLM behind it has an unbounded abuse bill, and the interesting surface here
is the evidence, not the chat box.

So the demo serves the evidence and nothing that writes:

- the corpus tree;
- the Retrieval Lab — semantic, BM25 and graph ranked side by side for any query;
- the chunk-similarity graph and a 2,000-entity knowledge-graph snapshot;
- 30 cross-video Themes and 7 Disagreements;
- the Scoreboard, ranking engines over committed matrix runs;
- 66 recorded conversations, each answer carrying its own execution trace.

There is no composer and no ingestion: every write is a 403.

[Open the demo ↗](https://iibze7vuqr.ap-southeast-2.awsapprunner.com) ·
[repo ↗](https://github.com/nmp-dsci/transcript-rag-agent)

<figure class="evidence">
  <img src="/assets/img/transcript-rag/demo-chat.png" alt="A recorded answer in the demo: single-hop RAG answer with timestamped citations, a token and latency strip, and a footer saying new questions are disabled" loading="lazy">
  <figcaption><strong>Every answer here is a replay of a judged run, not a live call.</strong> The token count, chunk count, LLM calls and latency come from the stored trace; asking new questions is disabled on this deployment. Source: <code>src/chat/history.py</code>, <code>src/agents/models.py</code>, <code>src/api/main.py</code>.</figcaption>
</figure>

## 2 · Agent architecture

{% include fig-agent.html %}

Ingestion is segment-aware: transcripts are fetched, chunked at ~1,200 characters
with 150 of overlap so a chunk keeps its timestamps, embedded locally with MiniLM
and written to ChromaDB. A parallel collection holds the same chunks embedded
with an LLM-written situating sentence — Anthropic-style contextual retrieval as
an index-side variant you can ablate against.

Query time is where the lab lives. A question is optionally rewritten: HyDE
writes the passage that would answer it, and multi-query fans out paraphrases.
Both are cached per question, so a sweep is reproducible and free to repeat.

Semantic and BM25 each return 30 candidates; reciprocal-rank fusion merges them
by rank rather than score, because cosine distance and Okapi BM25 are not on
comparable scales. A local cross-encoder then reorders the survivors down to
top-k. Retrieve wide, rerank narrow.

Four answer paths consume that same retrieval and return the same typed answer
shape, so they are directly comparable:

- **single-hop**;
- **recursive multi-hop**, which acts on its own proposed subtopics;
- **a LangGraph ReAct agent**, which chooses its own retrieval calls;
- **a GraphRAG agent**, which routes a question to `local`, `global` or `temporal` and
  answers over a Neo4j entity/claim graph with Leiden communities and pre-built
  summaries.

DeepSeek flash is the only remote dependency; embeddings and reranking are local.

<figure class="evidence">
  <img src="/assets/img/transcript-rag/architecture.svg" alt="Pipeline architecture: ingestion, chunking and embeddings into ChromaDB, then query-time retrieval with recursive fan-out" loading="lazy">
  <figcaption><strong>Retrieve wide, rerank narrow.</strong> Ingestion chunks and embeds locally; query time fans out, fuses two rankings by rank, then cuts to top-k before any model sees the evidence. Source: <code>src/rag/contextualize.py</code>, <code>src/rag/fusion.py</code>, <code>src/rag/rerank.py</code>.</figcaption>
</figure>

## 3 · Agent loop & evaluation

One request: the question is embedded and searched, fused, reranked to ten
chunks, and answered with timestamped citations built from the labels the answer
actually cites — not from reference JSON the model was trusted to emit.

The eval loop underneath is the point of the project. Twenty golden questions
carry chunk-level labels — which specific `chunk:<video>:<index>` a good
retriever must surface — because that is exactly what reference-free metrics
cannot give you.

Eight configurations sweep those questions, and the honest finding is that plain
hybrid fusion still wins on recall@10, MRR and NDCG@10:

| Configuration | Where it acts | What the sweep found |
|---|---|---|
| Semantic only | retrieval | the floor hybrid has to beat at recall@3, which CI checks on every run |
| Hybrid fusion — RRF over BM25 + semantic | retrieval | wins recall@10, MRR and NDCG@10: the plain baseline is still the best ranker |
| Cross-encoder rerank over a bi-encoder ranking | post-retrieval | it helps: +0.058 recall@3 |
| Cross-encoder rerank over a fused ranking | post-retrieval | it hurts: −0.061 recall@10, because fusion had already done that reordering with a second retriever's opinion |
| HyDE | query side | best recall@1 and worst `video_recall`: a precision instrument with a hallucination failure mode |
| Multi-query | query side | — |
| Contextual retrieval | index side | — |

The per-configuration numbers behind those cells are committed as run snapshots
under `evals/runs/`, so a reviewer opens the exact figures rather than a summary
of them.

Answers are graded by RAGAS plus a `depth-v2` rubric weighting grounding 40% /
depth 60%, capped hard when faithfulness falls below 0.6.

The workbench refuses to flatter itself: the run the live Scoreboard ranks was
judged by the model that wrote the answers, and says so in a banner, beside a
note that its corpus digest (71 videos) is not the corpus in the header.

A CI job re-scores every committed snapshot from its stored chunk ids and fails
on a floor breach or a golden-set edit that silently invalidates a run —
deterministic, no corpus, no API key. [The eval loop →](/practices/eval-loop/)

<figure class="evidence">
  <img src="/assets/img/transcript-rag/demo-scoreboard.png" alt="The Scoreboard on the live demo: 20 of 20 questions judged under the RAGAS rubric, an efficiency panel ranking composite per 1k tokens, and warning banners about self-grading and a corpus mismatch" loading="lazy">
  <figcaption><strong>The Scoreboard argues against its own numbers.</strong> 20 of 20 questions judged and ranked by composite per 1k tokens, under two warnings it raises itself: the run is self-graded, and it was scored on a smaller corpus (71 videos) than the header reports. Source: <code>frontend/src/scoreboard/</code>, <code>evals/runs/matrix-20260809-071818-depth-v2.json</code>.</figcaption>
</figure>

## 4 · Deployed architecture

{% include fig-topology.html %}

One App Runner service in `ap-southeast-2`, 0.5 vCPU / 1 GB, no VPC, no database
and no Secrets Manager — the container holds no provider keys because it never
calls one.

Everything the read routes serve is baked into the image: the React bundle, the
Chroma index, the committed eval runs, the chat history and the exported
knowledge-graph snapshot that stands in for a live Neo4j. That is what makes the
running service read-only by construction rather than by policy.

Merging to `main` is the deploy. Over GitHub OIDC with no stored AWS keys, the
workflow syncs the non-git demo data from S3, builds and pushes the linux/amd64
image to ECR — pushing `:latest` is the release step, since App Runner
auto-deploys it — reconciles Terraform, polls until the service reports
`RUNNING`, then smoke-tests the live URL.

The smoke test fails the deploy unless all four hold:

- health reports `mode: demo`;
- the corpus is non-empty;
- `POST /api/ask` returns 403 with the demo refusal body;
- the React shell renders.

An ECR lifecycle policy keeps the last five images, which is the rollback window;
a CloudWatch alarm on sustained 5xx is the one page-worthy failure.

Sizing is measured, not assumed: 539 MiB RSS at rest with the corpus loaded, so
1 GB is the honest floor and 0.5 GB would OOM on the first burst. This is rung 10
and nothing has been load-tested. [See the scale ladder →](/practices/production-scale/)

## 5 · Guardrails & security

The demo gate is deny-by-default on *method*, not a hand-kept route list: every
non-GET returns `403 {"detail":"demo"}`, which covers ask, judge, index, eval and
any POST added later without that file being touched.

Two carve-outs are written down where they live:

- `POST /api/chunk-graph` builds a layout from stored vectors alone and is
  allowed, while still refusing the query overlay, which would load the
  embedding stack;
- the matrix and ingestion streams are refused despite being GETs, because they
  do work rather than read.

The speech-to-text WebSocket is a separate boundary because HTTP middleware never
sees a WebSocket handshake, so the refusal lives in the route: accept, then close
`1008`, so the browser reads a policy code rather than a bare failure. A 110s
client cap sits inside a 120s server cap.

Document review — the one feature that fetches something the user supplied — runs
behind SSRF guards that re-check scheme, credentials, port and address before
*every* redirect hop, and reject a host if any DNS answer is private, loopback or
link-local.

Analytics needs three gates open at once:

- the server saying `demo`;
- a key baked in at build time;
- init not already run.

There is no autocapture and no session recording.

What this is not: a multi-tenant application. There is no per-user auth and no
data isolation, because there is one corpus and it is public in the repo. That is
scope, not a control, and it is the first thing that would have to change.

## 6 · Observability & cost

Every answer carries its own trace, built only from what the code measured:

- the route decision;
- each retrieval and rerank stage, with the chunk ids it kept;
- the query it actually searched for — a follow-up is rewritten, and a trace that
  hides that cannot show you the corpus was searched for the wrong thing;
- every LLM call, with its model and elapsed time.

An empty chunk list means "not measured", never a guess. The trace is stored with
the history entry rather than session state, so it survives a reload and is
readable on the live demo. MLflow instruments the CLI; the server never opens a
run.

Cost is the finding, not a footnote. Against full-transcript prompting the same
question costs 2,997 prompt tokens instead of 18,295 — 6.1× — at 0.93 answer
similarity. Agency costs more than that, and what it buys depends entirely on the
rubric it is scored under:

| Answer path | Prompt tokens | What that spend returns |
|---|---|---|
| Full-transcript prompting | 18,295 | the baseline the others are compared against |
| Single-hop RAG | 2,997 | 0.93 similarity to that baseline at 6.1× fewer tokens — the shipped default |
| Recursive multi-hop | ~10.4k | a *lower* composite than single-hop |
| ReAct agent | ~24.5k | below single-hop under grounding-only RAGAS; clearly ahead only under `depth-v2` |

That is a real finding about agency and also a warning about single-metric
leaderboards, which is why the default ships single-hop.

Embeddings and reranking are local, so the ablation is free to repeat; the demo
performs no inference at all, leaving a fixed ~$8–12/month App Runner bill as the
worst case.

<figure class="evidence">
  <div class="dash-embed"><iframe src="/assets/dash/transcript-rag/comparison.html" loading="lazy" title="Retrieval strategy comparison dashboard"></iframe></div>
  <figcaption><strong>More agency costs more tokens and does not buy grounding.</strong> Single-hop, recursive and agentic on one question, each carrying its own token cost. Source: <code>evals/runs/</code>, <code>dashboard/evaluation.json</code> · <a href="/assets/dash/transcript-rag/comparison.html" target="_blank" rel="noopener">open full-screen ↗</a></figcaption>
</figure>

## 7 · Production readiness scorecard
