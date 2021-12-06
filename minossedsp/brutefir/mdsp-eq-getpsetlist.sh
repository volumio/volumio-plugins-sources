#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
eq_preset_file=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_preset_file')

### Load folder and file locations
. "$MDSP_BF_DIRS"

PSETFILE="$coefficient_folder""$eq_preset_file"

INTVAL=$(/usr/bin/jq -c 'keys' "$PSETFILE" | /bin/sed 's/"//g;s/\[//g;s/\]//g;s/ //g')
#/bin/echo "$INTVAL"

mapfile -d ',' RETVAL < <(/bin/echo "$INTVAL")
#/bin/echo "${RETVAL[@]/','/''}"
#/bin/echo "${RETVAL[@]}"
#/bin/echo "${#RETVAL[@]}"

NFDBL=()
for lval in "${RETVAL[@]}"
do
    NFDBL+=( ${lval/','/''} )
done

/usr/bin/printf '%s\n' "${NFDBL[@]}" | /usr/bin/sort -u
