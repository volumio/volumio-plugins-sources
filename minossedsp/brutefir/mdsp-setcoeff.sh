#!/bin/bash

IDSTR="MinosseDSP::mdsp-bf-setcoeff.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')
#eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

if [[ "$1" == "" || "$1" == "null" ]]
then
	/bin/echo "$IDSTR"'ERROR - invalid coefficient id parameter'
	exit 1
fi

#if [[ "$eq_enabled" != "true" ]]
#then
	
	RETVAL="$(/usr/bin/jq '.filter_coeff_id = "'"$1"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	
	### Create an array of subfolders (channels) based on "$audio_type"
	### Convert mdsp-getchanlist.sh to an array
	mapfile -t DIRFIL < <("$minosse_bin_folder"mdsp-getchanlist.sh)
	
	if (/bin/systemctl is-active --quiet mdsp-bf.service)
	then
		
		COMMAND=""
		for ndirs in "${DIRFIL[@]}"
		do
			COMMAND+='cfc "'"$ndirs"'" "'"$1"'_'"$ndirs"'";'
		done
		"$minosse_bin_folder"mdsp-bf-cmd.sh "$COMMAND" >/dev/null 2>&1
		"$minosse_bin_folder"mdsp-applydelays.sh >/dev/null 2>&1
		
	fi
	
	### Send a message to the user interface
	/bin/echo '{"event":"pushmsg","data":{"type":"success","content":"COEFFICIENTS_OPTIONS_SAVED","extra":""}}' > "$core_fifo"

#fi
