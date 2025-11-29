import numpy as np

def jsonifyBinary(data):
    # Handle np.int64 and byte strings
    for key, value in data.items():
        if isinstance(value, np.int64):
            data[key] = int(value)  # Convert np.int64 to int
        elif isinstance(value, bytes):
            data[key] = value.decode('utf-8').lower()  # Convert bytes to string
    return data
