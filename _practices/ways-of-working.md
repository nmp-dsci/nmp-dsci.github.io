---
title: "Ways of working: Git · Lavish · no-mistakes"
short: "Ways of working"
summary: >-
  How one engineer working with agents built three production systems without
  the usual slop: plan in the browser, build on a branch, validate through a
  local gate, ship on merge. 52 merged PRs, 69 review artifacts and 49
  gate-fix commits later.
tldr: >-
  Plan in the browser, build on a branch, validate through a gate, ship on merge. 52 merged PRs · 69 numbered review artifacts · 49 `no-mistakes(...)` fix commits, counted today across the four repos.
order: 2
kicker: "practice · engineering process"
systems: [data-pilot, convfinqa-agent, transcript-rag]
rubric: [release, gate]
evidence_note: >-
  Every count was re-run on 2026-08-30 with the command given in Evidence, in
  each of the four repos. Numbers quoted in earlier write-ups that no longer
  reproduce have been replaced by today's.
sections:
  - n: 1
    summary: >-
      An agent that writes faster than one person can review turns a repo that
      looks healthy into one nobody has checked.
  - n: 2
    summary: >-
      Four things stand between an agent's output and main, and each of them is
      allowed to refuse.
  - n: 3
    summary: >-
      The same process leaves very different trails, and the thinnest trail
      belongs to the repo that was built fastest.
  - n: 4
    summary: >-
      Every count comes from a command you can run in the repo, and two of them
      moved since the plan was written.
  - n: 5
    summary: >-
      A process this optional leaves gaps: squash-merge, skipped gates and tidy
      prefixes each hide a different one.
---

## Problem

An agent writes plausible code very fast.

- **Most of it is fine** — some is confidently wrong in a way that reads as fine, and the volume beats reading every diff.
- **One engineer plus that tool** — a repo that looks healthy and is not.
- **The failure is not "the AI wrote a bug"** — nothing in the loop is allowed to say *stop*: unreviewed plans become code, unreviewed code becomes main, main deploys.

## Pattern

Four things, each of which can refuse.

### Git

The unit of review is a slice a person can hold in their head, not a week of edits.

- **One feature branch and one pull request per slice**, with conventional commit subjects.
- **CI on every PR**; deploy on merge through GitHub OIDC, no stored AWS keys.
- **A worktree rather than a stash** for isolated fixes, so an in-flight branch is never unwound — `data-qa-agent` still carries `.claude/worktrees/golden-build` from exactly that.
- **"Never ship a red main"** — only ConvFinQA enforces it mechanically: deploy triggers on `workflow_run` after CI completes and checks the conclusion, with a comment saying why — "their deploy fires on push regardless, which means a red main can ship".
- **Data Pilot and Transcript RAG** deploy on push to `main`: two of three by discipline, one in YAML.

### Lavish

- **Every non-trivial change starts as a numbered review artifact** — `.lavish/sNN_*.html`, rendered in the browser, read and annotated *before code exists*: architecture, implementation plans, tickets, experiment results, screenshot sets.
- **The numbering is the spine** — `s41` is the worker-scaling plan, `s42` its results; a case study cites `s42` the way a paper cites a figure.
- **Why review the plan?** Minutes in a browser change the whole diff; hours on the diff change a line.
- **69 artifacts** across the four repos — this rebuild was planned the same way, from this repo's `.lavish/s04_production-showcase-plan.html`.
- **Never gitignored**, by workspace rule — an artifact you can `git log` is a decision record; one in a temp directory is a screenshot.

### no-mistakes

A local gate over committed work on a feature branch: **intent → rebase → review → test → document → lint → push → PR → CI**.

- **Refuses** the default branch and an uncommitted tree.
- **`--intent` is required** — *the user's goal in their own words*, not a description of the diff; review uses it to tell a deliberate decision from a mistake, so a thin intent flags things you already chose.
- **`auto-fix`** — you may resolve it on your own judgement.
- **`no-op`** — informational.
- **`ask-user`** — the human's decision, because it challenges their stated intent or changes product behaviour.
- **Review auto-fix is off by default** — blocking findings park at a gate instead of being silently self-healed.
- **Findings land as commits you can count** — `no-mistakes(review|document|lint|test): …`, **49** of them across the four repos.

Two real catches, quoted from the log:

> `no-mistakes(review): Coalesce repeated /health/db probes to throttle Aurora wake abuse`

- **The hole** — Data Pilot's Aurora pauses when idle; `/health/db`, the unauthenticated probe the frontend uses to decide whether to narrate the wake, was fenced by a client-channel header that ships in the bundle. Anyone can copy it and hammer the endpoint to force fresh connects, defeating auto-pause, the dominant idle cost.
- **The fix** — cache the result for five seconds, so the path wakes Aurora at a bounded rate regardless of volume. A cost-and-abuse defect on a no-login demo, found by the review step rather than a bill.

> `no-mistakes(review): Guard ws.onopen against listening-flash after cancel`

- **The hole** — Transcript RAG's speech-to-text opens a WebSocket; cancel while it is still connecting and `onopen` fires afterwards, flashing the UI into a listening state nobody asked for.
- **Why it matters** — a race in callback ordering, precisely the class of bug that reads as correct in a diff.

### …and the portfolio itself

This site closes the loop.

- **`/case-study`** (`.claude/skills/case-study/SKILL.md`) turns a repo into a case study by the same path — survey the repo, fill the front-matter contract, score the nine rubric dimensions, draw the two diagrams, lint, review.
- **`scripts/lint_case_study.py`** is the gate at the end, deliberately unkind. It checks:
- the seven H2s present, exactly titled and in order;
- the scorecard section left empty for the layout to render;
- all nine rubric dimensions once each in `_data/rubric.yml`'s order, with a status from the vocabulary;
- anything not `shipped` carrying a reason of at least forty characters;
- and — the load-bearing check — **every path token in a `proof:` field resolving in that system's own repo**.
- **Why paths?** A model can write "shipped" for free; it cannot invent a path that exists.

## In the three systems

Same process, three different amounts of it: the repos are different sizes and were built at different times.

| metric | Data Pilot | ConvFinQA Agent | Transcript RAG | this site |
|---|---|---|---|---|
| merged PRs | 33 | 4 | 13 | 2 |
| commits on `main` | 195 | 14 | 80 | 56 |
| `feat` · `fix` · `docs` | 71 · 35 · 16 | 2 · 0 · 0 | 30 · 2 · 4 | 0 · 0 · 0 |
| `.lavish/*.html` | 40 | 4 | 20 | 5 |
| `no-mistakes(...)` commits | 27 | 0 | 16 | 6 |
| gate branches on the `no-mistakes` remote | 20 | 1 | 9 | — |

**The trail thins with the repo that was built fastest, and ConvFinQA's zero is squash-merge, not an absent gate.**

Source: `gh pr list`, `git log`, `ls .lavish/*.html` and `git branch -r` in each repo, re-run 2026-08-30.

- **Data Pilot** — the process fully loaded: 33 PRs, 40 review artifacts, 27 gate-fix commits split 10 review · 10 document · 4 lint · 3 test. The `document` share is the surprise: a third of the gate's output is the docs step noticing that `AGENTS.md`, `README.md` or an `.env.example` no longer describes what shipped.
- **ConvFinQA Agent** — the honest outlier: four PRs, all squash-merged, so `main` is fourteen commits with zero `no-mistakes(...)` *subjects*. The gate ran — two squash-commit bodies still contain its fix lines, and the `no-mistakes` remote holds its branch — but squashing erased the per-fix history. Squash-merge and a countable gate trail are mutually exclusive; this repo picked squash.
- **Transcript RAG** — in between: 13 PRs, 20 artifacts, 16 gate commits (9 review · 5 document · 2 lint), and the largest single log entry is `no-mistakes(review): Address all 14 approved review findings across RAG pipeline` — one branch, fourteen findings.

## Evidence

Re-run on 2026-08-30 in each repo.

```sh
# merged PRs
gh pr list --state merged --limit 300 | wc -l
# commits, and the conventional-commit split (also fix, docs, chore…)
git log --oneline | wc -l
git log --oneline | grep -cE '^[0-9a-f]+ feat(\(|:)'
# review artifacts
ls .lavish/*.html | wc -l
# gate commits, and their type split
git log --format=%s | grep -c '^no-mistakes('
git log --format=%s | grep '^no-mistakes(' \
  | sed -E 's/^no-mistakes\(([a-z]+)\).*/\1/' | sort | uniq -c
# branches the gate pushed to its own remote
git branch -r | grep -c 'no-mistakes/'
```

- **Totals across the four repos** — **52** merged PRs, **69** review artifacts, **49** `no-mistakes(...)` commits.
- **Workflows** — each repo's `.github/workflows/` (`ci.yml`, `deploy-aws.yml`); the gate's own definition is `~/.claude/skills/no-mistakes/SKILL.md`.
- **Two counts moved since the plan** — Transcript RAG is at 13 merged PRs, not 12; the gate total is 49 by commit *subject*, where an earlier 33 for Data Pilot included six squash-merge commits whose bodies quote the gate lines.
- **Why subjects?** That is what a `git log` reader sees.

## Failure modes

- **A gate you skip under time pressure** — local and optional is why it exists at all, and why the numbers above are uneven: ConvFinQA was built fastest and shows the least trail. Nothing in the repo forced it, and nothing would have.
- **Squash-merge erasing the evidence** — ConvFinQA's four PRs collapsed to four commits; the work happened, the gate ran, the record is gone from the subject line. Fix: if you intend to count the gate trail later, the merge strategy is part of the design, not a preference.
- **Review artifacts documenting a plan nobody followed** — a `.lavish/sNN_*.html` is worth something only if the code matches it or the artifact says why not. The numbering makes divergence visible (`s41` beside `s42`) but enforces nothing: `s42` was checked against `out/wsweep/summary.json` before the scale page cited it; the other thirty-nine were not.
- **Conventional commits as theatre** — 195 commits with tidy prefixes prove someone configured a convention, not that the work was any good. The telling number is 35 `fix` against 71 `feat`: one fix for every two features, the cost of building fast against a live cloud deployment; pretending otherwise would mean deleting the fixes.
- **The gate's own output can be sloppy** — one Transcript RAG subject reads `no-mistakes(review): {"summary": "Fix added_chunk_count race by summing claimed videos' chunk counts"}`, the raw JSON envelope leaked into the commit message. The fix underneath is real; the commit that records it is not clean. A pipeline that writes commits can write bad commits.
