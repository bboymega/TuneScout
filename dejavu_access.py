import argparse
import json
import sys
from argparse import RawTextHelpFormatter
from os.path import isdir
import threading, queue
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
    threads = []
    result_queue = queue.Queue()
    songs = []
    djv = init(config_file)
    
    # Start a new thread for each instance
    for instance in djv:
        thread = threading.Thread(target=recognize, args=(blob, instance, result_queue,), name=f"Thread-{instance}")
        threads.append(thread)
        thread.start()

    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    # collect results from each instance and merge them
    while not result_queue.empty():
        result = result_queue.get()
        songs.extend(result['results'])
    return songs
