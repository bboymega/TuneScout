from dejavu.core_modules.recognize import recognizeAll
from flask import Flask, jsonify, request, abort
import json
import secrets
import string
from dejavu.base_classes.sorting import quick_sort_by_confidence
from dejavu.base_classes.jsonifyBinaryData import jsonifyBinary
from dejavu.config.settings import CONFIG_FILE
from dejavu.database_handler.result_storage import initAllStorageDb, storeResult, searchResultAll

config_file = CONFIG_FILE if CONFIG_FILE not in [None, '', 'config.json'] else 'config.json'

app = Flask(__name__)

def generate_result_token(length=20):
    # Define the characters to choose from (uppercase, lowercase, digits)
    characters = string.ascii_letters + string.digits
    # Generate a random string using secrets.choice
    random_id = ''.join(secrets.choice(characters) for _ in range(length))
    return random_id


@app.route('/api/recognize', methods=['POST'])
def recognizeAPI():
    initAllStorageDb()
    if 'file' not in request.files:
        abort(400, description="No file part in the request.")
    blob = request.files['file'].read()
    results = recognizeAll(blob)
    
    resultsArray = [] # Here stores the results
    for result in results:
        resultsArray.append(jsonifyBinary(result)) # Make sure that the returned data format is JSON compatible
    
    quick_sort_by_confidence(resultsArray, 0, len(resultsArray) - 1) #Quick sort output results based on fingerprinted confidence
    resultsArray = resultsArray[:3] # Only return the 3 best solutions.
    resultsToken = generate_result_token()
    storeResult(resultsToken, resultsArray)

    return(jsonify({"token":resultsToken, "results": resultsArray})) 


@app.route('/api/fetch/<token>', methods=['GET'])
def fetchResultAPI(token):
    json_result = searchResultAll(token)
    if json_result:
        return(jsonify(json_result))
    else:
        return jsonify({
            "error": "The requested data could not be found"
        }), 404


@app.errorhandler(404)
def page_not_found(error):
    return jsonify({
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "error": "Bad request"
    }), 400


@app.errorhandler(405)
def bad_request(error):
    return jsonify({
        "error": "Method not allowed"
    }), 405


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)