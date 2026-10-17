import time
import random
import requests

API = "http://localhost:5000/api/readings"

while True:
    # Change these values or replace this block with actual simulator data.
    reading = {
        "ph": round(random.uniform(6.2, 8.8), 2),
        "turbidity": round(random.uniform(10, 75), 1),
        "temperature": round(random.uniform(20, 42), 1)
    }

    try:
        response = requests.post(API, json=reading, timeout=3)
        print(response.status_code, response.json())
    except requests.RequestException as error:
        print("Backend error:", error)

    time.sleep(2)
