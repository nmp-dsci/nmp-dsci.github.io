---
title: The eval loop
short: "The eval loop"
summary: >-
  How a gen-AI system gets better without getting worse — a versioned golden
  set, deterministic graders and an independent judge, a gate that blocks
  per-case regressions, then traces that feed the next version. Three systems
  running the same loop, including the two versions it refused to ship.
tldr: >-
  Golden set → graders + judge → gate → ship → traces → diagnose → next version → promote. Three systems, one loop — and the versions it refused: Data Pilot's cycle 002, ConvFinQA's v3_1 and its v4.
order: 1
kicker: "practice · evaluation"
systems: [data-pilot, convfinqa-agent, transcript-rag]
rubric: [evals, judge, gate, loop]
evidence_note: >-
  Every count on this page was re-run with the command beside it: the ConvFinQA
  rows on 2026-09-03 against the eval-loop release, the Data Pilot and Transcript
  RAG rows on 2026-08-30. Where an older write-up's number no longer reproduces,
  the number here is the one the repo gives today.
sections:
  - n: 1
    summary: >-
      Without a fixed set and a per-case comparison, "the model got better" is a
      story about the questions you remembered to ask.
  - n: 2
    summary: >-
      Eight steps turn a guess into an attributable cycle, and the gate that
      blocks per-case regressions is the one that says no.
  - n: 3
    summary: >-
      The same eight steps look different in each repo because the task decides
      what code can grade and what needs a judge.
  - n: 4
    summary: >-
      Every count was re-run against the repos with the command beside it, so the
      numbers are today's, including the loop's newest verdicts.
  - n: 5
    summary: >-
      Six ways an eval loop flatters itself, and what each system does to stop
      it.
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
5. **Gate on per-case flips, not on the average.** On a small, high-stakes pack
   any case going pass → fail blocks, whatever the headline did. On a larger
   split a single flip cannot carry a veto, so the gate becomes a paired test —
   more fixed than broken, with the exact p recorded on the verdict and every
   flip still listed by name.
6. **Commit the predictions**, so the gate re-scores offline with no API key and
   therefore runs on every pull request instead of occasionally.
7. **Trace what ships**, so the next diagnosis reads real failures.
8. **Promote through a contract**, and write up the cycles that failed as
   carefully as the ones that worked.

## In the three systems

### Data Pilot — goldens authored inside the product

The eval set is a product surface: you ask a question in chat, and the run you
liked is promoted to a golden — extraction SQL, sandbox objects and finished
report pages all captured, then exported to `evals/cases/*.yaml`.

The pack holds
**32 cases** across three NSW property datasets on a T1–T7 question ladder, 2
marked `ready` and 30 `draft`, so the scored pack is small and correct rather
than large and noisy.

Graders are layered and deterministic:

- **G1** — the values the SQL returned, not the SQL text.
- **G2** — the sandbox metrics.
- **G3** — the report shape.
- **G4** — ops: turns and latency, turns being the cost metric because it drives
  billed tokens.

Only the *insight* half of G3 needs a judge, and `agent/eval_judge.py` will not
grade its own family: with DeepSeek answering, Claude judges; with no
cross-family key configured it records `skipped` with a reason.

`agent/version.py` composes the build fingerprint — provider, model, and content
hashes over prompt sources, skills and knowledge. That is what makes a cycle
attributable: one change, one moving hash, one verdict.

| cycle | the change | what moved | gate |
|---|---|---|---|
| 001 | one knowledge page and nothing else — prompt and skills hashes identical across builds | pass rate 0.0 → 1.0, G1 0.34 → 1.0 | **PASS** |
| 002 | the same guidance moved into the system prompt | turns fell 24 → 20.5, the stated goal — and the rent case broke: pass rate 1.0 → 0.5, one regression | **FAIL**, reverted, not shipped |
| 003 | the guidance scoped to trend questions over documented marts | no regression | **PASS** |

**One change per cycle is what makes a verdict attributable, and 002 is the one
that had to be thrown away.** Source: `docs/evals/` in `data-qa-agent`.

### ConvFinQA Agent — prompts as versioned code

No judge here, and the write-up says why: answers are numbers and programs, so
exact and program accuracy are the honest metric. That is the task framing, not a
missing feature.

The first two cycles ran on the **200 conversations / 770 questions** corpus, with
prediction CSVs committed so `REUSE_CACHE=1 uv run convfinqa-eval` reproduces v1
**72.99%** → v2 **77.14%** with zero API calls. GEPA produced v2 over **1,964
metric calls**; the s7 harness then generated **39 rules** into v3_1, which scored
**76.23%** and was refused: 61 questions fixed, 68 broken, net negative. As a
headline that is a rounding error; as a flip count it is a decision.

Since 2026-09-02 the loop runs on a committed manifest instead — train 53 / test
54 / holdout 56 reports, drawn only from conversations neither optimiser saw — and
the eight steps look like this:

| step | in ConvFinQA |
|---|---|
| fix the set | `evaluation/splits/eval_loop_v1.json`: id lists are the truth, the seed is provenance |
| grade | numeric and program match per turn, a cascade flag, and a gold-derived per-agent panel at zero API calls |
| judge | none for scoring; a teacher on the pro tier *attributes* each first-wrong turn to one agent, checked by a 30-case κ sheet (unlabelled) |
| fingerprint | a bundle is a composition of four per-agent prompt hashes, `t3.p4.r3.c3` |
| gate | net positive on the shared test-split questions, McNemar p recorded, `--promote` refused on train evidence |
| commit predictions | every run's CSV under `evaluation/predictions/evalloop/` |
| trace | every LLM call a span in MLflow, run → report → question → stage |
| promote | an append-only history that keeps the refusals |

Two verdicts under the new contract. v4 changed only the retriever, improved
retriever recall on unseen data (.744 → .780) and was **refused** because the
calculator collapsed behind it. v5 changed only preprocess and was **promoted**:
77.5% → 79.7% on 187 test questions, 12 fixed against 8 broken, McNemar p 0.503
— not significant, and recorded as such on the verdict.

The gate runs on every pull request, offline. `python -m convfinqa.tracking.gate`
re-derives each committed CSV's `correct` column from its own answers against
gold — catching a CSV edited by hand — then checks the champion against its
floor from the CSV its promotion was decided on. Today: v1, v2, v3_1 at 770 rows
each, consistent; champion v5 79.68% against a 79.18% floor, **PASSED**.

[The loop in full, command by command →](/projects/convfinqa-agent/eval-loop/)

### Transcript RAG — labelled chunks, then an ablation

The golden set is 20 entries and the expensive part is the labels:
`expected_chunk_ids` name the exact chunks a good retriever must surface. Over a
seven-video corpus they break down two ways:

- **by question type** — 14 `local`, 4 `global`, 2 `temporal`.
- **by domain** — 7 property, 6 ai-coding, 6 career, 1 corpus.

Validation enforces the id shape and cross-references video ids both ways,
because a wrong label silently corrupts every recall number computed against it.

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

**Plain hybrid won, and adding a reranker on top of it *lost* recall.** HyDE and
contextual retrieval both scored below the plain semantic baseline. None of that
is knowable from a demo. Source: `evals/runs/ablation-20260801-051456.json`.

For the open-ended half: RAGAS (faithfulness, answer relevancy, context
precision) plus a `depth-v2` rubric weighting grounding 40% and depth 60% with a
hard cap — depth cannot rescue an ungrounded answer.

Runs record `judge_model` and set `self_graded` when generator and grader are
the same model. `rejudge`
re-scores a committed run under a new rubric while deliberately reusing the
stored grounding scores, so a ranking change is attributable to the rubric and
not to judge nondeterminism.

The CI `eval-gate` job runs `tests/evals/test_committed_runs.py` over the **16
committed snapshots**, recomputing each run's deterministic metrics from its
stored `retrieved_chunk_ids` against the *current* golden labels. That catches a
snapshot whose numbers no longer reconcile with its own ids, a golden-set edit
that silently invalidates a committed run, and a real drop below a floor.

## Evidence

Re-run in each system's own repo: ConvFinQA on 2026-09-03, the other two on 2026-08-30.

| claim | command | result |
|---|---|---|
| Data Pilot pack | `grep -c '^- case_key:' evals/cases/*.yaml` | 11 + 11 + 10 = **32**; 2 `ready`, 30 `draft` |
| Data Pilot cycles | `ls docs/evals/` | 001 PASS · 002 FAIL, not shipped · 003 PASS |
| ConvFinQA corpus | `convfinqa.data.loader` | 200 conversations, **770** questions, **309** never-seen |
| ConvFinQA splits | `python -c "import json;print(json.load(open('evaluation/splits/eval_loop_v1.json'))['stats'])"` | train 53 / test 54 / holdout 56 reports · 202 / 201 / 207 questions · holdout opened **0** |
| ConvFinQA registry | `cat evaluation/registry.json` | v1 0.72987 · v2 0.771429 · v3_1 0.762338 · v5 0.796791 (n=187) · champion `v5` |
| ConvFinQA gate | `python -m convfinqa.tracking.gate` | v1, v2, v3_1 at 770 rows consistent; champion v5 79.68% vs floor 79.18%; **PASSED** |
| ConvFinQA refusals | `evaluation/registry.json` history · `predictions/evalloop/*test10*` | v3_1 on 770: 68 pass→fail, 61 fail→pass · v4 on test-10: 79.4% → 67.6%, rolled back |
| ConvFinQA promotion | `evaluation/registry.json` history, last `promote` | v5 over v3_1 on test-50: 77.5% → 79.7%, 12 fixed / 8 broken, McNemar p 0.503 |
| GEPA | `evaluation/mlflow_snapshot.json` | 1,964 metric calls, 65 val evals, test 56.47 → 65.26 |
| s7 rules | `wc -l evaluation/diagnostics/rules_*_v3_1.jsonl` | 3 + 24 + 7 + 5 = **39** |
| teacher diagnoses | `wc -l evaluation/diagnostics/evalloop/diagnoses_v3_1_20260902_220936.jsonl` | **30** first-wrong turns: preprocess 14 · retriever 10 · calculator 3 · triage 3 · 4 `gold_suspect` |
| RAG goldens | `src/evals/golden_dataset.json` | 20 entries: 14 local / 4 global / 2 temporal |
| RAG ablation | `evals/runs/ablation-20260801-051456.json` | 8 configs × 20 entries |
| RAG snapshots + CI gate | `ls evals/runs/*.json` · `pytest tests/evals/test_committed_runs.py -q` | **16** snapshots · 20 passed in 0.09s |

Two earlier systems, not published as case studies, ran the same discipline.

- [v2v-prod-agent](https://github.com/nmp-dsci/v2v-prod-agent) grades a voice
  banking agent's red team on **bank state, not words** — nine scripted attacks
  driven by a model that is already fully compromised, each asserted with
  `test_the_bank_does_not_move[...]`, 9/9, deterministic, no API key.
- [CUAD-agent](https://github.com/nmp-dsci/CUAD-agent) scores 41 clause questions
  across 50 contracts for each of five retrieval context modes — 2,050
  predictions per mode, **10,250** in the grid — with retrieval measured
  separately from the answer, so a bad number can be attributed to one of them.

## Failure modes

**Self-grading.** A model asked to score its own family rewards its own phrasing.
Data Pilot's judge refuses the job and records `skipped`; Transcript RAG flags
`self_graded` on the run. The tempting alternative — grade anyway, footnote it —
produces a number nobody can use.

**A better average hiding per-case flips.** The failure the gate exists for, and
it fired three times here: cycle 002 improved the exact metric it targeted and
would have shipped on any headline rule; v3_1 fixed 61 and broke 68 for −0.91%;
v4 lifted the retriever's own recall on unseen data while the calculator behind
it fell from .618 to .500. All three are only visible as a list of case ids or
a per-agent panel, never in the average.

**Goldens without labels.** A golden that says only "this answer was good" cannot
tell you *why* retrieval failed. Chunk ids are the most expensive part of
Transcript RAG's set and the only reason its ablation means anything —
reference-free metrics cannot measure what retrieval missed.

**A "held-out" split that isn't.** ConvFinQA has two 60/40 splits over the same
200 conversations, both seeded 42 — one from `pandas.sample`, one from
`random.shuffle` as the DSPy backend actually performed it. They agree on only
**78 of 120** conversations. Same seed, same data, different partition.

Only the second supports a held-out claim, which is why `optimizer_split()`
lives in the data loader with that fact in its docstring instead of being
rediscovered later.

**A grader that measures the wrong thing.** Cycle 001's first attempt appeared to
regress: a better answer returned `avg_weekly_rent` while the grader was pinned
to `total_weekly_rent`, so G1 went to 0.0 on an improvement.

Fixing the grader changed the pack version, and `eval_compare.py` refuses to
compare across pack versions — the improvement had to be re-baselined and re-earned rather than
laundered across the boundary. That refusal is the defence against eval-tuning
theatre, and it costs a full re-run every time it fires.

**A scored gate that is a manual step.** Data Pilot's zero-LLM pack lint blocks
every merge; the *scored* comparison is a deliberate CD step, because scoring
needs a live stack and a key. That is an honest trade, not a solved problem — a
gate you have to remember to run is a gate that eventually is not run.
