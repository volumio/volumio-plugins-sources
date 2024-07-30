import requests
import time
import os
import sys

# UTF-8 is the default encoding for stdout in Python 3
# sys.stdout and sys.stderr are already using UTF-8 encoding by default

VOLUMIO_API_URL_QUEUE = "http://localhost:3000/api/v1/getQueue"
VOLUMIO_API_URL_STATE = "http://localhost:3000/api/v1/getState"

def get_current_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_STATE)
        response.raise_for_status()
        state_data = response.json()
        # Extract the URI directly from the state data
        current_uri = state_data.get("uri")
        print(f"Current URI: {current_uri}")  # Use f-strings for formatting
        return current_uri
    except requests.exceptions.RequestException as e:
        print(f"Error fetching current state from Volumio: {e}")
        return None

def get_last_queue_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_QUEUE)
        response.raise_for_status()
        queue_data = response.json()
        # Only return the last URI from the queue
        last_uri = queue_data['queue'][-1]['uri'] if queue_data.get("queue") else None
        print(f"Last Queue URI: {last_uri}")  # Use f-strings for formatting
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
            if current_uri == last_queue_uri:  # Compare with the last URI in the queue
                print("Currently on the last track, executing scripts...")
                os.system("/usr/bin/python /data/plugins/user_interface/smartqueue/unit/lastfm.py")
            else:
                print("Not on the last track.")
        else:
            print("Could not retrieve current URI or last queue URI.")

        time.sleep(10)

if __name__ == "__main__":
    main()
