# Usage: python dummy_code.py <id> <model_name> <sample_input.txt-name of input file> 


import json
import random
import sys
import numpy as np 

def generate_parameter(id, model_name, data_array):
    #Dummy function that generates random output and saves in json file 
    #model name -name of the AI model 
    #data array-100 data points (for now )

    # selecting models- just place holders for the model selection logic
    ## model names- 'model1','model2' 
    ##since the models have not been finalised using these variables instead

    #parameters- parameter 1 , parameter 2....etc
    if model_name == "model1":
        selected_model = "Model1"
    elif model_name == "model2":
        selected_model = "Model2"
    else:
        print(f"Error: Unknown model name '{model_name}'.")
        sys.exit(1)

    # creating random parameter output 
    output_values = [random.uniform(0, 1) for _ in range(15)] #Since we have not finalised which parameters are to be predicted ,i have 15 parameters randomly generated here.


    # dictionary with parameter names as keys
    output_dict = {f"parameter {i+1}": value for i, value in enumerate(output_values)}

    # saving the output in json format with the  given id as the filename
    output_filename = f"{id}.json"
    with open(output_filename, 'w') as json_file:
        json.dump(output_dict, json_file)

    return output_filename

if __name__ == "__main__":
    # check if the correct number of command line arguments is provided
    if len(sys.argv) != 4:
        print("Usage: python script.py <id> <model_name> <data_array>")
        sys.exit(1)

    # parse command line arguments
    id, model_name, data_file_path = sys.argv[1], sys.argv[2], sys.argv[3]

    # read data_array from text file 
    try:
        with open(data_file_path, 'r') as data_file:
            data_array = np.loadtxt(data_file)
    except Exception as e:
        print(f"Error reading data from file: {e}")
        sys.exit(1)

    
    # check that data_array has 100 elements
    if len(data_array) != 100:
        print("Error: Data array must contain 100 elements.")
        sys.exit(1)

    # dummy function 
    result_file = generate_parameter(id, model_name, data_array)
    print(f"Output saved to {result_file}")




