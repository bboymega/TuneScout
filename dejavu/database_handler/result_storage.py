import mysql.connector
from mysql.connector import Error
import json
import random
import queue
import multiprocessing as mp
from dejavu.base_classes.jsonifyBinaryData import jsonifyBinary
from dejavu.config.settings import (CONFIG_FILE,
                                    FIELD_RESULT_ID, FIELD_RESULT_TOKEN,

                                    FIELD_RESULT1_FILE_SHA1, FIELD_RESULT1_FINGERPRINTED_CONFIDENCE,
                                    FIELD_RESULT1_FINGERPRINTED_HASHES_IN_DB, FIELD_RESULT1_HASHES_MATCHED_IN_INPUT,
                                    FIELD_RESULT1_INPUT_CONFIDENCE, FIELD_RESULT1_INPUT_TOTAL_HASHES,
                                    FIELD_RESULT1_OFFSET, FIELD_RESULT1_OFFSET_SECONDS,
                                    FIELD_RESULT1_SONG_ID, FIELD_RESULT1_SONG_NAME,

                                    FIELD_RESULT2_FILE_SHA1, FIELD_RESULT2_FINGERPRINTED_CONFIDENCE,
                                    FIELD_RESULT2_FINGERPRINTED_HASHES_IN_DB, FIELD_RESULT2_HASHES_MATCHED_IN_INPUT,
                                    FIELD_RESULT2_INPUT_CONFIDENCE, FIELD_RESULT2_INPUT_TOTAL_HASHES,
                                    FIELD_RESULT2_OFFSET, FIELD_RESULT2_OFFSET_SECONDS,
                                    FIELD_RESULT2_SONG_ID, FIELD_RESULT2_SONG_NAME,

                                    FIELD_RESULT3_FILE_SHA1, FIELD_RESULT3_FINGERPRINTED_CONFIDENCE,
                                    FIELD_RESULT3_FINGERPRINTED_HASHES_IN_DB, FIELD_RESULT3_HASHES_MATCHED_IN_INPUT,
                                    FIELD_RESULT3_INPUT_CONFIDENCE, FIELD_RESULT3_INPUT_TOTAL_HASHES,
                                    FIELD_RESULT3_OFFSET, FIELD_RESULT3_OFFSET_SECONDS,
                                    FIELD_RESULT3_SONG_ID, FIELD_RESULT3_SONG_NAME,

                                    RESULTS_TABLENAME)

CREATE_RESULTS_TABLE_MYSQL = f"""
    CREATE TABLE IF NOT EXISTS `{RESULTS_TABLENAME}` (
        `{FIELD_RESULT_ID}` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT
    ,   `{FIELD_RESULT_TOKEN}` VARCHAR(25) NOT NULL
    ,   `{FIELD_RESULT1_FILE_SHA1}` BINARY(20) NOT NULL
    ,   `{FIELD_RESULT1_FINGERPRINTED_CONFIDENCE}` DOUBLE NOT NULL
    ,   `{FIELD_RESULT1_FINGERPRINTED_HASHES_IN_DB}` INT UNSIGNED NOT NULL
    ,   `{FIELD_RESULT1_HASHES_MATCHED_IN_INPUT}` INT UNSIGNED NOT NULL
    ,   `{FIELD_RESULT1_INPUT_CONFIDENCE}` DOUBLE NOT NULL
    ,   `{FIELD_RESULT1_INPUT_TOTAL_HASHES}` INT UNSIGNED NOT NULL
    ,   `{FIELD_RESULT1_OFFSET}` INT UNSIGNED NOT NULL
    ,   `{FIELD_RESULT1_OFFSET_SECONDS}` DOUBLE NOT NULL
    ,   `{FIELD_RESULT1_SONG_ID}` BIGINT UNSIGNED NOT NULL
    ,   `{FIELD_RESULT1_SONG_NAME}` VARCHAR(250) NOT NULL

    ,   `{FIELD_RESULT2_FILE_SHA1}` BINARY(20)
    ,   `{FIELD_RESULT2_FINGERPRINTED_CONFIDENCE}` DOUBLE
    ,   `{FIELD_RESULT2_FINGERPRINTED_HASHES_IN_DB}` INT UNSIGNED
    ,   `{FIELD_RESULT2_HASHES_MATCHED_IN_INPUT}` INT UNSIGNED
    ,   `{FIELD_RESULT2_INPUT_CONFIDENCE}` DOUBLE
    ,   `{FIELD_RESULT2_INPUT_TOTAL_HASHES}` INT UNSIGNED
    ,   `{FIELD_RESULT2_OFFSET}` INT UNSIGNED
    ,   `{FIELD_RESULT2_OFFSET_SECONDS}` DOUBLE
    ,   `{FIELD_RESULT2_SONG_ID}` BIGINT UNSIGNED
    ,   `{FIELD_RESULT2_SONG_NAME}` VARCHAR(250)

    ,   `{FIELD_RESULT3_FILE_SHA1}` BINARY(20)
    ,   `{FIELD_RESULT3_FINGERPRINTED_CONFIDENCE}` DOUBLE
    ,   `{FIELD_RESULT3_FINGERPRINTED_HASHES_IN_DB}` INT UNSIGNED
    ,   `{FIELD_RESULT3_HASHES_MATCHED_IN_INPUT}` INT UNSIGNED
    ,   `{FIELD_RESULT3_INPUT_CONFIDENCE}` DOUBLE
    ,   `{FIELD_RESULT3_INPUT_TOTAL_HASHES}` INT UNSIGNED
    ,   `{FIELD_RESULT3_OFFSET}` INT UNSIGNED
    ,   `{FIELD_RESULT3_OFFSET_SECONDS}` DOUBLE
    ,   `{FIELD_RESULT3_SONG_ID}` BIGINT UNSIGNED
    ,   `{FIELD_RESULT3_SONG_NAME}` VARCHAR(250)

    ,   `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

    ,   PRIMARY KEY (`{FIELD_RESULT_ID}`)
    ,   UNIQUE (`{FIELD_RESULT_TOKEN}`)
    ) ENGINE=INNODB;
"""
config_file = CONFIG_FILE if CONFIG_FILE not in [None, '', 'config.json'] else 'config.json'

def createMysqlConnection(dbCredential):
    try:
        # Connect to the MySQL database
        connection = mysql.connector.connect(
            host= dbCredential["host"],
            user= dbCredential["user"],
            password= dbCredential["password"],
            database= dbCredential["database"]
        )
        if connection.is_connected():
            return connection
    except Error as e:
        return None

def initStorageDb(dbConfig):
    # Initialize storage database
    if dbConfig["database_type"] == "mysql":
        MysqlDbConnection = createMysqlConnection(dbConfig["database"])
        if MysqlDbConnection:
            try:
                # Initalize database tables
                cursor = MysqlDbConnection.cursor()
                cursor.execute(CREATE_RESULTS_TABLE_MYSQL)
                cursor.close()
                MysqlDbConnection.close()

            except Error as e:
                return None

def initAllStorageDb():
    # Initialize all storage database with multi processing
    with open(config_file, 'r') as jsonFile:
        dbConfigs = json.load(jsonFile)["results"]
        processes = []

        # Start a new process for each instance
        for item in dbConfigs:
            process = mp.Process(target=initStorageDb, args=(item,))
            processes.append(process)
            process.start()

        # Wait for all process to complete
        for process in processes:
            process.join()

def storeResult(resultsToken, resultsArray):
    with open(config_file, 'r') as jsonFile:
        dbConfigs = json.load(jsonFile)["results"]
        random_db = random.choice(dbConfigs) # Randomly choose a database in all available databases to store the result
        if random_db["database_type"] == "mysql":
            MysqlDbConnection = createMysqlConnection(random_db["database"])
            cursor = MysqlDbConnection.cursor()
            store_result = f"""
                INSERT INTO `{RESULTS_TABLENAME}`(
                `{FIELD_RESULT_TOKEN}`,
                `{FIELD_RESULT1_FILE_SHA1}`, `{FIELD_RESULT1_FINGERPRINTED_CONFIDENCE}`, `{FIELD_RESULT1_FINGERPRINTED_HASHES_IN_DB}`,
                `{FIELD_RESULT1_HASHES_MATCHED_IN_INPUT}`, `{FIELD_RESULT1_INPUT_CONFIDENCE}`, `{FIELD_RESULT1_INPUT_TOTAL_HASHES}`,
                `{FIELD_RESULT1_OFFSET}`, `{FIELD_RESULT1_OFFSET_SECONDS}`, `{FIELD_RESULT1_SONG_ID}`, `{FIELD_RESULT1_SONG_NAME}`,

                `{FIELD_RESULT2_FILE_SHA1}`, `{FIELD_RESULT2_FINGERPRINTED_CONFIDENCE}`, `{FIELD_RESULT2_FINGERPRINTED_HASHES_IN_DB}`,
                `{FIELD_RESULT2_HASHES_MATCHED_IN_INPUT}`, `{FIELD_RESULT2_INPUT_CONFIDENCE}`, `{FIELD_RESULT2_INPUT_TOTAL_HASHES}`,
                `{FIELD_RESULT2_OFFSET}`, `{FIELD_RESULT2_OFFSET_SECONDS}`, `{FIELD_RESULT2_SONG_ID}`, `{FIELD_RESULT2_SONG_NAME}`,
                
                `{FIELD_RESULT3_FILE_SHA1}`, `{FIELD_RESULT3_FINGERPRINTED_CONFIDENCE}`, `{FIELD_RESULT3_FINGERPRINTED_HASHES_IN_DB}`,
                `{FIELD_RESULT3_HASHES_MATCHED_IN_INPUT}`, `{FIELD_RESULT3_INPUT_CONFIDENCE}`, `{FIELD_RESULT3_INPUT_TOTAL_HASHES}`,
                `{FIELD_RESULT3_OFFSET}`, `{FIELD_RESULT3_OFFSET_SECONDS}`, `{FIELD_RESULT3_SONG_ID}`, `{FIELD_RESULT3_SONG_NAME}`
                )
                VALUES (
                %s,
                UNHEX(%s), %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,

                UNHEX(%s), %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,

                UNHEX(%s), %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s
                );
            """
            values_to_insert = []
            values_to_insert.append((
                resultsToken,
                resultsArray[0]["file_sha1"], resultsArray[0]["fingerprinted_confidence"], resultsArray[0]["fingerprinted_hashes_in_db"],
                resultsArray[0]["hashes_matched_in_input"], resultsArray[0]["input_confidence"], resultsArray[0]["input_total_hashes"],
                resultsArray[0]["offset"], resultsArray[0]["offset_seconds"], resultsArray[0]["song_id"], resultsArray[0]["song_name"],

                resultsArray[1]["file_sha1"], resultsArray[1]["fingerprinted_confidence"], resultsArray[1]["fingerprinted_hashes_in_db"],
                resultsArray[1]["hashes_matched_in_input"], resultsArray[1]["input_confidence"], resultsArray[1]["input_total_hashes"],
                resultsArray[1]["offset"], resultsArray[1]["offset_seconds"], resultsArray[1]["song_id"], resultsArray[1]["song_name"],

                resultsArray[2]["file_sha1"], resultsArray[2]["fingerprinted_confidence"], resultsArray[2]["fingerprinted_hashes_in_db"],
                resultsArray[2]["hashes_matched_in_input"], resultsArray[2]["input_confidence"], resultsArray[2]["input_total_hashes"],
                resultsArray[2]["offset"], resultsArray[2]["offset_seconds"], resultsArray[2]["song_id"], resultsArray[2]["song_name"]
            ))
            cursor.executemany(store_result, values_to_insert)
            MysqlDbConnection.commit()
            cursor.close()
            MysqlDbConnection.close()

def searchResultinDb(resultsToken, dbConfig, result_queue):
    if dbConfig["database_type"] == "mysql":
        MysqlDbConnection = createMysqlConnection(dbConfig["database"])
        cursor = MysqlDbConnection.cursor()
        search_query = f"""
        SELECT
            `{FIELD_RESULT_TOKEN}`,
            `{FIELD_RESULT1_FILE_SHA1}`, `{FIELD_RESULT1_FINGERPRINTED_CONFIDENCE}`, `{FIELD_RESULT1_FINGERPRINTED_HASHES_IN_DB}`,
            `{FIELD_RESULT1_HASHES_MATCHED_IN_INPUT}`, `{FIELD_RESULT1_INPUT_CONFIDENCE}`, `{FIELD_RESULT1_INPUT_TOTAL_HASHES}`,
            `{FIELD_RESULT1_OFFSET}`, `{FIELD_RESULT1_OFFSET_SECONDS}`, `{FIELD_RESULT1_SONG_ID}`, `{FIELD_RESULT1_SONG_NAME}`,

            `{FIELD_RESULT2_FILE_SHA1}`, `{FIELD_RESULT2_FINGERPRINTED_CONFIDENCE}`, `{FIELD_RESULT2_FINGERPRINTED_HASHES_IN_DB}`,
            `{FIELD_RESULT2_HASHES_MATCHED_IN_INPUT}`, `{FIELD_RESULT2_INPUT_CONFIDENCE}`, `{FIELD_RESULT2_INPUT_TOTAL_HASHES}`,
            `{FIELD_RESULT2_OFFSET}`, `{FIELD_RESULT2_OFFSET_SECONDS}`, `{FIELD_RESULT2_SONG_ID}`, `{FIELD_RESULT2_SONG_NAME}`,
                
            `{FIELD_RESULT3_FILE_SHA1}`, `{FIELD_RESULT3_FINGERPRINTED_CONFIDENCE}`, `{FIELD_RESULT3_FINGERPRINTED_HASHES_IN_DB}`,
            `{FIELD_RESULT3_HASHES_MATCHED_IN_INPUT}`, `{FIELD_RESULT3_INPUT_CONFIDENCE}`, `{FIELD_RESULT3_INPUT_TOTAL_HASHES}`,
            `{FIELD_RESULT3_OFFSET}`, `{FIELD_RESULT3_OFFSET_SECONDS}`, `{FIELD_RESULT3_SONG_ID}`, `{FIELD_RESULT3_SONG_NAME}`
        
        FROM `{RESULTS_TABLENAME}`
        WHERE `{FIELD_RESULT_TOKEN}` = %s;
        """
        cursor.execute(search_query, (resultsToken,))
        result = cursor.fetchone()
        cursor.close()
        MysqlDbConnection.close()
        result_queue.put(result)

def searchResultAll(resultsToken):
    with open(config_file, 'r') as jsonFile:
        dbConfigs = json.load(jsonFile)["results"]

        processes = []
        result_queue = mp.Queue()

        # Start a new process for each instance
        for item in dbConfigs:
            process = mp.Process(target=searchResultinDb, args=(resultsToken, item, result_queue,))
            processes.append(process)
            process.start()

        # Wait for all process to complete
        for process in processes:
            process.join()

        # Collect results from each instance and merge them
        while not result_queue.empty():
            result = result_queue.get()
            if result:
                # Make sure that the returned data format is JSON compatible
                json_result = jsonifyBinary({
                    "results": [
                        {
                            "file_sha1": result[1].hex(),
                            "fingerprinted_confidence": result[2],
                            "fingerprinted_hashes_in_db": result[3],
                            "hashes_matched_in_input": result[4],
                            "input_confidence": result[5],
                            "input_total_hashes": result[6],
                            "offset": result[7],
                            "offset_seconds": result[8],
                            "song_id": result[9],
                            "song_name": result[10]
                        },
                        {
                            "file_sha1": result[11].hex(),
                            "fingerprinted_confidence": result[12],
                            "fingerprinted_hashes_in_db": result[13],
                            "hashes_matched_in_input": result[14],
                            "input_confidence": result[15],
                            "input_total_hashes": result[16],
                            "offset": result[17],
                            "offset_seconds": result[18],
                            "song_id": result[19],
                            "song_name": result[20]
                        },
                        {
                            "file_sha1": result[21].hex(),
                            "fingerprinted_confidence": result[22],
                            "fingerprinted_hashes_in_db": result[23],
                            "hashes_matched_in_input": result[24],
                            "input_confidence": result[25],
                            "input_total_hashes": result[26],
                            "offset": result[27],
                            "offset_seconds": result[28],
                            "song_id": result[29],
                            "song_name": result[30]
                        }
                    ],
                    "token": result[0]
                })
                return json_result