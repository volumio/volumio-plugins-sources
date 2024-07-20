# -*- coding: utf-8 -*-

import requests
import time
import os
import sys
import codecs

# Configure stdout and stderr to use UTF-8 encoding
sys.stdout = codecs.getwriter('utf8')(sys.stdout)
sys.stderr = codecs.getwriter('utf8')(sys.stderr)

VOLUMIO_API_URL_QUEUE = "http://localhost:3000/api/v1/getQueue"
VOLUMIO_API_URL_STATE = "http://localhost:3000/api/v1/getState"

def get_current_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_STATE)
        response.raise_for_status()
        state_data = response.json()
        # Extract the URI directly from the state data
        current_uri = state_data.get("uri")
        print(u"Current URI: {}".format(current_uri))  # Ensure the string is Unicode
        return current_uri
    except requests.exceptions.RequestException as e:
        print(u"Error fetching current state from Volumio: {}".format(e))
        return None

def get_last_queue_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_QUEUE)
        response.raise_for_status()
        queue_data = response.json()
        # Only return the last URI from the queue
        last_uri = queue_data['queue'][-1]['uri'] if queue_data.get("queue") else None
        print(u"Last Queue URI: {}".format(last_uri))  # Ensure the string is Unicode
        return last_uri
    except requests.exceptions.RequestException as e:
        print(u"Error fetching playlist from Volumio: {}".format(e))
        return None

def main():
    while True:
        print(u"Checking current URI and last queue URI...")  # Ensure the string is Unicode
        current_uri = get_current_uri()
        last_queue_uri = get_last_queue_uri()

        if current_uri and last_queue_uri:
            print(u"Comparing current URI with last queue URI...")  # Ensure the string is Unicode
            if current_uri == last_queue_uri:  # Compare with the last URI in the queue
                print(u"Currently on the last track, executing scripts...")  # Ensure the string is Unicode
                os.system("/usr/bin/python /data/plugins/user_interface/smartqueue/unit/lastfm.py")
                print(u"Not on the last track.")  # Ensure the string is Unicode
        else:
            print(u"Could not retrieve current URI or last queue URI.")  # Ensure the string is Unicode

        time.sleep(10)

if __name__ == "__main__":
    main()