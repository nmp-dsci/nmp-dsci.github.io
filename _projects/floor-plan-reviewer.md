---
title: Floor Plan Reviewer
summary: An agentic redesign studio that re-plans a home's interior to maximise weekly rent — one validated change at a time, priced against live rental comparables.
tldr: A vision agent that edits floor plans only through typed, validated geometry operations — never pixels — and prices every proposal against live market comps.
tags: [Agents]
metric: "+$360/wk"
metric_label: "verified uplift on the worked example"
featured: true
order: 6
stack: [Claude Agent SDK, Vision ingest, Tavily live comps, FastAPI, React 19 + d3, Pillow renderers]
skills: [agentic-ai, vision, prompt-engineering, api-design, python, llms]
skills_detail:
  - skill: agentic-ai
    proof: The agent can only change the plan through typed, validated geometry operations — every edit is checked before it touches the model, and the external envelope is immutable by rule (plan-core/ops.py, validate.py).
  - skill: vision
    proof: Claude vision ingest segments a plan image into rooms, walls and structure that the geometry engine can operate on (plan-agent/ingest.py).
  - skill: prompt-engineering
    proof: Comps and ops calls are single-turn, tool-free structured extractions — one call returns one validated Pydantic model, with reasoning effort set high for planning and low for comps (llm.py, comps.py).
  - skill: api-design
    proof: FastAPI review/edit endpoints stream agent progress over SSE into the React + d3 canvas workspace (backend-api).
  - skill: python
    proof: Everything after the LLM is deterministic and local — geometry validation, compliance flags, and the Pillow renderers that draw delta overlays and listing-style redraws (render_overlay.py, render_plan.py).
media:
  walkthrough: /assets/video/floor-plan-reviewer/walkthrough.mp4
  poster: /assets/img/floor-plan/app-review.png
  captions: /assets/video/floor-plan-reviewer/walkthrough.vtt
  reel: planned
---

## Architecture

Five phases: intake → locked scope → rent baseline → iterate → summary. Vision
ingest builds a typed model of the plan; the agent proposes one high-impact
change per version as geometry operations; validators enforce what's
structurally plausible; Pillow renderers produce red-box delta overlays and
clean listing-style redraws; and every version is priced against live rental
comparables pulled via Tavily and structured-extracted into evidence.

On the worked example — a real property — the pipeline corrected its own
baseline ($850 → $900/wk after owner review), then iterated to a five-bed,
three-bath composite worth **+$360/wk cumulative**, every step traceable to a
committed proposal file.

<figure class="evidence">
  <img src="/assets/img/floor-plan/front-existing.png" alt="Existing 1960s house front" loading="lazy">
  <figcaption>Before — the existing house (real property, 231 Peats Ferry Rd)</figcaption>
</figure>

<figure class="evidence">
  <img src="/assets/img/floor-plan/front-proposed.png" alt="Agent-proposed façade render" loading="lazy">
  <figcaption>After — the agent-proposed façade render</figcaption>
</figure>

<figure class="evidence">
  <img src="/assets/img/floor-plan/plan-proposed.png" alt="Proposed layout with added rooms and change annotations" loading="lazy">
  <figcaption>Proposed layout — added rooms in green, change annotations in amber</figcaption>
</figure>

<figure class="evidence">
  <img src="/assets/img/floor-plan/overlay-v03.png" alt="v03 delta overlay with red-boxed changes" loading="lazy">
  <figcaption>v03 delta overlay — every change red-boxed against the original</figcaption>
</figure>

## Cost

- **Flat-rate LLM by design.** The agent runs on the Claude Agent SDK
  authenticated with a subscription OAuth token — the repo explicitly warns
  *against* setting an API key, because the subscription outranks metered
  billing. Top-tier model, fixed cost.
- **One call, one validated object.** LLM interactions are single-turn and
  tool-free — a structured extraction returning a typed Pydantic model — with
  reasoning effort dialled high only where planning quality pays.
- **Deterministic everywhere else.** Geometry validation, compliance checks,
  diffing and all rendering are local Python; an echo mode runs the entire
  studio LLM-free for development.
- **Comps are bounded**: Tavily basic-depth searches capped at 8 results, and
  skipped gracefully with a note when no key is present.
