from typing import Any, Dict
from pathlib import Path
import sys
_MODEL_DIR = Path(__file__).resolve().parent
if str(_MODEL_DIR) not in sys.path:
    sys.path.insert(0, str(_MODEL_DIR))



# Additional Code for running the model


#Complete the run function
def run(experiment_condition: Dict[str, Any], input_data: list) -> list[Dict[str, Any]]:
    """
    Template method to run the prediction of the model 
    :param experiment_condition: Experiment conditions in json format
    :param input_data: Input data, as a list
    :return: Parameters passed to the BESKID interface
    """

    # Add the necessary code to run your model
    ...

    # Return the predictions in the following format
    predictions_json = [
    #     {
    #         "id": ..., #id of the parameter, should match id of fds template
    #         "name": ..., # label of parameter which will be displayed on the interface
    #         "value": ... # value of the parameter
    #         "templateOnly": optional boolean if parameter is only for fds template and not predicted from the model
    #     },
    #   Examples
    #     {
    #         "id": "name",
    #         "name": "Case name",
    #         "value": "test_case",
    #         "templateOnly": true
    #     },
    #     {
    #         "id": "emissivity",
    #         "name": "Emissivity",
    #         "value": 0.9
    #     },
    ]

    return predictions_json
