---
title: "Production at 10 / 100 / 1,000 concurrent users"
summary: >-
  What actually runs today at ten concurrent users, what changes at a hundred
  and at a thousand, and which of those three is deployed, which is measured and
  which is only drawn. The rung-100 sizing is arithmetic, from a queue
  experiment whose formula held within 6%.
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
---

## Problem

Most scale sections on a portfolio are a picture of what someone would build.
The picture is usually fine and tells you nothing, because it never says which
box exists.

There is a second problem specific to gen-AI. A web request is measured in
milliseconds, so "requests per second" is the natural unit and headroom is
enormous. An agent answer takes **around 90 seconds** and holds a worker slot for
all of it. At that service time, capacity is not a throughput number, it is a
slot count — and a hundred people asking at once is a genuinely different system
from ten, not the same system with a bigger instance.

So the unit here is **concurrent users**, each rung is labelled with how real it
is, and the sizing is arithmetic you can check rather than a shape.

## Pattern

Three rungs. Rung 10 is running now. Rung 100's sizing was measured on one
laptop and has not been deployed. Rung 1,000 is a design.

Monthly-user figures use a 1–2% concurrency rule of thumb and are
order-of-magnitude only. Only rung-10 costs are measured.

### Rung 10 · deployed — today's demo

<figure class="fig">
  {% include diagrams/rung-10.svg %}
  <figcaption>Rung 10 as deployed: App Runner is front door and compute in one, session and limit state lives in the process, and the model is never called on the public URL.</figcaption>
</figure>

**~$5–18 / month per app · ≈ hundreds of visitors a month**

- **Compute** — one App Runner instance per service, front door and compute
  bundled. Data Pilot pins `min_size = max_size = 1` with `max_concurrency 100`
  for its read paths; ConvFinQA and Transcript RAG each run one 0.5 vCPU / 1 GB
  instance, and ConvFinQA additionally caps live turns at 4 in flight and needs
  `--workers 1`.
- **State** — sessions, rate limits and the demo pack live in process memory.
  That is *correct* at N=1, not a shortcut, and it is the named seam beyond it.
- **Data** — Data Pilot's Aurora Serverless v2 runs 0–1 ACU and auto-pauses
  after an hour, so the first visitor after a pause waits about 30 seconds and
  the UI narrates it. The other two bake their index and CSVs into the image and
  have no database at all.
- **Spend** — no inference on the public URL. Chat replays recorded runs, so the
  worst-case bill under attack is a fixed ceiling rather than an unbounded one.
  Turning Data Pilot's demo mode on deleted the 2 vCPU / 4 GB agent service —
  the single biggest idle line at roughly $25–35/month — measured as **~$36–66
  → ~$8–18/month**, 60–70% cheaper.
- **Signal to move** — App Runner 5xx alarm or concurrency at cap; Aurora ACU
  pinned at max; in Data Pilot, the ops deck's wait p95 rising while service p95
  stays flat.

### Rung 100 · sizing measured, not deployed — live LLM back on

<figure class="fig">
  {% include diagrams/rung-100.svg %}
  <figcaption>Rung 100: the ALB and Fargate split apart what App Runner bundles, a queue absorbs the burst, and session state moves out to Redis.</figcaption>
</figure>

**≈ $0.5–1k / month + inference · ≈ 5–10k monthly users — estimates**

Two terms, so the figure reads right. **ALB** (Application Load Balancer) is the
front door — the job an API Gateway would otherwise do. **ECS Fargate** is the
compute — where the FastAPI containers run, with no servers to manage. They are
the two halves of what App Runner bundles at rung 10.

**Why ALB, not API Gateway, for the chat path.** API Gateway's integration
timeout is about 30 seconds. That cannot hold a 90-second agent answer, and it
cannot hold an SSE stream. An ALB's idle timeout goes to 4,000 seconds. API
Gateway earns a place *beside* the ALB, not instead of it, on keyed surfaces —
Data Pilot's `dpk_` webhook and MCP keys — where per-key usage plans and
throttling are the entire point.

**The sizing is arithmetic.** The measured formula is drain time
`⌈N ÷ slots⌉ × S`, and it held within 6% across every configuration tested.
Substituting the target:

```
100 askers · S ≈ 90 s · wait target < 3 min
    ⌈100 ÷ slots⌉ × 90 s ≤ 180 s   ⇒   ⌈100 ÷ slots⌉ ≤ 2   ⇒   slots ≥ 50
    50 slots  ≈  8–12 worker tasks × 4–6 concurrency
```

Then size the task from measured memory, not from a guess: a warm worker held
**~300 MB at cruise and up to ~840 MB freshly warmed** (Pyodide plus ONNX), and
one process running four concurrent slots peaked at **~1.45 GB including four
in-flight jobs**. That puts 4–6 slots inside a 1 vCPU / 2 GB task, so ~50 slots
is roughly **10 tasks**. Memory, not CPU, is what bounds worker count.

- **State out of process** — Redis for sessions and limits. This is exactly the
  seam ConvFinQA's `serving/limits.py` names in its own docstring; Data Pilot's
  queue already works this way.
- **Data** — Aurora min ACU above zero kills the cold start; one reader carries
  Explore and SQL; pgvector stays in the database.
- **Guardrails scale with it** — per-user daily caps become tenant quotas; WAF
  and edge rate limits; provider quota alarms. Fifty concurrent LLM calls is
  where a single provider's rate limit starts to matter.
- **Signal to move** — queue wait p95 rising while service p95 stays flat means
  add slots; *both* rising means the agent itself got slower, which is an eval
  problem and not an infrastructure one. Also reader CPU and connection count on
  Aurora, and cost-per-answer × volume crossing the budget alarm.

### Rung 1,000 · designed only — multi-tenant fleet

<figure class="fig">
  {% include diagrams/rung-1000.svg %}
  <figcaption>Rung 1,000 as designed: fleets separated by role, one queue per workload class, a router in front of the providers, and an online judge sampling production.</figcaption>
</figure>

**≈ $5–15k / month + inference · ≈ 50–100k monthly users — estimates**

- **Compute** — separate autoscaling fleets per role across AZs: API, LLM-wait
  workers (cheap, high concurrency), CPU-bound sandbox workers, an online judge.
  About 500 slots for 1,000 askers at the same wait target. Slots are slots: the
  experiment showed one process × 4 coroutines beating three serial replicas.
- **Queues per class** — interactive, batch and eval-sample, so a report
  backfill never queues in front of a live user.
- **Data** — Aurora writer plus readers; marts partitioned by tenant and
  dataset; row-level security graduates to schema-per-tenant where a customer
  demands physical isolation; pgvector moves to a dedicated or partitioned store.
- **LLM** — 500 concurrent calls exceeds one provider's default quota, so a
  router across providers with per-tenant quotas, prompt caching and fallbacks.
  That is the choke-point pattern ConvFinQA already has in one module, applied
  fleet-wide.
- **Release** — blue/green on ALB weighted target groups, with the canary judged
  by the online eval sample before it takes 100%.
- **Cost** — per-tenant showback; the budget alarm becomes a per-tenant quota.
- **Signal to move** — rung-100 autoscaling hitting its max repeatedly; reader
  lag or connection exhaustion; one tenant's load starving others (the argument
  for per-class queues and sharding); provider 429s.

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

## In the three systems

All three sit on rung 10 today. What differs is how much of rung 100 is more
than an intention.

**Data Pilot — rung 10, with rung-100 sizing measured.** k6 load tests are
recorded to `app.load_tests`, and the Redis Streams queue experiment behind this
page's arithmetic ran against the live stack. The queue itself exists as an
opt-in path, so the state-out-of-process half of rung 100 is already built rather
than designed. Production today is one instance per service and Aurora at 0–1 ACU.

**ConvFinQA Agent — rung 10, seam named.** One instance, `--workers 1`,
in-memory sessions and limits — and `serving/limits.py` says so in its own
docstring: in-memory state is *correct* here because App Runner runs the service
at max-size 1, "if that ever changes, these two classes are the seam". There is
no load test. Rungs 100 and 1,000 are design only.

**Transcript RAG — rung 10, seam named.** One 0.5 vCPU / 1 GB App Runner
instance, read-only, with the Chroma index baked into the image; an ingestion
queue with three workers (`src/api/ingestion_queue.py`) already exists for the
write path, which is the shape rung 100 needs for the read path. No load test.
Rungs 100 and 1,000 are design only.

## Evidence

The rung-100 arithmetic rests on one experiment, in `data-qa-agent`:
`.lavish/s42_worker-scaling-results.html` (the write-up),
`out/wsweep/summary.json` (the raw grid) and `load/k6/chat.js`. Recomputed from
`summary.json` on 2026-08-30:

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

**10 cells · 150 of 150 answers ok · 0 shed · 0 errors · 0 timeouts.** Three
workers gave 2.97–2.99×, five gave 4.87–4.98×, and the largest error in the grid
was 6.0% — on the shortest cell, where a fixed ~1.8 s of per-wave overhead is a
larger share of a 30-second run. The last row is the one that changed the design:
one process running four coroutines drained the burst in 121.8 s against 152.3 s
for three serial replicas, at 1.45 GB instead of 2.34 GB. Slots are slots,
whether they come from processes or coroutines.

**The live-LLM validation (E9).** The grid used a stubbed service time to isolate
queueing, so it was re-run with real answers: 10 users at once, through the queue
on 3 workers, then straight at a single container with the queue off. 20 of 20
answered, zero errors.

| leg | makespan | peak CPU | peak memory | concurrent LLM calls |
|---|---|---|---|---|
| queue · 3 workers | **197.0 s** | 331% (≈110%/worker) | 2.0 GB over 3 replicas | ≤ 3, by construction |
| direct · 1 container | **72.9 s** | 816% | 2.3 GB, one process | 10, unbounded |

The prediction for the queue leg — ⌈10/3⌉ = 4 waves × 50–60 s ≈ 200–240 s —
landed on a measured 197 s, so the stub arithmetic transfers to real answers. The
direct leg's win was bought with **eight-plus idle cores**, which no App Runner
instance at 1–2 vCPU has: the same burst there serialises on CPU and stretches
toward the 240-second timeout. The queue trades about two minutes for the last
user in exchange for bounded CPU, bounded LLM spend and a clean 429 past depth 32.

Rung-10 costs are the only measured dollars on this page: Data Pilot's demo-mode
cutover (~$36–66 → ~$8–18/month) and ConvFinQA's container sizing — 225 MiB RSS
at rest, 315 MiB with every prediction CSV cached, so the 1 GB instance is the
honest floor at roughly $5–15/month. Everything at rung 100 and rung 1,000 is an
estimate.

## Failure modes

**Presenting an estimate as a measurement.** The rung-100 dollar range is a guess
with a shape, not a bill. The sizing is not — but it was measured on one laptop
with a stubbed service time, and the write-up says so: live answers vary 60–120 s,
which smears wave boundaries, so expect the same means with wider spread.

**Confusing throughput with slots.** A queue that "handles 30 requests a minute"
tells you nothing when one answer occupies a slot for 90 seconds. The only number
that sizes the fleet is `⌈N ÷ slots⌉ × S`, and the only way to know `S` is to
measure it under the model you actually ship.

**Reading a single latency number.** Wait p95 and service p95 have to be
separated or the dashboard cannot tell you what to do. Wait rising while service
is flat means add slots. Both rising means the agent got slower, and adding
workers will burn money without fixing anything. The queue sweep produced the
first pattern on demand, which is what makes it alertable.

**Warm-up lagging scale-out.** A cold replica costs about 30 seconds before its
first answer (Pyodide and ONNX warm-up), and the sweep saw boot spikes of
500–750% CPU as three to five replicas warmed concurrently. An autoscaler that
adds capacity at the moment the backlog appears has already added it too late.

**Scaling the compute and forgetting the provider.** At 50 concurrent calls a
single provider's rate limit becomes the binding constraint, and at 500 it is a
certainty. That is a routing and quota problem, not an ECS one, and it is the
reason the rung-1,000 design puts a router in front of the providers rather than
more workers behind them.

**Skipping the rung you are on.** All three systems could be given more
instances tomorrow. None of them would survive it, because sessions and rate
limits are in process memory — correct at one instance, wrong at two. Naming that
seam in the code is cheap; the migration is not, and pretending the box is
already ticked is how a demo becomes an outage.
