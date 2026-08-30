---
published: false   # D4a — the site shows only the three production systems.
                   # Content and media stay in git; nothing renders. Reversible.
title: PropertyIQ ETL
summary: Collection-only ETL over NSW property and census sources — partitioned CSVs with sha256 manifests, the data backbone behind the property agents.
tags: [Data]
metric: "3 sources"
metric_label: "sales · rents · census"
featured: false
order: 7
stack: [Python, pandas, argparse CLI, uv]
skills: [python, data-pipelines]
links:
  repo: https://github.com/nmp-dsci/propertyiq_getdata
media: {}
---

## What it is

The unglamorous layer that keeps the property agents honest: a collection-only
ETL package over three public sources — NSW Valuer General property sales, NSW
rental bond lodgements, and ABS Census data by postcode. A staged
pull → extract → transform CLI writes period-partitioned, normalised CSVs with
atomic writes and sha256-stamped manifests, plus a cross-source integrity audit.
Deliberately stops at collection — downstream modelling belongs to the projects
that consume it. Floor Plan Reviewer's market grounding starts here.
