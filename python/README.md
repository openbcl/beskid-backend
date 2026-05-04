## Required model structure

Create a new model folder under `python/models/`:

```text
python/
  models/
    modelX/
      run.py
      additional code/resource files
```

`run.py` must define:

```python
def run(experiment_condition: dict, input_data: list) -> list[dict]:
    ...
```

Use `python/run_template.py` as the starting point.

`run(...)` must return a `list` of objects. Each object must contain a dictionary:

- `id` (string): parameter id (must match template placeholders)
- `name` (string): label shown in UI
- `value` (number or string): value to be used

Optional:

- `templateOnly` (boolean): if `true`, parameter is used for template filling fds template or other important parameter that are in the results file, but hidden in normal result screen.

Example:

```python
[
  {"id": "emissivity", "name": "Emissivity", "value": 0.92},
  {"id": "name", "name": "Case name", "value": "fzj_case", "templateOnly": True}
]
```

## Register the model in backend config

Add it to

- `src/config/models.json`

Minimum fields to add/update:

- `id`
- `name` (must match folder name, e.g. `modelX`)
- `resolution`
- `experiments` and allowed `conditions`
- `templates` with `experimentId` and `experimentConditions`

For example:
```
{
    "id": 1,
    "name": "my_model_name",
    "description": "My Model",
    "resolution": 600, # length of input data
    "fds": "6.7.6",
    "experiments": [
      {
        "id": "CONE",
        "conditions": [
          { "id": "heat_flux", "label": "Heat Flux (kW/m2)", "values": [25, 50, 75] },
          { "id": "density", "label": "Density (kg/m3)", "values": [900, 950, 1000] },
          { "id": "thickness", "label": "Thickness (mm)", "values": [3, 6, 10] }
        ]
      }
    ],
    "templates": [
      {
        "file": "template_my_model.fds",
        "experimentId": "CONE",
        "experimentConditions": {
          "heat_flux": [25, 50, 75],
          "density": [900, 950, 1000, 1050, 1100, 1150, 1200, 1250],
          "thickness": [3, 6, 10]
        }
      }
    ],
    "disabled": false
  }
```
The `id` in `condition` is also the key passed as `experiment_condition` to the model's `run(...)` function. The `values` are used for dropdowns in the UI for the user to select.

If multiple templates match, the first one in `models.json` is used.
