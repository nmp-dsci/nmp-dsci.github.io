---
name: case-study
description: Turn a sibling repo into a portfolio case study on the locked seven-section spine — survey the repo for facts with paths, fill _templates/project.md, score the nine rubric dimensions, draw the two theme-aware SVGs, then lint and build. Use when the user asks for a case study, a project page, a practice page, or invokes /case-study.
argument-hint: <repo-path> | lint | practice <name>
user-invocable: true
---

# case-study

`/case-study` produces one file — `_projects/<slug>.md` — plus its two diagrams,
from a repo that already exists. The site does the rest: `_layouts/project.html`
renders the spine, the scorecard and the home-page matrix from that file's front
matter, so the case study and the matrix can never disagree.

The contract this skill fills lives in four places, and they are the authority
when this file and they disagree:

- `DESIGN.md` — the brief: who the page is for, the evidence rules, and the
  "Never do this" list. Everything below is downstream of it
- `_templates/project.md` — the front-matter schema, one comment per field, and
  the seven H2s
- `_data/rubric.yml` — the nine dimensions, the status vocabulary, the rungs
- `scripts/lint_case_study.py` — the same contract, executable

## Three ways to invoke

| Invocation | What it does |
|---|---|
| `/case-study ../data-qa-agent` | The full run: survey → fill → score → draw → lint → build → review |
| `/case-study lint` | Steps 5 only — `--all --no-net` across every published project and practice |
| `/case-study practice eval-loop` | The same run against `_templates/practice.md` and the five-H2 spine |

The site repo is the working directory in every case. The sibling repos live at
`../<name>` beside it.

## Step 1 · Survey the repo — facts with paths

Read, in this order, and write down what you find **with the path you found it
at**. A fact with no path does not go in the case study.

```bash
REPO=../data-qa-agent
sed -n '1,120p' $REPO/README.md
cat $REPO/AGENTS.md $REPO/CLAUDE.md 2>/dev/null
cat $REPO/SECURITY.md 2>/dev/null
ls $REPO/.github/workflows/ && sed -n '1,80p' $REPO/.github/workflows/deploy-*.yml
ls -R $REPO/infra 2>/dev/null | head -60
ls -R $REPO/evals $REPO/tests 2>/dev/null | head -80
ls $REPO/.lavish/ 2>/dev/null                  # the design write-ups, often the source of a number
git -C $REPO log --oneline -40
git -C $REPO log --oneline --grep=eval | wc -l  # counts you can quote and re-run
```

What you are collecting, mapped to where it lands:

| Looking for | Usually in | Lands in |
|---|---|---|
| what it is, who for, the headline number | README intro | `summary`, `tldr`, `metric`, §1 |
| agents, stages, models, tools, prompts | `src/`, `agent/`, `prompts/`, README §Architecture | §2 + the agent SVG |
| golden set, graders, judge, gate | `evals/`, `tests/`, `.github/workflows/` | §3 + rubric rows 1–4 |
| region, sizing, IaC, smoke test | `infra/terraform/`, `deploy-*.yml`, `scripts/*smoke*` | §4 + rows 8–9 + the topology SVG |
| RLS, AST guards, sandboxes, caps | `SECURITY.md`, guard/limits modules | §5 + row 5 |
| traces, dashboards, cost per answer | `tracking/`, `ops/`, `docs/runbook.md` | §6 + rows 6–7 |

Prefer a smaller true number to a bigger unverified one. If the plan or an older
write-up claims something the repo no longer supports, the repo wins.

## Step 2 · Fill the scaffold

```bash
cp _templates/project.md _projects/<slug>.md
```

Fill every key. Two hard constraints the lint enforces:

- every key in `skills:` and every `skills_detail[].skill` must exist in
  `_data/skills.yml` — do not invent a skill, add it to the taxonomy first
- the seven H2s appear in order, none skipped. If a section has little to say,
  write the short true version; do not delete the heading.

Leave `## 7 · Production readiness scorecard` **empty**. The layout renders it.
Keep `{% include fig-agent.html %}` directly under §2 and
`{% include fig-topology.html %}` directly under §4.

Write like an engineer explaining to another engineer. No "seamless", no
"robust", no "cutting-edge". The existing `_projects/*.md` bodies are the voice.
British/Australian spelling. Em dashes are fine; three in one paragraph is not.

### The three card lines

A visitor scans for 60–90 seconds and reads about a quarter of the words
(DESIGN.md §1). These three fields are most of what they actually take in, so
they are written last, from what the body turned out to prove — not first, from
what you hoped it would.

| Field | Limit | What it does |
|---|---|---|
| `headline` | ≤ **9 words**, never equal to `title` | The outcome, not the name. "Governed NL→SQL in production" — not "Data Pilot" |
| `outcome` | **one sentence**, ≤ 25 words | The achievement with its stake, for the home-page row. What goes wrong without it |
| `proof_line` | **one sentence**, and it MUST carry a number | The TL;DR "Proof" cell. The number brings its baseline or denominator with it: "77.1%, up from 73.0% (594/770)", never a bare "77.1%" |

### `sections:` — one summary per H2

```yaml
sections:
  - n: 1
    summary: "A data agent is only useful if its users can be trusted with the rows it returns."
```

One entry per H2, `n` matching the number in the heading, 1..7 in order. Each
`summary` is **one sentence of at most 24 words** and states the **point** of the
section, not its topic:

- ✅ "Governance is the product, not a feature."
- ❌ "This section covers governance."

They render in the reading rail beside the prose, so a scanner who reads nothing
else gets seven sentences that add up to the argument.

### Prose rules the lint enforces

1. **No paragraph over 80 words.** Over that it does not get read. Split at the
   natural seam; do not delete content to fit. The lint reports the first 60
   characters and the word count, and warns (`!`, not a failure) at 65–80 so you
   can see the ones sitting near the limit. Fenced code, tables, lists,
   blockquotes, HTML blocks and Liquid tags are not paragraphs and are not
   measured.
2. **Enumerations become lists or tables.** If a sentence carries three or more
   parallel items — three cost caps, four tools, eight configurations, graders
   G1–G3 — lift them into a markdown list or table. This is the single biggest
   readability win available in a 2,700-word page, and it is usually also what
   fixes an over-length paragraph.
3. **Keep inline `code`** for paths, identifiers and commands.
4. **A figure caption states the takeaway first, then the source.** Never the
   topic:

   ```markdown
   **The model never touches the database directly.** Every path from question
   to report passes the AST guard and then RLS.
   Source: db/init/02_rls.sql, agent/sql_guardrails.py
   ```

5. **No placeholder for media that does not exist** (DESIGN.md rule 5). If the
   walkthrough is not recorded, `walkthrough: ""` — the slot is then not
   rendered at all. `planned`, `coming`, `tbd`, `todo` fail the lint, because a
   promise in a portfolio reads as a thing that was never finished.

## Step 3 · Score the nine rows

One row per dimension in `_data/rubric.yml`, in that file's `order:`, each with
`status` · `how` · `proof`.

```
status: shipped ●   built, measured, in the repo
        partial ◐   present but narrower than the rubric asks
        designed ○  written up, not built
        na —        not needed by design (still say why in `how`)
```

Anything that is not `shipped` must carry its reason in `how`. This is not a
formality: a hollow dot with a reason reads as engineering judgement, nine green
dots reads as marketing.

**State the failure mode plainly, because it is yours.** The characteristic way
this step goes wrong is an LLM rating rows `shipped` generously — reading a
`tests/` directory as a regression gate, a `print()` as a trace, a README
paragraph as a deployed thing. Nothing in the prose stops you doing that.

The backstop is `proof:`. Every row carries `· `-separated repo paths, and
`scripts/lint_case_study.py --repo <path>` resolves each one against the actual
repo. A generous rating survives only if you can also name a file that exists.
So write the proof paths first, then pick the status that those paths support —
not the other way round. When you cannot find a path, the row is `partial` or
`designed`, and the reason you could not find one is the `how`.

Then set `production.score` to the count of `shipped` rows as `N / 9`. The lint
recomputes it, so guessing here is pointless.

## Step 4 · Draw the two diagrams

```bash
cp _templates/agent-structure.svg _includes/diagrams/agent/<slug>.svg
cp _templates/topology.svg        _includes/diagrams/topology/<slug>.svg
```

Both are **inlined** by the layout, never `<img>`, which is why they can use
`currentColor` and work in both themes from one file. The style contract is in
the comment at the top of each template and the lint checks the mechanical part:

- `viewBox="0 0 320 100"` (±10 height), no `width=`/`height=` on the root `<svg>`
- `class="dia"`, `role="img"`, an `aria-label` describing the whole flow
- a `<title>` inside every `<g>` — the hover tooltip and the accessible name
- marker ids unique on the page: `ar-<slug>` for the agent, `tp-<slug>` for the
  topology (both diagrams can appear on one page)

Agent diagram: left → right is the request path; highlight (`.hi`) the two or
three nodes that are the point of the system; the `.cap` line says how it is
kept honest. Topology: visitor → front door → compute → data, off-path
infrastructure on the top row, `.cap` carries region · IaC · what demo mode
changes.

Then set `architecture.diagram: "diagrams/agent/<slug>.svg"` and
`production.topology_diagram: "diagrams/topology/<slug>.svg"` — include-relative,
not site-relative.

## Step 5 · Lint

```bash
uv run --with pyyaml --no-project python scripts/lint_case_study.py \
    _projects/<slug>.md --repo ../<repo-dir>
```

Every check prints one line: `✓` held, `✗` broken, `!` near a limit (a warning,
never a failure), `~` not checked. Fix until `PASS`. The lines most likely to be
red on a first draft are `paragraphs:` and `sections:` — both are fixed by
splitting a paragraph or lifting an enumeration into a list, never by cutting a
fact. Across everything, as CI runs it:

```bash
uv run --with pyyaml --no-project python scripts/lint_case_study.py --all --no-net
```

`--no-net` skips the live `links.demo` request; drop it locally to confirm the
demo URL still answers 200 and that a demo build still answers `"mode":"demo"`.
For a practice page, `--practice` (or just a path under `_practices/`).

CI runs this same command plus the contrast audit
(`scripts/contrast_audit.py assets/css/tokens.css`) in
`.github/workflows/lint.yml`, so a case study that passes locally passes there.

## Step 6 · Build

The repo has no local Ruby toolchain, so the build runs in a container. Build
the image once:

```bash
printf 'FROM ruby:3.3-slim\nRUN apt-get update && apt-get install -y --no-install-recommends build-essential git && gem install github-pages\nWORKDIR /site\n' > /tmp/ghp.Dockerfile
docker build -f /tmp/ghp.Dockerfile -t ghp-jekyll:local /tmp
```

Then, from the site root:

```bash
docker run --rm -e JEKYLL_NO_BUNDLER_REQUIRE=true -v "$PWD":/site -w /site \
    ghp-jekyll:local jekyll build -d /site/_probeout -q
```

A silent run is a pass. Check the page rendered and the diagram inlined:

```bash
grep -c 'class="dia"' _probeout/projects/<slug>/index.html   # expect 2
rm -rf _probeout
```

## Step 7 · Review, then gate

Open the draft for a human read before it is committed — the point is to catch a
claim that is technically true and still misleading, which no lint can see:

```bash
npx -y lavish-axi .lavish/sNN_<slug>-case-study.html
```

Then commit on a branch and run the gate:

```bash
git checkout -b case-study/<slug>
git add _projects/<slug>.md _includes/diagrams/agent/<slug>.svg _includes/diagrams/topology/<slug>.svg
git commit -m "feat(case-study): <slug> on the seven-section spine"
```

then `/no-mistakes` with the intent stated as what you set out to prove.

## `/case-study practice <name>`

Same shape, different contract:

```bash
cp _templates/practice.md _practices/<name>.md
uv run --with pyyaml --no-project python scripts/lint_case_study.py _practices/<name>.md
```

The prose rules are the same — 80-word paragraphs, enumerations as lists,
takeaway-first captions. The three card lines and `sections:` are optional on a
practice (it has no system card), but the lint holds them to the same limits
whenever they are present.

A practice is a generalised case study: one pattern shown across all three
systems, on the spine Problem → Pattern → In the three systems → Evidence →
Failure modes. `systems:` are `_projects/` slugs, `rubric:` are dimension keys.
The interesting part is where the three systems *differ* — say where one does
less, and why. Every count under "Evidence" needs the command that reproduces
it, and "Failure modes" needs a named failure with its fix, not a list of
virtues.

## Why a skill and not just a template

A template can hold the shape. It cannot do the part that is actually hard.

- **The work is the survey, not the Markdown.** Tying every claim to a path
  means reading a repo's README, workflows, IaC, evals and git log and keeping
  track of what supports what. That is the repeatable part, and it is the part
  a blank template leaves entirely to whoever is holding it.
- **It keeps the rubric honest.** The skill cannot rate a row `shipped` without
  a proof path the lint can resolve. The template asks nicely; the skill plus
  the lint makes it structural.
- **It is proven before it is reused.** The three production case studies were
  built through this skill, so the contract has already survived three real
  repos rather than one imagined one.
- **The toolchain is itself the argument.** Plan in Lavish → `/case-study` →
  lint → `/no-mistakes` → merge → Pages deploy is the same path the systems
  themselves ship on. A portfolio that is built the way its subject is built is
  making a claim it can support.
