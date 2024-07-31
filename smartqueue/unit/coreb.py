# -*- coding: utf-8 -*-

import requests
import time
import os
import sys

# Ensure UTF-8 encoding for stdout and stderr
import codecs
sys.stdout = codecs.getwriter('utf8')(sys.stdout)
sys.stderr = codecs.getwriter('utf8')(sys.stderr)

VOLUMIO_API_URL_QUEUE = "http://localhost:3000/api/v1/getQueue"
VOLUMIO_API_URL_STATE = "http://localhost:3000/api/v1/getState"

def get_current_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_STATE)
        response.raise_for_status()
        state_data = response.json()
        current_uri = state_data.get("uri")
        print(u"Current URI: {}".format(current_uri))  # Debug statement
        return current_uri
    except requests.exceptions.RequestException as e:
        print(u"Error fetching current state from Volumio: {}".format(e))
        return None

def get_last_queue_uri():
    try:
        response = requests.get(VOLUMIO_API_URL_QUEUE)
        response.raise_for_status()
        queue_data = response.json()
        last_uri = queue_data['queue'][-1]['uri'] if queue_data.get("queue") else None
        print(u"Last Queue URI: {}".format(last_uri))  # Debug statement
        return last_uri
    except requests.exceptions.RequestException as e:
        print(u"Error fetching playlist from Volumio: {}".format(e))
        return None

def main():
    while True:
        print(u"Checking current URI and last queue URI...")  # Debug statement
        current_uri = get_current_uri()
        last_queue_uri = get_last_queue_uri()

        if current_uri and last_queue_uri:
            print(u"Comparing current URI with last queue URI...")  # Debug statement
            if current_uri == last_queue_uri:
                print(u"Currently on the last track, executing scripts bliss.py...")  # Debug statement
                os.system("/usr/bin/python /data/plugins/user_interface/smartqueue/unit/bliss.py")
            else:
                print(u"Not on the last track.")  # Debug statement
        else:
            print(u"Could not retrieve current URI or last queue URI.")  # Debug statement

        time.sleep(10)

if __name__ == "__main__":
    main()
