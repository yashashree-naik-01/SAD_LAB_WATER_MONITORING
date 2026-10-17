# Optional bridge for a real/local Arduino serial connection.
# Install: pip install pyserial requests
#
# Expected Arduino serial format, one JSON object per line:
# {"ph":7.2,"turbidity":20,"temperature":25}

import json
import requests
import serial

SERIAL_PORT = "COM5"  # CHANGE THIS
BAUD_RATE = 9600
API = "http://localhost:5000/api/readings"

ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

while True:
    line = ser.readline().decode(errors="ignore").strip()
    if not line:
        continue

    try:
        reading = json.loads(line)
        response = requests.post(API, json=reading, timeout=3)
        print("Sent:", reading, "→", response.status_code)
    except Exception as error:
        print("Bridge error:", error)
