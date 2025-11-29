### About
Scalable music fingerprinting and recognition algorithm with multi-threading, multi-instance support, and API integration. 

This project is under development, core algorithm based on [worldveil/dejavu](https://github.com/worldveil/dejavu), which is licensed under the MIT License.

### Modifications

- Adding **multi-processing** support for improved performance.
- Supporting **result storage**.
- Supporting **multiple instances** for scalability.
- Exposing the core music recognition functionality as an **API endpoint**.

## Features

- **Multi-processing**: Supports concurrent requests for faster processing.
- **Multi-instance support**: Scalable design for running multiple instances of the recognition engine.
- **Result storage support**: Storing results in databases for future use.
- **Music recognition API**: Allows audio data processing through URL submission, returning track names for recognized songs.
