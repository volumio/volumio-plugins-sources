#!/bin/bash -e

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
#audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')

### Load folder and file locations
. "$MDSP_BF_DIRS"

CNUMB=$("$minosse_bin_folder"mdsp-getcardnum.sh)

### See: https://www.csa.iisc.ac.in/~udayb/alsamch.shtml
/usr/bin/amixer -c "$CNUMB" set "PCM" 100% mute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Master" 30% mute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Headphone" 30% mute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Front" 100% unmute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Side" 100% unmute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Surround" 100% unmute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Center" 100% unmute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "LFE" 100% unmute > /dev/null 2>&1 || true
