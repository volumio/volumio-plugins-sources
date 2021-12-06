#!/bin/bash

IDSTR="MinosseDSP::mdsp-setvol.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')
eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi

if [[ "$1" == "" || "$1" == "null" ]]
then
	/bin/echo "$IDSTR"'ERROR - invalid volume parameter'
	exit 1
fi

NV="$1"
if [ $(/usr/bin/bc -l <<< "$NV < 0.0") = 1 ]; then NV=$(/usr/bin/bc <<< "scale=1; 0.0 - $NV"); fi
if [ $(/usr/bin/bc -l <<< "$NV > 100.0") = 1 ]; then NV=100.0; fi

RETVAL="$(/usr/bin/jq '.out_volume = "'"$NV"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"

#if [[ $(/bin/systemctl is-active mdsp-bf.service) == "active" ]]
if (/bin/systemctl is-active --quiet mdsp-bf.service)
then
	
	if [[ "$audio_type" == "2.0" ]]; then COMMAND="cfoa 0 0 $NV; cfoa 1 1 $NV"
	elif [[ "$audio_type" == "2.1" ]]; then COMMAND="cfoa 0 0 $NV; cfoa 1 1 $NV; cfoa 2 2 $NV; cfoa 2 3 $NV"
	elif [[ "$audio_type" == "4.0" ]]; then COMMAND="cfoa 0 0 $NV; cfoa 1 2 $NV; cfoa 2 1 $NV; cfoa 3 3 $NV"
	elif [[ "$audio_type" == "4.1" ]]; then COMMAND="cfoa 0 0 $NV; cfoa 1 2 $NV; cfoa 2 1 $NV; cfoa 3 3 $NV; cfoa 4 4 $NV; cfoa 4 5 $NV"
	elif [[ "$audio_type" == "6.0" ]]; then COMMAND="cfoa 0 4 $NV; cfoa 1 0 $NV; cfoa 2 2 $NV; cfoa 3 5 $NV; cfoa 4 1 $NV; cfoa 5 3 $NV"
	elif [[ "$audio_type" == "6.1" ]]; then COMMAND="cfoa 0 4 $NV; cfoa 1 0 $NV; cfoa 2 2 $NV; cfoa 3 5 $NV; cfoa 4 1 $NV; cfoa 5 3 $NV; cfoa 6 6 $NV; cfoa 6 7 $NV"
	elif [[ "$audio_type" == "8.0" ]]; then COMMAND="cfoa 0 6 $NV; cfoa 1 2 $NV; cfoa 2 0 $NV; cfoa 3 4 $NV; cfoa 4 7 $NV; cfoa 5 3 $NV; cfoa 6 1 $NV; cfoa 7 5 $NV"
	fi
	"$minosse_bin_folder"mdsp-bf-cmd.sh "$COMMAND" >/dev/null 2>&1
	
fi

### Send a message to the user interface
NVSTR=$(echo 'scale=1; ('"$NV"'/1)' | bc)
MTYPE="info"
if [ $(/usr/bin/bc -l <<< "$NVSTR <= 15.0") = 1 ]; then MTYPE="warning"; fi
/bin/echo '{"event":"pushmsg","data":{"type":"'"$MTYPE"'","content":"VOLUME_DB_MESSAGE","extra":"'"$NVSTR"' dB"}}' > "$core_fifo"
