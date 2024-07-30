# -*- coding: utf-8 -*-

import requests
import subprocess
import json
import sys
import codecs
import os

# S'assurer que l'encodage de stdout est utf-8
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdout = codecs.getwriter('utf8')(sys.stdout)

API_KEY = "24acdbb6b2bb5160c7377edf4af1f994"
VOLUMIO_API_URL = "http://localhost:3000/api/v1/addToQueue"
local_tracks_found = False

def get_drift_variable():
    try:
        with open('/data/configuration/user_interface/smartqueue/config.json', 'r') as config_file:
            config_data = json.load(config_file)
            drift_data = config_data.get('Drift', {})
            if isinstance(drift_data, dict):
                return drift_data.get('value', '')
            return drift_data
    except Exception as e:
        print("Error reading Drift variable: {}".format(e))
        return ''

def get_tracksn_variable():
    try:
        with open('/data/configuration/user_interface/smartqueue/config.json', 'r') as config_file:
            config_data = json.load(config_file)
            tracksn_data = config_data.get('Tracksn', {})
            if isinstance(tracksn_data, dict):
                return tracksn_data.get('value', '')
            return tracksn_data
    except Exception as e:
        print("Error reading Tracksn variable: {}".format(e))
        return ''


def get_current_track_info():
    current_track_artist = subprocess.check_output(["mpc", "--format", "%artist%", "current"]).strip().decode('utf-8')
    current_track_title = subprocess.check_output(["mpc", "--format", "%title%", "current"]).strip().decode('utf-8')
    current_track_genre = subprocess.check_output(["mpc", "--format", "%genre%", "current"]).strip().decode('utf-8')
    print(u"Current track artist: {}".format(current_track_artist))
    print(u"Current track title: {}".format(current_track_title))
    print(u"Current track genre: {}".format(current_track_genre))
    return current_track_artist, current_track_title, current_track_genre


def run_blissify_and_export_playlist(tracksn):
    try:
        print("Running blissify to generate playlist...")
        result = subprocess.check_output(
            ["/home/volumio/blissify/blissify", "playlist", str(tracksn), "--dry-run"],
            stderr=subprocess.STDOUT
        )
        # Decode the output and split it into lines
        output_lines = result.decode('utf-8').splitlines()
        
        # Skip the first two lines and remove /mnt/ from the beginning of each line
        filtered_lines = [line.replace('/mnt/', '', 1) for line in output_lines[2:]]
        
        # Join the filtered lines back into a single string
        filtered_output = "\n".join(filtered_lines)
        
        # Write the filtered output to the file
        with open("/home/volumio/bliss.m3u", "w") as f:
            f.write(filtered_output)
        
        print("Playlist exported to bliss.m3u")
    except subprocess.CalledProcessError as e:
        print("An error occurred while running blissify:")
        print(e.output.decode('utf-8'))


def add_tracks_from_playlist_to_volumio():
    global local_tracks_found
    local_tracks_found = False
    local_tracks_found = 0

    print("Adding tracks from bliss.m3u to Volumio queue...")
    if not os.path.exists("/home/volumio/bliss.m3u"):
        print("No playlist found.")
        return

    with open("/home/volumio/bliss.m3u", 'r') as playlist:
        for track in playlist:
            track = track.strip()
            if track and not track.startswith('#'):
                print(u"Adding track: {}".format(track))
                add_track_to_volumio(track)
                local_tracks_found = local_tracks_found + 1
                #local_tracks_found = True

def find_similar_local_tracks(genre, limit):
    print(u"Searching local MPD database for tracks of the same genre: {}".format(genre))
    
    # Obtenir les pistes locales du genre spécifié
    local_tracks = subprocess.check_output(["mpc", "search", "genre", genre]).decode('utf-8')
    
    # Mélanger les pistes localement en utilisant un pipe
    shuf_process = subprocess.Popen(["shuf"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    local_tracks, _ = shuf_process.communicate(input=local_tracks.encode('utf-8'))
    
    # Limiter à 5 pistes
    head_process = subprocess.Popen(["head", "-n", str(limit)], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    local_tracks, _ = head_process.communicate(input=local_tracks)
    
    local_tracks = local_tracks.decode('utf-8')
    print("Local similar tracks:")
    print(local_tracks)
    return local_tracks

def add_track_to_volumio(track_path):
    track_info = {
        "uri": track_path,
        "service": "mpd",
        "title": track_path.split('/')[-1],  # Extract title from path
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
        print("Failed to add track to Volumio queue. Status code:", response.status_code)
        print("Response:", response.text)

def add_similar_tracks_to_playlist(local_tracks):
    print("Adding similar local tracks to the playlist")
    if not local_tracks:
        print("No local tracks found to add.")
        return
    
    for track in local_tracks.split('\n'):
        if track:
            print(u"Adding track: {}".format(track))
            add_track_to_volumio(track)

def main():
    global local_tracks_found

    tracksn = int(get_tracksn_variable())
    print("Tracksn variable: {} (type: {})".format(tracksn, type(tracksn)))
   
    current_track_artist, current_track_title, current_track_genre = get_current_track_info()

    TOTAL_TRACKS_LIMIT = int(tracksn)
    
    drift = get_drift_variable()
    print("Drift variable: {} (type: {})".format(drift, type(drift)))

    current_track_artist, current_track_title, current_track_genre = get_current_track_info()

    related_tracks = run_blissify_and_export_playlist(tracksn)
    #local_tracks_found = len(related_tracks) > 0
    add_tracks_from_playlist_to_volumio()

    if not local_tracks_found:
        print("No similar tracks found on bliss.m3u. Searching local database...")
        local_tracks = find_similar_local_tracks(current_track_genre, limit=int(tracksn)-int(local_tracks_found))
        add_similar_tracks_to_playlist(local_tracks)

if __name__ == "__main__":
    main()
