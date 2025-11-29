import json
import sys
from os.path import isdir
import queue
import multiprocessing as mp
from dejavu import Dejavu
from dejavu.logic.recognizer.blob_recognizer import BlobRecognizer
from dejavu.config.settings import CONFIG_FILE

config_file = CONFIG_FILE if CONFIG_FILE not in [None, '', 'config.json'] else 'config.json'


def init(config_file):
    """
    Load config from a JSON file
    """
    try:
        with open(config_file) as f:
            config = json.load(f)
            instances = []
            for item in config["instances"]:
                instances.append(Dejavu(item))

    except IOError as err:
        print(f"Cannot open configuration: {str(err)}. Exiting")
        sys.exit(1)

    return instances

def recognize(blob, instance, result_queue):
    result = instance.recognize(BlobRecognizer, blob)
    result_queue.put(result)

def recognizeAll(blob):
    processes = []
    result_queue = mp.Queue()
    songs = []
    djv = init(config_file)
    
    # Start a new process for each instance
    for instance in djv:
        process = mp.Process(target=recognize, args=(blob, instance, result_queue,))
        processes.append(process)
        process.start()

    # Wait for all process to complete
    for process in processes:
        process.join()
    
    # collect results from each instance and merge them
    while not result_queue.empty():
        result = result_queue.get()
        songs.extend(result['results'])
    return songs
