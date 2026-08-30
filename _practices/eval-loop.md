---
title: The eval loop
summary: >-
  How a gen-AI system gets better without getting worse — a versioned golden
  set, deterministic graders and an independent judge, a gate that blocks
  per-case regressions, then traces that feed the next version. Three systems
  running the same loop, including the two versions it refused to ship.
tldr: >-
  Golden set → graders + judge → gate → ship → traces → diagnose → next version → promote. Three systems, one loop — and the versions it refused: Data Pilot's cycle 002 and ConvFinQA's v3.1.
order: 1
kicker: "practice · evaluation"
systems: [data-pilot, convfinqa-agent, transcript-rag]
rubric: [evals, judge, gate, loop]
evidence_note: >-
  Every count on this page was re-run against the three repos on 2026-08-30, with
  the command beside it. Where an older write-up's number no longer reproduces,
  the number here is the one the repo gives today.
---

## Problem

A prompt edit is a guess until something scores it. The feedback you get by hand
is the three questions you happened to try — and those are the three the edit was
written against. So the change ships, the demo still works, and a fourth question
that used to be right is now quietly wrong.

Averages hide this. A version can lose one point overall while fixing sixty-one
answers and breaking sixty-eight. Without a fixed set, a per-case comparison and
something that says *no*, "the model got better" is a story about the questions
you remembered to ask.

## Pattern

Eight steps. All three systems run all eight; they differ in how much of each is
automated.

1. **Fix the set** — goldens in version control beside the code, with a pack
   version, so a score attaches to a specification rather than to whatever was in
   the database that day.
2. **Grade deterministically wherever the answer has a right shape** — values,
   chunk ids, program accuracy. Code is free, repeatable, and cannot flatter
   itself.
3. **Judge only what code cannot score**, independently: a different model family
   from the one being graded, a frozen rubric hashed into the run, and a
   `skipped` record rather than a fake score when no independent judge exists.
4. **Fingerprint the build** — provider, model, a content hash per behaviour
   surface — so a base-versus-candidate run has exactly one moving part.
5. **Gate on per-case flips, not on the average.** Any case going pass → fail
   blocks, whatever the headline did.
6. **Commit the predictions**, so the gate re-scores offline with no API key and
   therefore runs on every pull request instead of occasionally.
7. **Trace what ships**, so the next diagnosis reads real failures.
8. **Promote through a contract**, and write up the cycles that failed as
   carefully as the ones that worked.

## In the three systems

### Data Pilot — goldens authored inside the product

The eval set is a product surface: you ask a question in chat, and the run you
liked is promoted to a golden — extraction SQL, sandbox objects and finished
report pages all captured, then exported to `evals/cases/*.yaml`. The pack holds
**32 cases** across three NSW property datasets on a T1–T7 question ladder, 2
marked `ready` and 30 `draft`, so the scored pack is small and correct rather
than large and noisy.

Graders are layered and deterministic: **G1** grades the values the SQL returned
(not the SQL text), **G2** the sandbox metrics, **G3** the report shape, **G4**
ops — turns and latency, turns being the cost metric because it drives billed
tokens. Only the *insight* half of G3 needs a judge, and `agent/eval_judge.py`
will not grade its own family: with DeepSeek answering, Claude judges; with no
cross-family key configured it records `skipped` with a reason.

`agent/version.py` composes the build fingerprint — provider, model, and content
hashes over prompt sources, skills and knowledge. That is what makes a cycle
attributable. Cycle 001 added one knowledge page and nothing else (prompt and
skills hashes identical across builds): pass rate 0.0 → 1.0, G1 0.34 → 1.0, gate
**PASS**. Cycle 002 put the same guidance in the system prompt: turns fell 24 →
20.5, which was the stated goal — and the rent case broke. Pass rate 1.0 → 0.5,
one regression, gate **FAIL**, reverted, not shipped. Cycle 003 scoped the
guidance to trend questions over documented marts and passed.

### ConvFinQA Agent — prompts as versioned code

No judge here, and the write-up says why: answers are numbers and programs, so
exact and program accuracy are the honest metric. That is the task framing, not a
missing feature.

The set is **200 conversations / 770 questions** and the prediction CSVs are
committed, so `REUSE_CACHE=1 uv run convfinqa-eval` reproduces v1 **72.99%** → v2
**77.14%** with zero API calls. Prompt versions are files — `prompts/v1.py`,
`v2.py`, `v3_1.py`. GEPA produced v2 over **1,964 metric calls** and 65 full
validation evaluations on a 108/12 train/val split, lifting the held-out
80-conversation test split 56.47 → 65.26.

Then the s7 harness — diagnose, propose, verify — read 95 failing cases and
generated **39 rules** (3 triage, 24 preprocess, 7 retriever, 5 calculator) into
v3.1. v3.1 scored **76.23%**, and the promotion contract refused it. Running the
comparator today:

```
promotable: False
reason: shared-question accuracy fell 77.1% → 76.2% (-0.91%)
regressions (pass→fail): 68 · improvements (fail→pass): 61
```

Thirty-nine rules of genuine diagnosis, sixty-one questions actually fixed, net
negative. As a headline that is a rounding error you would argue past; as a flip
count it is a decision.

The gate runs on every pull request, offline. `python -m convfinqa.tracking.gate`
re-derives each committed CSV's `correct` column from its own answers against
gold — catching a CSV edited by hand, the failure mode where every number
downstream becomes fiction — then checks the champion against its floor. Today:
three versions, 770 rows each, columns consistent, champion v2 77.14% against a
76.64% floor, **PASSED**.

### Transcript RAG — labelled chunks, then an ablation

The golden set is 20 entries and the expensive part is the labels:
`expected_chunk_ids` name the exact chunks a good retriever must surface. 14
`local`, 4 `global`, 2 `temporal`, across four domains (7 property, 6 ai-coding,
6 career, 1 corpus) over a seven-video corpus. Validation enforces the id shape
and cross-references video ids both ways, because a wrong label silently
corrupts every recall number computed against it.

Those labels buy a measurement with no LLM in it — recall@k, MRR, NDCG@10 — and
the eight-config ablation is why they were worth the effort:

| config | context recall | MRR | NDCG@10 |
|---|---|---|---|
| hybrid | **0.667** | **0.741** | **0.585** |
| multi-query | 0.635 | 0.601 | 0.515 |
| semantic + rerank | 0.626 | 0.713 | 0.571 |
| contextual + hybrid + rerank | 0.625 | 0.663 | 0.555 |
| semantic (baseline) | 0.618 | 0.661 | 0.535 |
| hybrid + rerank | 0.607 | 0.662 | 0.545 |
| HyDE | 0.591 | 0.669 | 0.525 |
| contextual | 0.545 | 0.707 | 0.516 |

Plain hybrid won. Adding a reranker on top of it *lost* recall. HyDE and
contextual retrieval both scored below the plain semantic baseline. None of that
is knowable from a demo.

For the open-ended half: RAGAS (faithfulness, answer relevancy, context
precision) plus a `depth-v2` rubric weighting grounding 40% and depth 60% with a
hard cap — depth cannot rescue an ungrounded answer. Runs record `judge_model`
and set `self_graded` when generator and grader are the same model. `rejudge`
re-scores a committed run under a new rubric while deliberately reusing the
stored grounding scores, so a ranking change is attributable to the rubric and
not to judge nondeterminism.

The CI `eval-gate` job runs `tests/evals/test_committed_runs.py` over the **16
committed snapshots**, recomputing each run's deterministic metrics from its
stored `retrieved_chunk_ids` against the *current* golden labels. That catches a
snapshot whose numbers no longer reconcile with its own ids, a golden-set edit
that silently invalidates a committed run, and a real drop below a floor.

## Evidence

Re-run on 2026-08-30, in each system's own repo.

| claim | command | result |
|---|---|---|
| Data Pilot pack | `grep -c '^- case_key:' evals/cases/*.yaml` | 11 + 11 + 10 = **32**; 2 `ready`, 30 `draft` |
| Data Pilot cycles | `ls docs/evals/` | 001 PASS · 002 FAIL, not shipped · 003 PASS |
| ConvFinQA set | `convfinqa.data.loader` | 200 conversations, **770** questions, **309** never-seen |
| ConvFinQA registry | `cat evaluation/registry.json` | v1 0.72987 · v2 0.771429 · v3_1 0.762338 · champion `v2` |
| ConvFinQA gate | `python -m convfinqa.tracking.gate` | 3 × 770 rows consistent; 77.14% vs floor 76.64%; **PASSED** |
| ConvFinQA refusal | `comparator.compare('v2','v3_1')` | not promotable; 68 pass→fail, 61 fail→pass |
| GEPA | `evaluation/mlflow_snapshot.json` | 1,964 metric calls, 65 val evals, test 56.47 → 65.26 |
| s7 rules | `wc -l evaluation/diagnostics/rules_*_v3_1.jsonl` | 3 + 24 + 7 + 5 = **39** |
| RAG goldens | `src/evals/golden_dataset.json` | 20 entries: 14 local / 4 global / 2 temporal |
| RAG ablation | `evals/runs/ablation-20260801-051456.json` | 8 configs × 20 entries |
| RAG snapshots + CI gate | `ls evals/runs/*.json` · `pytest tests/evals/test_committed_runs.py -q` | **16** snapshots · 20 passed in 0.09s |

Two earlier systems, not published as case studies, ran the same discipline.
[v2v-prod-agent](https://github.com/nmp-dsci/v2v-prod-agent) grades a voice
banking agent's red team on **bank state, not words** — nine scripted attacks
driven by a model that is already fully compromised, each asserted with
`test_the_bank_does_not_move[...]`, 9/9, deterministic, no API key.
[CUAD-agent](https://github.com/nmp-dsci/CUAD-agent) scores 41 clause questions
across 50 contracts for each of five retrieval context modes — 2,050 predictions
per mode, **10,250** in the grid — with retrieval measured separately from the
answer, so a bad number can be attributed to one of them.

## Failure modes

**Self-grading.** A model asked to score its own family rewards its own phrasing.
Data Pilot's judge refuses the job and records `skipped`; Transcript RAG flags
`self_graded` on the run. The tempting alternative — grade anyway, footnote it —
produces a number nobody can use.

**A better average hiding per-case flips.** The failure the gate exists for, and
it fired twice here: cycle 002 improved the exact metric it targeted and would
have shipped on any headline rule; v3.1 fixed 61 and broke 68 for −0.91%. Both
are only visible as a list of case ids.

**Goldens without labels.** A golden that says only "this answer was good" cannot
tell you *why* retrieval failed. Chunk ids are the most expensive part of
Transcript RAG's set and the only reason its ablation means anything —
reference-free metrics cannot measure what retrieval missed.

**A "held-out" split that isn't.** ConvFinQA has two 60/40 splits over the same
200 conversations, both seeded 42 — one from `pandas.sample`, one from
`random.shuffle` as the DSPy backend actually performed it. They agree on only
**78 of 120** conversations. Same seed, same data, different partition. Only the
second supports a held-out claim, which is why `optimizer_split()` lives in the
data loader with that fact in its docstring instead of being rediscovered later.

**A grader that measures the wrong thing.** Cycle 001's first attempt appeared to
regress: a better answer returned `avg_weekly_rent` while the grader was pinned
to `total_weekly_rent`, so G1 went to 0.0 on an improvement. Fixing the grader
changed the pack version, and `eval_compare.py` refuses to compare across pack
versions — the improvement had to be re-baselined and re-earned rather than
laundered across the boundary. That refusal is the defence against eval-tuning
theatre, and it costs a full re-run every time it fires.

**A scored gate that is a manual step.** Data Pilot's zero-LLM pack lint blocks
every merge; the *scored* comparison is a deliberate CD step, because scoring
needs a live stack and a key. That is an honest trade, not a solved problem — a
gate you have to remember to run is a gate that eventually is not run.
