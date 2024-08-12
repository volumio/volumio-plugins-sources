# -*- coding: utf-8 -*-

import requests
import subprocess
import json
import sys
import os

API_KEY = "24acdbb6b2bb5160c7377edf4af1f994"
VOLUMIO_API_URL = "http://localhost:3000/api/v1/addToQueue"
local_tracks_found = False

def get_drift_variable():
    try:
        with open('/data/configuration/user_interface/smartqueue/config.json', 'r', encoding='utf-8') as config_file:
            config_data = json.load(config_file)
            drift_data = config_data.get('Drift', {})
            if isinstance(drift_data, dict):
                return drift_data.get('value', '')
            return drift_data
    except Exception as e:
        print(f"Error reading Drift variable: {e}")
        return ''

def get_tracksn_variable():
    try:
        with open('/data/configuration/user_interface/smartqueue/config.json', 'r', encoding='utf-8') as config_file:
            config_data = json.load(config_file)
            tracksn_data = config_data.get('Tracksn', {})
            if isinstance(tracksn_data, dict):
                return tracksn_data.get('value', '')
            return tracksn_data
    except Exception as e:
        print(f"Error reading Tracksn variable: {e}")
        return ''

def get_sine_variable():
    try:
        with open('/data/configuration/user_interface/smartqueue/config.json', 'r', encoding='utf-8') as config_file:
            config_data = json.load(config_file)
            sine_data = config_data.get('Sine', {})
            if isinstance(sine_data, dict):
                return sine_data.get('value', '')
            return sine_data
    except Exception as e:
        print(f"Error reading Sine variable: {e}")
        return ''

def get_seed_variable():
    try:
        with open('/data/configuration/user_interface/smartqueue/config.json', 'r', encoding='utf-8') as config_file:
            config_data = json.load(config_file)
            seed_data = config_data.get('Seed', {})
            if isinstance(seed_data, dict):
                return seed_data.get('value', '')
            return seed_data
    except Exception as e:
        print(f"Error reading Seed variable: {e}")
        return ''


def get_current_track_info():
    current_track_artist = subprocess.run(["mpc", "--format", "%artist%", "current"], capture_output=True, text=True).stdout.strip()
    current_track_title = subprocess.run(["mpc", "--format", "%title%", "current"], capture_output=True, text=True).stdout.strip()
    current_track_genre = subprocess.run(["mpc", "--format", "%genre%", "current"], capture_output=True, text=True).stdout.strip()
    
    print(f"Current track artist: {current_track_artist}")
    print(f"Current track title: {current_track_title}")
    print(f"Current track genre: {current_track_genre}")
    
    return current_track_artist, current_track_title, current_track_genre

def run_blissify_and_export_playlist(config,tracksn):

    try:
        cosine = config['Cosine']['value']
        seed = config['Seed']['value']
        
        print(f"Seed:: {seed}, Cosine: {cosine}")
        print("Running blissify to generate playlist...")
        if cosine and seed:
            result = subprocess.run(
            ["/home/volumio/blissify/blissify", "playlist", "--distance", "cosine", "--seed-song 30", str(tracksn), "--dry-run"],
            capture_output=True, text=True
            ).stdout

        elif cosine and not seed:
            result = subprocess.run(
            ["/home/volumio/blissify/blissify", "playlist", "--distance", "cosine", str(tracksn), "--dry-run"],
            capture_output=True, text=True
            ).stdout

        elif not cosine and seed:
            result = subprocess.run(
            ["/home/volumio/blissify/blissify", "playlist" ,"--seed-song 30", str(tracksn), "--dry-run"],
            capture_output=True, text=True
            ).stdout

        elif not cosine and not seed:
            result = subprocess.run(
            ["/home/volumio/blissify/blissify", "playlist", str(tracksn), "--dry-run"],
            capture_output=True, text=True
            ).stdout


        # Decode the output and split it into lines
        output_lines = result.splitlines()
        
        # Skip the first two lines and remove /mnt/ from the beginning of each line
        filtered_lines = [line.replace('/mnt/', '', 1) for line in output_lines[2:]]
        
        # Join the filtered lines back into a single string
        filtered_output = "\n".join(filtered_lines)
        
        # Write the filtered output to the file
        with open("/home/volumio/bliss.m3u", "w", encoding='utf-8') as f:
            f.write(filtered_output)
        
        print("Playlist exported to bliss.m3u")
    except subprocess.CalledProcessError as e:
        print("An error occurred while running blissify:")
        print(e.output)


def add_tracks_from_playlist_to_volumio():
    global local_tracks_found
    local_tracks_found = False
    local_tracks_found = 0

    print("Adding tracks from bliss.m3u to Volumio queue...")
    if not os.path.exists("/home/volumio/bliss.m3u"):
        print("No playlist found.")
        return

    with open("/home/volumio/bliss.m3u", 'r', encoding='utf-8') as playlist:
        for track in playlist:
            track = track.strip()
            if track and not track.startswith('#'):
                print(f"Adding track: {track}")
                add_track_to_volumio(track)
                local_tracks_found += 1


def find_similar_local_tracks(genre, limit):
    print(f"Searching local MPD database for tracks of the same genre: {genre}")
    
    # Obtenir les pistes locales du genre spécifié
    local_tracks = subprocess.run(["mpc", "search", "genre", genre], capture_output=True, text=True).stdout
    
    # Mélanger les pistes localement en utilisant un pipe
    shuf_process = subprocess.run(["shuf"], input=local_tracks, capture_output=True, text=True)
    local_tracks = shuf_process.stdout
    
    # Limiter à 5 pistes
    head_process = subprocess.run(["head", "-n", str(limit)], input=local_tracks, capture_output=True, text=True)
    local_tracks = head_process.stdout
    
    print("Local similar tracks:")
    print(local_tracks)
    return local_tracks


def add_track_to_volumio(track_path):
    track_info = {
        "uri": track_path,
        "service": "mpd",
        "title": os.path.basename(track_path),  # Extract title from path
        "artist": "",  # Artist info would ideally be retrieved separately
        "album": "",  # Album info would ideally be retrieved separately
        "type": "song",
        "tracknumber": 0,
        "duration": 0,  # Duration should ideally be retrieved separately
        "trackType": track_path.split('.')[-1]  # Extract track type from file extension
    }
    
    response = requests.post(VOLUMIO_API_URL, json=[track_info])
    if response.status_code == 200:
        print("Track added successfully to Volumio queue.")
    else:
        print(f"Failed to add track to Volumio queue. Status code: {response.status_code}")
        print(f"Response: {response.text}")

def add_similar_tracks_to_playlist(local_tracks):
    print("Adding similar local tracks to the playlist")
    if not local_tracks:
        print("No local tracks found to add.")
        return
    
    for track in local_tracks.split('\n'):
        if track:
            print(f"Adding track: {track}")
            add_track_to_volumio(track)

def main():

    config_file_path = '/data/configuration/user_interface/smartqueue/config.json'
    global local_tracks_found

    tracksn = int(get_tracksn_variable())
    print(f"Tracksn variable: {tracksn} (type: {type(tracksn)})")
   
    current_track_artist, current_track_title, current_track_genre = get_current_track_info()

    TOTAL_TRACKS_LIMIT = int(tracksn)
    
    drift = get_drift_variable()
    print(f"Drift variable: {drift} (type: {type(drift)})")

    try:
        with open(config_file_path, 'r', encoding='utf-8') as file:
            config = json.load(file)
            print(f"Configuration loaded: {config}")
    except Exception as e:
        print(f"Error loading configuration: {e}")
        sys.exit(1)

    related_tracks = run_blissify_and_export_playlist(config,tracksn)
    add_tracks_from_playlist_to_volumio()

    if not local_tracks_found:
        print("No similar tracks found on bliss.m3u. Searching local database...")
        local_tracks = find_similar_local_tracks(current_track_genre, limit=int(tracksn)-int(local_tracks_found))
        add_similar_tracks_to_playlist(local_tracks)

if __name__ == "__main__":
    main()