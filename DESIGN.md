# DESIGN.md — the brief this site is built to

The source of truth for how nmp-dsci.github.io looks and reads. Written before
the layouts, and updated with them. If a change here and a change in
`assets/css/tokens.css` disagree, this file is wrong — fix it.

Design direction chosen 31 Aug 2026 from `.lavish/s05_design-evaluation-redesign.html`:
**Option A, "Field Guide"** — evolve the existing identity onto a real token
system, make the rubric matrix the star, and rebuild the case study as a
reading surface. Scored 137/145 (94%) against the twelve-dimension design rubric
in that artifact; the site it replaces scored 73/145 (50%).

---

## 1. Who it is for and what it has to do

**Visitor:** a hiring manager or senior engineer deciding whether to interview
the author. They arrive from LinkedIn, a CV, or a GitHub profile, and they scan
for 60–90 seconds before deciding to read or leave. Research (NN/g) says they
will get through at most ~28% of the words on any page.

**The one action:** open a case study, then start a conversation. Every page
ends in a next step; no page dead-ends at the footer.

**Their objection:** "anyone can demo an LLM — can he run one?" The nine-dimension
production rubric, the honest ●/◐/○ scores and the live AWS demos exist to
answer exactly that, so they must be reachable in the first viewport.

**What we are not:** a design portfolio, an agency site, or a blog. Nothing here
should look like a template, and nothing should look like a pitch deck.

---

## 2. The rules

### Type
- Three voices from one superfamily, each with one job. **IBM Plex Serif** is the
  anchor display face — `h1`, `h2` and the reading column. **IBM Plex Sans** is
  the interface — `h3`, labels, buttons, nav, table headers. **IBM Plex Mono** is
  data — numbers, paths, keys, status words. Mono is never used for prose or for
  a heading, and the serif is never used for a control.
- **One decorated keyword per page, and only inside an `h1` or `h2`:** a single
  `<em>`, set in serif italic at weight 400 in `--accent`. It is the one place
  emphasis is allowed to be a colour. Two is scatter, and
  `scripts/lint_case_study.py` fails the build on the second one.
- One scale: 16px UI base × 1.25, declared as `--t-2 … --t6`. No size outside it.
- **Nothing on the site is smaller than `--t-2` (12.8px).** The old site had ~77
  text nodes under 10px; that is the single biggest reason it was unreadable.
- Reading measure `--measure: 68ch`, line-height 1.6. Prose paragraphs cap at
  **80 words**; anything longer becomes two paragraphs or a list.
- Letter-spacing is used in exactly one place: `--track-label` on uppercase mono
  labels. Display type is tracked in, never out.
- `text-wrap: balance` on headings, `pretty` on paragraphs.

### Colour
- 60/30/10: surfaces (`--bg --panel --band`), ink (four steps), accent.
- **The accent means "act on this" or "shipped".** Primary buttons, links, and
  the shipped status. It is not used for decoration, borders, diagram fills that
  carry no status, or the wordmark.
- `--amber` means exactly one thing: **partial**. `--line-3` outlines mean
  **designed, not built**. Status is never colour alone — every glyph is
  accompanied by the word.
- Every text/surface pair is declared in the `@contrast` block of
  `tokens.css` and checked by `scripts/contrast_audit.py` **in both themes**, in
  CI. Nothing ships under 4.5:1 (3:1 for meaningful borders).

### Space and shape
- One 4/8-point ladder (`--s1 … --s10`), one section rhythm (`--sec-gap`
  between, `--sec-pad` within), both stepped down at 900px and 560px.
- **One radius** (`--r`), one small radius for chips and cells, one shadow.
  Mismatched radii are the classic tell of a site built without a system.
- Sections alternate `--bg` and `--band`. Cards sit on the band without borders;
  the border is not how we separate things — space is.

### Motion
- Micro only: 300ms `--dur` with `--ease` on hover, focus and reveal. No
  scroll-jacking, no parallax, no autoplay video, no 3D.
- Every transition reads `--dur`, so `prefers-reduced-motion` disables the lot
  by changing one token.
- Focus is always visible: a 2px `--focus` ring with a 2px offset.

### Evidence
- **Every number carries its baseline or denominator in the same sentence.**
  "77.1%, up from 73.0% (594/770)" — never a bare "77.1%".
- Proof paths sit next to the claim they support, not in an appendix.
- Figures caption the *takeaway*, not the topic, and name their source.
- Honest ratings are the point: a hollow dot with a reason is worth more than a
  row of filled ones, so `partial` and `designed` are never faded out.

---

## 3. Never do this

Committed as rules so they survive future sessions:

1. **No ghost primary action.** The primary button is solid `--accent`; the
   secondary is an underlined link. Never two outlined buttons side by side.
2. **No text under `--t-2`.** Including labels, captions, legends and keys.
3. **No accent outside action, link and "shipped".**
4. **No decorative background pattern.** The old grid-paper background competed
   with 2,700 words of prose on every case study.
5. **No placeholder for media that does not exist.** No "video coming", no
   "reel coming". If it isn't recorded, the slot isn't rendered.
6. **No headline metric strip.** Three big numbers with no stakes read as a
   pitch deck, and benchmark figures are not wins. Proof belongs inside the
   system row and the matrix, attached to the system it describes.
7. **No bare hero.** The first viewport carries the rubric matrix — the evidence
   is the hero image.
8. **No purple, no Inter, no gradient cards, no uniformly rounded pastel
   panels, no wide letter-spacing on display type** — the named AI-slop
   signature. This site is meant to look engineered, not generated.
9. **No cookie banner, no chat widget, no newsletter modal, no analytics beyond
   the existing GA4 tag.**
10. **No em dash cluttering** — em dashes are fine in prose, but do not use them
    as a substitute for a full stop three times in one paragraph.
11. **No side-scrolling the rubric matrix on a phone.** It abbreviates instead:
    under 560px the system columns take each project's `short:` label, the
    tracking comes off, and the row header stacks under its ref. This was
    written as a rule long before it was implemented, and in the meantime the
    headers collided and "TRANSCRIPT" ran off the panel edge at 390px — which
    is why `scripts/audit_pages.mjs` now measures it.
12. **No paragraph over 80 words in a case study.** The lint fails the build.
13. **No second decorated keyword.** One `<em>` per page, in the `h1`. A page
    with two emphasised words has emphasised nothing.
14. **No navigation surface with a hand-maintained list.** The nav dropdown, the
    footer page tree and `#work` all read the same
    `where production.live` query, so an unpublished project cannot leak into
    one of them by being forgotten in another.
15. **No standalone control under 24×24px** (WCAG 2.5.8). Links set inline in a
    sentence are exempt and are left alone — padding them would wreck the line
    rhythm of the prose.
16. **No link distinguished from its surrounding text by colour alone**
    (WCAG 1.4.1). Inside any block of prose a link is underlined, not just
    tinted.
17. **No asset URL without its build revision.** GitHub Pages serves CSS and JS
    with `max-age=600`, so an unversioned URL gives returning visitors up to ten
    minutes of new HTML against an old stylesheet. It happened on two
    consecutive deploys before the `?v=` was added.

---

## 4. Structure

| Surface | Job | Spine |
|---|---|---|
| Home | Answer "who, what, and can he run it?" in one viewport | hero + matrix → three systems → the nine dimensions → scale ladder → practices → contact |
| Case study | Reward a 90-second scan and a 12-minute read equally | header + TL;DR → TOC · prose · rail → scorecard → skills → next system |
| Practice | Same reading template, no scorecard | header → TOC · prose · rail → applies-to → contact |
| About | Who, what, proof, contact — in one screen | lead → what I work with → links |

The seven-section case-study spine (`1 · Purpose & benefit` … `7 · Production
readiness scorecard`), `_data/rubric.yml`, the nine dimensions and the `.dia`
SVG contract are **unchanged**. This redesign is a presentation layer.

---

## 5. Fonts

Self-hosted, latin subset, 94 KB total across five files in `assets/fonts/`:
IBM Plex Sans variable (400–600), Plex Serif 400/400i/600, Plex Mono 400.
`font-display: swap` with metric-matched `@font-face` fallbacks
(`size-adjust`/`ascent-override`) so a late swap does not move the page.

To refresh: fetch `https://fonts.googleapis.com/css2?...&display=swap` with a
modern browser User-Agent, keep only the `/* latin */` blocks, download those
`.woff2` files into `assets/fonts/`, and regenerate `assets/css/fonts.css`.

---

## 6. Checks that enforce this file

| Check | Command |
|---|---|
| Contrast, both themes | `uv run --no-project python scripts/contrast_audit.py` |
| Case-study schema, paragraphs, summaries, proofs | `uv run --with pyyaml --no-project python scripts/lint_case_study.py --all --no-net` |
| Build | `docker run --rm -e JEKYLL_NO_BUNDLER_REQUIRE=true -v "$PWD":/site -w /site ghp-jekyll:local jekyll build -d /site/_o -q` |
| Layout, type floor, target size, axe, motion | `node scripts/audit_pages.mjs http://127.0.0.1:8801` |

The first three run in `.github/workflows/lint.yml` on every push and pull
request. The fourth needs a browser, so it is a local and pre-merge check: it
sweeps eight pages × three widths × two themes, runs axe-core over all of them,
and asserts the motion contract (reduced motion, the frozen-animation case, and
no-JavaScript). Setup is `npm i --no-save playwright axe-core`.

**The standard the site is held to:** axe-core reports **0 violations** across
every page in both themes, and Lighthouse scores **100 accessibility, 100 best
practices, 100 SEO** with performance in the high 90s. A change that drops any
of those is a regression, not a trade-off.
