---
name: review
description: Open one built page of the site in Lavish so the user can pin comments on the real page; apply each note to the source, rebuild, re-export and reply until they press Send & End, then run the checks and the gate. Use when the user asks to review a page, comment on the site, or invokes /review.
argument-hint: <page> — index | projects/<slug> | projects/<slug>/<deep> | practices/<name> | about
user-invocable: true
---

# review

`/review <page>` is the Lavish loop pointed at the site instead of a plan. The
reviewer annotates the page as it is built; the agent edits the source the page
is rendered from, never the copy.

## Open

```bash
# the local server backs every nav link in the review copy
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8790/ || \
  (cd _probeout && nohup python3 -m http.server 8790 --bind 127.0.0.1 >/dev/null 2>&1 &)

FILE=$(python3 scripts/review_page.py <page>)      # builds, rewrites, copies assets
npx -y lavish-axi "$FILE"
npx -y lavish-axi poll "$FILE"                      # foreground; stays silent until a note arrives
```

Never open the session URL in your own browser tab: Lavish keeps one live view,
and yours invalidates the user's. Verify with headless Playwright against the
file if you need to see it.

## Each note

A note arrives with a CSS selector, the element's text and the user's words.
Map the selector to source before touching anything:

| Selector contains | Source |
|---|---|
| `#slide-Na` | that `.slide` block in `_projects/<slug>.md` |
| `svg.dia` / a `<g>` title | the include under `_includes/diagrams/…` |
| `.matrix`, `.star`, `.hero`, `.row` | `_layouts/home.html` or `_includes/*.html`, styled in `assets/css/main.css` |
| an `h2` | the spine heading — label is locked, the claim after ` — ` is editable, ≤ 10 words |
| `.rail`, `.sections` | `sections[].summary` in the front matter, ≤ 24 words |
| `figcaption`, `.fig-title` | the figure block in the Markdown |

Then, per note:

1. edit the source;
2. `uv run --with pyyaml --no-project python scripts/lint_case_study.py <file> --repo ../<repo> --no-net` for a case study or deep page — a note that would break the contract gets a reply saying why, not a silent edit;
3. `python3 scripts/review_page.py <page>` (rebuild + re-export) — Lavish reloads the revision;
4. `npx -y lavish-axi poll "$FILE" --agent-reply "<one line per note: what changed, or why not>"`.

Batch the notes from one send into one rebuild.

## Send & End

The final poll response still carries the last notes; apply them, then:

```bash
uv run --with pyyaml --no-project python scripts/lint_case_study.py --all --no-net
docker run --rm -e JEKYLL_NO_BUNDLER_REQUIRE=true -v "$PWD":/site -w /site ghp-jekyll:local jekyll build -d /site/_probeout -q
node scripts/audit_pages.mjs http://127.0.0.1:8790
python3 scripts/contrast_audit.py assets/css/tokens.css
```

Commit on the branch with the notes as the body — one line each, what the
reviewer asked and what was done — then `/no-mistakes` with the same as the
intent. Do not reopen the session afterwards unless asked.
