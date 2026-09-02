---
title: "Ways of working: Git · Lavish · no-mistakes"
short: "Ways of working"
summary: >-
  How three production systems were built by one engineer working with agents,
  without the usual slop. Plan in the browser, build on a branch, validate
  through a local gate, ship on merge — 52 merged PRs, 69 review artifacts and
  49 gate-fix commits later.
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

An agent writes plausible code very fast. Most of it is fine; some is
confidently wrong in a way that reads as fine, and the volume means you will not
catch that by reading every diff. One engineer plus a tool that produces more
code per hour than a person can review is a repo that looks healthy and is not.

The failure is not "the AI wrote a bug". It is that nothing in the loop is
allowed to say *stop*. Plans nobody reviewed become code; code nobody reviewed
becomes main; main deploys.

## Pattern

Four things, each of which can refuse.

### Git

The unit of review is a slice a person can hold in their head, not a week of
accumulated edits.

- **One feature branch and one pull request per slice of work**, with
  conventional commit subjects.
- **CI on every PR**, and a deploy that fires on merge through GitHub OIDC with
  no stored AWS keys.
- **A worktree rather than a stash** for isolated fixes, so an in-flight branch
  never has to be unwound to chase something unrelated — `data-qa-agent` still
  carries `.claude/worktrees/golden-build` from exactly that.

The rule is "never ship a red main", and it is worth being precise about how far
that is actually enforced: only ConvFinQA's deploy is mechanically gated on it.
Its workflow triggers on `workflow_run` after CI completes and checks the
conclusion, with a comment in the file saying why — "their deploy fires on push
regardless, which means a red main can ship".

Data Pilot and Transcript RAG deploy on push to `main`. Two of three enforce the
rule by discipline; one enforces it in YAML.

### Lavish

Every non-trivial change starts as a numbered review artifact — `.lavish/sNN_*.html`
— rendered in the browser, read, and annotated *before code exists*.
Architecture, implementation plans, tickets, experiment results, screenshot
sets. The numbering is the spine of the project: `s41` is the worker-scaling
plan, `s42` is its results, and a case study can cite `s42` the way a paper
cites a figure.

That is where the argument happens: reviewing a plan in a browser costs minutes
and changes the whole diff, while reviewing the diff costs hours and changes a
line. **69** artifacts across the four repos — and this rebuild was planned the
same way, from this repo's `.lavish/s04_production-showcase-plan.html`.

They are never gitignored, by workspace rule, which matters more than it sounds:
an artifact you can `git log` is a decision record; one in a temp directory is a
screenshot.

### no-mistakes

A local gate that runs a fixed pipeline over committed work on a feature branch:
**intent → rebase → review → test → document → lint → push → PR → CI**. It will
not run on the default branch and it will not run on an uncommitted tree.

Two properties make it more than a shell script. First, `--intent` is required
and is *the user's goal in their own words*, not a description of the diff — the
review step uses it to tell a deliberate decision apart from a mistake, so a thin
intent makes the gate flag things you already chose.

Second, findings are classified:

- **`auto-fix`** — you may resolve it on your own judgement.
- **`no-op`** — informational.
- **`ask-user`** — a decision that belongs to the human, because it challenges
  their stated intent or changes product behaviour.

Review auto-fix is off by default, so blocking findings park at a gate instead
of being silently self-healed.

Its findings land as commits you can count: `no-mistakes(review|document|lint|test): …`.
**49** of them across the four repos. Two real catches, quoted from the log:

> `no-mistakes(review): Coalesce repeated /health/db probes to throttle Aurora wake abuse`

Data Pilot's Aurora pauses when idle, and `/health/db` is the unauthenticated
probe the frontend uses to decide whether to narrate the wake. It was fenced by a
client-channel header — but that header ships in the bundle, so anyone can copy
it and hammer the endpoint to keep forcing fresh connects, defeating auto-pause,
which is the dominant idle cost.

The fix caches the result for five seconds so the path can only wake Aurora at a
bounded rate regardless of request volume. A cost-and-abuse defect on a no-login
demo, found by the review step rather than by a bill.

> `no-mistakes(review): Guard ws.onopen against listening-flash after cancel`

Transcript RAG's speech-to-text opens a WebSocket. If the user cancels while the
socket is still connecting, `onopen` fires afterwards and the UI flashes into a
listening state nobody asked for. A race in a callback ordering — precisely the
class of bug that reads as correct in a diff.

### …and the portfolio itself

This site closes the loop. `/case-study` (`.claude/skills/case-study/SKILL.md`)
turns a repo into a case study through the same path — survey the repo, fill the
front-matter contract, score the nine rubric dimensions, draw the two diagrams,
lint, review — and `scripts/lint_case_study.py` is the gate at the end of it.

The lint is deliberately unkind. It checks:

- the seven H2s present, exactly titled and in order;
- the scorecard section left empty for the layout to render;
- all nine rubric dimensions once each in `_data/rubric.yml`'s order, with a
  status from the vocabulary;
- anything not `shipped` carrying a reason of at least forty characters;
- and — the load-bearing check — **every path token in a `proof:` field
  resolving in that system's own repo**.

A model can write "shipped" for free. It cannot invent a path that exists.

## In the three systems

Same process, three different amounts of it, because the repos are different
sizes and were built at different times.

| | Data Pilot | ConvFinQA Agent | Transcript RAG | this site |
|---|---|---|---|---|
| merged PRs | 33 | 4 | 13 | 2 |
| commits on `main` | 195 | 14 | 80 | 56 |
| `feat` · `fix` · `docs` | 71 · 35 · 16 | 2 · 0 · 0 | 30 · 2 · 4 | 0 · 0 · 0 |
| `.lavish/*.html` | 40 | 4 | 20 | 5 |
| `no-mistakes(...)` commits | 27 | 0 | 16 | 6 |
| gate branches on the `no-mistakes` remote | 20 | 1 | 9 | — |

**The trail thins with the repo that was built fastest, and ConvFinQA's zero is
squash-merge, not an absent gate.** Source: `gh pr list`, `git log`,
`ls .lavish/*.html` and `git branch -r` in each repo, re-run 2026-08-30.

**Data Pilot** is where the process is fully loaded: 33 PRs, 40 review
artifacts, and 27 gate-fix commits split 10 review · 10 document · 4 lint · 3
test. The `document` share is the surprise — a third of the gate's output is the
docs step noticing that `AGENTS.md`, `README.md` or an `.env.example` no longer
describes what shipped.

**ConvFinQA Agent** is the honest outlier. Four PRs, all squash-merged, so its
`main` is fourteen commits and carries zero `no-mistakes(...)` *subjects* — the
gate ran (two squash-commit bodies still contain its fix lines, and the
`no-mistakes` remote holds its branch), but squashing erased the per-fix history.
Squash-merge and a countable gate trail are mutually exclusive; this repo picked
squash.

**Transcript RAG** sits in between: 13 PRs, 20 artifacts, 16 gate commits (9
review · 5 document · 2 lint), and the largest single entry in the log is
`no-mistakes(review): Address all 14 approved review findings across RAG
pipeline` — one branch, fourteen findings.

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

Totals across the four repos: **52** merged PRs, **69** review artifacts, **49**
`no-mistakes(...)` commits. Workflows are in each repo's `.github/workflows/`
(`ci.yml`, `deploy-aws.yml`); the gate's own definition is
`~/.claude/skills/no-mistakes/SKILL.md`.

Two counts moved since the plan was written and the page uses today's: Transcript
RAG is at 13 merged PRs, not 12, and the gate-commit total is 49 by commit
*subject* — an earlier count of 33 for Data Pilot included six squash-merge
commits whose bodies quote the gate lines. Subjects are the right unit, because
that is what a `git log` reader sees.

## Failure modes

**A gate you skip under time pressure.** The gate is local and optional, which
is why it exists at all — and also why the numbers above are uneven. ConvFinQA
was built fastest and shows the least trail. Nothing in the repo forced it, and
nothing would have.

**Squash-merge erasing the evidence.** ConvFinQA's four PRs collapsed to four
commits. The work happened; the gate ran; the record is gone from the subject
line. If the gate trail is something you intend to count later, the merge
strategy is part of the design, not a preference.

**Review artifacts documenting a plan nobody followed.** A `.lavish/sNN_*.html`
is only worth anything if the code that followed it either matches or the
artifact is updated to say why not.

The numbering helps here — a plan (`s41`) and its results (`s42`) sitting next
to each other make the divergence visible — but nothing enforces it. `s42` was checked against `out/wsweep/summary.json`
before it was cited on the scale page; the other thirty-nine were not.

**Conventional commits as theatre.** 195 commits with tidy prefixes tells you
someone configured a convention, not that the work was any good. The number in
that row that actually says something is the 35 `fix` against 71 `feat` — one
fix commit for every two features, which is what building fast against a live
cloud deployment costs. Pretending otherwise would mean deleting the fixes.

**The gate's own output can be sloppy.** One Transcript RAG subject reads
`no-mistakes(review): {"summary": "Fix added_chunk_count race by summing claimed
videos' chunk counts"}` — the raw JSON envelope leaked into the commit message.
The fix underneath is real; the commit that records it is not clean. A pipeline
that writes commits is a pipeline that can write bad commits.
