# nmp-dsci.github.io

Portfolio site for Nathan Phillips — applied AI engineer. A Jekyll site, built
and served by GitHub Pages, showcasing shipped agent/RAG/eval systems as case studies.

## Structure

- `_projects/` — one Markdown file per case study. Front matter drives the
  home-page card (title, summary, metric, tags, skills) and the project-page
  layout (stack, links, media, evidence). Add a project by dropping a new file
  here — no template or code changes needed.
- `_data/site.yml` — name, role, tagline, and the GitHub/LinkedIn links used
  in the nav, footer, and About page (LinkedIn is the sole contact/résumé
  channel — no separate résumé link/file).
- `_data/skills.yml` — the AI-engineering skills taxonomy (with market-frequency
  labels) used to render each project's "skills demonstrated" chip row.
- `_layouts/` — `default` (shell + nav/footer/theme toggle), `home` (capability
  filters + project cards), `project` (case-study template with media frame,
  evidence gallery, and stack/links sidebar), `page` (About, etc).
- `assets/img/`, `assets/video/`, `assets/dash/` — evidence media (screenshots,
  walkthroughs, self-contained HTML eval dashboards) referenced from a
  project's `media`/`evidence` front matter.

### Adding a project

Create `_projects/<slug>.md` with front matter matching the fields used in the
existing files (`title`, `summary`, `tags`, `metric`, `metric_label`, `stack`,
`skills`, `links.repo`, `media`, `evidence`) and a Markdown body. `skills` keys
must exist in `_data/skills.yml`. Media fields (`media.walkthrough`,
`media.poster`, `media.reel`, `media.gifs`) are optional — until a
recording exists, the layout falls back to a placeholder automatically.

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
