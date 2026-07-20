---
title: Floor Plan Reviewer
summary: An agentic redesign studio that re-plans a home's interior to maximise weekly rent — one validated change at a time, priced against live rental comparables.
tags: [Agents]
metric: "+$360/wk"
metric_label: "verified uplift on the worked example"
featured: true
order: 2
stack: [Claude Agent SDK, Vision ingest, Tavily live comps, FastAPI, React 19 + d3, Pillow renderers]
skills: [agentic-ai, vision, llms, prompt-engineering, api-design, product-ui, python]
links:
  repo: https://github.com/nmp-dsci/floor-plan-reviewer
media:
  walkthrough: /assets/video/floor-plan-reviewer/walkthrough.mp4
  poster: /assets/img/floor-plan/app-review.png
  reel: planned
evidence:
  - type: image
    src: /assets/img/floor-plan/front-existing.png
    caption: "Before — the existing 1960s house (real property, 231 Peats Ferry Rd)"
  - type: image
    src: /assets/img/floor-plan/front-proposed.png
    caption: "After — the agent-proposed façade render"
  - type: image
    src: /assets/img/floor-plan/plan-original.png
    caption: Original layout, redrawn clean by the pipeline
  - type: image
    src: /assets/img/floor-plan/plan-proposed.png
    caption: Proposed layout — added rooms in green, change annotations in amber
  - type: image
    src: /assets/img/floor-plan/overlay-v03.png
    caption: v03 delta overlay — every change red-boxed against the original
---

## The problem

A property's rental income is mostly locked in by its floor plan, and deciding
whether a re-plan is worth it usually means paying a designer to speculate. The
question — *what layout change actually moves the rent, and by how much?* — is
judgment plus arithmetic, which is exactly what an agent can do measurably.

## The build

The reviewer works like an investor's architect, in five phases: intake → locked
scope → rent baseline → iterate → summary.

- **Vision understanding.** Claude vision ingest segments the plan image into
  rooms and structure; the external envelope is immutable by rule — the agent
  can only re-plan inside it.
- **Typed, validated edits.** In the Studio app, the agent (Claude Agent SDK)
  never draws pixels — it emits typed geometry operations that are validated
  before they touch the plan, then Pillow renderers produce red-box delta
  overlays and clean listing-style redraws.
- **Priced against reality.** Every version is valued against live rental
  comparables (Tavily search → structured extraction), with the paper trail
  committed per version.

## The result

On the worked example the pipeline corrected its own comp-triangulated baseline
($850 → $900/wk after owner review), then iterated: v01 turned the garage into a
fourth bedroom with ensuite (+$150/wk), v02 reclaimed the balcony into living
space (+$190/wk), and the v03 composite — five bedrooms, three baths, two
masters — landed at **+$360/wk cumulative** over the corrected baseline. Every
number traces to a committed proposal file, and every change to a red-boxed
overlay you can inspect below.
