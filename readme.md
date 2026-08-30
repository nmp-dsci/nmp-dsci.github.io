# nmp-dsci.github.io

Portfolio site for Nathan Phillips — applied AI engineer. A Jekyll site, built
and served by GitHub Pages, showcasing shipped agent/RAG/eval systems as case studies.

## Structure

- `_projects/` — one Markdown file per case study. Front matter drives the
  home-page card (title, summary, metric, tags), the project-page layout (tldr,
  skills, skills_detail, stack, links, media) and the production scorecard
  (`production.rubric`). Files carrying `published: false` stay in git and out
  of the build.
- `_practices/` — the second collection: a practice is a generalised case study,
  one pattern shown across all three systems, on its own five-section spine.
- `_data/site.yml` — name, role, tagline, and the GitHub/LinkedIn links used
  in the nav, footer, and About page (LinkedIn is the sole contact/résumé
  channel — no separate résumé link/file).
- `_data/skills.yml` — the AI-engineering skills taxonomy (with market-frequency
  labels) used to label a project's skills in the TL;DR strip and the
  "skills demonstrated" chips.
- `_data/rubric.yml` — the nine production dimensions, the status vocabulary and
  the scale rungs. One source of truth for both the home-page matrix and every
  case study's scorecard, so the two can never disagree.
- `_templates/` — the scaffolds you copy: `project.md`, `practice.md`, and the
  two SVG style contracts. Excluded from the build.
- `_includes/diagrams/agent/`, `_includes/diagrams/topology/` — one SVG per
  system, per kind. They are *inlined* by the layout rather than loaded as
  `<img>`, which is what lets them use `currentColor` and be correct in both
  themes from one file.
- `_layouts/` — `default` (shell + nav/footer/theme toggle), `home` (hero
  metric strip, live-system project cards, rubric explainer), `project`
  (case-study template with a TL;DR strip, media frame, "skills demonstrated"
  proof list, scorecard and stack/links sidebar), `practice`, `page`
  (About, etc).
- `assets/img/`, `assets/video/`, `assets/audio/`, `assets/dash/` — evidence
  media (screenshots, captioned walkthroughs, sample call audio, self-contained
  HTML eval dashboards) referenced from a project's `media` front matter or
  from inline `<figure class="evidence">` blocks in the body.
- `scripts/lint_case_study.py` — the contract, executable. Run by
  `.github/workflows/lint.yml` on pull requests.
- `.claude/skills/case-study/` — the `/case-study` skill that turns a sibling
  repo into a case study through that contract.
- `.lavish/` — design/planning write-ups kept with the repo for reference.
  Tracked in git but excluded from the Jekyll build via `_config.yml`.

### Adding a project

A case study is not a free-form page any more. The structure is a contract, and
it lives in three places rather than in this readme:

- `_templates/project.md` — the scaffold. Every front-matter key is present with
  a one-line comment saying what goes there and where to find it in a repo, then
  the seven H2s with a prompt under each. Copy it to `_projects/<slug>.md`.
- `_data/rubric.yml` — the nine dimensions, the status vocabulary and the rungs.
- `scripts/lint_case_study.py` — the same contract, executable.

```bash
cp _templates/project.md _projects/<slug>.md
uv run --with pyyaml --no-project python scripts/lint_case_study.py \
    _projects/<slug>.md --repo ../<repo-dir>
```

Or let the skill do the survey: `/case-study ../<repo-dir>` reads the repo's
README, workflows, IaC, evals and git log, fills the scaffold, scores the nine
rows, draws the two diagrams and runs the lint. See
`.claude/skills/case-study/SKILL.md`.

**The spine.** Seven H2s, in order, none skipped: Purpose & benefit · Agent
architecture · Agent loop & evaluation · Deployed architecture · Guardrails &
security · Observability & cost · Production readiness scorecard. §2 carries
`{% include fig-agent.html %}` and §4 carries `{% include fig-topology.html %}`;
§7 is left **empty** because the layout renders it from front matter.

**The `production:` block.** New, and the reason the spine is locked: `live`,
`surface`, `topology`, `topology_diagram`, `region`, `cost`, `rung`,
`rung_note`, `score`, and `rubric` — nine rows, one per `_data/rubric.yml`
dimension, each `{dimension, status, how, proof}`. Statuses are `shipped ●`,
`partial ◐`, `designed ○`, `na —`, and anything that is not `shipped` must carry
its reason in `how`: a hollow dot with a reason reads as engineering judgement,
nine green dots reads as marketing. `proof` is a `· `-separated list of repo
paths, and the lint resolves every one of them against `--repo` — which is what
stops a row being rated generously.

**Diagrams.** Two SVGs per system, from `_templates/agent-structure.svg` and
`_templates/topology.svg`, written to `_includes/diagrams/agent/<slug>.svg` and
`_includes/diagrams/topology/<slug>.svg`. Front matter carries include-relative
paths (`architecture.diagram`, `production.topology_diagram`) because the layout
inlines them with `{% include %}` — that is what makes `currentColor` and the
CSS custom properties resolve, so one file is correct in light and dark. The
agent structure is the visual identity of the system and appears on the home
card too; the deploy topology appears only in §4.

**The rest still holds.** `tldr` is the one-line "What" in the 30-second strip
(the strip also shows `metric`/`metric_label` as "Proof", the first five
`skills`, and the `links.repo`/`links.demo` pair). Keys in `skills` and
`skills_detail` must exist in `_data/skills.yml`. Media fields
(`media.walkthrough`, `media.poster`, `media.captions`, `media.reel`) are
optional and fall back to a placeholder; `media.captions` points at a WebVTT
file attached as a default English caption track. `featured: true` puts the
project in the home-page card grid; `order` sorts within it. `published: false`
keeps a file in git and out of the build.

Evidence is placed inline in the body as a `<figure class="evidence">`
containing an `<img>`, an `<audio>` player, or a `<div class="dash-embed">`
iframe — inline figures let the evidence sit next to the prose that explains
it, rather than in a separate gallery driven by front matter.

### Adding a practice

A practice is a generalised case study: one pattern, shown across all three
systems. Copy `_templates/practice.md` to `_practices/<name>.md`. Its front
matter is `title`, `summary`, `tldr`, `order`, `kicker`, `systems` (slugs in
`_projects/`), `rubric` (dimension keys it explains) and `evidence_note`; its
spine is Problem → Pattern → In the three systems → Evidence → Failure modes.

```bash
uv run --with pyyaml --no-project python scripts/lint_case_study.py \
    _practices/<name>.md --practice
```

### The lint

```bash
uv run --with pyyaml --no-project python scripts/lint_case_study.py --all --no-net
```

Stdlib + PyYAML, no virtualenv. It checks the front-matter schema, that skills
and rubric keys resolve in `_data/`, that all nine dimensions are present in the
right order with statuses from the vocabulary, that non-`shipped` rows say why,
that every `proof:` path exists in the sibling repo, that both diagrams parse
and keep the style contract, that the seven H2s are in order with §7 empty, that
`score` matches the count of shipped rows, and — without `--no-net` — that
`links.demo` answers 200 and a demo build answers `"mode":"demo"`. Each check
prints one `✓` / `✗` / `~` line and the file ends in `PASS` or `FAIL`.

`.github/workflows/lint.yml` runs it on pull requests. GitHub Pages still builds
and deploys the site natively; the workflow only adds a check.

## Theming

Light/dark mode defaults to the OS preference, is togglable via the nav
button, and persists across visits through `localStorage`.

## Running locally

```
bundle install
bundle exec jekyll serve
```

Requires Ruby and Bundler. GitHub Pages builds the site natively on push to
`master` — no CI pipeline is needed.
