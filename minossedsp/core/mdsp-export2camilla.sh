#!/bin/bash -e

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
filter_coeff_extension=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_extension')
#eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

DIRFILTERS="$coefficient_folder"2.0/
DIRFIL=("left" "right")
#/bin/echo "${DIRFIL[@]}"
#/bin/echo "${#DIRFIL[@]}"

mkdir -p "2.0"

for vdir in "${DIRFIL[@]}"
do
	DIRDBL="$DIRFILTERS""$vdir""/*""$filter_coeff_extension"
	FDBL=( $(dir $DIRDBL) )
	#/bin/echo "${FDBL[@]}"
	#/bin/echo ${#FDBL[@]}
	for filedbl in "${FDBL[@]}"
	do
		FILEDBLNAME=$(basename "$filedbl")
		cp -v -f "$filedbl" "2.0/""$vdir""_""$FILEDBLNAME"
	done
done
