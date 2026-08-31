---
published: false   # D4a — the site shows only the three production systems.
                   # Content and media stay in git; nothing renders. Reversible.
title: V2V Prod Agent
summary: A voice-to-voice banking agent built to production standard — callers get verified, answered from a knowledge base, and served by tools that can block cards and move money, with a deterministic policy gate between the model and every action.
tldr: Voice in, voice out, real actions in between — and the model is never trusted to police itself. A pure-Python guardrail gate authorizes every tool call; red-team attacks are graded on whether a single bank value moved.
tags: [Agents, RAG]
metric: "9/9"
metric_label: "red-team attacks stopped at the gate"
featured: false
order: 1
stack: [pydantic-ai, faster-whisper STT, Kokoro TTS, FastAPI + SQLite, BM25 RAG, OTel → Langfuse, Docker + CI]
skills: [responsible-ai, agentic-ai, model-evaluation, rag, mlops, prompt-engineering, docker, python]
skills_detail:
  - skill: responsible-ai
    proof: A pure ordered-rule policy gate sits between the LLM and every tool call — identity verification, a permissible-action matrix, read-back confirmation with exact-argument match, confidence thresholds and PII redaction — as deterministic Python, not prompts (guardrails/gate.py).
  - skill: agentic-ai
    proof: A pydantic-ai tool loop with ten banking tools, every one routed through a single thread-locked authorize → execute → audit chokepoint (agent/core.py, tools/executor.py).
  - skill: model-evaluation
    proof: The red-team suite grades each of its 9 attacks on the final bank state — did money actually move? — not on what the model says; 65 guardrail/gate/red-team tests pass deterministically without an API key (evals/redteam/attacks.py, tests/).
  - skill: rag
    proof: An in-process BM25 knowledge base with a grounded-claims check on answers — the agent cites what it retrieved, and ungrounded claims are flagged (rag/index.py, rag/search.py).
  - skill: mlops
    proof: A calibrated scikit-learn intent classifier feeds the human-handoff threshold — sub-millisecond and deliberately not an LLM — with OpenTelemetry traces flowing to Langfuse for sampled online judging (ml/intent.py, observability/tracing.py).
  - skill: prompt-engineering
    proof: An adversarial promptfoo suite probes injection, social engineering and authority impersonation against the live prompt (evals/promptfoo/redteam.yaml).
  - skill: docker
    proof: Guardrail tests run as their own CI gate, and the multi-stage runtime image deliberately excludes the voice/ML extras it doesn't need (ci.yml, Dockerfile).
links:
  repo: https://github.com/nmp-dsci/v2v-prod-agent
media:
  reel: ""
---

## Architecture

Caller audio → **faster-whisper STT** (with word-level confidence) → a
**pydantic-ai agent core** → **Kokoro TTS**, streamed back sentence by sentence.
The agent holds ten tools — from `verify_identity` and `get_balance` through
`block_card`, `transfer_funds` and `escalate_to_human` — and the design's one
non-negotiable is that **the model never runs a tool directly**.

Every tool call passes through a guardrail gate implemented as a pure function:
no I/O, no model, just ordered rules — identity before any account access, a
permissible-action matrix as data, explicit read-back confirmation before
irreversible actions, STT- and intent-confidence floors that route the caller
to a human instead of guessing, and PII redaction. Allowed, denied and failed
calls alike land in an audit log that can be replayed through the gate.
A jailbroken model still can't move money, because the thing that says no
isn't a prompt.

Sample calls, synthesised end-to-end through the real pipeline:

<figure class="evidence">
  <audio controls preload="none" src="/assets/audio/v2v/call_0142.mp3"></audio>
  <figcaption>Sample call — identity verification then account actions (52s, agent voice Kokoro bf_emma)</figcaption>
</figure>

<figure class="evidence">
  <audio controls preload="none" src="/assets/audio/v2v/call_0163.mp3"></audio>
  <figcaption>Sample call — knowledge-base question, grounded answer (20s)</figcaption>
</figure>

## Cost

The pipeline is engineered so the metered part is as small as possible:

- **Voice runs locally.** STT is faster-whisper `small.en` quantised to int8 on
  CPU; TTS is Kokoro-82M — neither touches an API.
- **The router costs nothing.** Intent classification is a calibrated
  linear model, sub-millisecond by design, because an LLM in that seat would be
  paying latency and tokens for a solved problem.
- **Retrieval is free.** The knowledge base is in-process BM25 — no embedding
  API, no vector database to host.
- **Only the agent is metered** — DeepSeek by default, with a provider swap to
  Claude (Opus for agent/judge, Haiku for the fast path) behind one config
  switch. TTS streams sentence-by-sentence to cut perceived latency.
- **The runtime image ships lean**: voice and ML extras are excluded from the
  production Docker stage that doesn't need them.
