# Model package template

This folder documents the standard package for every additional model. It is intentionally excluded from `models/registry.json`, so it is not shown as a live model.

When adding a verified model:

1. Copy this folder to `models/<stable-kebab-case-id>/`.
2. Add the original Vensim file as `source.mdl`.
3. Complete `manifest.example.json` as `manifest.json`.
4. Implement `engine.js` using the API in `ENGINE_CONTRACT.md`.
5. Add a model-specific `app.js` and `index.html`. Reuse `../../shared/style.css` in the model page.
6. Add tests and a `preview.png`.
7. Add one entry to `models/registry.json`.

The current model workspace is the visual and interaction reference. Do not copy its equations or variable names into a different model. The model-specific engine, editable controls, graph options and diagram connections must be derived from the new model's own source file.
