# -*- coding: utf-8 -*-
# This will be run once upon event

import json
import subprocess
import sys

def run_core_under_conditions(config):
    print("Running core chooser under conditions...")
    # Accéder directement aux valeurs sans conversion
    autoqueue = config['Autoqueue']['value']
    blissmixer = config['Blissmixer']['value']

    print("Raw values: Autoqueue: {}, Blissmixer: {}".format(autoqueue, blissmixer))

    print("Autoqueue: {}, Blissmixer: {}".format(autoqueue, blissmixer))

    if autoqueue and not blissmixer:
        command = "/usr/bin/pgrep python | xargs -r /bin/kill -15 && /usr/bin/python /data/plugins/user_interface/smartqueue/unit/core.py"
        print("Running command for Autoqueue true and Blissmixer false: {}".format(command))
        subprocess.call(command, shell=True)
        return "Applied settings: Autoqueue true, Blissmixer false"
    
    elif not autoqueue and not blissmixer:
        command = "/usr/bin/pgrep python3 | xargs -r /bin/kill -15"
        print("Running command for both Autoqueue and Blissmixer false: {}".format(command))
        subprocess.call(command, shell=True)
        return "Applied settings: Both Autoqueue and Blissmixer false"
    
    elif blissmixer:
        command = "/usr/bin/pgrep python | xargs -r /bin/kill -15 && /usr/bin/python /data/plugins/user_interface/smartqueue/unit/coreb.py"
        print("Running command for Blissmixer true: {}".format(command))
        subprocess.call(command, shell=True)
        return "Applied settings: Blissmixer true"

if __name__ == "__main__":
    config_file_path = '/data/configuration/user_interface/smartqueue/config.json'
    print("Loading configuration from {}".format(config_file_path))

    try:
        with open(config_file_path, 'r') as file:
            config = json.load(file)
            print("Configuration loaded: {}".format(config))
    except Exception as e:
        print("Error loading configuration: {}".format(e))
        sys.exit(1)

    try:
        result = run_core_under_conditions(config)
        print(result)
    except Exception as e:
        print("Error running core under conditions: {}".format(e))
        sys.exit(1)

    sys.exit(0)