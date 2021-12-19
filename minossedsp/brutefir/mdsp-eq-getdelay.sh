#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
eq_preset_file=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_preset_file')
sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')

### Load folder and file locations
. "$MDSP_BF_DIRS"

PSETFILE="$coefficient_folder""$eq_preset_file"

LVAL=$(/usr/bin/jq -c '."eq-delays-ms"."left"' "$PSETFILE" | /bin/sed 's/"//g' | /bin/sed 's/,/./g')
RVAL=$(/usr/bin/jq -c '."eq-delays-ms"."right"' "$PSETFILE" | /bin/sed 's/"//g' | /bin/sed 's/,/./g')

LSMP=$(/usr/bin/bc <<< "scale=10; ($LVAL * $sampling_rate) / 1000")
RSMP=$(/usr/bin/bc <<< "scale=10; ($RVAL * $sampling_rate) / 1000")

### Number of samples equivalent to the required ms
LLSMP=$(/bin/echo "($LSMP + 0.5) / 1" | /usr/bin/bc)
RRSMP=$(/bin/echo "($RSMP + 0.5) / 1" | /usr/bin/bc)

/bin/echo "$LLSMP"','"$RRSMP"
