# -*- coding: utf-8 -*-

import requests
import subprocess
import json
import sys
import codecs
import urllib

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

def find_related_tracks_from_lastfm(artist, track, tracksn):
    global local_tracks_found

    if not artist or not track:
        print("Error: Artist name or track title is empty. Cannot perform search.")
        return []

    print(u"Searching for similar tracks on Last.fm for artist: {} and track: {}".format(artist, track))

    artist_encoded = urllib.quote(artist.encode('utf-8'))
    track_encoded = urllib.quote(track.encode('utf-8'))
    
    response = requests.get(
        "http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist={}&track={}&api_key={}&format=json".format(
            artist_encoded, track_encoded, API_KEY)
    )

    data = response.json()

    if 'error' in data:
        print("Error fetching related tracks: {}".format(data['message']))
        return []

    related_tracks = data.get('similartracks', {}).get('track', [])[:tracksn*2]

    if not related_tracks:
        print("No related tracks found.")
        return []

    print("Found related tracks:")
    local_related_tracks = []
    for track in related_tracks:
        formatted_track = u"{} - {}".format(track['artist']['name'], track['name'])
        print(u"Checking local database for related track: \"{}\"".format(formatted_track))

        search_query_artist = track['artist']['name'].encode('utf-8')
        search_query_title = track['name'].encode('utf-8')
        
        local_track = subprocess.check_output(["mpc", "search", "artist", search_query_artist, "title", search_query_title]).strip().decode('utf-8')

        if local_track:
            print(u"Found local track: {}".format(local_track))
            local_related_tracks.append(local_track)
            local_tracks_found = True
        else:
            print(u"No local track found for: \"{}\"".format(formatted_track))
    
    return local_related_tracks

def find_similar_local_tracks(genre, limit):
    # Vérification du type de la variable genre
    if not isinstance(genre, (str, unicode)):
        print("Error: genre is not a string or unicode. Current type: {}".format(type(genre)))
        return []

    # Conversion de unicode en str si nécessaire
    if isinstance(genre, unicode):
        genre = genre.encode('utf-8')

    print(u"Searching local MPD database for tracks of the same genre: {}".format(genre))
    
    # Obtenir les pistes locales du genre spécifié
    local_tracks = subprocess.check_output(["mpc", "search", "genre", genre]).decode('utf-8')
    
    # Mélanger les pistes localement en utilisant un pipe
    shuf_process = subprocess.Popen(["shuf"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    local_tracks, _ = shuf_process.communicate(input=local_tracks.encode('utf-8'))
    
    # Limiter à `limit` pistes
    head_process = subprocess.Popen(["head", "-n", str(limit)], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    local_tracks, _ = head_process.communicate(input=local_tracks)
    
    local_tracks = local_tracks.decode('utf-8').strip()
    print("Local similar tracks:")
    print(local_tracks)
    return local_tracks.split('\n')

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
    
    for track in local_tracks:
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
   

    # Vérification du type de la variable genre avant de l'utiliser
    print("Current track genre: {} (type: {})".format(current_track_genre, type(current_track_genre)))

    related_tracks = find_related_tracks_from_lastfm(current_track_artist, current_track_title,tracksn)
    local_tracks_found = len(related_tracks) > 0

    # Ajout des pistes Last.fm
    if local_tracks_found:
        add_similar_tracks_to_playlist(related_tracks)
    
    total_tracks_added = len(related_tracks)

    # Ajout des pistes Drift si moins de 5 pistes ont été ajoutées
    if total_tracks_added < TOTAL_TRACKS_LIMIT and drift:
        remaining_drift_tracks_needed = TOTAL_TRACKS_LIMIT - total_tracks_added + drift
        print("Adding drift tracks to the playlist")
        drift_tracks = find_similar_local_tracks(current_track_genre, limit=remaining_drift_tracks_needed)
        add_similar_tracks_to_playlist(drift_tracks)
        total_tracks_added += len(drift_tracks)

    # Compléter avec des pistes du même genre si le total n'atteint pas 5
    if total_tracks_added < TOTAL_TRACKS_LIMIT:
        remaining_tracks_needed = TOTAL_TRACKS_LIMIT - total_tracks_added + drift
        print("Not enough similar tracks found on Last.fm. Searching local database for remaining tracks...")
        local_tracks = find_similar_local_tracks(current_track_genre, limit=remaining_tracks_needed)
        add_similar_tracks_to_playlist(local_tracks)

if __name__ == "__main__":
    main()