import argparse
import json
import sys
from argparse import RawTextHelpFormatter
from os.path import isdir
import queue
import multiprocessing as mp
from dejavu import Dejavu
from dejavu.logic.recognizer.blob_recognizer import BlobRecognizer

DEFAULT_CONFIG_FILE = "dejavu.cnf.SAMPLE"


def init(configpath):
    """
    Load config from a JSON file
    """
    try:
        with open(configpath) as f:
            config = json.load(f)
            instances = []
            for item in config["instances"]:
                instances.append(Dejavu(item))

    except IOError as err:
        print(f"Cannot open configuration: {str(err)}. Exiting")
        sys.exit(1)

    return instances

#def fingerprint(directory, extension, config_file = "config.json"):
#    djv = init(config_file)
#    print(f"Fingerprinting all .{extension} files in the {directory} directory")
#    djv.fingerprint_directory(directory, ["." + extension], 4)

def recognize(blob, instance, result_queue):
    result = instance.recognize(BlobRecognizer, blob)
    result_queue.put(result)

def recognizeAll(blob, config_file = "config.json"):
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
