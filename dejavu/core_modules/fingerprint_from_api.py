import json
import multiprocessing as mp
from dejavu.database_handler.result_storage import createMysqlConnection
from dejavu import Dejavu
from dejavu.logic.recognizer.blob_recognizer import BlobRecognizer
from dejavu.config.settings import (CONFIG_FILE,
                                    SONGS_TABLENAME, FIELD_FILE_SHA1)

config_file = CONFIG_FILE if CONFIG_FILE not in [None, '', 'config.json'] else 'config.json'

def isFingerprinted(blob, dbConfig):
    if dbConfig["database_type"] == "mysql":
        MysqlDbConnection = createMysqlConnection(dbConfig["database"])
            if MysqlDbConnection:
                try:
                    is_fingerprinted_query = f"""
                    SELECT `{FIELD_FILE_SHA1}` FROM `{SONGS_TABLENAME}`
                    WHERE `{FIELD_FILE_SHA1}` = %s;
                    """
                    #blobHash = 
                    cursor = MysqlDbConnection.cursor()
                    cursor.execute(is_fingerprinted_query, (blobHash,))
                    result = cursor.fetchone()

                except Error as e:
                    return None

def isFingerprintedAll(blob):

def fingerprint(blob):
    with open(config_file, 'r') as jsonFile:
        dbConfigs = json.load(jsonFile)["results"]
        random_db = random.choice(dbConfigs) # Randomly choose a database in all available databases to store the result
