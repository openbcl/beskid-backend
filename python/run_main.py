#!/usr/bin/env python3

# Usage: python run_main.py <model_name> <experiment_id> <experiment_conditions as json> <name of input file> <name of output file>
# Example: python run_main.py model1 CONE '{"heat_flux": 25}' sample_input.txt result_model1.json
import argparse
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
import os


def validate_predictions(predictions):
    if not isinstance(predictions, list):
        return False, "Predictions must be a list"

    required_keys = {"id", "name", "value"}
    optional_keys = {"parameter_type"}

    for i, item in enumerate(predictions):
        if not isinstance(item, dict):
            return False, f"Item at index {i} is not a dict"

        item_keys = set(item.keys())
        if not required_keys.issubset(item_keys):
            return False, f"Item at index {i} must include keys {required_keys}, got {item_keys}"
        if not item_keys.issubset(required_keys | optional_keys):
            return False, f"Item at index {i} contains unsupported keys: {item_keys - (required_keys | optional_keys)}"

    return True, "Valid structure"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run model prediction with given experiment settings"
    )

    parser.add_argument("model_name", help="Name of the model to use")
    parser.add_argument("experiment_id", help="Experiment identifier")
    parser.add_argument("experiment_condition", help="Condition (e.g., temperature)")
    parser.add_argument("input_file", help="Path to input file")
    parser.add_argument("result_file", help="Path to save results")

    args = parser.parse_args()

    model_name = args.model_name
    experiment_id = args.experiment_id

    try:
        experiment_condition = json.loads(args.experiment_condition)

        # Backwards compatibility if it is just a single number but still valid json
        # Not really necessary after testing
        if isinstance(experiment_condition, (int, float)):
            experiment_condition = {"heat_flux": experiment_condition}

    except json.JSONDecodeError:
        # Backwards compatibility in case it is not valid json
        try:
            value = float(args.experiment_condition)
            experiment_condition = {"heat_flux": value}
        except ValueError:
            print("experiment_condition must be valid JSON or a number")
            sys.exit(1)

    input_file = args.input_file
    result_file = args.result_file

    # Load input data
    try:
        data_array = np.loadtxt(input_file)
    except Exception as e:
        print(f"Error reading data: {e}")
        sys.exit(1)

    # Manual method if automatically is not safe enough
    # <----- Load models manually ----->
    # import model1.run
    # import model2.run
    #
    # models = {'model1': model1.run,
    #           'model2': model2.run}
    # if model_name not in models:
    #     print(f"Model {model_name} not found")
    #     sys.exit(1)
    # model_run_func = models[model_name]

    # <----- Load models automatically ----->

    # Define file path of model in file system
    BASE_MODELS_DIR = Path(__file__).parent / "models"
    model_path = BASE_MODELS_DIR / model_name

    if not model_path.exists():
        print(f"Model {model_name} at path {model_path} does not exist")
        sys.exit(1)

    run_file = model_path / "run.py"
    if not run_file.exists():
        print(f"Model {model_name} does not have run.py")
        sys.exit(1)

    # import function dynamically from the file
    try:
        spec = importlib.util.spec_from_file_location(model_name, run_file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        model_run_func = getattr(module, 'run')
    except Exception as e:
        print(f"Error loading model '{model_name}': {e}")
        print("Make sure:")
        print("- The folder exists")
        print("- It contains run.py")
        print("- run.py defines a function: run(experiment_condition, input_data)")

        sys.exit(1)

    # Create JSON output
    result = model_run_func(experiment_condition, data_array)

    # verify formatting of result
    is_valid, validation_message = validate_predictions(result)
    if not is_valid:
        print(validation_message)
        sys.exit(1)

    #ensure that result file has json ending
    result_file = Path(result_file).with_suffix(".json")
    # Save to JSON file
    with open(result_file, 'w') as json_file:
        json.dump(result, json_file, indent=2)

    print(f"Predictions saved to {result_file}.json")
