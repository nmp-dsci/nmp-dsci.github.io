---
title: The DABstep loop, in full
short: "the loop · MLOps"
kicker: "deep dive · the loop"
project: dabstep-loop
rubric: [evals, gate, loop, guardrails, trace]
summary: >-
  The mechanism behind the case study's §3: what has to exist before a cycle, the supervised and
  the unsupervised cycle command by command, the two gate rules, and the ledger with all five
  cycles on it, the held ones included.
tldr: >-
  make loop (eval champion → one Sonnet session writes v(N+1) → eval challenger → McNemar →
  register) and make uloop (probe 47 of the 450 unscored → signals → cards → the same session →
  paired re-probe → gate A), with the file each step writes.
updated: 2026-09-14
evidence_note: >-
  Every number on this page was read on 2026-09-14 from a clone of <code>DABStep-loop</code> at
  <code>f386466</code>, with the path beside it. The cycle log reads <code>loop/ledger.jsonl</code>
  and the history in <code>loop/registry.json</code>; pass counts and costs read
  <code>runs/*/run.json</code> and <code>runs/*/traces/</code>; the signals read
  <code>runs/*/signals.json</code>; both gate rules are <code>eval/compare.py</code> and re-compute
  with no API key. When a cycle is run, append a row to the log and re-date this note.
sections:
  - n: 1
    summary: >-
      Ten gold tasks, a scorer nobody may edit, and a model choke point exist before a cycle can start.
  - n: 2
    summary: >-
      Two commands, one ring: the optimiser is an agent with a shell, and what it is shown and may touch is the design.
  - n: 3
    summary: >-
      McNemar at n = 10 is blunt by construction; gate A adds gold-free evidence but keeps the gold veto.
  - n: 4
    summary: >-
      Five cycles, one promoted and two held, and the held ones are what make the promotion mean anything.
  - n: 5
    summary: >-
      The gate rule changed once and a second gate was added, and the commits that did it are on the log.
---

## Setup — ten gold tasks, an untouchable scorer, one choke point

Six things exist before a cycle can run.

| Piece | What it is | Command · path |
|---|---|---|
| **The data** | `adyen/DABstep` from Hugging Face: `payments.csv` (138k rows), `fees.json` (1,000 rules), `merchant_data.json`, `manual.md`; the context files are gitignored, their shapes committed | `make data` · `data/file_structures.json` |
| **The split** | `dev.jsonl`, ten tasks with gold; `all.jsonl`, 450 without. A test pins both counts, and `eval --split all` asks for confirmation | `data/tasks/` · `tests/test_eval.py::test_dev_split_has_ten_gold_and_all_has_none` |
| **The scorer** | `question_scorer` vendored verbatim from the benchmark space; excluded from ruff and mypy so it cannot drift | `src/dabstep_loop/eval/scorer.py` · `pyproject.toml` |
| **MLflow** | `mlflow:v3.5.0` in docker compose on `:5600`, SQLite store; the index of every run, never the record | `make mlflow-up` · `docker-compose.yml` |
| **The choke point** | three model ids in one file; `require_live()` refuses under `DEMO_MODE=1`, and a subscription session has the API key stripped | `src/dabstep_loop/agent/llm.py` · `.env.example` |
| **A version** | a folder of three files: `system.md` and `helper.py` editable, `agent.yaml` frozen; fingerprint is a hash of the folder's bytes | `agents/v0/` · `src/dabstep_loop/agent/versions.py` |
| **The tool's caps** | output over 12,000 characters truncated to head and tail; the third identical call returns `STOP`; one lock, 120 s per call | `src/dabstep_loop/agent/tools/python_executor.py` |
| **The families** | lens 1, an ordered regex table over the 106 question templates → 12 families; lenses 2 and 3 (MiniLM k-means, one Sonnet membership pass) score how far to trust lens 1 per task, ARI 0.58 and 0.66 | `make families` · `make lenses` · `loop/families/families.json` · `lenses.json` |

Environment for a cycle:

```bash
cp .env.example .env        # BILLING=subscription, no key: dev runs bill the Claude subscription
claude login                # the agent, the optimiser and the reflection all run through the SDK
make mlflow-up              # :5600 — 5000 and 5500 belong to sibling projects
make smoke                  # v0 on the dev split: the build's only live eval outside a cycle
```

## One cycle — an agent with a shell, confined to two files

Reference: cycle 3 (2026-09-14), v0 → v2, one command; then cycle 5, v2 → v3, the other.

```bash
make loop CYCLES=1      # supervised: the ten gold tasks
make uloop CYCLES=1     # unsupervised: a probe of the 450, K=3 SEED=0 PROBE_PASSES=2
```

<figure class="fig">
  <p class="fig-title">Figure · the loop as a ring, with the choke point and the write guard off it</p>
  <div class="dia-frame">{% include diagrams/loop/dabstep-loop.svg %}</div>
  <figcaption><b>Both loops run the same ring; the input, the scoring, the gate and the reflection are where they differ.</b> Steps 01–11 are the tables below; the two dashed boxes are the constraints every cycle runs under. Source: <code>src/dabstep_loop/loop/run.py</code>, <code>src/dabstep_loop/loop/optimiser.py</code>.</figcaption>
</figure>

| # | Step | What it does | Writes · library |
|---|---|---|---|
| 1 | eval champion | ten tasks at three workers behind an `asyncio.Semaphore`; one Agent SDK session per task | `runs/<id>/{run.json,results.jsonl,traces/}` · `eval/runner.py` |
| 2 | index | one MLflow run per eval: agent, fingerprint, model, split, code SHA, `passed`, `pass_rate` | `loop/mlflow_snapshot.json` · `tracking/mlflow_log.py` |
| 3 | optimise | one `ClaudeSDKClient` session on `claude-sonnet-5`, effort high, up to 120 turns, tools Read/Write/Edit/Bash/Glob/Grep | `agents/v(N+1)/{system.md,helper.py,diagnosis.json}` · `loop/optimiser.py` |
| 4 | check | `agent.yaml` byte-identical; `diagnosis.json` present; a checksum over ten guarded paths unchanged; at least one surface changed | `loop/optimiser.py::tree_checksum` |
| 5 | eval challenger | the same ten tasks, same workers | `runs/<id>/` · `eval/runner.py` |
| 6 | gate | one-sided exact McNemar on the paired flips | `eval/compare.py` |
| 7 | register | promote to champion, or register as challenger; both append to the history | `loop/registry.json` · `tracking/registry.py` |
| 8 | ledger | diagnoses, both diff summaries, expected fixes, risks, optimiser turns and tokens, the verdict | `loop/ledger.jsonl` · `loop/ledger.py` |

What the optimiser is shown, from `build_prompt`:

- both champion surfaces, verbatim;
- every failed task: question, gold, the agent's answer, its error, its turn count, and a trace condensed to 9,000 characters;
- the ledger history, so a failed fix is not retried unchanged;
- any held challenger, offered as a starting point, not a rejected one;
- the gate, in one line: one break costs three extra fixes.

What it may do is narrower than what it is shown. A `PreToolUse` hook on `Write|Edit|MultiEdit`
denies any path outside `agents/v(N+1)/` and any path ending `agent.yaml`. The guarded set is
explicit: `agents`, the agent, eval, loop and data packages, `tests`, `data/tasks`,
`data/file_structures.json`, `Makefile`, `pyproject.toml`.

Between cycles, `make reflect` runs a read-only pass over the champion's traces, up to 40
turns, and records a summary, consistency notes, open gaps and sibling-template groups on the
ledger. Cycle 2's reflection is what found 1871's cause. `loop/annotate.py` later writes a
per-edit `change_log.json` for a version, marked `post-hoc` or `in-session`.

### The unsupervised cycle — the same session, shown cards instead of failures

`make uloop` replaces steps 1, 3's evidence, 5 and 6; everything else is the table above.

| # | Step | What it does | Writes · library |
|---|---|---|---|
| 1 | probe champion | `sampler.draw(k, seed)`: k per family, boundary tasks first, never a dev id, plus each invariant's siblings; 47 tasks at k = 3; two passes, gold blanked, `correct: null`, no submission | `runs/<id>_probe_haiku/` · `loop/sampler.py` |
| 1b | signals | S1 share of a family's traces on its modal helper method; S2 two-pass agreement; S3 metamorphic invariants between sibling answers; S5 guideline format. Nothing reads gold | `runs/<id>/signals.json` · `loop/signals.py` · `loop/invariants.py` |
| 2 | cards | one read-only Sonnet session over the family blocks writes a card per family: canonical method, entry point, prompt rule, status `verified` / `provisional` / `open`; only when a card is missing or cites an older probe | `loop/families/Fnn.json` · `loop/ureflect.py` |
| 3 | optimise | the §5 session with the cards worst-first and both traces of every failed invariant; one routing row and at most one blanked example per family in `system.md`, one entry point per family in `helper.py`; verified against an invariant, never a leaderboard answer | `agents/v(N+1)/` · `loop/optimiser.py` |
| 5 | paired eval | the challenger runs dev-10 scored and the same probe sample unscored | `runs/` · `eval/runner.py` |
| 6 | gate A | promote only if no dev task broke and the paired composite improved | `eval/compare.py::gate_a` |
| 8 | ledger | kind `ucycle`: `signals_before`, `signals_after`, `signals_by_family`, beside the usual diagnoses and diffs | `loop/ledger.jsonl` |

The invariants are pure functions over parsed answers and slots, unit-tested in both directions
on synthetic answers before they see a trace. A check that cannot run is `skipped`, never
passed. Six families carry no dev task at all: F03, F05, F06, F08, F09 and F11, 188 hard tasks.
The probe is the only evidence about them the loop has.

## Gate & promote — two rules, and gold has the veto in both

The rule, from `eval/compare.py`: with `b` tasks fixed and `c` broken, the one-sided exact
McNemar p is the binomial tail on `n = b + c`, and the challenger is promoted at p < 0.05.

```python
ALPHA = 0.05
def mcnemar_one_sided(b: int, c: int) -> float:
    n = b + c
    return sum(comb(n, k) for k in range(c + 1)) / 2**n
```

At n = 10 the test is blunt by construction. The docstring says so; this is what it means:

| fixed | broken | p | verdict |
|---|---|---|---|
| 4 | 0 | 0.0625 | hold |
| 5 | 0 | 0.0313 | **promote** — the smallest clearing result |
| 5 | 1 | 0.1094 | hold — cycle 1 |
| 6 | 0 | 0.0156 | promote |
| 6 | 1 | 0.0625 | hold |
| 7 | 1 | 0.0352 | promote |

Every verdict carries `champion_passed`, `challenger_passed`, `n`, `fixed`, `broken`,
`p_value`, `alpha` and `reason`. `tests/test_eval.py::test_gate_is_a_one_sided_mcnemar_test`
and `test_gate_holds_on_equal` pin the arithmetic.

The CI gate, `tracking/gate.py`, runs on every push and checks four things:

1. the champion run's committed `results.jsonl` re-scores to the registry's `passed`;
2. the bytes of `agents/<champion>/` hash to the run's fingerprint;
3. the run's fingerprint equals the registry's;
4. no ledger cycle is left `pending`.

It also checks that every card's evidence run exists and that no version's prompt quotes a
leaderboard question verbatim; examples must use blanks.

### Gate A — signals can promote only when the gold has nothing to say against it

```python
if dev.broken: hold                       # any gold regression ends it
improved = (s3_up or (s1_up and s3_not_worse)) and s5_ok and errors_ok
```

`s3_up` is invariants passed strictly up with failures not up; `s5_ok` and `errors_ok` are
not-worse. The McNemar p is recorded, not required: with one dev failure left it can never clear
0.05, which is why this gate exists. Cycle 5 is what it looks like when the halves disagree:

| Signal, on the same 47 tasks | v2 | v3 | reads as |
|---|---|---|---|
| S1 method consistency, mean | 0.433 | 0.686 | better |
| S2 two-pass agreement, mean | 0.658 | 0.889 | better |
| S3 invariants passed · failed · skipped | 17 · 3 · 1 | 21 · 0 · 0 | better |
| S5 format compliance, mean | 0.972 | 1.000 | better |
| errors | 3 | 0 | better |
| probe turns · cost | 721 · $5.77 | 481 · $3.67 | cheaper |
| **dev-10, scored** | **9** | **7** · broke 49, 1681 | **hold** |

Task 49 answered "Belgium (BE) has the highest fraud rate" where the scorer wants `B. BE`; task
1681 returned a different fee-id list in three turns. Every gold-free signal said v3 was better,
and on the 47 probed tasks it may well be. The ten gold tasks said two answers were now wrong,
and that is the half of the gate that cannot be argued with.

## Cycle log — one promoted, two held, all five on the ledger

Newest first; pass counts from `runs/*/run.json`, verdicts from `loop/ledger.jsonl`, events
from `loop/registry.json`. Every row is paired on the same ten tasks against the champion of
the time: v0 for cycles 1 and 3, v2 for cycle 5.

| Date (UTC) | Subject | Deliverable | Dev 10 | Verdict |
|---|---|---|---|---|
| 2026-09-14 07:00 (cycle 5, unsupervised) | v3 | a "route first, then compute" table with one row per family; `capture_delay_bucket` before any fee match; `fee_ids_by_attributes`, `fraud_fee_by_aci`, `cheapest_alternative_aci` added, nothing removed; 29 turns, 2.31 M in · 34 k out | 9 → 7 · fixed none · broke 49, 1681 · signals up on every axis | **held** by gate A · challenger |
| 2026-09-14 06:54 (cycle 4, ureflect) | v2's probe | read-only, 99 k in: twelve cards, 6 verified, 1 provisional, 5 open; priority F10, F09, F05, F06, F01 | — | recorded |
| 2026-09-14 06:19 | v2 probe | 47 of the 450 by family, two passes, 94 traces, unscored; S1 0.433 · S2 0.658 · S3 17/3/1 · S5 0.972 | — | signals |
| 2026-09-14 03:44 (cycle 3) | v2 | ported v1's four rules; fees stated additive across matching rules; removed `best_matching_fee`, added `transactions_matching_rule`, `fee_total_for_rule`, `total_fees_paid`; 27 turns, 2.05 M in · 47 k out | 4 → 9 · fixed 49, 70, 1273, 1681, 1753 · broke none · p 0.0313 | **promoted** · champion |
| 2026-09-14 02:48 (cycle 2) | reflect on v1 | read-only, 9 turns, 394 k in: `best_matching_fee` is the wrong model for delta questions (1871); kwarg names cost retries; 2697's method not found | — | recorded |
| 2026-09-14 02:41 (cycle 1) | v1 | four ground rules; fraud as a volume ratio; natural-month bucketing; uniform null-wildcard fee matching; 13 helper functions; 40 turns, 3.85 M in · 60 k out | 4 → 8 · fixed the same five · broke 1871 · p 0.1094 | **held** · challenger |
| 2026-09-14 02:27 | v0 | NVIDIA's inference prompt on Haiku 4.5, 57-line helper | 4 / 10 · 1681 hit the turn cap | champion by baseline |

Three numbers beside the promotion, so it reads as no more than it is:

- **Ten tasks.** Six of the twelve families contain a dev task; the other six, 188 hard tasks, are reached only by the probe, and nothing on this page scores them.
- **The same five.** v2's gain over v0 is v1's gain with the break removed. What cycle 3 proved is the additive-fee model, on one task.
- **Signals are not accuracy.** v3's 21/21 invariants and 0.89 agreement say its answers are consistent with each other, not that they are right. Cycle 5 is the proof: consistent, cheaper, and wrong on two of ten.

## What changed since — the gate rule changed, then a second gate was added

Newest first, each with the commit that made it.

| Date | Change | Commit · path |
|---|---|---|
| 2026-09-14 18:17 | cycle 5 on the ledger: v3 held by gate A; the sampler draws one task for a verified family so a regression still shows | `5ed49b2` · `053d4ea` · `loop/ledger.jsonl` |
| 2026-09-14 16:26 | the Families page; probes marked unscored in the API; the CI gate checks every card's evidence run | `e1ef2ca` · `frontend/src/pages/Families.tsx` · `src/dabstep_loop/tracking/gate.py` |
| 2026-09-14 16:22 | gate A, the unsupervised cycle, and the family cards in the optimiser prompt; `loop/families/` joins the guarded paths | `1b486c2` · `src/dabstep_loop/eval/compare.py` · `src/dabstep_loop/loop/run.py` |
| 2026-09-14 16:19 | the unsupervised reflector writes one card per family from a probe run | `608fd7c` · `src/dabstep_loop/loop/ureflect.py` |
| 2026-09-14 14:12 | per-edit commentary: `change_log.json` written in-session by the optimiser, or post-hoc by `annotate.py` for v1 and v2 | `0423f58` · `src/dabstep_loop/loop/annotate.py` |
| 2026-09-14 13:31 | the gate became a one-sided exact McNemar test; the earlier rule was no-flip, which cycle 1 had already failed | `7fc7beb` · `src/dabstep_loop/eval/compare.py` |
| 2026-09-14 12:31 | the checksum guards an explicit set of ten paths instead of the whole tree, so a run folder or a log cannot void a cycle | `5ef020c` · `src/dabstep_loop/loop/optimiser.py` |

All five cycles ran on 2026-09-14. This log grows when the next one does.
