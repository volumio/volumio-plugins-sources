#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi

PARAM_STRING=""
if [[ "$audio_type" == "2.0" ]]
then
	PARAM_STRING="cod 0 left;cod 1 right;"
elif [[ "$audio_type" == "2.1" ]]
then
	PARAM_STRING="cod 0 left;cod 1 right;cod 2 sub;cod 3 sub;"
elif [[ "$audio_type" == "4.0" ]]
then
	PARAM_STRING="cod 0 left-bass;cod 1 right-bass;cod 2 left-treble;cod 3 right-treble;"
elif [[ "$audio_type" == "4.1" ]]
then
	PARAM_STRING="cod 0 left-bass;cod 1 right-bass;cod 2 left-treble;cod 3 right-treble;cod 4 sub;cod 5 sub;"
elif [[ "$audio_type" == "6.0" ]]
then
	PARAM_STRING="cod 0 left-midrange;cod 1 right-midrange;cod 2 left-treble;cod 3 right-treble;cod 4 left-bass;cod 5 right-bass;"
elif [[ "$audio_type" == "6.1" ]]
then
	PARAM_STRING="cod 0 left-midrange;cod 1 right-midrange;cod 2 left-treble;cod 3 right-treble;cod 4 left-bass;cod 5 right-bass;cod 6 sub;cod 7 sub;"
elif [[ "$audio_type" == "8.0" ]]
then
	PARAM_STRING="cod 0 left-midrange;cod 1 right-midrange;cod 2 left-midbass;cod 3 right-midbass;cod 4 left-treble;cod 5 right-treble;cod 6 left-bass;cod 7 right-bass;"
fi
#/bin/echo "$PARAM_STRING"
DELAY_STRING=$("$minosse_bin_folder"mdsp-makedelaystr.sh "$PARAM_STRING")
#/bin/echo "$DELAY_STRING"

"$minosse_bin_folder"mdsp-bf-cmd.sh "$DELAY_STRING" >/dev/null 2>&1
