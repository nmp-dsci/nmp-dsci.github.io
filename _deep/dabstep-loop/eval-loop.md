---
title: The DABstep loop, in full
short: "the loop · MLOps"
kicker: "deep dive · the loop"
project: dabstep-loop
rubric: [evals, gate, loop, guardrails, trace]
summary: >-
  The mechanism behind the case study's §3: what has to exist before a cycle, one cycle command
  by command, the gate arithmetic at n = 10, and the ledger with both cycles on it, the held one
  included.
tldr: >-
  make data → make mlflow-up → make loop (eval champion → one Sonnet session writes v(N+1) →
  eval challenger → McNemar → register) → make reflect, with the file each step writes.
updated: 2026-09-14
evidence_note: >-
  Every number on this page was read on 2026-09-14 from a clone of <code>DABStep-loop</code> at
  <code>e728cc6</code>, with the path beside it. The cycle log reads <code>loop/ledger.jsonl</code>
  and the history in <code>loop/registry.json</code>; pass counts and costs read
  <code>runs/*/run.json</code>; the gate arithmetic is <code>eval/compare.py</code> and
  re-computes with no API key. When a cycle is run, append a row to the log and re-date this note.
sections:
  - n: 1
    summary: >-
      Ten gold tasks, a scorer nobody may edit, and a model choke point exist before a cycle can start.
  - n: 2
    summary: >-
      One command runs a cycle; the optimiser is an agent with a shell, so what it may touch is the design.
  - n: 3
    summary: >-
      At n = 10 the gate is blunt by construction, and the page says exactly how blunt.
  - n: 4
    summary: >-
      Two cycles, one held and one promoted, and the held one is what makes the promotion mean anything.
  - n: 5
    summary: >-
      The gate rule was replaced between the two cycles, and the commit that did it is on the log.
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

Environment for a cycle:

```bash
cp .env.example .env        # BILLING=subscription, no key: dev runs bill the Claude subscription
claude login                # the agent, the optimiser and the reflection all run through the SDK
make mlflow-up              # :5600 — 5000 and 5500 belong to sibling projects
make smoke                  # v0 on the dev split: the build's only live eval outside a cycle
```

## One cycle — an agent with a shell, confined to two files

Reference: cycle 2 (2026-09-14), v0 → v2, one command.

```bash
make loop CYCLES=1
```

<figure class="fig">
  <p class="fig-title">Figure · the loop as a ring, with the choke point and the write guard off it</p>
  <div class="dia-frame">{% include diagrams/loop/dabstep-loop.svg %}</div>
  <figcaption><b>The optimiser is on the ring, and what it may touch sits beside it.</b> Steps 01–11 are the table below; the two dashed boxes are the constraints every cycle runs under. Source: <code>src/dabstep_loop/loop/run.py</code>, <code>src/dabstep_loop/loop/optimiser.py</code>.</figcaption>
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

## Gate & promote — five fixes and no break is the floor

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

Its last line today: `GATE OK: champion v2 (665f5ffa88eb) re-scores to 9/10`.

## Cycle log — one held, one promoted, both on the ledger

Newest first; pass counts from `runs/*/run.json`, verdicts from `loop/ledger.jsonl`, events
from `loop/registry.json`. Every row is paired on the same ten tasks against v0.

| Date (UTC) | Subject | Deliverable | Dev 10 | Verdict |
|---|---|---|---|---|
| 2026-09-14 03:44 (cycle 3) | v2 | ported v1's four rules; fees stated additive across matching rules; removed `best_matching_fee`, added `transactions_matching_rule`, `fee_total_for_rule`, `total_fees_paid`; 27 turns, 2.05 M in · 47 k out | 4 → 9 · fixed 49, 70, 1273, 1681, 1753 · broke none · p 0.0313 | **promoted** · champion |
| 2026-09-14 02:48 (cycle 2) | reflect on v1 | read-only, 9 turns, 394 k in: `best_matching_fee` is the wrong model for delta questions (1871); kwarg names cost retries; 2697's method not found | — | recorded |
| 2026-09-14 02:41 (cycle 1) | v1 | four ground rules; fraud as a volume ratio; natural-month bucketing; uniform null-wildcard fee matching; 13 helper functions; 40 turns, 3.85 M in · 60 k out | 4 → 8 · fixed the same five · broke 1871 · p 0.1094 | **held** · challenger |
| 2026-09-14 02:27 | v0 | NVIDIA's inference prompt on Haiku 4.5, 57-line helper | 4 / 10 · 1681 hit the turn cap | champion by baseline |

Two numbers beside the promotion, so it reads as no more than it is:

- **Ten tasks.** A sibling-template count from the reflection pass says six of the ten dev tasks each stand for about twenty of the 450, so a fix may transfer. That is a claim on the ledger, not a measurement.
- **The same five.** v2's gain over v0 is v1's gain with the break removed. What cycle 2 proved is the additive-fee model, on one task.

## What changed since — the gate rule changed between the cycles

Newest first, each with the commit that made it.

| Date | Change | Commit · path |
|---|---|---|
| 2026-09-14 14:12 | per-edit commentary: `change_log.json` written in-session by the optimiser, or post-hoc by `annotate.py` for v1 and v2 | `0423f58` · `src/dabstep_loop/loop/annotate.py` |
| 2026-09-14 13:31 | the gate became a one-sided exact McNemar test; the earlier rule was no-flip, which cycle 1 had already failed | `7fc7beb` · `src/dabstep_loop/eval/compare.py` |
| 2026-09-14 12:31 | the checksum guards an explicit set of ten paths instead of the whole tree, so a run folder or a log cannot void a cycle | `5ef020c` · `src/dabstep_loop/loop/optimiser.py` |

Both cycles ran on 2026-09-14. This log grows when the next one does.
