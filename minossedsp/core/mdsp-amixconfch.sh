#!/bin/bash -e

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi

CNUMB=$("$minosse_bin_folder"mdsp-getcardnum.sh)
NCH=$("$minosse_bin_folder"mdsp-at2ch.sh "$audio_type")

### See: https://www.csa.iisc.ac.in/~udayb/alsamch.shtml
/usr/bin/amixer -c "$CNUMB" set "Surround Jack Mode" "Independent" > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Channel Mode" "$NCH""ch" > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Downmix" "Off" > /dev/null 2>&1 || true
