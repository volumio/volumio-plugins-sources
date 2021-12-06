#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
filter_coeff_extension=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_extension')
#eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

#if [[ "$eq_enabled" != "true" ]]
#then
	DIRFILTERS="$coefficient_folder""$audio_type""/"
	
	### Convert mdsp-getchanlist.sh to an array
	mapfile -t DIRFIL < <("$minosse_bin_folder"mdsp-getchanlist.sh)
	#/bin/echo "${DIRFIL[@]}"
	#/bin/echo "${#DIRFIL[@]}"
	
	### Create an array of coefficient names extracted from file names (using the first subfolder in DIRFIL)
	DIRDBL="$DIRFILTERS""${DIRFIL[0]}""/*""$filter_coeff_extension"
	FDBL=( $(dir $DIRDBL) )
	#/bin/echo "${FDBL[@]}"
	#/bin/echo ${#FDBL[@]}
	NFDBL=()
	for filedbl in "${FDBL[@]}"
	do
	    #NFDBL+=( $(/bin/echo $(basename "$filedbl") | sed 's/_.*//') )
		STRVAL=$(basename "$filedbl")
		NFDBL+=( $(/bin/echo ${STRVAL%-*}) )
	done
	#COEFFS=( $(/usr/bin/printf '%s\n' "${NFDBL[@]}" | /usr/bin/sort -u) )
	
	/usr/bin/printf '%s\n' "${NFDBL[@]}" | /usr/bin/sort -u
#fi
