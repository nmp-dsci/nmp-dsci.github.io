---
title: One Claude session against four agents
short: "sdk vs llm · runtime test"
kicker: "deep dive · the runtime test"
project: convfinqa-agent
rubric: [evals, gate, loop, cost]
summary: >-
  The runtime experiment behind the case study's slides 2 and 4: the Claude Agent SDK runtime,
  v8's four prompts distilled into one, the same gate on the same 349 questions. Then the
  by-turn-type split, the model swap, the confidence judge that refused itself, and what the
  result does and does not establish.
tldr: >-
  sdk-distil v8 → sdk_v1 → run both arms on the gate split → runtime gate → sdk_champion, then
  the SDK loop's own experiment (rejected), a model swap (Haiku 4.5, −3.2 pp, not significant),
  and a confidence judge that scored AUROC 0.52 and ships as advisory rather than as a gate.
updated: 2026-09-08
evidence_note: >-
  Every number on this page was re-read on 2026-09-08 from
  <code>ConvFinQA-agent</code> at <code>9d11da7</code>. The two arms' accuracies are recomputed
  with pandas from the committed CSVs under <code>evaluation/predictions/evalloop/</code>
  (<code>evalloop-test100-v8·…</code>, <code>sdk-evalloop-test100-sdk_v1·…</code> and the
  <code>…haiku-4-5…</code> run); the verdicts read <code>evaluation/diagnostics/evalloop/gates.jsonl</code>
  and <code>evaluation/story.json → runtime_comparison</code>; the judge figures read
  <code>evaluation/story.json → judge</code> and <code>evaluation/judge/judge_gates.jsonl</code>; cost and wall time are the
  values logged on each MLflow run. When an SDK experiment is added, append a row and re-date.
sections:
  - n: 1
    summary: >-
      A runtime comparison is only fair if both arms write the same capture and face the same gate.
  - n: 2
    summary: >-
      An SDK experiment is the pipeline's cycle with one prompt instead of four and a subprocess instead of a call.
  - n: 3
    summary: >-
      The runtime gate promoted sdk_v1; a second gate, the confidence judge, refused itself.
  - n: 4
    summary: >-
      Three rows: the baseline that won, the rewrite that lost, and the model swap that priced the confound.
  - n: 5
    summary: >-
      What shipped is a measurement and a second runtime, not a change to what the demo serves.
---

## Setup — one capture shape, so only the runtime differs

Three things existed first, so the comparison is of runtimes, not scoring paths.

| Piece | What it is | Path |
|---|---|---|
| **The runtime** | `--runtime agent_sdk`: one `ClaudeSDKClient` session per conversation; the report arrives in message one, each later question is one more message; the six calculator functions are its only tools, served over MCP as `cfq`; two attempts per turn, eight turns and 60k tokens per session at most | `src/convfinqa/backends/agent_sdk.py` · `config.py::sdk_model` |
| **The same capture** | `result_to_capture` writes exactly the shape `pipeline/runner.py::turn_events` fills — stage outputs, tool loop, tokens, latency — so the scorer, the panel and the gate cannot tell which runtime produced a row | `src/convfinqa/backends/agent_sdk.py` |
| **The distilled prompt** | `sdk-distil` asks the teacher to read v8's four prompts and write one: keep the turn-type criteria, the reference rules, the retrieval conventions and the calculator discipline; drop input-field descriptions and hand-off formats. Seven fixed sections, every tool and output key named, no value from any example. Four lineages of about 22k characters became one of 16.4k | `src/convfinqa/evalloop/sdk_teacher.py::SDK_DISTIL_PROMPT` · `src/convfinqa/prompts/sdk_v1.py` |
| **Its own lineage and alias** | `sdk_prompts` on the registry (`s1` from distil, `s2` from the SDK teacher), promoted to `sdk_champion` and never to `champion`, so serving is untouched | `evaluation/registry.json → sdk_prompts, aliases` · `src/convfinqa/evalloop/sdk_gate.py` |

- **Teacher on `claude-opus-5`** — a few dozen cases per cycle.
- **Session on `claude-sonnet-5`** — every turn of an eval pass, cost recorded per question.
- **Both via the Agent SDK on subscription billing** — a CLI subprocess the MLflow autologger cannot see; `evalloop/sdk.py` opens spans by hand and stores prompts by reference.

```bash
uv run convfinqa-evalloop sdk-distil --source-version v8 --new-version sdk_v1
uv run convfinqa-evalloop run --split test --version sdk_v1 --runtime agent_sdk
```

## One cycle — the pipeline's loop with one prompt instead of four

The pipeline's cycle with one prompt where there were four; reference campaign s01 (2026-09-05), capped at two experiments.

```bash
uv run convfinqa-evalloop cycle --campaign s01 --runtime agent_sdk
```

| # | Step | What differs from the pipeline's cycle | Writes | Library |
|---|---|---|---|---|
| 01 | Baseline | the distilled `sdk_v1` is gated against the pipeline champion `v8` first, as the runtime comparison | a `promote_sdk` event · `gates.jsonl` row `s01` | `evalloop/sdk_gate.py` |
| 02 | Run train | one session per conversation; refusals and rate limits are detected and recorded, never scored as wrong silently | `predictions/evalloop/sdk-evalloop-train100-sdk_v1·s1-….csv` | `claude-agent-sdk` · `backends/agent_sdk.py` |
| 03 | Diagnose | the SDK diagnosis prompt files each first-wrong case under a failure class sliced verbatim from the pipeline teacher's taxonomy, so the two arms cannot drift | rows in `diagnoses.jsonl` | `evalloop/sdk_teacher.py::SDK_DIAGNOSE_PROMPT` |
| 04 | Rewrite | the SDK teacher edits the one prompt inside tagged areas only, targeting the top failure class | `src/convfinqa/prompts/sdk_v2.py` · lineage `s2` · a row in `rewrites.jsonl` | `evalloop/sdk_teacher.py` |
| 05 | Run gate | `sdk_v2` on the same 349 questions | `sdk-evalloop-test100-sdk_v2·s2-….csv` | as 02 |
| 06 | Gate | the same rule: net positive AND one-sided clustered McNemar p < 0.05, against `sdk_v1` | `gates.jsonl` row `s01-e02` | `tracking/comparator.py` |
| 07 | Model swap | `run --sdk-model claude-haiku-4-5-20251001` scores the same prompt on another model — a plain scoring pass, no optimisation, no promotion | `…sdk_v1·s1-haiku-4-5-….csv` · `story.json → sdk_model_comparison` | `evalloop/cli.py` |

- **Skipped stages are failures of that stage** — over 349 questions `sdk_v1` recorded 3 stage skips and 5 inline-arithmetic answers, counted against it.
- **A second s01 experiment died at the rewrite step** — subscription session limit, no version written; on the ledger as a failed step, so the campaign shows one rewrite.

## Gate & promote — one session beat four agents by 8.9 points

The campaign gate with a different alias: `sdk_gate.py` pairs the arms, requires net positive and one-sided cluster-corrected McNemar p < 0.05, and writes `promote_sdk` on a pass.

<figure class="fig">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-turn-types.svg %}</div>
  <figcaption><b>The gain is entirely on program turns.</b> Lookups sat at 95.5% for both
  runtimes and moved by exactly zero; the +13.0 pp came from the multi-step turns, where a
  session keeps the plan and the arithmetic in one context instead of handing them across four
  boundaries. Source: <code>evaluation/story.json → runtime_comparison</code>.</figcaption>
</figure>

| Metric | pipeline · v8 | session · sdk_v1 |
|---|---|---|
| model · library | deepseek-v4-flash · pydantic-ai | claude-sonnet-5 · claude-agent-sdk |
| accuracy, 349 gate questions | **81.7%** (285) | **90.5%** (316) |
| number turns · n 111 | 95.5% | 95.5% |
| program turns · n 238 | 75.2% | 88.2% |
| program match (gold program) | 39.2% | 40.9% |
| triage · retriever recall · calculator | .923 · .768 · .751 | .974 · .786 · .882 |
| gate pass cost · wall | ~$1–2 · 344 s | $27.62 · 787 s |

The verdict, from `gates.jsonl`:

```text
s01  sdk_v1 vs v8  runtime  n_paired 349
  Δ +8.88pp (81.66% → 90.54%) · 38 fixed / 7 broken across 30 conversations
  one-sided clustered McNemar p 0.000286 · z 3.44 · 95% CI [+4.20, +13.71] · P(Δ>0) 1.00
  program turns  +13.03pp · 35 fixed / 4 broken · clustered p 0.00005
  number turns    +0.00pp ·  3 fixed / 3 broken · p 0.5              → PROMOTE to sdk_champion
```

What it establishes, and what it does not:

- **A win at equal optimisation effort** — one distilled prompt and one rejected rewrite against three campaigns and seven experiments; +8.9 points, all of it on program turns.
- **Not "one session beats four agents"** — model and architecture moved together; isolating the rest needs the pipeline on a Claude model, which needs an API endpoint this project does not use.
- **Not a human-level claim** — 90.5% is above the paper's 89.4% human-expert figure, but on 349 questions from the public train pool, with program match 40.9% against the paper's 86.3%.
- **A prompt the pipeline's loop wrote** — `sdk_v1` is v8 distilled; the campaigns produced the knowledge, the session was a better vessel.

### The judge that did not earn its gate

A second gate was built for the same runtime and refused itself. `judge_j1` is a
`claude-haiku-4-5` pass that never sees gold: it reads a finished turn's trace and returns a
confidence band from six named checks, so a low band could withhold an answer instead of
serving a wrong number.

<figure class="fig">
  <div class="dia-frame">{% include diagrams/chart/convfinqa-judge.svg %}</div>
  <figcaption><b>The band's interval contains the line it has to beat.</b> Withholding
  everything below the high band scores 91.5% on the 316 answers it releases, against 90.5% for
  releasing all 349 — and the 95% interval on that 91.5% runs 87.9 to 95.2. Source:
  <code>evaluation/story.json → judge</code>,
  <code>evaluation/judge/scores/</code>.</figcaption>
</figure>

| Metric | calibrate · n 304 | test · n 349 |
|---|---|---|
| release everything | 90.1% | 90.5% |
| high band only | 91.4% (267 released) | 91.5% (316 released) |
| 95% CI on the high band | [87.6, 94.3] | [87.9, 95.2] |
| failures caught / total | 7 / 30 | 6 / 33 |
| correct answers withheld | 30 | 27 |
| AUROC · ECE | 0.62 · 0.13 | 0.52 · 0.11 |
| coverage at the 1% error target | 0.7% | 0% |

- **Near chance on the split that counts** — AUROC 0.62 on calibrate did not survive to 0.52 on test.
- **The target is unreachable, not merely missed** — holding high-band error to 1% needs a threshold of 0.997 and releases almost nothing.
- **The second version was refused by its own rule** — `judge_j2`: *"candidate high band error 11.82% exceeds the 1% target"* (`evaluation/judge/judge_gates.jsonl`).
- **What shipped** — `JUDGE_MODE=advisory`: the band is shown as a caution beside the answer, and gates nothing.

## Cycle log — the baseline won, the rewrite lost, the swap priced it

Newest first; every row is paired on the same 349 gate questions.

| Date | Subject | Deliverable | Accuracy | Verdict |
|---|---|---|---|---|
| 2026-09-07 (judge gate) | judge_j2 · j2 | the SDK teacher's rewrite of the confidence prompt | high band error 11.82% against a 1% target | **rejected**, by its own rule |
| 2026-09-07 (judge s12/s13) | judge_j1 · j1 | a Haiku 4.5 confidence band over six named checks · `evalloop/judge.py` | high band 91.5% vs 90.5% releasing all · CI [87.9, 95.2] · AUROC 0.52 | **not adopted as a gate** · ships advisory |
| 2026-09-06 (model swap) | sdk_v1 on claude-haiku-4-5 | same prompt, cheaper model · $17.14 · 882 s | 90.5% → 87.4% · 7 fixed / 18 broken · p 0.051 · CI [−6.9, +0.3] | not significant; still +5.7 pp over the pipeline |
| 2026-09-05 (s01-e02) | sdk_v2 · s2 | the SDK teacher's rewrite for the calculator / wrong-format class · `prompts/sdk_v2.py` | 90.5% → 87.7% · 6 fixed / 16 broken · p 0.917 · CI [−7.3, +0.9] | **rejected** |
| 2026-09-05 (s01) | sdk_v1 · s1 | v8's four prompts distilled into one · `prompts/sdk_v1.py` | 81.7% → 90.5% · 38 fixed / 7 broken · p 0.0003 · CI [+4.2, +13.7] | **promoted** · `sdk_champion` |

The rejected rewrite:

- **Targeted the calculator class** — calculator flips 2 fixed / 4 broken; preprocess flips 2 fixed / 9 broken.
- **One section moved a different behaviour** — the pipeline's one-agent-per-experiment rule prevents exactly this; the single prompt gives it up.

Still open:

- **The loop is starving at 90%** — a 100-report train draw yields about 34 first-wrong cases, eight per stage; s01-e02's top failure class was 12 of 33 pooled cases, the next two 5 and 4.
- **A bigger draw is an unmade budget choice** — the pool holds 3,098 drawable reports; a 150-report draw (about 51 cases) restores parity with the pipeline's loop.
- **The architecture half of the confound** — unmeasured, for the reason above.
- **Cost** — a session gate pass is about fourteen times the pipeline's, 787 seconds against 344; the demo does not serve it, and nothing says when it should.

## What changed since — a second runtime, not a change to serving

Newest first.

- **2026-09-08 · the judge ships as advisory, not as a gate** — `evalloop/judge.py`, `evaluation/judge/`, the band rendered beside a served answer in `serving/sdk_turn.py`, and `JUDGE_MODE=advisory` as the default. PR #10, `ef10be5`.
- **2026-09-06 · the runtime experiment ships** — `backends/agent_sdk.py`, `evalloop/sdk.py`, `evalloop/sdk_teacher.py`, `evalloop/sdk_gate.py`, 74 tests across four files, the `Runtimes` admin page, `GET /eval/campaigns`, and `docs/optimization/agent-sdk.html` rebuilt from `story.json` by `convfinqa-evalloop story`. PR #9, `5af229e`.
- **2026-09-06 · model swap is a scoring pass** — `run --sdk-model <id>` never optimises or promotes; `story.sdk_model_comparison` pairs it against the reference model.
- **2026-09-05 · `sdk_champion` alias** — the SDK arm promotes to its own alias; serving reads only `champion`; the smoke test still asserts the served bundle is `v8`.
- **2026-09-05 · one taxonomy for both arms** — the SDK diagnosis prompt slices its failure classes from `teacher.TEACHER_PROMPT` at import time, no copy.

[Back to the loop that wrote the prompt →](/projects/convfinqa-agent/eval-loop/)
