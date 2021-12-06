#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
#eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

#if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi

DIRFILTERS="$coefficient_folder""$audio_type""/"

### Create an array of subfolders (channels) based on "$audio_type"
for dvar in "$DIRFILTERS"*
do
	if [[ -d "$dvar" ]]
	then
		echo $(basename "$dvar")
	fi
done
