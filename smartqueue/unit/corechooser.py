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
        try:
            command = "/usr/bin/pkill /*unit/coreb.py ; /usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/core.py"
            result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
            print(result.stdout)  # Print standard output
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            print(f"Error message: {e.stderr}")
    
    elif not autoqueue and not blissmixer:
        try:
            command = "/usr/bin/pkill /*unit/coreb.py && /usr/bin/pkill -f /*unit/core.py"
            result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
            print(result.stdout)  # Print standard output
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            print(f"Error message: {e.stderr}")
    
    elif blissmixer:
        try:
            command = "/usr/bin/pkill /*unit/core.py ; /usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/coreb.py"
            result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
            print(result.stdout)  # Print standard output
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            print(f"Error message: {e.stderr}")

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
