---
title: Adversarial Dev
summary: A GAN-inspired coding harness — planner, generator and evaluator agents in separate contexts, where code only ships by surviving an agent that's trying to fail it.
tags: [Multi-agent, Agents]
metric: "2 SDKs"
metric_label: "Claude + Codex, same harness"
featured: false
order: 9
stack: [TypeScript + Bun, Claude Agent SDK, OpenAI Codex SDK, File-mediated orchestration]
skills: [typescript, multi-agent, agentic-ai, llms, prompt-engineering, model-evaluation]
links:
  repo: https://github.com/nmp-dsci/adversarial-dev-test
media:
  reel: planned
evidence:
  - type: image
    src: /assets/img/adversarial-dev/diagram.png
    caption: The harness — planner → sprint contract → generator builds → evaluator attacks → pass at ≥7/10 or retry with feedback
---

## The problem

A single agent grading its own code is a student marking their own exam. Long-running
AI development gets better when something with a *separate context* is genuinely
trying to find the flaws.

## The build

Three roles, three context windows, communicating only through files — spec,
contracts, feedback, progress — never a shared conversation:

- The **planner** expands the prompt into a spec.
- Each sprint, generator and evaluator **negotiate a contract** of testable
  criteria before any code is written — the definition of done is agreed, in JSON.
- The **generator** builds and commits; the **evaluator** runs the app and scores
  every criterion 1–10. Any score under 7 sends detailed feedback back for a
  retry (max 3), otherwise the sprint passes.

The whole loop is implemented twice from shared prompts and types — once on the
Claude Agent SDK, once on the OpenAI Codex SDK — making it a clean A/B surface
for comparing agent SDKs on identical work. It's asymmetric-adversarial rather
than a literal GAN: the evaluator attacks, the generator survives a hard threshold.

## The result

A working adversarial development loop where quality is enforced by an opponent
with its own context, not self-assessment — portable across two agent SDKs, with
resumable progress on the Claude harness.
