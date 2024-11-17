# -*- coding: utf-8 -*-

import json
import subprocess
import sys
import os
import signal

def run_core_under_conditions(config):
    print("Running core chooser under conditions...")
    
    # Access values directly without conversion
    autoqueue = config['Autoqueue']['value']
    blissmixer = config['Blissmixer']['value']

    print(f"Raw values: Autoqueue: {autoqueue}, Blissmixer: {blissmixer}")

    print(f"Autoqueue: {autoqueue}, Blissmixer: {blissmixer}")

    path1 = '/data/plugins/user_interface/smartqueue/unit/core.py'
    path2 = '/data/plugins/user_interface/smartqueue/unit/coreb.py'

    if autoqueue and not blissmixer:
        try:
            # Kill processes running coreb.py
            pids = find_pid_by_path(path2)
            if pids:
                print(f"Pids for {path2}: {pids}")
                kill_processes(pids)
            else:
                print("No process found with specified path.")

            pids = find_pid_by_path(path1)
            if pids:
                print(f"Pids for {path2}: {pids}")
                kill_processes(pids)
            else:
                print("No process found with specified path.")

            # Run core.py
            command = ['/usr/bin/python3', path1]
            print(f"Running command: {command}")
            result = subprocess.run(command, text=True, capture_output=True)
            print("Core.py Output:", result.stdout)  # Print standard output
            print("Core.py Error:", result.stderr)  # Print standard error
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            print(f"Error message: {e.stderr}")

    elif not autoqueue and not blissmixer:
        try:
            # Kill processes running core.py
            pids = find_pid_by_path(path1)
            if pids:
                print(f"Pids for {path1}: {pids}")
                kill_processes(pids)
            else:
                print("No process found with specified path.")

            # Run core.py again if needed
            pids = find_pid_by_path(path2)  # Seems redundant, could be a mistake
            if pids:
                print(f"Pids for {path1}: {pids}")
                kill_processes(pids)
            else:
                print("No process found with specified path.")
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            print(f"Error message: {e.stderr}")

    elif blissmixer:
        try:
            # Kill processes running core.py
            pids = find_pid_by_path(path2)
            if pids:
                print(f"Pids for {path2}: {pids}")
                kill_processes(pids)
            else:
                print("No process found with specified path.")

            pids = find_pid_by_path(path1)
            if pids:
                print(f"Pids for {path2}: {pids}")
                kill_processes(pids)
            else:
                print("No process found with specified path.")

            # Run coreb.py
            command = ['/usr/bin/python3', path2]
            print(f"Running command: {command}")
            result = subprocess.run(command, text=True, capture_output=True)
            print("Coreb.py Output:", result.stdout)  # Print standard output
            print("Coreb.py Error:", result.stderr)  # Print standard error
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            print(f"Error message: {e.stderr}")

def find_pid_by_path(path):
    try:
        # Use 'pgrep' to find PIDs of processes running the given path
        result = subprocess.run(['pgrep', '-f', path], text=True, capture_output=True)
        result.check_returncode()
        pids = result.stdout.strip().split()
        return [int(pid) for pid in pids]
    except subprocess.CalledProcessError as e:
        print(f"pgrep failed with exit code {e.returncode}")
        print(f"Error message: {e.stderr}")
        return []
    except Exception as e:
        print(f"Error while searching for PID: {e}")
        return []

def kill_processes(pids):
    for pid in pids:
        try:
            os.kill(int(pid), signal.SIGTERM)  # Use SIGTERM instead of SIGKILL for a graceful shutdown
            print(f"Process {pid} killed.")
        except ProcessLookupError:
            print(f"Process {pid} does not exist.")
        except Exception as e:
            print(f"Error while killing process {pid}: {e}")

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
        run_core_under_conditions(config)
    except Exception as e:
        print(f"Error running core under conditions: {e}")
        sys.exit(1)

    sys.exit(0)
