---
title: "Production at 10 / 100 / 1,000 concurrent users"
short: "Production at scale"
summary: >-
  What runs today at ten concurrent users, what changes at a hundred and at a
  thousand, and which rung is deployed, measured or only drawn. The rung-100
  sizing is arithmetic, from a queue experiment whose formula held within 6%.
tldr: >-
  Rung 10 is deployed. Rung 100's sizing is measured — ⌈N ÷ slots⌉ × S held within 6% across 10 cells and 150 answers. Rung 1,000 is designed only. Dollar ranges are order-of-magnitude estimates.
order: 3
kicker: "practice · scale & cost"
systems: [data-pilot, convfinqa-agent, transcript-rag]
rubric: [scale, cost, release, trace]
evidence_note: >-
  The scaling numbers come from `data-qa-agent/out/wsweep/summary.json` and
  `.lavish/s42_worker-scaling-results.html`, re-read and recomputed on
  2026-08-30. Only rung-10 costs are measured; every other dollar figure on this
  page is an order-of-magnitude estimate and is labelled as one.
sections:
  - n: 1
    summary: >-
      A 90-second answer holds a worker slot, so capacity is a slot count and
      the unit is concurrent users.
  - n: 2
    summary: >-
      Three rungs, each labelled with how real it is: rung 10 deployed, rung 100
      measured but not deployed, rung 1,000 drawn.
  - n: 3
    summary: >-
      All three sit on rung 10; only Data Pilot has measured any of rung 100
      rather than naming the seam.
  - n: 4
    summary: >-
      One queue experiment, recomputed on 2026-08-30, is what makes the rung-100
      sizing arithmetic rather than a shape.
  - n: 5
    summary: >-
      Six ways a scale story goes wrong, starting with presenting an estimate as
      a measurement.
---

## Problem — "it scales" is a claim nobody has measured

Most portfolio scale sections draw what someone would build and never say which box exists.

- **Gen-AI breaks the usual unit** — a web request is milliseconds, so "requests per second" fits and headroom is enormous; an agent answer takes **around 90 seconds** and holds a worker slot throughout.
- **Capacity is a slot count**, not a throughput number — a hundred people at once is a different system from ten, not a bigger instance.
- **So** — the unit is concurrent users, each rung is labelled with how real it is, and the sizing is arithmetic you can check.

## Pattern — name your rung, and size the next one

Three rungs: rung 10 running now; rung 100 sized on one laptop, not deployed; rung 1,000 a design.

Monthly-user figures use a 1–2% concurrency rule of thumb, order-of-magnitude only; only rung-10 costs are measured.

### Rung 10 · deployed — today's demo

<figure class="fig">
  {% include diagrams/rung-10.svg %}
  <figcaption><strong>The model is never called on the public URL, so the worst-case bill is a fixed ceiling.</strong> App Runner is front door and compute in one, and session and limit state lives in the process. Source: today's deployed configuration of the three demos.</figcaption>
</figure>

**~$5–18 / month per app · ≈ hundreds of visitors a month**

- **Compute** — one App Runner instance per service, front door and compute bundled. Data Pilot pins `min_size = max_size = 1`, `max_concurrency 100` on read paths; ConvFinQA and Transcript RAG run 0.5 vCPU / 1 GB each; ConvFinQA caps 4 live turns in flight and needs `--workers 1`.
- **State** — sessions, rate limits and the demo pack in process memory: *correct* at N=1, not a shortcut, and the named seam beyond it.
- **Data** — Data Pilot's Aurora Serverless v2 at 0–1 ACU auto-pauses after an hour; the first visitor after a pause waits about 30 seconds and the UI narrates it. The other two bake index and CSVs into the image; no database.
- **Spend** — no inference on the public URL; chat replays recorded runs, so the worst-case bill under attack is a fixed ceiling. Demo mode deleted Data Pilot's 2 vCPU / 4 GB agent service, the biggest idle line at roughly $25–35/month: **~$36–66 → ~$8–18/month**, 60–70% cheaper.
- **Signal to move** — App Runner 5xx alarm or concurrency at cap; Aurora ACU pinned at max; Data Pilot's ops-deck wait p95 rising while service p95 stays flat.

### Rung 100 · sizing measured, not deployed — live LLM back on

<figure class="fig">
  {% include diagrams/rung-100.svg %}
  <figcaption><strong>Rung 100 splits apart what App Runner bundles: ALB in front, Fargate behind, a queue to absorb the burst and Redis to hold session state.</strong> Sizing source: <code>out/wsweep/summary.json</code>. Not deployed.</figcaption>
</figure>

**≈ $0.5–1k / month + inference · ≈ 5–10k monthly users — estimates**

- **ALB in front, ECS Fargate behind** — the two halves of what App Runner bundles at rung 10.
- **Why not API Gateway for chat?** Its integration timeout is ~30 s and cannot hold a 90-second answer or an SSE stream; an ALB's idle timeout goes to 4,000 s. API Gateway sits *beside* it on the keyed surfaces, where per-key throttling is the point.

**The sizing is arithmetic.** Drain time `⌈N ÷ slots⌉ × S` held within 6% across every configuration tested.

```
100 askers · S ≈ 90 s · wait target < 3 min
    ⌈100 ÷ slots⌉ × 90 s ≤ 180 s   ⇒   ⌈100 ÷ slots⌉ ≤ 2   ⇒   slots ≥ 50
    50 slots  ≈  8–12 worker tasks × 4–6 concurrency
```

- **Task size from measured memory** — a warm worker held **~300 MB at cruise, up to ~840 MB freshly warmed** (Pyodide plus ONNX); one process on four slots peaked at **~1.45 GB including four in-flight jobs**.
- **So** — 4–6 slots per 1 vCPU / 2 GB task; ~50 slots is roughly **10 tasks**. Memory, not CPU, bounds worker count.
- **State out of process** — Redis for sessions and limits: the seam ConvFinQA's `serving/limits.py` names in its own docstring; Data Pilot's queue already works this way.
- **Data** — Aurora min ACU above zero kills the cold start; one reader carries Explore and SQL; pgvector stays in the database.
- **Guardrails scale with it** — per-user daily caps become tenant quotas; WAF and edge rate limits; provider quota alarms. Fifty concurrent LLM calls is where one provider's rate limit starts to matter.
- **Signal to move** — wait p95 rising, service p95 flat: add slots. *Both* rising: the agent got slower, an eval problem not infrastructure. Also Aurora reader CPU and connection count, and cost-per-answer × volume crossing the budget alarm.

### Rung 1,000 · designed only — multi-tenant fleet

<figure class="fig">
  {% include diagrams/rung-1000.svg %}
  <figcaption><strong>At rung 1,000 the provider, not the compute, is the binding constraint — hence a router in front of it.</strong> Fleets separate by role, one queue per workload class, and an online judge samples production. Source: design only, nothing deployed.</figcaption>
</figure>

**≈ $5–15k / month + inference · ≈ 50–100k monthly users — estimates**

- **Compute** — autoscaling fleets per role across AZs: API, LLM-wait workers (cheap, high concurrency), CPU-bound sandbox workers, an online judge. About 500 slots for 1,000 askers at the same wait target; the experiment showed one process × 4 coroutines beating three serial replicas.
- **Queues per class** — interactive, batch and eval-sample; a report backfill never queues in front of a live user.
- **Data** — Aurora writer plus readers; marts partitioned by tenant and dataset; row-level security graduates to schema-per-tenant where a customer demands physical isolation; pgvector to a dedicated or partitioned store.
- **LLM** — 500 concurrent calls exceeds one provider's default quota: a router across providers, per-tenant quotas, prompt caching, fallbacks. ConvFinQA's one-module choke point, fleet-wide.
- **Release** — blue/green on ALB weighted target groups; the canary judged by the online eval sample before it takes 100%.
- **Cost** — per-tenant showback; the budget alarm becomes a per-tenant quota.
- **Signal to move** — rung-100 autoscaling hitting its max repeatedly; reader lag or connection exhaustion; one tenant starving others (the argument for per-class queues and sharding); provider 429s.

### What changes at each rung

| What changes | Rung 10 · today | Rung 100 | Rung 1,000 |
|---|---|---|---|
| **Front door** | App Runner's managed endpoint (CloudFront for the SPA) | ALB + WAF · API Gateway only for keyed service surfaces (usage plans) | CloudFront + WAF at the edge → ALB per fleet · API Gateway usage plans per tenant |
| **Compute** | 1 App Runner instance / service | ECS Fargate: API ×2–4 + agent workers ~50 slots behind the ALB | Per-role fleets (API / agent ~500 slots / sandbox / judge), multi-AZ |
| **Concurrency model** | In-process caps (4 in flight, 30 req/min/IP) | Queue with admission depth; slots = replicas × concurrency; ⌈N/slots⌉ × S | Queues per workload class; per-tenant quotas at the edge |
| **Session & limit state** | Process memory (`--workers 1`) | Redis | Redis cluster / DynamoDB; sticky nothing |
| **Database** | Aurora v2 0–1 ACU (or none) | Aurora min ACU > 0 + 1 reader | Writer + N readers; marts partitioned/sharded by tenant; schema-per-tenant option |
| **Vectors** | pgvector / Chroma in the image | pgvector in Aurora | Dedicated or partitioned vector service |
| **LLM spend** | $0 (replayed) | Bounded by ~50 worker slots; daily caps → tenant quotas | Router + multi-provider + caching; per-tenant showback |
| **Release** | Auto-deploy `:latest`, rollback by retag | Blue/green on ALB weighted target groups | Canary judged by the online eval sample |
| **How you know** | 5xx alarm; ACU pinned; wait p95 ≫ service p95 | Backlog-per-task; reader CPU; cost × volume alarm | Autoscale max hit; reader lag; tenant starvation; provider 429s |

**Every row moves state out of the process and every row costs money, which is why the rung you are on is the one worth sizing.**

Source: rung 10 from the deployed configuration; rungs 100 and 1,000 from `.lavish/s42_worker-scaling-results.html` and the design.

## In the three systems — all three sit on rung 10, and say so

All three sit on rung 10 today; what differs is how much of rung 100 is more than an intention.

- **Data Pilot — rung 10, rung-100 sizing measured.** k6 load tests recorded to `app.load_tests`; the Redis Streams queue experiment behind this page's arithmetic ran against the live stack; the queue exists as an opt-in path, so the state-out-of-process half of rung 100 is built. Today: one instance per service, Aurora at 0–1 ACU.
- **ConvFinQA Agent — rung 10, seam named.** One instance, `--workers 1`, in-memory sessions and limits; `serving/limits.py`'s own docstring says in-memory state is *correct* because App Runner runs at max-size 1, "if that ever changes, these two classes are the seam". No load test; rungs 100 and 1,000 design only.
- **Transcript RAG — rung 10, seam named.** One 0.5 vCPU / 1 GB App Runner instance, read-only, Chroma index baked in; an ingestion queue with three workers (`src/api/ingestion_queue.py`) already serves the write path, the shape rung 100 needs for reads. No load test; rungs 100 and 1,000 design only.

## Evidence — rung 100 is measured, rung 1,000 is only drawn

One experiment in `data-qa-agent`: `.lavish/s42_worker-scaling-results.html` (the write-up), `out/wsweep/summary.json` (the raw grid) and `load/k6/chat.js`, recomputed from `summary.json` on 2026-08-30.

| cell | workers × conc | S | predicted ⌈15/W⌉×S | measured | error | speedup |
|---|---|---|---|---|---|---|
| W1-S10 | 1 × 1 | 10 s | 150 s | 154.8 s | 3.2% | 1.00× |
| W3-S10 | 3 × 1 | 10 s | 50 s | 52.1 s | 4.2% | 2.97× |
| W5-S10 | 5 × 1 | 10 s | 30 s | 31.8 s | 6.0% | 4.87× |
| W1-S30 | 1 × 1 | 30 s | 450 s | 454.7 s | 1.0% | 1.00× |
| W3-S30 | 3 × 1 | 30 s | 150 s | 152.3 s | 1.5% | 2.99× |
| W5-S30 | 5 × 1 | 30 s | 90 s | 91.7 s | 1.9% | 4.96× |
| W1-S60 | 1 × 1 | 60 s | 900 s | 904.7 s | 0.5% | 1.00× |
| W3-S60 | 3 × 1 | 60 s | 300 s | 302.4 s | 0.8% | 2.99× |
| W5-S60 | 5 × 1 | 60 s | 180 s | 181.6 s | 0.9% | 4.98× |
| W1-S30-C4 | 1 × 4 | 30 s | 120 s | 121.8 s | 1.5% | 3.73× |

- **10 cells · 150 of 150 answers ok · 0 shed · 0 errors · 0 timeouts.**
- **Speedup** — three workers 2.97–2.99×, five 4.87–4.98×.
- **Largest error 6.0%** — the shortest cell, where a fixed ~1.8 s of per-wave overhead is a larger share of a 30-second run.
- **The last row changed the design** — one process × four coroutines drained the burst in 121.8 s against 152.3 s for three serial replicas, at 1.45 GB instead of 2.34 GB. Slots are slots, from processes or coroutines.

**The live-LLM validation (E9).** The grid stubbed service time to isolate queueing, so it was re-run with real answers.

- **Setup** — 10 users at once, through the queue on 3 workers, then straight at one container with the queue off.
- **Result** — 20 of 20 answered, zero errors.

| leg | makespan | peak CPU | peak memory | concurrent LLM calls |
|---|---|---|---|---|
| queue · 3 workers | **197.0 s** | 331% (≈110%/worker) | 2.0 GB over 3 replicas | ≤ 3, by construction |
| direct · 1 container | **72.9 s** | 816% | 2.3 GB, one process | 10, unbounded |

- **The prediction held** — ⌈10/3⌉ = 4 waves × 50–60 s ≈ 200–240 s, measured 197 s; the stub arithmetic transfers to real answers.
- **The direct leg's win** cost **eight-plus idle cores**, which no App Runner instance at 1–2 vCPU has; there the burst serialises on CPU toward the 240-second timeout.
- **The queue's trade** — about two minutes for the last user, for bounded CPU, bounded LLM spend and a clean 429 past depth 32.
- **The only measured dollars** — Data Pilot's demo-mode cutover (~$36–66 → ~$8–18/month) and ConvFinQA's container: 225 MiB RSS at rest, 315 MiB with every prediction CSV cached, so 1 GB is the honest floor at roughly $5–15/month. Rungs 100 and 1,000 are estimates.

## Failure modes — where a rung-10 shape breaks first

- **Presenting an estimate as a measurement** — the rung-100 dollar range is a guess with a shape, not a bill. The sizing was measured, but on one laptop with stubbed service time; live answers vary 60–120 s and smear wave boundaries, so expect the same means with wider spread.
- **Confusing throughput with slots** — "handles 30 requests a minute" says nothing when one answer holds a slot for 90 seconds. Fix: size by `⌈N ÷ slots⌉ × S`, and measure `S` under the model you actually ship.
- **Reading a single latency number** — separate wait p95 from service p95 or the dashboard cannot tell you what to do. Wait rising, service flat: add slots. Both rising: the agent got slower, and workers burn money. The sweep produced the first pattern on demand, which makes it alertable.
- **Warm-up lagging scale-out** — a cold replica costs about 30 seconds before its first answer (Pyodide and ONNX), and three to five replicas warming together spiked 500–750% CPU. An autoscaler that adds capacity when the backlog appears is already late.
- **Scaling the compute and forgetting the provider** — at 50 concurrent calls one provider's rate limit binds; at 500 it is a certainty. Fix: a routing and quota problem, not an ECS one — the rung-1,000 router in front of the providers, not more workers behind them.
- **Skipping the rung you are on** — all three could get more instances tomorrow; none would survive it, because sessions and rate limits are in process memory, correct at one instance and wrong at two. Naming the seam in code is cheap, the migration is not; pretending the box is ticked is how a demo becomes an outage.
