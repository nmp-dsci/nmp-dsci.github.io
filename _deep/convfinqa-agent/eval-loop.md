---
title: The ConvFinQA eval loop, in full
short: "eval loop · MLOps"
kicker: "deep dive · the eval loop"
project: convfinqa-agent
rubric: [evals, judge, gate, loop, trace]
summary: >-
  The MLOps behind the case study's §3: the tracking server, the fixed splits, one experiment
  command by command, the significance gate and the promotion contract. The log holds every
  verdict, including the seven refused and the three champions taken back.
tldr: >-
  Compose up MLflow → make-splits → cycle (run train → diagnose → rewrite → run gate → gate →
  decide) → deploy, with the library at each step and the number each step produced.
updated: 2026-09-06
evidence_note: >-
  Every number on this page was re-run on 2026-09-06 in a clone of
  <code>ConvFinQA-agent</code> at <code>5af229e</code>, with the command beside it. The cycle
  log reads <code>evaluation/diagnostics/evalloop/gates.jsonl</code> and the history in
  <code>evaluation/registry.json</code>; the split counts read
  <code>evaluation/splits/eval_loop_v2.json</code>; accuracies are recomputed from the committed
  CSVs under <code>evaluation/predictions/evalloop/</code> with pandas and no API key. When an
  experiment is added, append a row to the log and re-date this note.
sections:
  - n: 1
    summary: >-
      The server, the manifest and the choke point exist before a cycle starts, or it cannot run.
  - n: 2
    summary: >-
      One command runs an experiment; each step names the file it writes and the library doing the work.
  - n: 3
    summary: >-
      The gate reads the fixed unseen split only, and promotes only on a cluster-corrected significant gain.
  - n: 4
    summary: >-
      Refusals and rollbacks are rows too, which is what makes the promotions mean anything.
  - n: 5
    summary: >-
      The protocol got stricter three times in four days, each change dated and attributable.
---

## Setup — a fixed unseen split, drawn once and committed

Four things exist before an experiment can run.

| Piece | What it is | Command · path |
|---|---|---|
| **Tracking server** | MLflow 3.12 in docker compose, always on, SQLite store and server-side artifacts under `./.mlflow` | `docker compose up -d mlflow` · `docker-compose.yml` |
| **Split manifest** | Committed `report_id` lists: train 100 reports (368 questions) and a fixed gate split of 100 reports (349 questions), seed 2026, stratified on `has_type2_question`, drawn from the 2,777 train conversations minus the 260 GEPA and s7 saw; the holdout is the untouched remainder, cut only for a confirmatory run | `uv run convfinqa-evalloop make-splits` · `evaluation/splits/eval_loop_v2.json` |
| **The choke point** | Every model built in one module: `deepseek-v4-flash` for the four agents, `claude-opus-5` through the Agent SDK for the teacher and prompt-writer (with `setting_sources=[]`), `claude-sonnet-5` for the single-session runtime; retry, the 120 s ceiling and the demo gate live there | `src/convfinqa/llm.py` · `evalloop/sdk.py` |
| **Per-agent lineage** | Each agent's prompt versions keyed by content hash with a human label (`t1…t3`, `p1…p4`, `r1…r5`, `c1…c3`); a bundle is the composition, `t2.p2.r5.c2` for v8 | `uv run convfinqa-evalloop backfill-prompts` · `evaluation/registry.json → agent_prompts` |

- **The manifest, not the seed, is the truth** — two 60/40 splits both seeded 42 agree on only 78 of 120 conversations; the code around the seed changed.
- **Sized by power, not budget** — 349 paired questions detect about 4.7 points one-sided at α 0.05, the size one rewrite produces.
- **Fixed for a whole campaign** — a smaller split makes every verdict a coin toss.

Environment for a cycle:

```bash
export MLFLOW_TRACKING_URI=http://127.0.0.1:5000   # the compose service
export DEEPSEEK_API_KEY=...                        # the four agents; never set in the demo image
claude auth status                                 # the teacher runs on the Claude subscription
```

## One cycle — the teacher blames one agent, and only that prompt moves

Reference: campaign c01, experiment 3 (2026-09-03), v2 → v8, one command.

```bash
uv run convfinqa-evalloop cycle --campaign c01 --baseline v2
```

| # | Step | Command | Writes | Library |
|---|---|---|---|---|
| 01 | Manifest | `make-splits` (once per campaign) | `evaluation/splits/eval_loop_v2.json` | `evalloop/splits.py` · pandas |
| 02 | Run train | `run --split train --version v2` | one MLflow run · `predictions/evalloop/evalloop-train100-v2·….csv` · a trace row per turn | pydantic-ai ×4 on flash · `evalloop/runner.py` |
| 03 | Trace | always on for the loop | spans run → report → question → agent stage → `Agent.run`, linked to the run | `mlflow.pydantic_ai.autolog()` · `tracking/tracing.py` |
| 04 | Score | inside the run | `correct`, `cascade`, `first_wrong_turn`, and the per-agent columns on every row | `evaluation/metrics.py` · `evalloop/stage_scores.py` |
| 05 | Diagnose | `diagnose --csv <train.csv> --version v2` | rows in `diagnostics/evalloop/diagnoses.jsonl` (440 today) · a run in `convfinqa-optimization` | claude-agent-sdk on Opus 5 · `evalloop/teacher.py` |
| 06 | Propose | `propose --diagnoses … --base-version v2 --new-version v8 --target retriever` | `src/convfinqa/prompts/v8.py` · lineage entry `r5` · a row in `rewrites.jsonl` (13 today) | `evalloop/teacher.py` · `tracking/prompt_ledger.py` |
| 07 | Register | on the first run of `v8` | registry spec, composition `t2.p2.r5.c2`, MLflow prompt mirror via `mirror-prompts` | `tracking/registry.py` · `tracking/bundle.py` |
| 08 | Run gate | `run --split test --version v2` and the same for `v8` | the two `test100` CSVs, 349 questions each | as 02 |
| 09 | Gate | `gate-targeted --target-agent retriever --baseline-csv … --candidate-csv … --promote` | a row in `gates.jsonl` (9 today) · a `promote` event on the registry history with the full comparison | `tracking/comparator.py` · `evalloop/gate.py` |
| 10 | Deploy | merge to `main` | CI eval gate → OIDC → ECR → App Runner; smoke asserts served bundle == champion | GitHub Actions · Terraform · `scripts/demo_smoke.sh` |
| 11 | Observe | `MLFLOW_TRACING=1` for serving; `/metrics/production` | one trace row per turn, split by source | `tracking/traces.py` · `serving/routes/metrics.py` |

- **Campaign rules** — at most five experiments per gate split; a target agent rotates off after two consecutive rejections.
- **`campaign-status`** — where a campaign is.
- **`ledger-trace --question-id <report>_q<n>`** — one question's diagnoses, rewrites and verdicts, joined by id.
- **The runner threads the agent's own answers as history** — a wrong turn poisons the turns below; `cascade` marks those rows, so the teacher reads only each report's first wrong turn.
- **The per-agent panel needs no judge** — gold program plus gold answer fix what three of the four stages should have produced.

| Agent | Metric | How it is derived from gold |
|---|---|---|
| triage | `acc_triage_turn_type` | `gold_turn_type` is a column |
| preprocess | `acc_preprocess_skeleton` · `acc_preprocess_plan` | the op skeleton of the planned program vs the gold program's; equivalent-but-different shapes read as misses, and the teacher adjudicates those |
| retriever | `retriever_operand_recall` | the gold program's numeric operands, minus constants and minus earlier gold answers, which come from history not the document |
| calculator | `acc_calculator_exec` · `calculator_acc_given_full_recall` | the gold answer, conditioned on retrieval having succeeded — what separates "wrong operand" from "wrong computation" |

- **The taxonomy is frozen** — named failure modes per agent, a `new:<label>` escape, and `gold_suspect` for a gold answer that looks wrong (the Dataset page settles those).
- **Attribution prompt rewritten once** — PR #8, measured old against new on 554 cases; the SDK arm slices its taxonomy verbatim from the same constant.

## Gate & promote — significance, not a better number, decides

`comparator.py::promotable_significant`: **net positive on the shared gate questions — strictly more fixed than broken — and a one-sided McNemar p below 0.05 over the discordant pairs, cluster-corrected by conversation.**

- **One-sided** — the gate only ever promotes.
- **Clustered** — one report's turns share a history, so their flips are not independent.
- **Every verdict** — a cluster-bootstrap 95% CI on the delta and a `P(Δ > 0)`.
- **Train runs optimise, the gate split promotes** — `gate` and `gate-targeted` refuse `--promote` on a train CSV.
- **A targeted challenger must move its own agent** — `gate-targeted` requires the target's panel metric to improve on the shared gate reports and paired accuracy not to regress.
- **The SDK arm promotes to its own alias** — `sdk_champion`, never `champion`; serving reads only the latter.

<figure class="fig">
  <p class="fig-title">Figure · nine gate verdicts, as accuracy deltas with 95% intervals</p>
  <div class="dia-frame">{% include diagrams/chart/convfinqa-gates.svg %}</div>
  <figcaption><b>Seven of nine challengers moved the number and none of them earned it.</b>
  Every interval that crosses zero is a rejection; the two that clear it are v8 at +4.58 pp and
  sdk_v1 at +8.88 pp. Source:
  <code>evaluation/diagnostics/evalloop/gates.jsonl</code>.</figcaption>
</figure>

The verdict that promoted v8, from `gates.jsonl`:

```text
c01-e03  v8 vs v2  target retriever  n_paired 349
  Δ +4.58pp (77.08% → 81.66%) · 34 fixed / 18 broken across 36 conversations
  one-sided clustered McNemar p 0.0404 · z 1.75 · 95% CI [−0.28, +9.85] · P(Δ>0) 0.96
  retriever_operand_recall 0.740 → 0.768                                → PROMOTE
```

The event that un-promoted three champions, from the registry history on 2026-09-03:

> v3_1, v4 and v5 were each promoted under the retired net-positive rule. Re-judged under the
> campaign rule — net positive AND one-sided cluster-corrected McNemar p < 0.05 — every one is
> rejected (v5, the strongest, has p=0.207 and a 95% CI of [−3.2pp, +7.6pp] that contains zero).
> The evidence for them was never wrong, it was never sufficient.

- **The holdout is the release gate, not the promotion gate** — `release --i-know-this-opens-the-holdout` opens it once, for the current champion only, and records the opening in the history.
- **Opened 0 times** — tested with stubs.

The offline CI gate, on every pull request:

```text
$ uv run python -m convfinqa.tracking.gate
eval-gate: 3 committed version(s): v1, v2, v3_1
  ✓ v1: 770 rows, correctness column consistent
  ✓ v2: 770 rows, correctness column consistent
  ✓ v3_1: 770 rows, correctness column consistent
  ✓ champion v8: 81.66% (registered 0.00%, floor -0.50%)
eval-gate PASSED
```

- **The last line is a defect, not a pass** — campaign promotions leave the bundle's `metrics` empty, so v8's floor is −0.5% and cannot fail.
- **The re-score is real** — 81.66% from the committed CSV; the floor is not.

## Cycle log — one promotion in seven campaign experiments

Newest first; accuracies from the committed CSVs, verdicts from `gates.jsonl` and the registry history; every campaign row paired on the same 349 gate questions.

| Date | Subject | Deliverable | Split · n | Accuracy | Verdict |
|---|---|---|---|---|---|
| 2026-09-05 (s01-e02) | sdk_v2 · s2 | SDK teacher, calculator class | gate · 349 | 90.5% → 87.7% · 6 fixed / 16 broken · p 0.917 | **rejected** |
| 2026-09-05 (s01) | sdk_v1 · s1 | v8's four prompts distilled into one session | gate · 349 | 81.7% → 90.5% · 38 fixed / 7 broken · p 0.0003 · CI [+4.2, +13.7] | **promoted** · `sdk_champion` |
| 2026-09-04 (c03-e02) | v12 · preprocess | rewrite against v8 | gate · 349 | 81.7% → 81.4% · 19 / 20 · p 0.551 | rejected |
| 2026-09-04 (c03-e01) | v11 · preprocess | rewrite against v8 | gate · 349 | 81.7% → 83.1% · 19 / 14 · p 0.254 · CI [−2.9, +5.5] | rejected |
| 2026-09-04 (c02-e02) | v10 · preprocess | rewrite against v8 | gate · 349 | 81.7% → 82.2% · 20 / 18 · p 0.393 | rejected |
| 2026-09-04 (c02-e01) | v9 · retriever | rewrite against v8 | gate · 349 | 81.7% → 81.7% · 17 / 17 · p 0.500 | rejected |
| 2026-09-03 (c01-e03) | v8 · t2.p2.r5.c2 | retriever rewrite · `prompts/v8.py` | gate · 349 | 77.1% → 81.7% · 34 / 18 · p 0.040 · CI [−0.3, +9.9] | **promoted** · champion |
| 2026-09-03 (c01-e02) | v7 · preprocess | rewrite against v2 | gate · 349 | 77.1% → 79.7% · 27 / 18 · p 0.132 | rejected · preprocess rotated off |
| 2026-09-03 (c01-e01) | v6 · preprocess | rewrite against v2 | gate · 349 | 77.1% → 79.4% · 31 / 23 · p 0.191 | rejected |
| 2026-09-03 17:18 | v3_1 · v4 · v5 | re-judged under the campaign rule | — | v5: p 0.207 · CI [−3.2, +7.6] | **rolled back** to v2 |
| 2026-09-02 (cycle 2) | v5 · t3.p4.r3.c3 | preprocess, 5 merged rules from 30 diagnoses | test · 187 | 77.5% → 79.7% · 12 / 8 · p 0.503 | promoted under the retired rule |
| 2026-09-02 (smoke) | v4 · t3.p3.r4.c3 | retriever, 3 of 6 diagnosed faults | test · 34 | recall .744 → .780 · accuracy 79.4% → 67.6% | refused; its train-10 promotion rolled back 11:34 |
| 2026-09-02 (cycle 0) | v3_1 over v2 | — | train · 44 | 54.5% → 61.4% · 5 / 2 · p 0.453 | promoted under the first net-positive rule |
| 2026-08-28 | v2 · t2.p2.r2.c2 | GEPA (DSPy), full prompt set | corpus · 770 | 73.0% → 77.1% | champion by backfill |
| 2026-05 | v3_1 · t3.p3.r3.c3 | s7 harness, 39 verified rules | corpus · 770 | 77.1% → 76.2% · 61 / 68 | refused under the flip-veto rule |

Two numbers beside the one promotion, so it reads as no more than it is:

- **v8's CI still touches zero on the left** — `P(Δ > 0)` is 0.96, not 1.
- **Two-sided uncorrected p would read 0.036** — the loop reports the harder number.

Still open:

- **CI floor for campaign champions** — `tracking/gate.py` reads the floor from registry metrics campaign promotions leave empty; v8 is checked against −0.5%.
- **Teacher trust** — `kappa --make` produced a 30-case sheet, teacher's verdict hidden, bar κ ≥ 0.7 against a human; committed, unlabelled.
- **Holdout** — reserved, never cut; the first release is the first measurement.
- **Production failures joining train** — designed, not built; serving traces carry the bundle id, nothing routes a failed live turn into the next teacher pass.
- **Diminishing returns** — three campaigns against v8, four rejections; the best, v11, +1.4 pp.
- **Noise floor** — a 100-report train draw yields about 50 first-wrong cases split four ways; one draw's ranking of agents is close to noise.

## What changed since — the rule got stricter, three times

Newest first; protocol changes, not code changes.

- **2026-09-06 · a second runtime** — `--runtime agent_sdk` answers a conversation in one Claude session; same split, same gate, own alias. PR #9, `5af229e`. [The runtime test →](/projects/convfinqa-agent/sdk-vs-llm/)
- **2026-09-05 · campaigns** — up to five experiments per fixed gate split, target rotation after two rejections, three append-only ledgers joined by id. PR #8, `4ced811`.
- **2026-09-05 · attribution rewrite** — the blame prompt measured old-against-new on 554 cases before replacing it (PR #8). `evalloop/teacher.py::TEACHER_PROMPT`.
- **2026-09-03 · the significance rule** — net positive AND one-sided cluster-corrected McNemar p < 0.05 replaces "net positive with p recorded"; v3_1, v4, v5 rolled back to v2 at 17:18; v8 promoted at 19:33. `tracking/comparator.py::promotable_significant`.
- **2026-09-03 · the campaign split** — `eval_loop_v2` extends v1 to 100 / 100 reports, holdout reserved, sized by power calculation. `evaluation/splits/eval_loop_v2.json`.
- **2026-09-03 · teacher to Opus 5 on the Agent SDK** — from deepseek-v4-pro on pydantic-ai; subscription billing, `setting_sources=[]`, one structured call per case. `llm.py::LM_TEACHER_MODEL`.
- **2026-09-02 · promotion evidence from the unseen split only** — the owner's rollback of v4; both gates refuse `--promote` on train CSVs since.
- **2026-09-02 · net-positive rule with McNemar p replaces the flip veto** — itself replaced by the significance rule.

Libraries:

| Library | Trusted with |
|---|---|
| pydantic-ai ≥ 0.2 | the four typed agents on deepseek-v4-flash |
| claude-agent-sdk ≥ 0.2.152 | the teacher and prompt-writer on Opus 5; the single-session runtime on Sonnet 5 |
| MLflow ≥ 3.11 (server v3.12.0) | runs, tracing via autolog, hand-opened SDK spans, prompt registry and aliases, teacher memory |
| pandas | scoring, the panel, the paired comparison; exact and clustered McNemar and the bootstrap CI live in the comparator |
| Logfire · tenacity | serving spans on a separate provider; retry with jitter in the choke point |
| FastAPI · React 18 + Vite | the console, nine admin pages read-only in demo |
| GitHub Actions · Terraform · App Runner | the offline gate, the OIDC deploy, the smoke test |
| DSPy / GEPA · the s7 harness | produced v2 and v3_1; no longer the promotion path; iteration logs archived |
