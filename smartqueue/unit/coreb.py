# -*- coding: utf-8 -*-
import requests
import subprocess
import time
import os
import sys

# Ensure UTF-8 encoding for stdout and stderr
# In Python 3, this is typically unnecessary, as UTF-8 is the default encoding for strings and file I/O
# But if you need to ensure it, you can use the following lines
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

VOLUMIO_API_URL_QUEUE = "http://localhost:3000/api/v1/getQueue"
VOLUMIO_API_URL_STATE = "http://localhost:3000/api/v1/getState"

def get_current_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_STATE)
        response.raise_for_status()
        state_data = response.json()
        current_uri = state_data.get("uri")
        print(f"Current URI: {current_uri}")  # Using f-strings for better readability
        return current_uri
    except requests.exceptions.RequestException as e:
        print(f"Error fetching current state from Volumio: {e}")
        return None

def get_last_queue_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_QUEUE)
        response.raise_for_status()
        queue_data = response.json()
        last_uri = queue_data['queue'][-1]['uri'] if queue_data.get("queue") else None
        print(f"Last Queue URI: {last_uri}")  # Using f-strings for better readability
        return last_uri
    except requests.exceptions.RequestException as e:
        print(f"Error fetching playlist from Volumio: {e}")
        return None

def main():
    while True:
        print("Checking current URI and last queue URI...")
        current_uri = get_current_uri()
        last_queue_uri = get_last_queue_uri()

        if current_uri and last_queue_uri:
            print("Comparing current URI with last queue URI...")
            if current_uri == last_queue_uri:
                print("Currently on the last track, executing scripts bliss.py...")
                # Use subprocess.run for executing external commands
                subprocess.run(["/usr/bin/python3", "/data/plugins/user_interface/smartqueue/unit/bliss.py"], check=True)
            else:
                print("Not on the last track.")
        else:
            print("Could not retrieve current URI or last queue URI.")

        time.sleep(10)

if __name__ == "__main__":
    main()
