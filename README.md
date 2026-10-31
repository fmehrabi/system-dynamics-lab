# System Dynamics Lab

A browser-based library of interactive system dynamics models. The site is designed as a stable catalogue with isolated model packages: adding a model does not require redesigning the library or changing existing model workspaces.

## Stable URLs

- **Library:** `https://fmehrabi.github.io/system-dynamics-lab/`
- **Current model:** `https://fmehrabi.github.io/system-dynamics-lab/models/demand-supply-delay/`
- **Repository:** `https://github.com/fmehrabi/system-dynamics-lab`

Keep the GitHub account name and repository name unchanged to preserve these URLs.

## Architecture

```text
system-dynamics-lab/
├── index.html                    # Stable model-library homepage
├── assets/
│   ├── library.css               # Library-page styling
│   ├── library.js                # Reads the registry and renders model cards
│   ├── favicon.svg
│   └── model-previews/
├── shared/
│   └── style.css                 # Shared visual system for model workspaces
├── models/
│   ├── registry.json             # Single source of truth for the model catalogue
│   ├── demand-supply-delay/
│   │   ├── index.html             # Current interactive model page
│   │   ├── app.js                 # Model-specific UI and diagram behavior
│   │   ├── engine.js              # Model-specific simulation equations
│   │   ├── manifest.json          # Model metadata and simulation settings
│   │   └── source.mdl             # Original Vensim source file
│   └── _template/                 # Instructions and starter contract for future models
├── docs/
│   ├── ADDING_MODELS.md
│   └── ADDING_MODELS_FA.md
├── tests/
│   ├── browser_test.py
│   └── test_engine.js
├── downloads/
│   └── System_Dynamics_Lab_Standalone.html
├── .nojekyll
└── README.md
```

### Why this structure

- The root URL always opens the **model library**, not a model-specific page.
- Each model has an isolated folder. Its source `.mdl`, equations, diagram mapping, model page, and tests can be maintained independently.
- `models/registry.json` controls which models appear in the library. The library page reads this file at runtime; its HTML and JavaScript do not need to be edited when a model is added.
- `shared/style.css` is the common design system. New model workspaces reuse it so the overall product remains visually consistent.
- Existing model folders are not changed when a new model is introduced.

## Current model

**Demand, Supply & Adjustment Delay** is the only model included in this release. Other models should be added only after their equations, lookup functions, diagram connections, and simulation settings have been reviewed and verified.

### Editable items

- Demand Slope = 10
- Supply Slope = 30
- Delay = 2 months
- Initial Price = 5
- Initial Capacity = 100
- Five y-values of lookup function F; original x-values are fixed

All calculated variables remain read-only. The demand intercept (1000), equations, and simulation settings are fixed in the current interface.

### Source simulation settings

- Initial Time = 0
- Final Time = 20 months
- Time Step = 0.125 months
- Integration method in the browser implementation = fixed-step Euler
- Lookup interpolation = piecewise linear, endpoint hold outside the tabulated x-range

The model engine is an explicit transcription of the supplied Vensim equations, not a general-purpose Vensim interpreter. Point-by-point numerical comparison with Vensim output is still required before research use.

## Add a model later

Read [`docs/ADDING_MODELS.md`](docs/ADDING_MODELS.md) or [`docs/ADDING_MODELS_FA.md`](docs/ADDING_MODELS_FA.md).

In short:

1. Create a new folder under `models/` using a stable kebab-case ID.
2. Add that model's `manifest.json`, original `.mdl`, `engine.js`, `app.js`, `index.html`, preview, and tests.
3. Add one metadata entry to `models/registry.json`.
4. Test the new model locally and verify its outputs against Vensim.
5. Commit and push. The library card appears automatically from the registry.

Do not put equations for different models into one shared engine file. Keep each model's equations isolated in its own folder.

## Run locally

From the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`. Use a local HTTP server rather than opening `index.html` with `file://`, because the library reads `models/registry.json` using `fetch()`.

The current model can also be opened directly at `http://localhost:8000/models/demand-supply-delay/`.

## Deploy with GitHub Pages

1. Create a **public** repository named `system-dynamics-lab` under `fmehrabi`.
2. Upload or push the **contents** of this project folder to the repository root. Do not upload the ZIP itself as the site source.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then save.
6. Wait for the Pages deployment to complete. The stable library URL is `https://fmehrabi.github.io/system-dynamics-lab/`.

GitHub Pages on GitHub Free requires a public repository. Published Pages content is publicly accessible. Do not commit private or sensitive files.

## Repository metadata

**Repository name:** `system-dynamics-lab`

**Description:** `Interactive system dynamics model library — Vensim-based stock–flow diagrams, live simulation, editable parameters, lookup functions, and scenario comparison.`

**Topics:** `system-dynamics`, `vensim`, `simulation`, `stock-flow`, `feedback-loops`, `systems-thinking`, `github-pages`, `education`, `javascript`

No license is included in this starter. Choose a license before inviting others to reuse or redistribute the code or model files.
