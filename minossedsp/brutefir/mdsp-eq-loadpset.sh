#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
eq_preset_file=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_preset_file')

### Load folder and file locations
. "$MDSP_BF_DIRS"

PSETFILE="$coefficient_folder""$eq_preset_file"

RETVAL=$(/usr/bin/jq -c '."eq-presets"."'"$1"'".magnitude' "$PSETFILE")

/bin/echo "$RETVAL" | /bin/sed 's/"//g'
