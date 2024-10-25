# Usage: python dummy_code.py <name of output file> <model_name> <sample_input.txt-name of input file> 

# python test_02.py "12qw" "model1" sample_input.txt
# python test_02.py "34er" "model2" sample_input.txt

# The model was created using PyTorch version 2.0.1, so while the latest version may issue a warning, it can still be used.


import torch
import torch.nn as nn
import torch.nn.functional as F
import json
import os
import sys
import numpy as np


# Define the 1D Convolutional Neural Network
class ConvNet1D(nn.Module):
    def __init__(self):
        super(ConvNet1D, self).__init__()
        self.conv1 = nn.Conv1d(1, 32, 3, stride=1, padding=1)
        self.pool = nn.MaxPool1d(2)
        self.conv2 = nn.Conv1d(32, 64, 3, stride=1, padding=1)
        self.fc1 = nn.Linear(64 * 25, 120)  # Adjusted for pooled size
        self.fc2 = nn.Linear(120, 15)

    def forward(self, x):
        x = x.unsqueeze(1)  # Add channel dimension
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = torch.flatten(x, 1)  # Flatten except batch
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Load the trained model
model_path = "model1.pth"
model = ConvNet1D()
model.load_state_dict(torch.load(model_path, map_location='cpu'))
model.eval()  # Set to evaluation mode

# Predict using the model
def make_predictions(input_data):
    input_tensor = torch.tensor(input_data, dtype=torch.float32)
    if input_tensor.ndim == 1:
        input_tensor = input_tensor.unsqueeze(0)  
    model.eval()
    with torch.no_grad():
        output = model(input_tensor)
    return output

# Generate dummy outputs
def create_dummy_outputs(sample_input):
    return np.random.rand(sample_input.shape[0], 15)

# Reverse scaling for a single parameter
def reverse_scaling(scaled, min_val, max_val):
    scaled = np.clip(scaled, 0, 1)
    return scaled * (max_val - min_val) + min_val

# Reverse scaling for all parameters
def reverse_scaling_all(scaled_values):
    param_ranges = {
        "PMMA Emissivity": (0.7994, 0.9990),
        "PMMA Absorption coefficient": (6782.23, 9175.28),
        "PMMA Refractive index": (2.4259, 3.2819),
        "PMMA Conductivity at 150°C": (0.3221, 0.4357),
        "PMMA Conductivity at 480°C": (0.0206, 0.0279),
        "PMMA Conductivity at 800°C": (3.6867, 4.9875),
        "PMMA Specific heat at 150°C": (0.6581, 0.8903),
        "PMMA Specific heat at 480°C": (3.2372, 4.3791),
        "PMMA Specific heat at 800°C": (6.1837, 8.3656),
        "Residue Emissivity": (0.4692, 0.6348),
        "Residue Conductivity": (3.8330, 5.1854),
        "Residue Specific heat": (5.0091, 6.7765),
        "Backing Emissivity": (0.3746, 0.5067),
        "Backing Conductivity": (2.0467, 2.7689),
        "Backing Specific heat": (3.4569, 4.6766),
    }
    return [reverse_scaling(val, *param_ranges[key]) for key, val in zip(param_ranges, scaled_values)]

if __name__ == "__main__":
    # Validate arguments
    if len(sys.argv) != 4:
        print("Usage: python script.py <id> <model_name> <inputfile>")
        sys.exit(1)

    id, model_name, data_file = sys.argv[1], sys.argv[2], sys.argv[3]

    # Load input data
    try:
        data_array = np.loadtxt(data_file)
    except Exception as e:
        print(f"Error reading data: {e}")
        sys.exit(1)

    try:
        if len(data_array) != 100:
            print("Error: Data array must have 100 elements.")
            sys.exit(1)
        print(len(data_array))
        sample_input = torch.from_numpy(data_array).float().unsqueeze(0) if data_array.ndim == 1 else torch.from_numpy(data_array).float()

        if sample_input.shape != (1, 100):
            raise ValueError("Input must be of shape (1, 100)")

        # Predict or generate dummy outputs
        predictions = make_predictions(sample_input).numpy().tolist() if model_name == "model1" else create_dummy_outputs(sample_input).tolist()

        # Reverse scale predictions
        y_pred = np.array([reverse_scaling_all(predictions[0])])[0]

        # Parameter names
        params = [
            'PMMA Emissivity',
            'PMMA Absorption coefficient, m⁻¹',
            'PMMA Refractive index',
            'PMMA Conductivity at 150°C, W/m·K',
            'PMMA Conductivity at 480°C, W/m·K',
            'PMMA Conductivity at 800°C, W/m·K',
            'PMMA Specific heat at 150°C, kJ/kg·K',
            'PMMA Specific heat at 480°C, kJ/kg·K',
            'PMMA Specific heat at 800°C, kJ/kg·K',
            'Residue Emissivity',
            'Residue Conductivity, W/m·K',
            'Residue Specific heat, kJ/kg·K',
            'Backing Emissivity',
            'Backing Conductivity, W/m·K',
            'Backing Specific heat, kJ/kg·K'
        ]

        # Create JSON output
        predictions_json = [{ "id": f"param_{i+1}", "name": params[i], "value": round(y_pred[i],4) } for i in range(len(params))]
        # for pred_dict in predictions_json:
        #     print(pred_dict)

        # Save to JSON file
        with open(f"{id}.json", 'w') as json_file:
            json.dump(predictions_json, json_file, indent=2)


        print(f"Predictions saved to {id}.json")

    except ValueError as e:
        print(f"Error: {e}")
