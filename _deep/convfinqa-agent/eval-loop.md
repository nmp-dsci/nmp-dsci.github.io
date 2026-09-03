---
title: The ConvFinQA eval loop, in full
short: "eval loop · setup"
kicker: "deep dive · the eval loop"
project: convfinqa-agent
rubric: [evals, judge, gate, loop, trace]
summary: >-
  The setup behind the case study's §3: the tracking server, the sealed splits, one cycle command
  by command, the gate and the promotion contract, and the log of every cycle including the ones
  the loop refused. Maintained every cycle.
tldr: >-
  Compose up MLflow → make-splits → run train → diagnose → propose → run test → gate → promote →
  deploy, with the library at each step and the number each step produced.
updated: 2026-09-03
evidence_note: >-
  Every number on this page was re-run on 2026-09-03 in a clone of
  <code>ConvFinQA-agent</code> at <code>dc3efb2</code>, with the command beside it. The cycle
  log reads <code>evaluation/registry.json</code>; the split counts read
  <code>evaluation/splits/eval_loop_v1.json</code>; accuracies are recomputed from the committed
  CSVs under <code>evaluation/predictions/evalloop/</code> with pandas and no API key. When a
  cycle is added, append a row to the log and re-date this note.
sections:
  - n: 1
    summary: >-
      A cycle can only be trusted if the server, the manifest and the choke point exist before it starts.
  - n: 2
    summary: >-
      Eleven steps, each with the command, the file it writes and the library doing the work.
  - n: 3
    summary: >-
      The gate reads the unseen test split only, and records the statistic that says how much to believe it.
  - n: 4
    summary: >-
      Refusals are rows too, which is the only reason the promotions mean anything.
  - n: 5
    summary: >-
      The protocol changed three times in two days, and each change is dated and attributable.
---

## Setup

Four things exist before a cycle can run. Each is a file or a process the rest of the loop
reads, so a cycle cannot silently run without them.

| Piece | What it is | Command · path |
|---|---|---|
| **Tracking server** | MLflow 3.12 in docker compose, always on, SQLite store and server-side artifacts under `./.mlflow` | `docker compose up -d mlflow` · `docker-compose.yml` |
| **Split manifest** | Committed `report_id` lists: train 53 / test 54 / holdout 56 reports (202 / 201 / 207 questions), seed 2026, stratified on `has_type2_question`, drawn from the 2,777 train conversations minus the 260 GEPA and s7 saw | `uv run convfinqa-evalloop make-splits` · `evaluation/splits/eval_loop_v1.json` |
| **The choke point** | Every model built in one module: `deepseek-v4-flash` for the four agents, `deepseek-v4-pro` for the teacher; retry, the 120 s ceiling and the demo gate live there | `src/convfinqa/llm.py` · `backends/pydantic.py::lm_max` |
| **Per-agent lineage** | Each agent's prompt versions keyed by content hash with a human label (`t1…t3`, `p1…p4`, `r1…r4`, `c1…c3`) | `uv run convfinqa-evalloop backfill-prompts` · `evaluation/registry.json → agent_prompts` |

The manifest, not the seed, is the truth. The cautionary tale is in the same repo: two 60/40
splits both seeded 42 agree on only 78 of 120 conversations, because the code around the seed
changed. So the split holds actual id lists, and the seed is provenance.

Environment for a cycle:

```bash
export MLFLOW_TRACKING_URI=http://127.0.0.1:5000   # the compose service
export DEEPSEEK_API_KEY=...                        # never set in the demo image
```

## One cycle

Cycle 2 (2026-09-02) is the reference: 50 reports, v3_1 as baseline, v5 as the outcome. Each row
is one step of the ring in the case study's figure.

| # | Step | Command | Writes | Library |
|---|---|---|---|---|
| 01 | Manifest | `make-splits` (once) | `evaluation/splits/eval_loop_v1.json` | `evalloop/splits.py` · pandas |
| 02 | Run train | `run --split train --version v3_1 --n-reports 50` | one MLflow run · `predictions/evalloop/evalloop-train50-v3_1·t3p3r3c3-….csv` · a trace row per turn | pydantic-ai ×4 on flash · `evalloop/runner.py` |
| 03 | Trace | always on for the loop | spans run → report → question → agent stage → `Agent.run`, linked to the run | `mlflow.pydantic_ai.autolog()` · `tracking/tracing.py` |
| 04 | Score | inside the run | `correct`, `cascade`, `first_wrong_turn`, and the per-agent columns on every row | `evaluation/metrics.py` · `evalloop/stage_scores.py` |
| 05 | Diagnose | `diagnose --csv <train.csv> --version v3_1` | `diagnostics/evalloop/diagnoses_v3_1_….jsonl` (30 rows) · a run in `convfinqa-optimization` | pydantic-ai on pro · `evalloop/teacher.py` |
| 06 | Propose | `propose --diagnoses <jsonl> --base-version v3_1 --new-version v5` | `src/convfinqa/prompts/v5.py` · lineage entry `p4` | `evalloop/teacher.py` · `tracking/prompt_ledger.py` |
| 07 | Register | on the first run of `v5` | registry spec, composition `t3.p4.r3.c3`, MLflow prompt mirror | `tracking/registry.py` · `tracking/bundle.py` |
| 08 | Run test | `run --split test --version v3_1 --n-reports 50` and the same for `v5` | the two `test50` CSVs, 187 questions each | as 02 |
| 09 | Gate | `gate-targeted --target-agent preprocess --baseline-csv … --candidate-csv … --promote` | a `promote` event on the registry history with the full comparison | `tracking/comparator.py` · `evalloop/gate.py` |
| 10 | Deploy | merge to `main` | CI eval gate → OIDC → ECR → App Runner; smoke asserts served bundle == champion | GitHub Actions · Terraform · `scripts/demo_smoke.sh` |
| 11 | Observe | `MLFLOW_TRACING=1` for serving; `/metrics/production` | one trace row per turn, split by source | `tracking/traces.py` · `serving/routes/metrics.py` |

Three details that make the steps honest rather than merely automated.

**The runner threads the agent's own answers as history.** A wrong turn poisons the turns below
it exactly as it would in production, and the `cascade` flag marks those rows so the teacher
reads only each report's first wrong turn — later wrongs are consequence, not signal.

**The per-agent panel needs no judge.** The gold program plus the gold answer determine what
three of the four stages should have produced:

| Agent | Metric | How it is derived from gold |
|---|---|---|
| triage | `acc_triage_turn_type` | `gold_turn_type` is a column |
| preprocess | `acc_preprocess_skeleton` | the op skeleton of the planned program vs the gold program's; equivalent-but-different shapes read as misses, and the teacher adjudicates those |
| retriever | `retriever_operand_recall` | the gold program's numeric operands, minus constants and minus earlier gold answers, which come from history not the document |
| calculator | `acc_calculator_exec` · `calculator_acc_given_full_recall` | the gold answer, conditioned on retrieval having succeeded — what separates "wrong operand" from "wrong computation" |

**The teacher's taxonomy is frozen.** Ten named failure modes across the four agents, plus a
`new:<label>` escape so a gap is visible rather than forced into the nearest box. It also sets
`gold_suspect` when the gold answer itself looks wrong, which is what the Dataset page exists to
settle. Prior diagnoses are read back from MLflow before each pass, so the teacher extends rather
than repeats.

## Gate & promote

The rule, as the comparator states it: **net positive on the shared question set** — strictly
more questions fixed than broken — with the exact McNemar p over the discordant pairs recorded
on every verdict and flagged when the sample cannot support significance at α = 0.05. Flips no
longer veto on their own (they did until 2026-09-02); each is still listed by report and turn.

Two evidence rules sit on top of it:

- **Train runs optimise, unseen test runs promote.** Both `gate` and `gate-targeted` refuse
  `--promote` when either CSV came from the train split.
- **A targeted challenger must move its own agent.** `gate-targeted` requires the target agent's
  panel metric to improve on the shared test reports, and overall paired accuracy not to regress.

Three verdicts, from the registry history:

```text
v4  2026-09-02 10:05  promote  train-10 (44 q)  63.6% → 72.7%, 5 fixed / 1 broken, p 0.219
    2026-09-02 11:34  rollback by owner: promotion evidence must come from the unseen test split
    test-10 (34 q)    retriever recall .744 → .780, accuracy 79.4% → 67.6%  → refused
v5  2026-09-02 12:18  promote  test-50 (187 q)  77.5% → 79.7%, 12 fixed / 8 broken, p 0.503
                      preprocess skeleton .415 → .447 on the 123 program turns
```

The holdout is the release gate, not the promotion gate. `release --i-know-this-opens-the-holdout`
opens it once, for the current champion only, and appends the opening to the history so no later
version can claim it as unseen. It has been opened 0 times; the mechanism is tested with stubs.

The offline CI gate then holds the line on every pull request:

```text
$ uv run python -m convfinqa.tracking.gate
eval-gate: 3 committed version(s): v1, v2, v3_1
  ✓ v1: 770 rows, correctness column consistent
  ✓ v2: 770 rows, correctness column consistent
  ✓ v3_1: 770 rows, correctness column consistent
  ✓ champion v5: 79.68% (registered 79.68%, floor 79.18%)
eval-gate PASSED
```

Champions promoted through the loop are re-scored from their own test-split CSV; legacy
champions from the 770-row corpus CSV. Before 2026-09-03 the gate would have looked for a
770-row file that v5 never had.

## Cycle log

Newest first. Accuracies recomputed from the committed CSVs; verdicts from the registry history.

| Date | Cycle | Version · composition | Changed | Split · n | Result | Verdict |
|---|---|---|---|---|---|---|
| 2026-09-02 | 2 | v5 · t3.p4.r3.c3 | preprocess (5 merged rules from 14 of 30 diagnoses) | test-50 · 187 | 77.5% → 79.7% · 12 fixed / 8 broken · p 0.503 | **promoted** · champion |
| 2026-09-02 | 2 | v5 · t3.p4.r3.c3 | as above | train-50 · 193 | 66.8% → 70.5% · first-faults 30 → 27 | optimisation signal only |
| 2026-09-02 | 2 | teacher pass on v3_1 | — | train-50 · 30 first-wrong | preprocess 14 · retriever 10 · calculator 3 · triage 3 · 4 `gold_suspect` | 4 labels drifted from the frozen spelling; none used `new:` |
| 2026-09-02 | smoke | v4 · t3.p3.r4.c3 | retriever (3 of 6 diagnosed faults) | test-10 · 34 | recall .744 → .780 · accuracy 79.4% → 67.6% · calculator .618 → .500 | **refused** |
| 2026-09-02 | smoke | v4 · t3.p3.r4.c3 | as above | train-10 · 44 | 63.6% → 72.7% · 5 fixed / 1 broken · p 0.219 | promoted, then **rolled back** 11:34 (protocol change) |
| 2026-09-02 | 0 | v3_1 over v2 | — | train-10 · 44 | 54.5% → 61.4% · 5 fixed / 2 broken · p 0.453 | promoted under the first net-positive rule, before "test only" |
| 2026-08-28 | — | v2 · t2.p2.r2.c2 | GEPA (DSPy), full prompt set | corpus · 770 (never-seen 309) | 73.0% → 77.1% (77.7% never-seen) | champion by backfill |
| 2026-05 | — | v3_1 · t3.p3.r3.c3 | s7 harness, 39 verified rules | corpus · 770 | 77.1% → 76.2% · 61 fixed / 68 broken | refused under the flip-veto rule |

Two numbers the log keeps beside the promotion so it cannot be read as more than it is:
p = 0.503 means the 12-versus-8 split is what chance produces about half the time on 20
discordant pairs, and the per-agent panel moved on the target only (triage .925 → .920, retriever
recall .752 → .772, calculator .455 → .465, cascade rate .166 → .134).

What is still open, and why the loop is not yet trusted at scale:

- **Teacher trust.** `kappa --make` produced a 30-case sheet with the teacher's verdict hidden;
  the bar is κ ≥ 0.7 against a human's labels. The sheet is committed and unlabelled.
- **Holdout.** Sealed, never opened. The first release will be the first measurement.
- **Production failures joining train.** Designed in the plan, not built: serving traces carry
  the bundle id but nothing yet routes a failed live turn into the next teacher pass.
- **The console's accuracy tiles.** They read the 770-question corpus CSVs, so under a v5
  champion they still show v3_1's 76.2% and 73.5% and a "gate v2 pass" chip. The loop's runs
  are served at `/eval/loop-runs` (PR #7); the tiles have not been taught to read them.

## What changed since

Newest first. Each entry is a protocol change, not a code change, with what made it.

- **2026-09-03 · CI gate branches on champion source** — evalloop champions are floor-checked
  from their own test-split CSV, matched by exact version segment so `v5` cannot match `v50`;
  the gate no longer bails out when no legacy CSV exists. Commit `d149911`.
- **2026-09-03 · `--n-questions` run budget** — a per-run subsample that walks the manifest in
  order until the question budget is met; the committed split is never resized. Commit `4c9f741`.
- **2026-09-02 · promotion evidence must come from the unseen test split** — the owner's rollback
  of v4 (registry history 11:34); both gates refuse `--promote` on train CSVs since.
- **2026-09-02 · net-positive rule with McNemar p replaces the flip veto** — flips are listed on
  the verdict, no longer a veto; the p and a significance flag are recorded. `tracking/comparator.py`.
- **2026-09-02 · teacher taxonomy frozen** — ten named modes plus `new:`; open-coded from the
  first battle-test cycles. `evalloop/teacher.py::TEACHER_PROMPT`.
- **2026-09-02 · the teacher is DeepSeek pro via pydantic-ai, not the Agent SDK** — the s04 plan
  proposed one Opus session per wrong answer on the Claude Agent SDK; what shipped is
  `lm_max()` behind the same choke point as everything else. The page follows the code.

Libraries in the loop, for the record:

| Library | Trusted with |
|---|---|
| pydantic-ai ≥ 0.2 | the four typed agents, the teacher, the prompt-writer |
| MLflow ≥ 3.11 (server v3.12.0) | runs, tracing via autolog, prompt registry and aliases, teacher memory |
| pandas | scoring, the panel, the paired comparison; McNemar exact p is implemented in the comparator |
| Logfire · tenacity | serving spans on a separate provider; retry with jitter in the choke point |
| FastAPI · React 18 + Vite | the console, seven admin pages read-only in demo |
| GitHub Actions · Terraform · App Runner | the offline gate, the OIDC deploy, the smoke test |
| DSPy / GEPA · the s7 harness | produced v2 and v3_1; no longer the promotion path; iteration logs archived |
