# Power Grid Simulator V2

## Metadata
- lastReviewed: 2026-07-01
- sourceOfTruthScope: present-state codebase
- freshnessExpectation: high
- updateTriggerSummary: update when architecture, physics model, files, or workflow materially change

A browser-based 2D power grid simulator — clean restart from V1. No code yet.

## Location
- **Root:** `.simma/workspace/simulator-v2/`
- **V1 (archive):** `.simma/workspace/simulator/`

## Design principles (from V1 learnings)
1. **Dispatch sets targets, physics sets outputs** — no `gen.mw` overwrites from dispatch
2. **Display shows raw instructions** — base, FCR, AGC presented independently, not re-bucketed
3. **Snapshots as first-class debug tools** — every feature designed with snapshot capture in mind
4. **Modular from day one** — 12-domain module split from V1 refactor is the baseline structure
5. **Trace blast radius** — no file is edited without checking all callers first

## Quick start
```bash
cd .simma/workspace/simulator-v2
# TBD
```

## Conventions
- **No `delegate_to_coder`** — all edits via direct file tools
- **snapshots/** — grid state captures for debugging
- **plans/** — one-shot plan docs before building
