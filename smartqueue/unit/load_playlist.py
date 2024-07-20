# -*- coding: utf-8 -*-

import requests
import sys
import os

def load_playlist(playlist_name):
    volumio_url = "http://localhost:3000/api/v1/commands/?cmd=playplaylist&name={}".format(playlist_name)

    try:
        response = requests.get(volumio_url)
        response.raise_for_status()  # Lève une exception en cas d'erreur HTTP
        print(response.json())  # Affiche la réponse JSON pour vérification
    except requests.exceptions.RequestException as e:
        print("Failed to load playlist in Volumio: {}".format(e))
        sys.exit(1)

def main():
    if len(sys.argv) != 2:
        print("Usage: python load_playlist.py <playlist_name>")
        sys.exit(1)

    playlist_name = sys.argv[1]
    load_playlist(playlist_name)

if __name__ == "__main__":
    main()
