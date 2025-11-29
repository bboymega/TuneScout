# Dejavu

# Configuration file path
CONFIG_FILE = "config.json"

# DEJAVU JSON RESPONSE
SONG_ID = "song_id"
SONG_NAME = 'song_name'
RESULTS = 'results'

HASHES_MATCHED = 'hashes_matched_in_input'

# Hashes fingerprinted in the db.
FINGERPRINTED_HASHES = 'fingerprinted_hashes_in_db'
# Percentage regarding hashes matched vs hashes fingerprinted in the db.
FINGERPRINTED_CONFIDENCE = 'fingerprinted_confidence'

# Hashes generated from the input.
INPUT_HASHES = 'input_total_hashes'
# Percentage regarding hashes matched vs hashes from the input.
INPUT_CONFIDENCE = 'input_confidence'

TOTAL_TIME = 'total_time'
FINGERPRINT_TIME = 'fingerprint_time'
QUERY_TIME = 'query_time'
ALIGN_TIME = 'align_time'
OFFSET = 'offset'
OFFSET_SECS = 'offset_seconds'

# DATABASE CLASS INSTANCES:
DATABASES = {
    'mysql': ("dejavu.database_handler.mysql_database", "MySQLDatabase")
}

# TABLE SONGS
SONGS_TABLENAME = "songs"

# SONGS FIELDS
FIELD_SONG_ID = 'song_id'
FIELD_SONGNAME = 'song_name'
FIELD_FINGERPRINTED = "fingerprinted"
FIELD_FILE_SHA1 = 'file_sha1'
FIELD_TOTAL_HASHES = 'total_hashes'

# TABLE FINGERPRINTS
FINGERPRINTS_TABLENAME = "fingerprints"

# FINGERPRINTS FIELDS
FIELD_HASH = 'hash'
FIELD_OFFSET = 'offset'

# TABLE RESULTS
RESULTS_TABLENAME = "results"

# RESULTS FIELDS
FIELD_RESULT_ID = 'result_id'
FIELD_RESULT_TOKEN = 'result_token'
# Storing the best 3 solutions returned by the algorithm
FIELD_RESULT1_FILE_SHA1 = "result1_file_sha1"
FIELD_RESULT1_FINGERPRINTED_CONFIDENCE = "result1_fingerprinted_confidence"
FIELD_RESULT1_FINGERPRINTED_HASHES_IN_DB = "result1_fingerprinted_hashes_in_db"
FIELD_RESULT1_HASHES_MATCHED_IN_INPUT = "result1_hashes_matched_in_input"
FIELD_RESULT1_INPUT_CONFIDENCE = "result1_input_confidence"
FIELD_RESULT1_INPUT_TOTAL_HASHES = "result1_input_total_hashes"
FIELD_RESULT1_OFFSET = "result1_offset"
FIELD_RESULT1_OFFSET_SECONDS = "result1_offset_seconds"
FIELD_RESULT1_SONG_ID = "result1_song_id"
FIELD_RESULT1_SONG_NAME = "result1_song_name"

FIELD_RESULT2_FILE_SHA1 = "result2_file_sha1"
FIELD_RESULT2_FINGERPRINTED_CONFIDENCE = "result2_fingerprinted_confidence"
FIELD_RESULT2_FINGERPRINTED_HASHES_IN_DB = "result2_fingerprinted_hashes_in_db"
FIELD_RESULT2_HASHES_MATCHED_IN_INPUT = "result2_hashes_matched_in_input"
FIELD_RESULT2_INPUT_CONFIDENCE = "result2_input_confidence"
FIELD_RESULT2_INPUT_TOTAL_HASHES = "result2_input_total_hashes"
FIELD_RESULT2_OFFSET = "result2_offset"
FIELD_RESULT2_OFFSET_SECONDS = "result2_offset_seconds"
FIELD_RESULT2_SONG_ID = "result2_song_id"
FIELD_RESULT2_SONG_NAME = "result2_song_name"

FIELD_RESULT3_FILE_SHA1 = "result3_file_sha1"
FIELD_RESULT3_FINGERPRINTED_CONFIDENCE = "result3_fingerprinted_confidence"
FIELD_RESULT3_FINGERPRINTED_HASHES_IN_DB = "result3_fingerprinted_hashes_in_db"
FIELD_RESULT3_HASHES_MATCHED_IN_INPUT = "result3_hashes_matched_in_input"
FIELD_RESULT3_INPUT_CONFIDENCE = "result3_input_confidence"
FIELD_RESULT3_INPUT_TOTAL_HASHES = "result3_input_total_hashes"
FIELD_RESULT3_OFFSET = "result3_offset"
FIELD_RESULT3_OFFSET_SECONDS = "result3_offset_seconds"
FIELD_RESULT3_SONG_ID = "result3_song_id"
FIELD_RESULT3_SONG_NAME = "result3_song_name"

# FINGERPRINTS CONFIG:
# This is used as connectivity parameter for scipy.generate_binary_structure function. This parameter
# changes the morphology mask when looking for maximum peaks on the spectrogram matrix.
# Possible values are: [1, 2]
# Where 1 sets a diamond morphology which implies that diagonal elements are not considered as neighbors (this
# is the value used in the original dejavu code).
# And 2 sets a square mask, i.e. all elements are considered neighbors.
CONNECTIVITY_MASK = 2

# Sampling rate, related to the Nyquist conditions, which affects
# the range frequencies we can detect.
DEFAULT_FS = 44100

# Size of the FFT window, affects frequency granularity
DEFAULT_WINDOW_SIZE = 4096

# Ratio by which each sequential window overlaps the last and the
# next window. Higher overlap will allow a higher granularity of offset
# matching, but potentially more fingerprints.
DEFAULT_OVERLAP_RATIO = 0.5

# Degree to which a fingerprint can be paired with its neighbors. Higher values will
# cause more fingerprints, but potentially better accuracy.
DEFAULT_FAN_VALUE = 5  # 15 was the original value.

# Minimum amplitude in spectrogram in order to be considered a peak.
# This can be raised to reduce number of fingerprints, but can negatively
# affect accuracy.
DEFAULT_AMP_MIN = 10

# Number of cells around an amplitude peak in the spectrogram in order
# for Dejavu to consider it a spectral peak. Higher values mean less
# fingerprints and faster matching, but can potentially affect accuracy.
PEAK_NEIGHBORHOOD_SIZE = 10  # 20 was the original value.

# Thresholds on how close or far fingerprints can be in time in order
# to be paired as a fingerprint. If your max is too low, higher values of
# DEFAULT_FAN_VALUE may not perform as expected.
MIN_HASH_TIME_DELTA = 0
MAX_HASH_TIME_DELTA = 200

# If True, will sort peaks temporally for fingerprinting;
# not sorting will cut down number of fingerprints, but potentially
# affect performance.
PEAK_SORT = True

# Number of bits to grab from the front of the SHA1 hash in the
# fingerprint calculation. The more you grab, the more memory storage,
# with potentially lesser collisions of matches.
FINGERPRINT_REDUCTION = 20

# Number of results being returned for file recognition
TOPN = 2
