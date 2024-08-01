# -*- coding: utf-8 -*-

import json
import subprocess
import sys

def run_core_under_conditions(config):
    print("Running core chooser under conditions...")
    
    # Access values directly without conversion
    autoqueue = config['Autoqueue']['value']
    blissmixer = config['Blissmixer']['value']

    print(f"Raw values: Autoqueue: {autoqueue}, Blissmixer: {blissmixer}")

    print(f"Autoqueue: {autoqueue}, Blissmixer: {blissmixer}")

    if autoqueue and not blissmixer:
        command = "/usr/bin/pgrep python3 | xargs -r /bin/kill -15 && /usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/core.py"
        print(f"Running command for Autoqueue true and Blissmixer false: {command}")
        subprocess.run(command, shell=True, check=True)
        return "Applied settings: Autoqueue true, Blissmixer false"
    
    elif not autoqueue and not blissmixer:
        command = "/usr/bin/pgrep python3 | xargs -r /bin/kill -15"
        print(f"Running command for both Autoqueue and Blissmixer false: {command}")
        subprocess.run(command, shell=True, check=True)
        return "Applied settings: Both Autoqueue and Blissmixer false"
    
    elif blissmixer:
        command = "/usr/bin/pgrep python3 | xargs -r /bin/kill -15 && /usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/coreb.py"
        print(f"Running command for Blissmixer true: {command}")
        subprocess.run(command, shell=True, check=True)
        return "Applied settings: Blissmixer true"

if __name__ == "__main__":
    config_file_path = '/data/configuration/user_interface/smartqueue/config.json'
    print(f"Loading configuration from {config_file_path}")

    try:
        with open(config_file_path, 'r', encoding='utf-8') as file:
            config = json.load(file)
            print(f"Configuration loaded: {config}")
    except Exception as e:
        print(f"Error loading configuration: {e}")
        sys.exit(1)

    try:
        result = run_core_under_conditions(config)
        print(result)
    except Exception as e:
        print(f"Error running core under conditions: {e}")
        sys.exit(1)

    sys.exit(0)
