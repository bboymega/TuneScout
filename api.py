from dejavu_access import recognize, recognizeAll
from flask import Flask, jsonify, request, abort
import json
import numpy as np
from sorting import quick_sort_by_confidence

app = Flask(__name__)

def jsonifyBinary(data):
    # Handle np.int64 and byte strings
    for key, value in data.items():
        if isinstance(value, np.int64):
            data[key] = int(value)  # Convert np.int64 to int
        elif isinstance(value, bytes):
            data[key] = value.decode('utf-8')  # Convert bytes to string
    return data

resultsArray = [] # Here stores the results

@app.route('/api/recognize', methods=['POST'])
def recognizeAPI():
    if 'file' not in request.files:
        abort(400, description="No file part in the request.")
    blob = request.files['file'].read()
    results = recognizeAll(blob)
    for result in results:
        resultsArray.append(jsonifyBinary(result))
    
    quick_sort_by_confidence(resultsArray, 0, len(resultsArray) - 1) #Quick sort output results based on fingerprinted confidence
    return(jsonify({"results": resultsArray[:3]})) # Only return the 3 best solutions.

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)