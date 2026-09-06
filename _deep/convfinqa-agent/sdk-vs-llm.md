---
title: One Claude session against four agents
short: "sdk vs llm · runtime test"
kicker: "deep dive · the runtime test"
project: convfinqa-agent
rubric: [evals, gate, loop, cost]
summary: >-
  The runtime experiment behind the case study's slides 2 and 4: the Claude Agent SDK runtime,
  the distillation of v8's four prompts into one, the same gate on the same 349 questions, the
  by-turn-type split, the model swap, and what the result does and does not establish.
tldr: >-
  sdk-distil v8 → sdk_v1 → run both arms on the gate split → runtime gate → sdk_champion, then
  the SDK loop's own experiment (rejected) and a model swap (Haiku 4.5, −3.2 pp, not significant).
updated: 2026-09-06
evidence_note: >-
  Every number on this page was re-run on 2026-09-06 in a clone of
  <code>ConvFinQA-agent</code> at <code>5af229e</code>. The two arms' accuracies are recomputed
  with pandas from the committed CSVs under <code>evaluation/predictions/evalloop/</code>
  (<code>evalloop-test100-v8·…</code>, <code>sdk-evalloop-test100-sdk_v1·…</code> and the
  <code>…haiku-4-5…</code> run); the verdicts read <code>evaluation/diagnostics/evalloop/gates.jsonl</code>
  and <code>evaluation/story.json → runtime_comparison</code>; cost and wall time are the
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
      The runtime gate promoted sdk_v1 to its own alias, and the case for it is stated with both caveats.
  - n: 4
    summary: >-
      Three rows: the baseline that won, the rewrite that lost, and the model swap that priced the confound.
  - n: 5
    summary: >-
      What shipped is a measurement and a second runtime, not a change to what the demo serves.
---

## Setup

Three things had to exist before one Claude session could be compared with four agents, and each
was built so the comparison is of runtimes rather than of two scoring paths.

| Piece | What it is | Path |
|---|---|---|
| **The runtime** | `--runtime agent_sdk`: one `ClaudeSDKClient` session per conversation; the report arrives in message one, each later question is one more message; the six calculator functions are its only tools, served over MCP as `cfq`; two attempts per turn, eight turns and 60k tokens per session at most | `src/convfinqa/backends/agent_sdk.py` · `config.py::sdk_model` |
| **The same capture** | `result_to_capture` writes exactly the shape `pipeline/runner.py::turn_events` fills — stage outputs, tool loop, tokens, latency — so the scorer, the panel and the gate cannot tell which runtime produced a row | `src/convfinqa/backends/agent_sdk.py` |
| **The distilled prompt** | `sdk-distil` asks the teacher to read v8's four prompts and write one: keep the turn-type criteria, the reference rules, the retrieval conventions and the calculator discipline; drop input-field descriptions and hand-off formats. Seven fixed sections, every tool and output key named, no value from any example. Four lineages of about 22k characters became one of 16.4k | `src/convfinqa/evalloop/sdk_teacher.py::SDK_DISTIL_PROMPT` · `src/convfinqa/prompts/sdk_v1.py` |
| **Its own lineage and alias** | `sdk_prompts` on the registry (`s1` from distil, `s2` from the SDK teacher), promoted to `sdk_champion` and never to `champion`, so serving is untouched | `evaluation/registry.json → sdk_prompts, aliases` · `src/convfinqa/evalloop/sdk_gate.py` |

The model choice is deliberate and asymmetric. The teacher judges a few dozen cases per cycle and
runs on `claude-opus-5`; the session runs on every turn of an eval pass, so it runs on
`claude-sonnet-5` and its cost is recorded per question. Both go through the Agent SDK on
subscription billing, and the SDK calls are a CLI subprocess the MLflow autologger cannot see, so
`evalloop/sdk.py` opens their spans by hand and stores prompts by reference.

```bash
uv run convfinqa-evalloop sdk-distil --source-version v8 --new-version sdk_v1
uv run convfinqa-evalloop run --split test --version sdk_v1 --runtime agent_sdk
```

## One cycle

The SDK arm runs the pipeline's cycle with one prompt where there were four. Campaign s01
(2026-09-05) is the reference; it is capped at two experiments.

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

Two details that keep the SDK arm honest.

**Skipped stages are failures of that stage.** Across 349 questions `sdk_v1` recorded 3 stage
skips and 5 inline-arithmetic answers — turns where the session answered without calling a
tool. They are counted against it, not excused as style.

**A second s01 experiment died at the rewrite step** on a subscription session limit and wrote
no version. It is on the ledger as a failed step, which is why the campaign shows one rewrite
rather than two.

## Gate & promote

The runtime gate is the campaign gate with a different alias at the end. `sdk_gate.py` pairs the
two arms on the shared gate questions, requires net positive and a one-sided cluster-corrected
McNemar p below 0.05, and on a pass writes `promote_sdk` with the full comparison.

| | pipeline · v8 | session · sdk_v1 |
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

What that establishes, and what it does not — the repo's own write-up says both, and so does
this page:

- **A win at equal optimisation effort.** The session had one distilled prompt and one rejected
  rewrite; the pipeline had three campaigns and seven experiments. On the same questions the
  session is 8.9 points better, and the whole gain is on program turns.
- **Not "one session beats four agents".** Model and architecture moved in the same step. The
  model swap below prices part of that; isolating the rest needs the four-agent pipeline on a
  Claude model, which needs an API endpoint this project deliberately does not use.
- **Not a human-level claim.** 90.5% sits above the paper's 89.4% human-expert figure, but on
  a 349-question split drawn from the public train pool, and program match is 40.9% against the
  paper's 86.3%: it reaches the right numbers without reproducing the gold programs.
- **A prompt the pipeline's loop wrote.** `sdk_v1` is v8 distilled. The campaigns produced the
  knowledge; the single session was a better vessel for it.

## Cycle log

Newest first. Every row is paired on the same 349 gate questions.

| Date | Subject | Deliverable | Accuracy | Verdict |
|---|---|---|---|---|
| 2026-09-06 (model swap) | sdk_v1 on claude-haiku-4-5 | same prompt, cheaper model · $17.14 · 882 s | 90.5% → 87.4% · 7 fixed / 18 broken · p 0.051 · CI [−6.9, +0.3] | not significant; still +5.7 pp over the pipeline |
| 2026-09-05 (s01-e02) | sdk_v2 · s2 | the SDK teacher's rewrite for the calculator / wrong-format class · `prompts/sdk_v2.py` | 90.5% → 87.7% · 6 fixed / 16 broken · p 0.917 · CI [−7.3, +0.9] | **rejected** |
| 2026-09-05 (s01) | sdk_v1 · s1 | v8's four prompts distilled into one · `prompts/sdk_v1.py` | 81.7% → 90.5% · 38 fixed / 7 broken · p 0.0003 · CI [+4.2, +13.7] | **promoted** · `sdk_champion` |

The rejected rewrite is instructive. It targeted the calculator class and the calculator's flips
were 2 fixed / 4 broken, but preprocess flips were 2 fixed / 9 broken: an edit to one section of a
single prompt moved a different behaviour. The pipeline's one-agent-per-experiment rule exists
precisely so that cannot happen, and the single prompt gives it up.

What is still open:

- **The loop is starving at 90%.** A 100-report train draw yields about 34 first-wrong cases,
  eight per stage; the top failure class in s01-e02 was 12 of 33 pooled cases, the next two 5
  and 4. The pool holds 3,098 drawable reports, so a 150-report draw (about 51 cases) would
  restore parity with what the pipeline's loop had. That is a budget choice, not yet made.
- **The architecture half of the confound.** Unmeasured, for the reason above.
- **Cost.** A gate pass on the session is about fourteen times the pipeline's, and 787 seconds
  against 344. The demo does not serve it, and nothing yet says when it should.

## What changed since

Newest first.

- **2026-09-06 · the runtime experiment ships** — `backends/agent_sdk.py`, `evalloop/sdk.py`,
  `evalloop/sdk_teacher.py`, `evalloop/sdk_gate.py`, 74 tests across four files, the
  `Runtimes` admin page and `GET /eval/campaigns`, and `docs/optimization/agent-sdk.html`
  rebuilt from `story.json` by `convfinqa-evalloop story`. PR #9, `5af229e`.
- **2026-09-06 · model swap recorded as a scoring pass** — `run --sdk-model <id>` never
  optimises or promotes; `story.sdk_model_comparison` pairs it against the reference model.
- **2026-09-05 · `sdk_champion` alias** — the SDK arm promotes to its own alias and serving
  reads only `champion`; the smoke test still asserts the served bundle is `v8`.
- **2026-09-05 · one taxonomy for both arms** — the SDK diagnosis prompt slices its failure
  classes from `teacher.TEACHER_PROMPT` at import time rather than carrying a copy.

[Back to the loop that wrote the prompt →](/projects/convfinqa-agent/eval-loop/)
