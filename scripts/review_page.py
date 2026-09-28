#!/usr/bin/env python3
"""Export one built page as a Lavish-reviewable copy.

Lavish serves a single HTML file plus the assets beside it, by relative path.
The site is built with root-relative paths (`/assets/…`, `/projects/…`), so a
built page cannot be opened in Lavish as-is. This script:

  1. builds the site into _probeout/ (Docker) unless --no-build,
  2. rewrites `/assets/` to a relative `assets/`,
  3. points every other root-relative link at the local server (:8790) so a
     click on the nav opens the real neighbour page,
  4. drops the analytics tags so a review is not a page view,
  5. copies only the assets a page needs (css, js, fonts, favicon, small img),
  6. writes _review/<slug>.html and prints its path.

    python3 scripts/review_page.py projects/dataagentbench
    python3 scripts/review_page.py index --no-build
    npx -y lavish-axi "$(python3 scripts/review_page.py index)"

_review/ is gitignored. .lavish/ is not used for output because the workspace
rule forbids ignoring anything under it, and these copies are generated.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "_probeout"
OUT = ROOT / "_review"
LOCAL = "http://127.0.0.1:8790"
ASSET_DIRS = ("css", "js", "fonts", "img/favicon")
IMG_MAX_BYTES = 400_000  # copy small images only; video and dashboards stay behind

BUILD_CMD = [
    "docker", "run", "--rm", "-e", "JEKYLL_NO_BUNDLER_REQUIRE=true",
    "-v", f"{ROOT}:/site", "-w", "/site", "ghp-jekyll:local",
    "jekyll", "build", "-d", "/site/_probeout", "-q",
]


def build() -> None:
    subprocess.run(BUILD_CMD, check=True)


def page_path(page: str) -> Path:
    page = page.strip("/")
    if page in ("", "index"):
        return BUILD / "index.html"
    p = BUILD / page
    if p.is_dir():
        return p / "index.html"
    if p.suffix == ".html" and p.exists():
        return p
    sys.exit(f"no built page for {page!r} under {BUILD}")


def slug_for(page: str) -> str:
    page = page.strip("/")
    return "index" if page in ("", "index") else page.replace("/", "--")


def rewrite(html: str) -> str:
    html = re.sub(r'<script async src="https://www\.googletagmanager\.com[^<]*</script>\s*', "", html)
    html = re.sub(r"<script>\s*window\.dataLayer.*?</script>\s*", "", html, flags=re.S)
    html = html.replace('"/assets/', '"assets/')
    html = re.sub(r'href="/(?!/)([^"]*)"', rf'href="{LOCAL}/\1"', html)
    html = re.sub(r'src="/(?!/)([^"]*)"', rf'src="{LOCAL}/\1"', html)
    # the canonical link and og:url still say the public site; leave them
    return html


def copy_assets() -> None:
    src = BUILD / "assets"
    dst = OUT / "assets"
    for d in ASSET_DIRS:
        s, t = src / d, dst / d
        if s.exists():
            shutil.copytree(s, t, dirs_exist_ok=True)
    for f in (src / "img").rglob("*"):
        if f.is_file() and f.stat().st_size <= IMG_MAX_BYTES and "favicon" not in f.parts:
            t = dst / f.relative_to(src)
            t.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, t)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("page", help="index, projects/<slug>, projects/<slug>/<deep>, practices/<name>, about")
    ap.add_argument("--no-build", action="store_true", help="reuse _probeout/ as it is")
    a = ap.parse_args()
    if not a.no_build:
        build()
    src = page_path(a.page)
    OUT.mkdir(exist_ok=True)
    copy_assets()
    out = OUT / f"{slug_for(a.page)}.html"
    out.write_text(rewrite(src.read_text()))
    print(out)


if __name__ == "__main__":
    main()
