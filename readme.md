# nmp-dsci.github.io

Portfolio site for Nathan Phillips — applied AI engineer. A Jekyll site, built
and served by GitHub Pages, showcasing shipped agent/RAG/eval systems as case studies.

## Structure

- `_projects/` — one Markdown file per case study. Front matter drives the
  home-page card (title, summary, metric, tags) and the project-page layout
  (tldr, skills, skills_detail, stack, links, media, evidence). Add a project
  by dropping a new file here — no template or code changes needed.
- `_data/site.yml` — name, role, tagline, and the GitHub/LinkedIn links used
  in the nav, footer, and About page (LinkedIn is the sole contact/résumé
  channel — no separate résumé link/file).
- `_data/skills.yml` — the AI-engineering skills taxonomy (with market-frequency
  labels) used to label a project's skills in the TL;DR strip and the
  "skills demonstrated" chips.
- `_layouts/` — `default` (shell + nav/footer/theme toggle), `home` (hero
  metric strip, capability filters + project cards), `project` (case-study
  template with a TL;DR strip, media frame, "skills demonstrated" proof list,
  evidence gallery, and stack/links sidebar), `page` (About, etc).
- `assets/img/`, `assets/video/`, `assets/audio/`, `assets/dash/` — evidence
  media (screenshots, captioned walkthroughs, sample call audio, self-contained
  HTML eval dashboards) referenced from a project's `media`/`evidence` front
  matter or from inline `<figure class="evidence">` blocks in the body.
- `.lavish/` — design/planning write-ups kept with the repo for reference.
  Tracked in git but excluded from the Jekyll build via `_config.yml`.

### Adding a project

Create `_projects/<slug>.md` with front matter matching the fields used in the
existing files (`title`, `summary`, `tldr`, `tags`, `metric`, `metric_label`,
`featured`, `order`, `stack`, `skills`, `skills_detail`, `links.repo`, `media`,
`evidence`) and a Markdown body.

- `tldr` — the one-line "What" in the project page's 30-second strip; falls
  back to `summary` when omitted. The strip also shows `metric`/`metric_label`
  as "Proof", the first five `skills`, and the `links.repo`/`links.demo` pair.
- `skills` / `skills_detail` — keys in both must exist in `_data/skills.yml`.
  `skills_detail` is a list of `{skill, proof}` pairs that renders the "Skills
  demonstrated" section, each chip paired with the concrete evidence for it;
  omit it and the section is skipped.
- Media fields (`media.walkthrough`, `media.poster`, `media.captions`,
  `media.reel`) are optional — until a recording exists, the layout falls back
  to a placeholder automatically. `media.captions` points at a WebVTT file and
  is attached to the walkthrough video as a default English caption track.
- `featured: true` puts the project in the home-page card grid, `false` in the
  "Earlier work" list; `order` sorts within each. The featured case studies
  follow a shared spine — `## Architecture` then `## Cost`.

Evidence can come from the `evidence` front matter (`type: image` or
`type: dashboard`, rendered after the body) or be placed inline in the body as
a `<figure class="evidence">` containing an `<img>`, an `<audio>` player, or a
`<div class="dash-embed">` iframe — inline figures let the evidence sit next to
the prose that explains it.

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
