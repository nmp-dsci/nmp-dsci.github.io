# CLAUDE.md — nmp-dsci.github.io

The site is a Jekyll build with three content collections and one executable
contract. Read `DESIGN.md` for the visual brief and
`scripts/lint_case_study.py` for the rules that are enforced rather than
described. This file covers the one thing neither of those said out loud: how a
page presents what it knows.

---

## Presentation mode — how every page presents information

Every published page is a presentation, not an essay. The unit is a **slide**:

```
ASSERTION HEADLINE  — a claim, with its number
VISUAL              — the chart, diagram or table that IS the evidence
ONE INSIGHT LINE    — what it means, once, in under 25 words
```

Why this shape and not another:

- Readers get through **20–28% of the words** on a page and the average visit
  runs under a minute; the dominant motion is the **layer cake** — jump
  headline to headline, and drop into body text only when a headline earns it
  ([NN/g eyetracking](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/)).
  A heading that names a topic spends the one thing a scanner reliably reads
  and returns nothing.
- A **sentence assertion over explanatory graphics** beat a phrase headline over
  a bullet list on comprehension, misconceptions, perceived cognitive load and
  delayed recall, across 110 engineering students
  ([Alley, Penn State](https://pure.psu.edu/en/publications/how-the-design-of-presentation-slides-affects-audience-comprehens/)).
  So the heading carries the claim and the figure carries the proof — never a
  bullet list that restates the figure in words.

### The rubric — score a page before publishing it

| Ref | Dimension | Holds (2) when | Fails (0) when |
|---|---|---|---|
| **P1** | Assertion headline | every heading states a claim | headings name topics |
| **P2** | Visual evidence | a figure under every claim | no chart on the page |
| **P3** | One insight | one takeaway line per visual, ≤ 25 words | a prose block |
| **P4** | Impact order | outcome + skill in the first screen | setup-first |
| **P5** | Scan cost | inside the body-word budget below | over it, or a paragraph over 80 |
| **P6** | Skill on display | the AI-system capability is named and scored | absent |
| **P7** | Honest number | baseline / denominator / caveat adjacent | bare numbers |

**P1–P4 outrank P5–P7.** Adding a chart that costs words is a good trade —
P2 gains two, P5 loses one. Cutting a caveat to save words is never a good
trade: it costs P7, and it costs the argument the site exists to make.

### The scan budget

Body words, front matter excluded. A warning, never a build failure — length is
a trade, and the right response to going over is usually to move mechanism down
a level, not to cut a fact.

| Page type | Budget | Why that number |
|---|---|---|
| `_projects/` | **1,800** | the 60–90 second scan; mechanism belongs on the deep page |
| `_practices/` | **2,200** | one pattern across three systems, each section a mini-case, plus an evidence table where every count carries its command |
| `_deep/` | **2,500** | the "in full" level — the page the other two link down to |
| a standalone page | **800** | About and the like |

`_practices/production-scale.md` sits at 2,429 against 2,200 and is over on
purpose: the excess is its three-rung comparison table and its evidence
section, and both are the page.

### Order, always

1. **The outcome**, with its baseline and its caveat.
2. **The visual** that proves it.
3. **The mechanism** — how it was made to happen.
4. **The setup** — what had to exist first.

Never the reverse. A reader who leaves after the first screen must still have
the result, and must know which engineering skill produced it. Mechanism and
setup belong on the deep page when the case study runs long — moved, not cut.

### Banned heading forms

`Architecture` · `Cost` · `What it is` · `Problem` · `The build` · `Overview`
`Setup` · `Results` · `Background` · `Approach` — any noun that names a topic.

A spine heading keeps its stable label so the contract stays checkable, then
carries the claim after an em dash:

```markdown
## 5 · Guardrails & security — six layers, and a bug is still not a leak
## Gate & promote — significance, not a better number, decides
```

The label before ` — ` must match the spine exactly. The claim after it runs at
most **10 words**. `scripts/lint_case_study.py` fails the build on both.

An **H3** carries no spine label, so it is measured whole: it may name its
subject as long as it goes on to say something about it. `### Git` fails;
`### Git — a branch per change, and the message says why` passes. Anything
under three words is a topic label whatever it is called.

### One insight, not a bullet pile

A bullet list under a chart that restates the chart is the AI-slop signature.
One line. If a second line is genuinely needed, the chart is doing too much —
split it into two.

The one exception is a numbered `.slide` block on a case study, where three or
four **question-and-answer** bullets are the format: each bullet asks the thing
a reader would ask and answers it in a clause. They are not a summary of the
figure; they are the things the figure cannot say.

### What counts as a visual

An inline `{% include diagrams/… %}` the author placed. The agent and topology
diagrams the layout injects through `fig-agent.html` / `fig-topology.html` do
not count toward P2 — they describe the system, they do not evidence a claim.
Charts live in `_includes/diagrams/chart/` and follow the `.dia` contract in
`DESIGN.md`: `currentColor`, the site's class vocabulary (`.tx`, `.tx.s`,
`.tx.k`, `.nd`, `.nd.hi`, `.bar`, `.ci`, `.pt`, `.ax`, `.gl`), a `<title>` in
every `<g>`, and an `aria-label` that describes the whole figure.

A system may override the figure the home page shows for it with
`architecture.home_diagram` — the home row is the scan layer, so a chart with a
number on it usually earns those 545 pixels more than a box-and-arrow of the
same stages does. The case study's §2 still renders `architecture.diagram`.

**Never draw a number that is not in a repo.** A chart with no committed source
is worse than no chart, because it looks like evidence.

---

## The checks that run

```bash
# the contract, across every published page
uv run --with pyyaml --no-project python scripts/lint_case_study.py --all --no-net

# one page, with its sibling repo's proof paths resolved
uv run --with pyyaml --no-project python scripts/lint_case_study.py \
    _projects/<slug>.md --repo ../<repo-dir>

# the build (no local Ruby toolchain — this runs in a container)
docker run --rm -e JEKYLL_NO_BUNDLER_REQUIRE=true -v "$PWD":/site -w /site \
    ghp-jekyll:local jekyll build -d /site/_probeout -q

# layout + axe across 10 pages × 3 widths × 2 themes
node scripts/audit_pages.mjs http://127.0.0.1:8790
```

CI runs the lint and the contrast audit on every pull request
(`.github/workflows/lint.yml`).

---

## Where things live

| Path | What it is |
|---|---|
| `_projects/` | case studies · seven-section spine · the home-page matrix reads their front matter |
| `_practices/` | one pattern across all three systems · five-section spine |
| `_deep/<slug>/<name>.md` | one system's setup in full, at `/projects/<slug>/<name>/` · five-section spine |
| `_includes/diagrams/chart/` | evidence figures — the ones that satisfy P2 |
| `_includes/diagrams/{agent,topology,loop,runtime}/` | structural diagrams |
| `_data/rubric.yml` | the nine production dimensions, the status vocabulary, the rungs |
| `scripts/lint_case_study.py` | the contract, executable |
| `DESIGN.md` | the visual brief and the never-list |
| `.lavish/sNN_*.html` | the review artifact written before each change |

Six `_projects/` pages carry `published: false` (decision D4a — the site shows
only the three production systems). They do not render and the lint skips them;
do not spend rubric work on them without changing that decision first.

---

## Voice

Write like an engineer explaining to another engineer. British/Australian
spelling. No "seamless", "robust", "cutting-edge", "leverage". Inline `code`
for paths, identifiers and commands. Every claim carries the path it came from,
and a smaller true number always beats a bigger unverified one.
