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
1. **Snapshots as first-class debug tools** — every feature designed with snapshot capture in mind
2. **Modular from day one**
3. **Trace blast radius** — no file is edited without checking all callers first

## Quick start
```bash
cd .simma/workspace/simulator-v2
# TBD
```

## Conventions
- **No `delegate_to_coder`** — all edits via direct file tools
- **snapshots/** — grid state captures for debugging
- **plans/** — one-shot plan docs before building
