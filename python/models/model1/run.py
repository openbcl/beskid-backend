from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping

import numpy as np
import pandas as pd
import torch

_MODEL_DIR = Path(__file__).resolve().parent
if str(_MODEL_DIR) not in sys.path:
    sys.path.insert(0, str(_MODEL_DIR))

from inverse_utils import load_inverse_bundle, predict_one_row

# Prediction parameter
DEFAULT_HEAT_FLUX = 65.0
DEFAULT_DENSITY = 1150.0
DEFAULT_THICKNESS = 6  # mm

DEFAULT_SAMPLE_AREA = 0.01
DEFAULT_TAIL_EPS = 1e-8
DEFAULT_CUT_LEN = 600

# Template parameter
DEFAULT_CASE_NAME = "fzj_case"
DEFAULT_TEND = 600
DEFAULT_NFRAMES = 600
DEFAULT_AMBIENT_TEMP = 25.0
DEFAULT_MATL_MASS_FRACTION = 1.0
DEFAULT_N_REACTIONS = 1
BACKING_THICKNESS = 0.02


@lru_cache(maxsize=1)
def _load_bundle_cached() -> dict[str, Any]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return {
        "device": device,
        "bundle": load_inverse_bundle(
            _MODEL_DIR / "best.pt",
            _MODEL_DIR / "x_scaler_inverse_slopes.joblib",
            _MODEL_DIR / "y_scaler_inverse_slopes.joblib",
            device,
        ),
    }


def _to_flat_float_array(values: Any) -> np.ndarray:
    arr = np.asarray(values, dtype=np.float32)
    if arr.ndim == 0:
        raise ValueError("input_data must contain at least one numeric value")
    if arr.ndim > 1:
        arr = arr.reshape(-1)
    if arr.size == 0:
        raise ValueError("input_data must not be empty")
    return arr


def run(experiment_condition: Dict[str, Any], input_data: list) -> list[Dict[str, Any]]:
    """
    Run model1 inverse prediction and return JSON-serializable parameter values.

    :param experiment_condition: Conditions in JSON format
    :param input_data: Input HRR values
    :return: Resulting predictions in [{id, name, value}, ...] format
    """

    # Use default values if not specified
    heat_flux = experiment_condition.get('heat_flux', DEFAULT_HEAT_FLUX)
    density = experiment_condition.get('density', DEFAULT_DENSITY)
    thickness = experiment_condition.get('thickness', DEFAULT_THICKNESS)
    thickness = float(thickness) / 1000  # meter

    # Should not be changed by experiment condition but just in case
    sample_area = experiment_condition.get('sample_area', DEFAULT_SAMPLE_AREA)
    tail_eps = experiment_condition.get('tail_eps', DEFAULT_TAIL_EPS)
    cut_len = experiment_condition.get('cut_len', DEFAULT_CUT_LEN)

    # Template Parameters, should also not be changed
    case_name = experiment_condition.get('case_name', DEFAULT_CASE_NAME)
    tend = experiment_condition.get('tend', DEFAULT_TEND)
    nframes = experiment_condition.get('nframes', DEFAULT_NFRAMES)
    ambient_temp = experiment_condition.get('ambient_temp', DEFAULT_AMBIENT_TEMP)
    matl_mass_fraction = experiment_condition.get('matl_mass_fraction', DEFAULT_MATL_MASS_FRACTION)
    n_reactions = experiment_condition.get('n_reactions', DEFAULT_N_REACTIONS)
    backing_thickness = experiment_condition.get('backing_thickness', BACKING_THICKNESS)

    hrr_values = _to_flat_float_array(input_data)
    row = pd.Series({f"t_{idx}": float(val) for idx, val in enumerate(hrr_values)})

    loaded = _load_bundle_cached()
    result = predict_one_row(
        row=row,
        density=density,
        thickness=thickness,
        heat_flux=heat_flux,
        bundle=loaded["bundle"],
        sample_area=sample_area,
        tail_eps=tail_eps,
        cut_len=cut_len,
        device=loaded["device"],
    )
    pred_full = result["pred_full"]

    def param(parameter_id: str, name: str, value: Any, parameter_type: str) -> Dict[str, Any]:
        return {
            "id": parameter_id,
            "name": name,
            "value": value,
            "parameter_type": parameter_type,
        }


    prediction_param = lambda key,name: param(key, name, pred_full[key], "prediction")
    prediction_parameter: list[Dict[str, Any]] = [
        prediction_param("emissivity", "Emissivity"),
        prediction_param("reference_temperature", "Reference temperature"),
        prediction_param("delta_T_K", "Delta T"),
        prediction_param("heat_of_reaction", "Heat of reaction"),
        prediction_param("heat_of_combustion", "Heat of combustion"),
        prediction_param("spec_heat_25", "Specific heat at 25 C"),
        prediction_param("spec_heat_150", "Specific heat at 150 C"),
        prediction_param("spec_heat_500", "Specific heat at 500 C"),
        prediction_param("conductivity_25", "Conductivity at 25 C"),
        prediction_param("conductivity_150", "Conductivity at 150 C"),
        prediction_param("conductivity_500", "Conductivity at 500 C"),
    ]


    tend = int(tend)
    nframes = int(nframes)
    ambient_temp = float(ambient_temp)
    matl_mass_fraction = float(matl_mass_fraction)
    n_reactions = int(n_reactions)
    backing_thickness = float(backing_thickness)
    thickness = float(thickness)
    heat_flux = float(heat_flux)
    density = float(density)
    obst_zmin = thickness + backing_thickness


    fds_param = lambda key, name,value: param(key, name, value, 'FDS_parameter')
    FDS_parameter: list[Dict[str, Any]] = [
        fds_param("name", "Case name", case_name),
        fds_param("tend", "Tend", tend),
        fds_param("nframes", "Nframes", nframes),
        fds_param("ambient_temp", "Ambient temperature", ambient_temp),
        fds_param("matl_mass_fraction", "Material mass fraction", matl_mass_fraction),
        fds_param("n_reactions", "Number of reactions", n_reactions),
        fds_param("backing_thickness", "Backing thickness (m)", backing_thickness),
        fds_param("obst_zmin", "Obstacle z minimum (m)", obst_zmin),

    ]


    input_pram = lambda id_, name, value: param(id_, name, value, 'input')
    input_parameter = [
        input_pram('heat_flux', 'Heat flux (kW/m²)', heat_flux ),
        input_pram('density', 'Density (kg/m³)', density ),
        input_pram('thickness', 'Thickness (m)', thickness),
    ]

    return prediction_parameter + input_parameter + FDS_parameter
