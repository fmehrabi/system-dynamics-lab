# Adding a model to System Dynamics Lab

The project uses a **Model Package + Central Registry** pattern. Every model is isolated in its own folder; the library page reads the registry.

## Required package layout

For a new model with ID `marketing-dynamics`:

```text
models/marketing-dynamics/
├── manifest.json
├── source.mdl
├── engine.js
├── app.js
├── index.html
├── tests/test_engine.js
└── preview.png
```

| File | Responsibility |
|---|---|
| `manifest.json` | Stable ID, title, description, version, category, simulation settings, source filename and validation status |
| `source.mdl` | Original Vensim file, retained unchanged |
| `engine.js` | Equations, lookups, integration method, initial conditions, input validation and time-series output |
| `app.js` | Model-specific diagram mapping, permitted controls, charts and page interactions |
| `index.html` | Model workspace; reuses `../../shared/style.css` |
| `tests/` | Tests for equations, initial conditions, first step, lookups and sensitivity scenarios |
| `preview.png` | Library card image |

## Register the model

Add one object to the `models` array in `models/registry.json`:

```json
{
  "id": "marketing-dynamics",
  "title": "Marketing Dynamics",
  "description": "An interactive model of marketing response and sales dynamics.",
  "category": "Marketing Systems",
  "status": "available",
  "version": "1.0.0",
  "path": "./models/marketing-dynamics/",
  "manifest": "./models/marketing-dynamics/manifest.json",
  "thumbnail": "./models/marketing-dynamics/preview.png",
  "tags": ["Marketing", "Feedback", "Vensim"],
  "order": 2
}
```

After the registry is committed, the library automatically displays the card. The root `index.html` and `assets/library.js` do not need editing.

## Simulation-engine contract

Each model's `engine.js` exposes its own `window.SDExplorerEngine` API. The current workspace expects:

- `DEFAULTS`: baseline parameters and stock initial values
- `DT` and `FINAL`: time step and final time
- `LOOKUP` and `LIMITS`, where applicable
- `clone(value)`: independent copy of scenario settings
- `simulate(parameters)`: returns `rows`, `params`, and `warnings`
- `at(run, time)`: returns the row nearest the selected time

Do not invent a lookup or parameter merely to fit the current model. If a model has a materially different structure or interaction pattern, its own `app.js` should implement the appropriate interface while reusing the shared stylesheet.

Each time-series row should include time under `t` and stable, documented variable keys. Avoid renaming published keys; increment the model version if a breaking change is necessary.

## Verification and release sequence

1. Parse the MDL file and inventory Stocks, Flows, Auxiliaries, Constants, Lookups and Control settings.
2. Record each equation, unit, Causes and Uses.
3. Draw the diagram from actual dependencies; do not confuse physical flow paths with causal links.
4. Define exactly which parameters and stock initial values are editable. Keep calculated variables read-only.
5. Implement and test the numerical engine: initial values, first integration step, lookups, limits and parameter-change scenarios.
6. When possible, export Vensim results to CSV and compare them time-step by time-step with browser output. Report absolute and relative error.
7. Test desktop and mobile layouts; update the preview and registry.
8. Change `status` from `draft` to `available` only after verification.

## Maintenance rules

- Keep the original MDL file unchanged in the model package.
- Never mix equations from separate models into one engine.
- Use stable lowercase kebab-case IDs; do not rename published IDs.
- Separate UI guardrails from source-equation constraints and document both.
- Keep incomplete or unverified models at `status: "draft"`.
- Change the global visual system only in `shared/style.css`; model-specific changes should not unintentionally affect other workspaces.
