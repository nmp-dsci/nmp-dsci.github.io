#!/usr/bin/env python3
"""Lint a case study (or a practice page) against the contract in _templates/.

The contract, in one place:

  Front matter  every required key present and non-placeholder, no invented
                keys; `skills:` and `skills_detail[].skill` resolve in
                _data/skills.yml.
  Rubric        all nine dimensions from _data/rubric.yml, once each, in that
                file's `order:`; every status in the vocabulary; anything not
                `shipped` carries its reason in `how`; every row has a `proof`;
                `score` is the count of shipped rows; `rung` is a known rung.
  Proof         the paths in `proof:` exist in the system's own repo. This is
                the backstop for the honest-rating problem: a model can type
                "shipped" for free, but it cannot invent a path that resolves.
  Diagrams      both SVGs exist under _includes/, parse as XML, and keep the
                style contract (class="dia", role="img" + aria-label, a
                <title> in every <g>, no width/height on the root <svg>).
  Spine         the seven H2s, exactly titled, in order; fig-agent under §2 and
                fig-topology under §4; §7 left empty for the layout to render.
  Card          `headline` at most nine words and never the title again;
                `outcome` one sentence of at most 25 words for the home-page
                card; `proof_line` one sentence that carries a number, because
                DESIGN.md asks every number to bring its denominator.
  Sections      one `sections:` entry per H2, `n` running 1..7 in the order the
                headings are numbered, each `summary` one sentence of at most 24
                words saying the POINT of the section, not its topic.
  Prose         `summary` at most two sentences, `tldr` one line, and no body
                paragraph over 80 words (DESIGN.md §3 rule 12). Fenced code,
                tables, lists, quotes, HTML blocks and Liquid tags are not
                paragraphs and are not measured. 65-80 words warns.
  Media         no `"planned"` / `"tbd"` / `"coming"` in `media:`. DESIGN.md rule
                5: media that does not exist is not rendered, so it is not
                promised either. An empty string is the honest empty slot.
  Live          `links.demo` answers 200, and a demo build answers "mode":"demo".

Practices (--practice, or any file under _practices/) get the parallel
contract: the practice front matter, `systems:` slugs that resolve to
_projects/ files, `rubric:` keys that resolve in _data/rubric.yml, and the
five-H2 spine.

Deep pages (--deep, or any file under _deep/<project>/) are one system's
setup in full, maintained every cycle: `project:` resolves to a case study
that lists the page under `deep:` (the link runs both ways), `updated:` is a
date the `evidence_note` repeats, and the spine is Setup → One cycle →
Gate & promote → Cycle log → What changed since. A case study may also carry
`architecture.loop_diagram`, linted like the other two SVGs.

Usage
    uv run --with pyyaml --no-project python scripts/lint_case_study.py \
        _projects/data-pilot.md --repo ../data-qa-agent
    uv run --with pyyaml --no-project python scripts/lint_case_study.py --all --no-net

The brief these rules come from is DESIGN.md in the site root.

Stdlib + PyYAML only, so it runs without a project virtualenv. Every check
prints one ✓ (held), ✗ (broken), ! (near a limit, not a failure) or ~ (not
checked) line. Exit status is 1 if any file fails; a ! never fails a file.
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import yaml

SITE_ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- the contract

REQUIRED = [
    "title", "headline", "outcome", "proof_line", "summary", "tldr", "sections",
    "tags", "metric", "metric_label", "featured", "order", "stack", "skills",
    "skills_detail", "links", "architecture", "production",
]
OPTIONAL = ["published", "media", "evidence", "layout", "permalink", "date",
            # the abbreviated column header the rubric matrix uses under 560px
            "short",
            # names of the deep pages under _deep/<slug>/ this case study links to
            "deep"]
REQUIRED_NESTED = {
    "links": ["repo", "demo"],
    "architecture": ["diagram", "caption"],
    "production": [
        "live", "order", "surface", "topology", "topology_diagram", "region",
        "cost", "rung", "rung_note", "score", "rubric",
    ],
}
SPINE = [
    "1 · Purpose & benefit",
    "2 · Agent architecture",
    "3 · Agent loop & evaluation",
    "4 · Deployed architecture",
    "5 · Guardrails & security",
    "6 · Observability & cost",
    "7 · Production readiness scorecard",
]
FIGURES = {
    "2 · Agent architecture": "{% include fig-agent.html %}",
    "4 · Deployed architecture": "{% include fig-topology.html %}",
}
EMPTY_SECTION = "7 · Production readiness scorecard"

PRACTICE_REQUIRED = ["title", "summary", "tldr", "order", "kicker", "systems",
                     "rubric", "evidence_note"]
# A practice has no home-page system card, so the three card lines and the
# section summaries are optional there — but linted the same way when present.
PRACTICE_OPTIONAL = ["published", "layout", "permalink", "date", "tags", "featured",
                     "headline", "outcome", "proof_line", "sections",
                     # `short` is the label the footer page tree prints, for the
                     # practices whose full title is a sentence.
                     "short"]
PRACTICE_SPINE = ["Problem", "Pattern", "In the three systems", "Evidence",
                  "Failure modes"]

# A deep page is one system's setup in full, under its case study. It is
# maintained every cycle, so the contract is about staying true over time: a
# two-way link to the case study, a date the evidence note repeats, and a spine
# whose last two sections are the ones that grow.
DEEP_REQUIRED = ["title", "summary", "tldr", "kicker", "project", "rubric",
                 "evidence_note", "updated"]
DEEP_OPTIONAL = ["published", "layout", "permalink", "date", "tags", "featured", "order",
                 "headline", "outcome", "proof_line", "sections", "short"]
DEEP_SPINE = ["Setup", "One cycle", "Gate & promote", "Cycle log", "What changed since"]
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

HEADLINE_WORDS = 9        # the card's first line, read at a glance
OUTCOME_WORDS = 25        # one sentence under it, on the home-page card
SUMMARY_WORDS = 24        # one `sections[].summary`, in the reading rail
PARAGRAPH_MAX = 80        # DESIGN.md §3 rule 12 — over this the lint fails
PARAGRAPH_WARN = 65       # under the limit but close enough to say so
PLACEHOLDER_MEDIA = {"planned", "coming", "soon", "tbd", "todo", "pending", "wip"}
MEDIA_SLOTS = ["walkthrough", "poster", "captions"]

HOW_MIN = 40  # a reason shorter than this is a shrug, not an explanation
ABBREV = re.compile(r"\b(e\.g|i\.e|etc|vs|approx|Dr|Mr|Ms|No|Fig|cf)\.", re.I)
SENTENCE_END = re.compile(r"(?<=[.!?])[\"')\]]?\s+(?=[A-Z\"'“(])")
EXTENSION = re.compile(r"\.[A-Za-z][A-Za-z0-9]{1,5}$")
HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
HEADING_NUMBER = re.compile(r"^\s*(\d+)\b")
LIST_ITEM = re.compile(r"^\s*(?:[-*+]\s|\d+[.)]\s)")
NOT_PROSE = ("#", ">", "|", "<", "{%", "{{", "!", "=")  # heading, quote, table,
#                                          HTML, Liquid, image, setext underline


# --------------------------------------------------------------------- output


def plural(n: int, word: str) -> str:
    return word if n == 1 else word + "s"


def listing(**groups: list) -> list[str]:
    """"absent=['tldr'] → ['absent: tldr']. Empty groups drop out."""
    return [f"{name.replace('_', ' ')}: {', '.join(str(v) for v in values)}"
            for name, values in groups.items() if values]


class Report:
    """The ✓ / ✗ / ! / ~ lines for one file, plus its verdict."""

    def __init__(self, label: str) -> None:
        self.label = label
        self.lines: list[tuple[str, str, list[str]]] = []
        self.failed = False

    def ok(self, msg: str) -> None:
        self.lines.append(("✓", msg, []))

    def bad(self, msg: str, *details: str) -> None:
        self.lines.append(("✗", msg, list(details)))
        self.failed = True

    def skip(self, msg: str) -> None:
        self.lines.append(("~", msg, []))

    def warn(self, msg: str, *details: str) -> None:
        """Worth the author's eye, not worth failing a build over."""
        self.lines.append(("!", msg, list(details)))

    def verdict(self, held: bool, msg: str, *details: str, fail_msg: str = "") -> None:
        """Details explain a failure, so they print only when it fails."""
        self.ok(msg) if held else self.bad(fail_msg or msg, *details)

    def render(self, quiet: bool) -> str:
        out = [self.label]
        for glyph, msg, details in self.lines:
            if quiet and glyph == "✓":
                continue
            out.append(f"  {glyph} {msg}")
            out.extend(f"      {d}" for d in details)
        return "\n".join(out + ["  " + ("FAIL" if self.failed else "PASS")])


# -------------------------------------------------------------------- reading


def read_front_matter(path: Path) -> tuple[dict, str]:
    """(front matter, body). Raises ValueError / yaml.YAMLError if malformed."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError("file does not open with '---'")
    end = re.search(r"^---\s*$", text[3:], re.M)
    if not end:
        raise ValueError("front matter is never closed with '---'")
    return yaml.safe_load(text[3 : 3 + end.start()]) or {}, text[3 + end.end() :]


def load_data(name: str) -> dict:
    return yaml.safe_load((SITE_ROOT / "_data" / name).read_text(encoding="utf-8")) or {}


def rel(path: Path) -> str:
    """A path as the reader typed it: relative to the site root where possible."""
    try:
        return os.path.relpath(path, SITE_ROOT)
    except ValueError:
        return str(path)


def is_empty(value) -> bool:
    if isinstance(value, (bool, int, float)):
        return False
    if isinstance(value, str):
        return value.strip() in ("", '""', "''")
    return not value


def is_placeholder(value) -> bool:
    return isinstance(value, str) and ("<slug>" in value or "<repo-dir>" in value)


def count_sentences(text: str) -> int:
    return len(SENTENCE_END.split(ABBREV.sub("X", text.strip()))) if text.strip() else 0


def h2_sections(body: str) -> list[tuple[str, str]]:
    """[(heading, section body)] for every '## ' heading outside a code fence."""
    sections: list[tuple[str, list[str]]] = []
    fenced = False
    for line in body.splitlines():
        if line.lstrip().startswith(("```", "~~~")):
            fenced = not fenced
        if not fenced and line.startswith("## "):
            sections.append((line[3:].strip(), []))
        elif sections:
            sections[-1][1].append(line)
    return [(title, "\n".join(lines)) for title, lines in sections]


def h3_headings(body: str) -> list[str]:
    """Every '### ' heading outside a code fence."""
    heads, fenced = [], False
    for line in body.splitlines():
        if line.lstrip().startswith(("```", "~~~")):
            fenced = not fenced
        elif not fenced and line.startswith("### "):
            heads.append(line[4:].strip())
    return heads


def body_paragraphs(body: str) -> list[str]:
    """The prose blocks of a body, as single strings.

    Only prose is measured: fenced code, tables, lists, blockquotes, HTML blocks
    and Liquid tags are not paragraphs. A block that starts as prose and turns
    into a list, a table or a <figure> is measured up to that turn.
    """
    blocks: list[list[str]] = []
    block: list[str] = []
    fenced = False
    for line in HTML_COMMENT.sub("", body).splitlines():
        if line.lstrip().startswith(("```", "~~~")):
            fenced = not fenced
            blocks.append(block)
            block = []
        elif fenced:
            continue
        elif line.strip():
            block.append(line)
        else:
            blocks.append(block)
            block = []
    blocks.append(block)

    paragraphs = []
    for chunk in blocks:
        prose = []
        for line in chunk:
            if LIST_ITEM.match(line) or line.lstrip().startswith(NOT_PROSE):
                break
            prose.append(line.strip())
        if prose:
            paragraphs.append(" ".join(prose))
    return paragraphs


def words_in(value) -> tuple[str, int]:
    """(the value on one line, its word count) — front matter folds, so re-join."""
    text = " ".join(str(value or "").split())
    return text, len(text.split())


def is_placeholder_media(value) -> bool:
    """DESIGN.md rule 5. A path or a URL is a file; "planned" is a promise."""
    if value is True:
        return True
    if not isinstance(value, str):
        return False
    text = value.strip().strip("\"'").casefold()
    if not text or "/" in text or text.startswith("http"):
        return False
    return bool({w for w in re.split(r"[^a-z]+", text) if w} & PLACEHOLDER_MEDIA)


def proof_paths(proof: str) -> list[str]:
    """The path-shaped tokens in a proof string: ' · ', commas and spaces split."""
    found = []
    for raw in re.split(r"[·,;]|\s+", proof):
        token = raw.strip().lstrip("`'\"([{").rstrip("`'\")]}.,;:")
        if not token or token.startswith(("http", "#", "§")):
            continue
        head = token.split("::", 1)[0]        # path::symbol — check the file part
        if not head or re.fullmatch(r"[\d.]+", head):   # 77.1, not a filename
            continue
        if "/" in head or EXTENSION.search(head):
            found.append(head)
    return found


def path_exists(repo: Path, token: str) -> bool:
    if any(part == ".." for part in Path(token).parts):
        return False
    if any(c in token for c in "*?["):
        return bool(glob.glob(str(repo / token), recursive=True))
    return (repo / token).exists()


def svg_tag(node) -> str:
    return node.tag.split("}")[-1] if isinstance(node.tag, str) else ""


# Presentation mode (CLAUDE.md, "the rubric"): a spine heading is a stable
# label followed by ` — ` and the section's assertion, so the one thing a
# scanner reliably reads carries a claim instead of naming a topic. The label
# keeps the spine checkable and keeps `sections[].n` aligned to the numbering.
ASSERTION_SEP = " — "
ASSERTION_WORDS = 10      # P1: long enough to state a claim, short enough to scan
TOPIC_LABELS = {          # P1: nouns that name a topic instead of asserting one
    "architecture", "cost", "what it is", "problem", "the build", "overview",
    "setup", "results", "the result", "background", "introduction", "summary",
    "how it works", "the problem", "approach", "the approach", "details",
}


def spine_label(title: str) -> str:
    """The stable part of a heading — everything before the assertion."""
    return title.split(ASSERTION_SEP, 1)[0].strip()


def assertion_of(title: str) -> str:
    """The claim after the separator, or '' when the heading carries none."""
    return title.split(ASSERTION_SEP, 1)[1].strip() if ASSERTION_SEP in title else ""


def order_faults(titles: list[str], spine: list[str]) -> list[str]:
    """Which headings are missing, invented, or in the wrong place.

    Matched on the label, so `## 3 · Agent loop & evaluation — one promotion in
    nine tries` satisfies the spine entry `3 · Agent loop & evaluation`.
    """
    labels = [spine_label(t) for t in titles]
    faults = [f"missing (or misspelled): ## {want}" for want in spine if want not in labels]
    faults += [f"not in the spine: ## {got}" for got, label in zip(titles, labels)
               if label not in spine]
    if [t for t in labels if t in spine] != [s for s in spine if s in labels]:
        faults.append("out of order — expected " + " → ".join(spine))
    return faults


def check_assertions(rep: Report, body: str, spine: list[str]) -> None:
    """P1 — every spine heading states a claim, and no heading names a topic."""
    titles = [h for h, _ in h2_sections(body)]
    faults = []
    for title in titles:
        label, claim = spine_label(title), assertion_of(title)
        if label.lower() in TOPIC_LABELS and not claim:
            faults.append(f"## {title} names a topic — say what it proves")
        elif not claim:
            faults.append(f"## {title} carries no assertion — add ' — <the claim>'")
        elif len(claim.split()) > ASSERTION_WORDS:
            faults.append(f"## {label}: the claim runs {len(claim.split())} words, "
                          f"and a scanned heading holds {ASSERTION_WORDS}")

    # H3s are scanned the same way. They carry no spine label, so they may
    # assert outright — but a one-word noun ("Git", "Lavish") names a topic
    # just as surely as `## Architecture` does.
    subs = h3_headings(body)
    for sub in subs:
        # The whole heading is the claim here, so it is measured whole: a
        # subheading may name its subject as long as it goes on to say
        # something about it.
        if sub.lower().rstrip(".") in TOPIC_LABELS or len(sub.split()) < 3:
            faults.append(f"### {sub} names a topic — say what it shows")
    rep.verdict(not faults,
                f"assertions: {len(titles) + len(subs)} headings state a claim",
                *faults, fail_msg="assertions: a heading names a topic instead of a claim")


# P5 — the scan budget, by page type. A reader gets through about a quarter of
# the words, so these are the points past which the rest is not being read.
# The three numbers differ because the page types differ structurally:
#   project   the 60-90 second scan; mechanism belongs on its deep page
#   practice  one pattern across three systems, each section a mini-case,
#             plus an evidence table where every count carries its command
#   deep      the "in full" level — the page the other two link down to
WORD_BUDGET = {"project": 1800, "practice": 2200, "deep": 2500, "page": 800}


def check_budget(rep: Report, body: str, kind: str) -> None:
    """P5 — a warning, never a failure: length is a trade, not a rule."""
    words = len(body.split())
    cap = WORD_BUDGET[kind]
    if words <= cap:
        rep.ok(f"scan cost: {words} body words, inside the {cap}-word {kind} budget")
    else:
        rep.warn(f"scan cost: {words} body words against a {cap}-word {kind} budget",
                 "move mechanism and setup down a level rather than cutting a fact")


def check_charts(rep: Report, body: str) -> None:
    """P2 — a published page draws at least one piece of its evidence.

    A warning, not a failure: the pages are being brought up to the rubric one
    wave at a time, and a page with nothing to draw yet should still publish.
    """
    # Author-placed figures only: the layout injects the agent and topology
    # diagrams through fig-agent.html / fig-topology.html, so an inline
    # `include diagrams/...` is always evidence the author chose to draw.
    charts = re.findall(r"include\s+diagrams/", body)
    if charts:
        rep.ok(f"charts: {len(charts)} evidence figure(s) inline")
    else:
        rep.warn("charts: no chart, loop or runtime figure — the claims are asserted, not drawn")


# --------------------------------------------------------------------- checks


def check_schema(rep: Report, fm: dict, required: list[str], optional: list[str],
                 nested: dict[str, list[str]], what: str = "schema") -> None:
    def scan(block: dict, keys: list[str], prefix: str = "") -> None:
        absent.extend(f"{prefix}{k}" for k in keys if k not in block)
        empty.extend(f"{prefix}{k}" for k in keys if k in block and is_empty(block[k]))
        stub.extend(f"{prefix}{k}" for k in keys if k in block and is_placeholder(block[k]))

    absent, empty, stub = [], [], []
    scan(fm, required)
    for parent, children in nested.items():
        if isinstance(fm.get(parent), dict):
            scan(fm[parent], children, f"{parent}.")
    unknown = [k for k in fm if k not in required and k not in optional]
    missing = len(absent) + len(empty) + len(stub)
    rep.verdict(
        not (missing or unknown),
        f"front matter matches {what} ({len(unknown)} unknown "
        f"{plural(len(unknown), 'key')}, {missing} missing)",
        *listing(absent=absent, empty=empty, placeholder=stub, unknown=unknown),
    )


def check_skills(rep: Report, fm: dict, skills: dict) -> None:
    chips = list(fm.get("skills") or [])
    proofs = [d.get("skill") for d in (fm.get("skills_detail") or []) if isinstance(d, dict)]
    unknown = sorted({s for s in chips + proofs if s not in skills})
    total = len(chips) + len(proofs)
    rep.verdict(
        not unknown,
        f"skills: {total - len(unknown)}/{total} keys in _data/skills.yml "
        f"({len(chips)} chips, {len(proofs)} proofs)",
        *listing(not_in_taxonomy=unknown),
    )


def check_rubric(rep: Report, rows: list, rubric: dict) -> None:
    """Nine dimensions, once each, in _data/rubric.yml's own order."""
    dims = rubric.get("dimensions")
    statuses = rubric.get("statuses")
    if not isinstance(dims, dict) or not isinstance(statuses, (list, set, tuple, dict)):
        rep.bad("rubric: _data/rubric.yml is missing dimensions or statuses")
        return
    malformed = [k for k, v in dims.items() if not isinstance(v, dict) or "order" not in v]
    if malformed:
        rep.bad("rubric: _data/rubric.yml dimensions missing 'order'",
                *listing(no_order=malformed))
        return
    expected = sorted(dims, key=lambda k: dims[k]["order"])
    got = [r.get("dimension") for r in rows if isinstance(r, dict)]
    off_vocab = sorted({r.get("status") for r in rows
                        if isinstance(r, dict) and r.get("status") not in statuses})
    details = listing(
        missing=[d for d in expected if d not in got],
        not_in_rubric_yml=[d for d in got if d not in expected],
        listed_twice=sorted({d for d in got if got.count(d) > 1}),
        status_outside_the_vocabulary=off_vocab,
    )
    if got != expected and not details:
        details = ["out of order — expected " + " → ".join(expected)]
    rep.verdict(
        got == expected and not off_vocab,
        f"rubric: {len(set(got) & set(expected))}/9 dimensions, "
        + ("statuses in vocabulary" if not off_vocab else "status outside the vocabulary"),
        *details,
    )


def check_reasons(rep: Report, rows: list) -> None:
    """Anything not `shipped` says why, and every row cites something."""
    silent, unproven = [], []
    for row in (r for r in rows if isinstance(r, dict)):
        how = (row.get("how") or "").strip()
        if row.get("status") != "shipped" and len(how) < HOW_MIN:
            silent.append(f"{row.get('dimension', '?')} ({row.get('status')}, "
                          f"how is {len(how)} chars)")
        if is_empty(row.get("proof")):
            unproven.append(row.get("dimension", "?"))
    rep.verdict(
        not (silent or unproven),
        f"rubric: {len(silent)} non-shipped {plural(len(silent), 'row')} without a "
        f"reason, {len(unproven)} without proof",
        *listing(no_reason_given=silent, no_proof_given=unproven),
    )


def check_proofs(rep: Report, rows: list, repo: Path | None, why: str) -> None:
    """The claim-to-path check — the reason a generous rating cannot survive."""
    if repo is None:
        rep.skip(f"proof paths: not checked ({why})")
        return
    hits, misses = 0, []
    for row in (r for r in rows if isinstance(r, dict)):
        for token in proof_paths(str(row.get("proof") or "")):
            if path_exists(repo, token):
                hits += 1
            else:
                misses.append(f"{row.get('dimension', '?')}: {token}")
    rep.verdict(not misses, f"proof paths: {hits}/{hits + len(misses)} exist in {rel(repo)}",
                *[f"not found: {m}" for m in misses])


def check_diagram(rep: Report, include_path: str, kind: str, key: str) -> None:
    if not include_path:
        rep.bad(f"{kind} diagram: {key} is not set")
        return
    path = SITE_ROOT / "_includes" / str(include_path)
    if not path.is_file():
        rep.bad(f"{kind} diagram: _includes/{include_path} not found")
        return
    try:
        root = ET.fromstring(path.read_text(encoding="utf-8"))
    except ET.ParseError as exc:
        rep.bad(f"{kind} diagram: _includes/{include_path} is not valid XML", str(exc))
        return
    faults = []
    if "dia" not in (root.get("class") or "").split():
        faults.append('root <svg> is missing class="dia"')
    if root.get("role") != "img":
        faults.append('root <svg> is missing role="img"')
    if not (root.get("aria-label") or "").strip():
        faults.append("root <svg> has no aria-label")
    faults += [f'root <svg> carries {a}="{root.get(a)}" (the CSS sizes it)'
               for a in ("width", "height") if root.get(a)]
    untitled = sum(1 for g in root.iter() if svg_tag(g) == "g" and not any(
        svg_tag(c) == "title" and (c.text or "").strip() for c in g))
    if untitled:
        faults.append(f"{untitled} <g> without a <title> (the tooltip and the a11y name)")
    rep.verdict(not faults, f"{kind} diagram: _includes/{include_path}", *faults)


def check_spine(rep: Report, body: str) -> None:
    # Keyed by the stable label, so a heading may carry its assertion after ` — `.
    sections = {spine_label(t): b for t, b in h2_sections(body)}
    titles = [t for t, _ in h2_sections(body)]
    hits = len([s for s in SPINE if s in sections])
    faults = order_faults(titles, SPINE)
    rep.verdict(not faults, f"spine: {hits}/7 sections present, in order", *faults,
                fail_msg=f"spine: {hits}/7 sections match the contract")

    # The layout owns three pieces of the body: the two figures and §7.
    faults = [f"## {head} does not carry {inc}" for head, inc in FIGURES.items()
              if head in sections and inc not in sections[head]]
    if HTML_COMMENT.sub("", sections.get(EMPTY_SECTION, "")).strip():
        faults.append(f"## {EMPTY_SECTION} has a body — the layout renders it from front matter")
    rep.verdict(not faults,
                "layout hooks: fig-agent under §2, fig-topology under §4, §7 left empty",
                *faults, fail_msg="layout hooks: the body fights the layout")


def check_score(rep: Report, production: dict, rows: list) -> None:
    shipped = sum(1 for r in rows if isinstance(r, dict) and r.get("status") == "shipped")
    want, got = f"{shipped} / 9", " ".join(str(production.get("score", "")).split())
    rep.verdict(got == want,
                f"score: {want} matches the {shipped} shipped {plural(shipped, 'row')}",
                f"{shipped} {plural(shipped, 'row')} are marked shipped, so it reads {want!r}",
                fail_msg=f"score: front matter says {got!r}")


def check_prose(rep: Report, fm: dict) -> None:
    sentences = count_sentences(str(fm.get("summary") or ""))
    tldr = str(fm.get("tldr") or "")
    faults = []
    if sentences > 2:
        faults.append(f"summary is {sentences} sentences — the card shows two")
    if "\n" in tldr.strip():
        faults.append("tldr runs to more than one line")
    if len(tldr) > 300:
        faults.append(f"tldr is {len(tldr)} chars — the 30-second strip wants one line")
    rep.verdict(not faults, f"summary {sentences} {plural(sentences, 'sentence')} · tldr 1 line",
                *faults,
                fail_msg=f"prose: summary {sentences} {plural(sentences, 'sentence')}, "
                         f"tldr {len(tldr)} chars")


def check_headline(rep: Report, fm: dict) -> None:
    """The card's first line: the outcome in nine words, not the product name.

    The headline may carry exactly one <em>, the page's single decorated keyword
    (DESIGN.md §2). Tags do not count as words, and two of them is scatter, which
    is the thing the rule exists to prevent.
    """
    raw, _ = words_in(fm.get("headline"))
    headline = re.sub(r"<[^>]+>", "", raw).strip()
    words = len(headline.split()) if headline else 0
    title, _ = words_in(fm.get("title"))
    faults = []
    if not headline:
        faults.append("absent — the card and the page header both lead with it")
    if words > HEADLINE_WORDS:
        faults.append(f"{words} words, and the line holds {HEADLINE_WORDS}: {headline}")
    if headline and headline.casefold() == title.casefold():
        faults.append(f"identical to title ({title!r}) — say the outcome, not the name again")

    opens, closes = raw.count("<em>"), raw.count("</em>")
    if opens > 1:
        faults.append(f"{opens} <em> keywords — decorate one word, or none (DESIGN.md §2)")
    if opens != closes:
        faults.append(f"unbalanced emphasis: {opens} <em> against {closes} </em>")
    stray = re.sub(r"</?em>", "", raw)
    if "<" in stray:
        faults.append("markup other than <em> in the headline — it renders raw into the <h1>")

    emph = " · 1 keyword" if opens == 1 else ""
    rep.verdict(not faults, f"headline: {words} {plural(words, 'word')}, not the title{emph}",
                *faults, fail_msg=f"headline: {words} {plural(words, 'word')}")


def check_outcome(rep: Report, fm: dict) -> None:
    """One sentence for the home-page card: what the system achieves, and the stake."""
    outcome, words = words_in(fm.get("outcome"))
    sentences = count_sentences(outcome)
    faults = []
    if not outcome:
        faults.append("absent — the home-page card has no sentence to show")
    if words > OUTCOME_WORDS:
        faults.append(f"{words} words, limit {OUTCOME_WORDS}: {outcome[:60]}")
    if sentences > 1:
        faults.append(f"{sentences} sentences — the card shows one")
    rep.verdict(not faults, f"outcome: 1 sentence, {words} {plural(words, 'word')}", *faults,
                fail_msg=f"outcome: {sentences} {plural(sentences, 'sentence')}, "
                         f"{words} {plural(words, 'word')}")


def check_proof_line(rep: Report, fm: dict) -> None:
    """The TL;DR "Proof" cell. DESIGN.md: every number carries its baseline or
    denominator — so a proof line with no number is not proof of anything."""
    proof, words = words_in(fm.get("proof_line"))
    faults = []
    if not proof:
        faults.append("absent — the TL;DR Proof cell needs a sentence")
    elif not any(character.isdigit() for character in proof):
        faults.append(f"carries no number: {proof[:60]}")
    rep.verdict(not faults, f"proof_line: {words} {plural(words, 'word')}, carries a number",
                *faults, fail_msg="proof_line: not usable as the TL;DR Proof cell")


def check_sections(rep: Report, fm: dict, body: str, required: bool = True) -> None:
    """One `sections:` entry per H2, numbered as the headings are, each summary a
    single sentence stating the point of the section rather than its topic."""
    entries = fm.get("sections")
    heads = [title for title, _ in h2_sections(body)]
    if entries is None:
        if required:
            rep.bad(f"sections: absent — the rail wants one summary per H2 "
                    f"({len(heads)} in the body)")
        else:
            rep.skip("sections: not declared (optional on a practice)")
        return
    if not isinstance(entries, list) or not entries:
        rep.bad(f"sections: {entries!r} is not a list of n/summary entries")
        return

    faults, numbers = [], []
    if len(entries) != len(heads):
        faults.append(f"{len(entries)} entries for {len(heads)} H2s — one each, no more")
    for position, entry in enumerate(entries, 1):
        if not isinstance(entry, dict):
            faults.append(f"entry {position} is not a mapping with n: and summary:")
            continue
        n = entry.get("n")
        numbered = isinstance(n, int) and not isinstance(n, bool)
        label = f"n={n}" if numbered else f"entry {position}"
        if numbered:
            numbers.append(n)
        else:
            faults.append(f"entry {position}: n is {n!r}, not a section number")
        summary, words = words_in(entry.get("summary"))
        if not summary:
            faults.append(f"{label}: summary is empty — say the point of the section")
            continue
        sentences = count_sentences(summary)
        if sentences > 1:
            faults.append(f"{label}: summary is {sentences} sentences — one states the point")
        if words > SUMMARY_WORDS:
            faults.append(f"{label}: summary is {words} words, limit {SUMMARY_WORDS}: "
                          f"{summary[:60]}")
    if numbers and numbers != list(range(1, len(numbers) + 1)):
        faults.append("n runs " + ", ".join(str(n) for n in numbers)
                      + f" — expected 1..{len(numbers)}, in order, once each")
    heading_numbers = [int(match.group(1)) for title in heads
                       for match in [HEADING_NUMBER.match(title)] if match]
    if numbers and len(heading_numbers) == len(heads) and numbers != heading_numbers:
        faults.append("n does not follow the H2 numbers: "
                      + ", ".join(str(n) for n in heading_numbers))
    rep.verdict(not faults,
                f"sections: {len(entries)}/{len(heads)} summaries, numbered as the H2s, "
                "one sentence each", *faults,
                fail_msg=f"sections: {len(entries)} for {len(heads)} H2s")


def check_paragraphs(rep: Report, body: str) -> None:
    """DESIGN.md §3 rule 12. Over 80 words the paragraph is not read; split it at
    the natural seam, or lift the enumeration inside it into a list."""
    over, near, paragraphs = [], [], body_paragraphs(body)
    for para in paragraphs:
        words = len(para.split())
        if words > PARAGRAPH_MAX:
            over.append(f"{words} words: {para[:60]}")
        elif words >= PARAGRAPH_WARN:
            near.append(f"{words} words: {para[:60]}")
    rep.verdict(not over,
                f"paragraphs: {len(paragraphs)} prose {plural(len(paragraphs), 'paragraph')}, "
                f"none over {PARAGRAPH_MAX} words", *over,
                fail_msg=f"paragraphs: {len(over)} over {PARAGRAPH_MAX} words")
    if near:
        rep.warn(f"paragraphs: {len(near)} between {PARAGRAPH_WARN} and {PARAGRAPH_MAX} words",
                 *near)


def check_media(rep: Report, fm: dict) -> None:
    """DESIGN.md rule 5: no placeholder for media that does not exist. An empty
    string is how an unrecorded slot says so; "planned" renders a promise."""
    media = fm.get("media")
    if not isinstance(media, dict):
        rep.ok("media: nothing declared, so no slot to placeholder")
        return
    faults = [f"media.{key}: {value!r} is a promise, not a file — leave it empty"
              for key, value in media.items() if is_placeholder_media(value)]
    filled = [key for key in MEDIA_SLOTS if not is_empty(media.get(key))]
    rep.verdict(not faults,
                f"media: {len(filled)}/{len(MEDIA_SLOTS)} slots filled, no placeholder",
                *faults,
                fail_msg=f"media: {len(faults)} placeholder {plural(len(faults), 'value')}")


def check_rung(rep: Report, production: dict, rubric: dict) -> None:
    rungs = {str(k) for k in (rubric.get("rungs") or {})}
    rung = str(production.get("rung"))
    rep.verdict(rung in rungs, f"rung: {rung} in _data/rubric.yml rungs",
                f"known rungs: {', '.join(sorted(rungs, key=int))}",
                fail_msg=f"rung: {rung} is not one of _data/rubric.yml's rungs")


def check_demo(rep: Report, url: str, no_net: bool) -> None:
    """A live URL that 404s is a broken claim; an unreachable one is just weather."""
    if no_net:
        rep.skip("links.demo: not checked (--no-net)")
        return
    scheme = urllib.parse.urlsplit(url).scheme
    if scheme not in ("http", "https"):
        rep.bad(f"links.demo: {scheme!r} is not http/https")
        return
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "lint-case-study"})
        with urllib.request.urlopen(request, timeout=8) as response:
            status, payload = response.status, response.read(65536).decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        rep.bad(f"links.demo: {exc.code} from {url}")
        return
    except Exception as exc:  # DNS, TLS, timeout — never a lint failure
        rep.skip(f"links.demo: not checked (network error: {type(exc).__name__})")
        return
    try:
        body = json.loads(payload)
    except ValueError:
        body = None
    if isinstance(body, dict) and "mode" in body:
        rep.verdict(body["mode"] == "demo", f'links.demo: {status}, "mode":"{body["mode"]}"',
                    'the public URL must answer "demo" — no keys, no inference')
    else:
        rep.verdict(status == 200, f"links.demo: {status}")


# ----------------------------------------------------------------- the linters


def lint_project(path: Path, repo: Path | None, why: str, no_net: bool) -> Report:
    rep = Report(rel(path) + (f"  ({rel(repo)})" if repo else ""))
    try:
        fm, body = read_front_matter(path)
    except (ValueError, yaml.YAMLError) as exc:
        rep.bad("front matter does not parse", *str(exc).splitlines())
        return rep
    rep.ok("front matter parses")
    rubric = load_data("rubric.yml")
    production = fm.get("production") if isinstance(fm.get("production"), dict) else {}
    architecture = fm.get("architecture") if isinstance(fm.get("architecture"), dict) else {}
    links = fm.get("links") if isinstance(fm.get("links"), dict) else {}
    rows = production.get("rubric") or []

    check_schema(rep, fm, REQUIRED, OPTIONAL, REQUIRED_NESTED)
    check_skills(rep, fm, load_data("skills.yml"))
    check_rubric(rep, rows, rubric)
    if rows:  # the two row-level checks have nothing to say without a rubric
        check_reasons(rep, rows)
        check_proofs(rep, rows, repo, why)
    check_diagram(rep, architecture.get("diagram") or "", "agent", "architecture.diagram")
    check_diagram(rep, production.get("topology_diagram") or "", "topology",
                  "production.topology_diagram")
    if architecture.get("loop_diagram"):
        check_diagram(rep, architecture["loop_diagram"], "loop", "architecture.loop_diagram")
    if architecture.get("home_diagram"):
        check_diagram(rep, architecture["home_diagram"], "home", "architecture.home_diagram")
    check_deep_links(rep, fm, path)
    check_spine(rep, body)
    check_assertions(rep, body, SPINE)
    check_charts(rep, body)
    check_budget(rep, body, "project")
    check_score(rep, production, rows)
    check_prose(rep, fm)
    check_headline(rep, fm)
    check_outcome(rep, fm)
    check_proof_line(rep, fm)
    check_sections(rep, fm, body)
    check_paragraphs(rep, body)
    check_media(rep, fm)
    check_rung(rep, production, rubric)
    if links.get("demo"):
        check_demo(rep, str(links["demo"]), no_net)
    return rep


def lint_practice(path: Path) -> Report:
    rep = Report(rel(path) + "  (practice)")
    try:
        fm, body = read_front_matter(path)
    except (ValueError, yaml.YAMLError) as exc:
        rep.bad("front matter does not parse", *str(exc).splitlines())
        return rep
    rep.ok("front matter parses")
    check_schema(rep, fm, PRACTICE_REQUIRED, PRACTICE_OPTIONAL, {}, "the practice schema")

    systems = list(fm.get("systems") or [])
    orphans = [s for s in systems if not (SITE_ROOT / "_projects" / f"{s}.md").is_file()]
    rep.verdict(not orphans,
                f"systems: {len(systems) - len(orphans)}/{len(systems)} slugs resolve "
                "in _projects/", *listing(no_such_case_study=orphans))

    claimed = list(fm.get("rubric") or [])
    unknown = [d for d in claimed if d not in load_data("rubric.yml")["dimensions"]]
    rep.verdict(not unknown,
                f"rubric: {len(claimed) - len(unknown)}/{len(claimed)} dimensions in "
                "_data/rubric.yml", *listing(not_a_dimension=unknown))

    titles = [t for t, _ in h2_sections(body)]
    labels = [spine_label(t) for t in titles]
    faults = order_faults(titles, PRACTICE_SPINE)
    hits = len([s for s in PRACTICE_SPINE if s in labels])
    rep.verdict(not faults, f"spine: {hits}/5 sections present, in order", *faults,
                fail_msg=f"spine: {hits}/5 sections match the contract")
    check_assertions(rep, body, PRACTICE_SPINE)
    check_charts(rep, body)
    check_budget(rep, body, "practice")
    check_prose(rep, fm)
    for key, check in (("headline", check_headline), ("outcome", check_outcome),
                       ("proof_line", check_proof_line)):
        if key in fm:
            check(rep, fm)
    check_sections(rep, fm, body, required=False)
    check_paragraphs(rep, body)
    return rep


def check_deep_links(rep: Report, fm: dict, path: Path) -> None:
    """`deep:` names the pages under _deep/<slug>/ this case study goes deep
    into; each must exist and point back at this case study via `project:`."""
    names = fm.get("deep")
    if names is None:
        return
    if not isinstance(names, list):
        rep.bad(f"deep: {names!r} is not a list of page names")
        return
    slug = path.stem
    faults = []
    for name in names:
        target = SITE_ROOT / "_deep" / slug / f"{name}.md"
        if not target.is_file():
            faults.append(f"{name}: _deep/{slug}/{name}.md not found")
            continue
        try:
            back = read_front_matter(target)[0].get("project")
        except Exception as exc:  # the deep page's own lint will say more
            faults.append(f"{name}: front matter does not parse ({exc})")
            continue
        if back != slug:
            faults.append(f"{name}: its project: is {back!r}, not {slug!r}")
    rep.verdict(not faults, f"deep: {len(names) - len(faults)}/{len(names)} pages resolve "
                "under _deep/ and link back", *faults)


def lint_deep(path: Path) -> Report:
    rep = Report(rel(path) + "  (deep)")
    try:
        fm, body = read_front_matter(path)
    except (ValueError, yaml.YAMLError) as exc:
        rep.bad("front matter does not parse", *str(exc).splitlines())
        return rep
    rep.ok("front matter parses")
    check_schema(rep, fm, DEEP_REQUIRED, DEEP_OPTIONAL, {}, "the deep-page schema")

    project = str(fm.get("project") or "")
    parent = SITE_ROOT / "_projects" / f"{project}.md"
    faults = []
    if not parent.is_file():
        faults.append(f"project: _projects/{project}.md not found")
    elif path.resolve().parent.name != project:
        faults.append(f"the file lives under _deep/{path.resolve().parent.name}/, "
                      f"not _deep/{project}/ — the folder is the URL")
    else:
        try:
            listed = list(read_front_matter(parent)[0].get("deep") or [])
        except Exception:
            listed = []
        if path.stem not in listed:
            faults.append(f"_projects/{project}.md does not list {path.stem!r} under deep: "
                          "— the link runs both ways")
    rep.verdict(not faults, f"project: {project} resolves and links back", *faults)

    claimed = list(fm.get("rubric") or [])
    unknown = [d for d in claimed if d not in load_data("rubric.yml")["dimensions"]]
    rep.verdict(not unknown,
                f"rubric: {len(claimed) - len(unknown)}/{len(claimed)} dimensions in "
                "_data/rubric.yml", *listing(not_a_dimension=unknown))

    updated = fm.get("updated")
    note = str(fm.get("evidence_note") or "")
    stamp = updated.isoformat() if hasattr(updated, "isoformat") else str(updated or "")
    faults = []
    if not ISO_DATE.match(stamp):
        faults.append(f"updated: {updated!r} is not a YYYY-MM-DD date")
    elif stamp not in note:
        faults.append(f"evidence_note does not name the updated date {stamp} — "
                      "the note and the date drift apart otherwise")
    rep.verdict(not faults, f"updated: {stamp}, named in the evidence note", *faults)

    titles = [t for t, _ in h2_sections(body)]
    faults = order_faults(titles, DEEP_SPINE)
    hits = len([s for s in DEEP_SPINE if s in [spine_label(t) for t in titles]])
    rep.verdict(not faults, f"spine: {hits}/5 sections present, in order", *faults,
                fail_msg=f"spine: {hits}/5 sections match the contract")
    check_assertions(rep, body, DEEP_SPINE)
    check_charts(rep, body)
    check_budget(rep, body, "deep")
    check_prose(rep, fm)
    for key, check in (("headline", check_headline), ("outcome", check_outcome),
                       ("proof_line", check_proof_line)):
        if key in fm:
            check(rep, fm)
    check_sections(rep, fm, body, required=False)
    check_paragraphs(rep, body)
    return rep


# ------------------------------------------------------------------------ main


def is_published(path: Path) -> bool:
    try:
        return read_front_matter(path)[0].get("published") is not False
    except Exception:
        return True  # can't tell — lint it and let the parse error speak


def infer_repo(path: Path) -> tuple[Path | None, str]:
    """`links.repo` names the sibling directory the proof paths live in."""
    try:
        url = str((read_front_matter(path)[0].get("links") or {}).get("repo") or "")
    except Exception:
        url = ""
    if not url:
        return None, "no links.repo to infer the sibling repo from"
    name = url.rstrip("/").split("/")[-1]
    if name.endswith(".git"):
        name = name[: -len(".git")]
    candidate = (SITE_ROOT.parent / name).resolve()
    return (candidate, "") if candidate.is_dir() else (None, f"{rel(candidate)} not checked out")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Lint a case study against the contract in _templates/project.md.",
        epilog="Contract: DESIGN.md · _templates/project.md · _data/rubric.yml "
               "· _data/skills.yml",
    )
    parser.add_argument("files", nargs="*", type=Path, help="_projects/<slug>.md")
    parser.add_argument("--repo", type=Path, help="sibling repo the proof paths resolve against")
    parser.add_argument("--practice", action="store_true", help="use the practice contract")
    parser.add_argument("--deep", action="store_true", help="use the deep-page contract")
    parser.add_argument("--all", action="store_true",
                        help="every published project, practice and deep page")
    parser.add_argument("--no-net", action="store_true", help="skip the live links.demo check")
    parser.add_argument("--quiet", action="store_true", help="only show ✗ and ~ lines")
    args = parser.parse_args(argv)

    targets: list[Path] = list(args.files)
    if args.all:
        for collection in ("_projects", "_practices"):
            targets += sorted(p for p in (SITE_ROOT / collection).glob("*.md") if is_published(p))
        targets += sorted(p for p in (SITE_ROOT / "_deep").glob("*/*.md") if is_published(p))
    if not targets:
        parser.error("nothing to lint — pass a file or --all")

    reports = []
    for path in targets:
        try:
            if not path.is_file():
                reports.append(Report(rel(path)))
                reports[-1].bad("no such file")
            elif args.practice or path.resolve().parent.name == "_practices":
                reports.append(lint_practice(path))
            elif args.deep or path.resolve().parent.parent.name == "_deep":
                reports.append(lint_deep(path))
            elif args.repo is not None and not args.all:
                repo = args.repo.resolve()
                reports.append(lint_project(
                    path, repo if repo.is_dir() else None,
                    f"{rel(repo)} not checked out", args.no_net))
            else:
                repo, why = infer_repo(path)
                reports.append(lint_project(path, repo, why or "no --repo given", args.no_net))
        except Exception as exc:
            reports.append(Report(rel(path)))
            reports[-1].bad(f"lint crashed: {type(exc).__name__}: {exc}")

    print("\n\n".join(r.render(args.quiet) for r in reports))
    failed = [r for r in reports if r.failed]
    if len(reports) > 1:
        print(f"\n{len(reports)} files · {len(reports) - len(failed)} PASS · {len(failed)} FAIL")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
