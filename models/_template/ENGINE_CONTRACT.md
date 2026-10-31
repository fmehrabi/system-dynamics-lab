# Engine interface contract

Every model engine is isolated in its own folder and exposes `window.SDExplorerEngine`.

Required members for a workspace using the current simulation shell:

```js
window.SDExplorerEngine = {
  DEFAULTS,       // baseline model parameters and stock initial values
  DT,             // integration / output time step
  FINAL,          // final simulation time
  clone(value),   // deep-copy scenario configuration
  simulate(params), // { rows: [{t, ...variables}], params, warnings }
  at(run, time)   // nearest saved row for selected time
};
```

Optional members:

- `LOOKUP`: default lookup points when the model contains a lookup editor.
- `LIMITS`: explicit UI bounds for editable controls.
- `validate(params)`: reject invalid scenario values before integration.
- `metadata`: engine-level units, integration method or diagnostics.

The engine must not silently alter the source equations. If a model contains unsupported Vensim constructs, mark them explicitly in its manifest and keep the model at `status: "draft"` until the implementation and validation approach are agreed.

The `rows` array must be ordered by time. Each row uses `t` for time and stable variable names for the remaining values. Keep model-specific parameter keys separate from calculated variable keys. A calculated auxiliary or flow must not be exposed as a free parameter unless the source model defines it as one.
