---
title: The eval loop
short: "The eval loop"
summary: >-
  A versioned golden set, deterministic graders and an independent judge, a gate
  that blocks per-case regressions, then traces that feed the next version.
  Three systems run the same loop, including the versions it refused to ship.
tldr: >-
  Golden set → graders + judge → gate → ship → traces → diagnose → next version → promote. Three systems, one loop — and the versions it refused: Data Pilot's cycle 002, ConvFinQA's v3_1, its v4 and seven of its nine campaign challengers.
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
      Eight steps make a cycle attributable, and the gate that blocks per-case
      regressions is the one that says no.
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

A prompt edit is a guess until something scores it.

- **Hand feedback** — the three questions you tried, which are the three the edit was written against.
- **The quiet regression** — the demo still works; a fourth question that used to be right is now wrong.
- **Averages hide it** — lose one point overall while fixing sixty-one answers and breaking sixty-eight.
- **No fixed set, no per-case comparison, nothing that says *no*** — "the model got better" is a story about the questions you remembered to ask.

## Pattern

Eight steps; all three systems run all eight, differing only in how much is automated.

1. **Fix the set** — goldens in version control beside the code, with a pack version; a score attaches to a specification, not that day's database.
2. **Grade deterministically** where the answer has a right shape — values, chunk ids, program accuracy. Code is free, repeatable, and cannot flatter itself.
3. **Judge only what code cannot score** — a different model family, a frozen rubric hashed into the run, a `skipped` record rather than a fake score.
4. **Fingerprint the build** — provider, model, a content hash per behaviour surface; base-versus-candidate has one moving part.
5. **Gate on per-case flips, not the average** — small high-stakes pack: any pass → fail blocks. Larger split: a paired test, more fixed than broken, exact p on the verdict, every flip named.
6. **Commit the predictions** — the gate re-scores offline with no API key, so it runs on every pull request.
7. **Trace what ships** — the next diagnosis reads real failures.
8. **Promote through a contract** — and write up the failed cycles as carefully as the successes.

## In the three systems

### Data Pilot — goldens authored inside the product

- **Goldens from chat** — promote the run you liked; extraction SQL, sandbox objects and report pages captured, exported to `evals/cases/*.yaml`.
- **Pack** — **32 cases**, three NSW property datasets, a T1–T7 ladder; 2 `ready`, 30 `draft`. Small and correct over large and noisy.
- **G1** — the values the SQL returned, not the SQL text.
- **G2** — the sandbox metrics.
- **G3** — the report shape; only its *insight* half needs a judge.
- **G4** — ops: turns and latency; turns drive billed tokens, so turns are the cost metric.
- **Judge** — `agent/eval_judge.py` never grades its own family: DeepSeek answers, Claude judges; no cross-family key means `skipped` with a reason.
- **Fingerprint** — `agent/version.py`: provider, model, content hashes over prompt sources, skills and knowledge. One change, one moving hash, one verdict.

| cycle | the change | what moved | gate |
|---|---|---|---|
| 001 | one knowledge page and nothing else — prompt and skills hashes identical across builds | pass rate 0.0 → 1.0, G1 0.34 → 1.0 | **PASS** |
| 002 | the same guidance moved into the system prompt | turns fell 24 → 20.5, the stated goal — and the rent case broke: pass rate 1.0 → 0.5, one regression | **FAIL**, reverted, not shipped |
| 003 | the guidance scoped to trend questions over documented marts | no regression | **PASS** |

**One change per cycle makes a verdict attributable; 002 is the one thrown away.** Source: `docs/evals/` in `data-qa-agent`.

### ConvFinQA Agent — prompts as versioned code

- **No judge** — answers are numbers and programs, so exact and program accuracy are the honest metric. Task framing, not a missing feature.
- **Cycles one and two** — the **200 conversations / 770 questions** corpus; `REUSE_CACHE=1 uv run convfinqa-eval` reproduces v1 **72.99%** → v2 **77.14%** from committed CSVs, zero API calls.
- **GEPA** — v2 over **1,964 metric calls**.
- **s7 harness** — **39 rules** into v3_1, **76.23%**, refused: 61 fixed, 68 broken, net negative. A rounding error as a headline; a decision as a flip count.
- **Since 2026-09-03** — a committed manifest: train 100 / gate 100 reports (368 / 349 questions), from conversations neither optimiser saw; holdout reserved.

| step | in ConvFinQA |
|---|---|
| fix the set | `evaluation/splits/eval_loop_v2.json`: id lists are the truth, the seed is provenance; the gate split is sized by a power calculation |
| grade | numeric and program match per turn, a cascade flag, and a gold-derived per-agent panel at zero API calls |
| judge | none for scoring; a teacher on Opus 5 through the Agent SDK *attributes* each first-wrong turn to one agent, checked by a 30-case κ sheet (unlabelled) |
| fingerprint | a bundle is a composition of four per-agent prompt hashes, `t2.p2.r5.c2` |
| gate | net positive on the shared gate questions *and* one-sided cluster-corrected McNemar p < 0.05, a bootstrap CI on every verdict, `--promote` refused on train evidence |
| commit predictions | every run's CSV under `evaluation/predictions/evalloop/` |
| trace | every LLM call a span in MLflow, run → report → question → stage |
| promote | an append-only history that keeps the refusals |

- **Nine verdicts** under the current contract, all paired on the same 349 gate questions.
- **v8** — retriever only, **promoted**: 77.1% → 81.7%, 34 fixed against 18 broken, one-sided clustered McNemar p 0.040.
- **Seven refused** — each moved the number, v11's +1.4 pp among them.
- **`sdk_v1`** — the runtime arm, promoted to its own alias at 90.5%, p 0.0003.
- **Rolled back 2026-09-03** — v3_1, v4 and v5 under the stricter rule; v5's p under it is 0.207.
- **The gate on every PR, offline** — `python -m convfinqa.tracking.gate` re-derives each committed CSV's `correct` column against gold (catching a hand-edited CSV), then checks the champion against the floor from its promotion CSV.
- **Today** — v1, v2, v3_1 at 770 rows, consistent; v8 re-scored 81.66% against a −0.5% floor, because campaign promotions leave registry metrics empty. Real re-score; open defect.

[The loop in full, command by command →](/projects/convfinqa-agent/eval-loop/)

### Transcript RAG — labelled chunks, then an ablation

- **Golden set** — 20 entries over a seven-video corpus; the expensive part is `expected_chunk_ids`, the exact chunks a good retriever must surface.
- **By question type** — 14 `local`, 4 `global`, 2 `temporal`.
- **By domain** — 7 property, 6 ai-coding, 6 career, 1 corpus.
- **Validation** — id shape enforced, video ids cross-referenced both ways; a wrong label silently corrupts every recall number.
- **No LLM in the measurement** — recall@k, MRR, NDCG@10; the eight-config ablation is why the labels were worth it.

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

**Plain hybrid won; a reranker on top of it *lost* recall.** HyDE and contextual both scored below the plain semantic baseline; none of that is knowable from a demo.

Source: `evals/runs/ablation-20260801-051456.json`.

- **The open-ended half** — RAGAS (faithfulness, answer relevancy, context precision) plus `depth-v2`: grounding 40%, depth 60%, a hard cap so depth cannot rescue an ungrounded answer.
- **Provenance** — runs record `judge_model` and set `self_graded` when generator and grader match.
- **`rejudge`** — re-scores a committed run under a new rubric, reusing the stored grounding scores; a ranking change is the rubric's, not judge nondeterminism.
- **CI `eval-gate`** — `tests/evals/test_committed_runs.py` over the **16 committed snapshots**, recomputing deterministic metrics from stored `retrieved_chunk_ids` against the *current* labels.
- **What it catches** — a snapshot that no longer reconciles with its own ids, a golden-set edit that invalidates a committed run, a real drop below a floor.

## Evidence

Re-run in each system's own repo: ConvFinQA on 2026-09-06, the other two on 2026-08-30.

| claim | command | result |
|---|---|---|
| Data Pilot pack | `grep -c '^- case_key:' evals/cases/*.yaml` | 11 + 11 + 10 = **32**; 2 `ready`, 30 `draft` |
| Data Pilot cycles | `ls docs/evals/` | 001 PASS · 002 FAIL, not shipped · 003 PASS |
| ConvFinQA corpus | `convfinqa.data.loader` | 200 conversations, **770** questions, **309** never-seen |
| ConvFinQA splits | `python -c "import json;print(json.load(open('evaluation/splits/eval_loop_v2.json'))['stats'])"` | train 100 / gate 100 reports · 368 / 349 questions · holdout reserved, opened **0** |
| ConvFinQA registry | `cat evaluation/registry.json` | v1 0.72987 · v2 0.771429 · v3_1 0.762338 · v5 0.796791 (n=187) · aliases champion `v8`, sdk_champion `sdk_v1` |
| ConvFinQA gate | `python -m convfinqa.tracking.gate` | v1, v2, v3_1 at 770 rows consistent; champion v8 81.66% vs floor −0.50% (empty registry metrics); **PASSED**, vacuously |
| ConvFinQA refusals | `evaluation/diagnostics/evalloop/gates.jsonl` | 7 of 9 campaign verdicts rejected: v6, v7, v9, v10, v11, v12, sdk_v2 · 3 champions rolled back on 2026-09-03 |
| ConvFinQA promotion | `evaluation/registry.json` history, last `promote` | v8 over v2 on the 349-question gate split: 77.1% → 81.7%, 34 fixed / 18 broken, one-sided clustered McNemar p 0.040 |
| GEPA | `evaluation/mlflow_snapshot.json` | 1,964 metric calls, 65 val evals, test 56.47 → 65.26 |
| s7 rules | `wc -l evaluation/diagnostics/rules_*_v3_1.jsonl` | 3 + 24 + 7 + 5 = **39** |
| teacher diagnoses | `wc -l evaluation/diagnostics/evalloop/diagnoses.jsonl` | **440** first-wrong cases on the ledger; 13 rewrites; 9 gate verdicts |
| RAG goldens | `src/evals/golden_dataset.json` | 20 entries: 14 local / 4 global / 2 temporal |
| RAG ablation | `evals/runs/ablation-20260801-051456.json` | 8 configs × 20 entries |
| RAG snapshots + CI gate | `ls evals/runs/*.json` · `pytest tests/evals/test_committed_runs.py -q` | **16** snapshots · 20 passed in 0.09s |

Two earlier systems, not published as case studies, ran the same discipline.

- **[v2v-prod-agent](https://github.com/nmp-dsci/v2v-prod-agent)** — a voice banking agent's red team graded on **bank state, not words**: nine scripted attacks from an already-compromised model, each asserted with `test_the_bank_does_not_move[...]`, 9/9, deterministic, no API key.
- **[CUAD-agent](https://github.com/nmp-dsci/CUAD-agent)** — 41 clause questions × 50 contracts × five retrieval context modes: 2,050 predictions per mode, **10,250** in the grid; retrieval scored apart from the answer, so a bad number attributes to one of them.

## Failure modes

- **Self-grading** — a model scoring its own family rewards its own phrasing. Fix: Data Pilot's judge refuses and records `skipped`; Transcript RAG flags `self_graded`. Grade-and-footnote gives a number nobody can use.
- **A better average hiding per-case flips** — fired three times: 002 improved its target metric and would have shipped on any headline rule; v3_1 fixed 61, broke 68, −0.91%; v4 lifted the retriever's unseen recall while the calculator fell .618 → .500. Fix: a list of case ids or a per-agent panel, never the average.
- **Goldens without labels** — "this answer was good" cannot say *why* retrieval failed. Fix: chunk ids, Transcript RAG's costliest labels and the only reason its ablation means anything; reference-free metrics cannot measure what retrieval missed.
- **A "held-out" split that isn't** — two 60/40 splits over the same 200 conversations, both seeded 42, `pandas.sample` versus `random.shuffle` as the DSPy backend performed it; they agree on only **78 of 120**. Fix: only the second supports a held-out claim, so `optimizer_split()` lives in the data loader with that fact in its docstring.
- **A grader that measures the wrong thing** — cycle 001's first attempt returned `avg_weekly_rent` against a grader pinned to `total_weekly_rent`; G1 hit 0.0 on an improvement. Fix: the grader fix bumped the pack version, and `eval_compare.py` refuses to compare across pack versions — re-baselined and re-earned, a full re-run each time it fires.
- **A scored gate that is a manual step** — Data Pilot's zero-LLM pack lint blocks every merge; the *scored* comparison is a deliberate CD step, needing a live stack and a key. An honest trade, not a solved problem: a gate you must remember to run is eventually not run.
