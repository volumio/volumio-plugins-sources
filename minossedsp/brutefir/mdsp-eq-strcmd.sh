#!/bin/bash

IDSTR="MinosseDSP::mdsp-eq-strcmd.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
eq_bands=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_bands')

### Load folder and file locations
. "$MDSP_BF_DIRS"

### Create an array from "$eq_bands"
mapfile -d ',' EQBANDS < <(/bin/echo "$eq_bands")
#/bin/echo "${EQBANDS[@]}"

### Create an array from input string "$1"
mapfile -d ',' EQINSTR < <(/bin/echo "$1")
#/bin/echo "${EQINSTR[@]}"

EQOUTSTR=''
ncount=0
for eqband in "${EQBANDS[@]}"
do
	if [ $ncount -gt 0 ]; then EQOUTSTR+=','; fi
	eqbandtrmd=$(/bin/echo "$eqband" | /bin/sed 's/,//g')
	eqinstrrmd=$(/bin/echo "${EQINSTR[$ncount]}" | /bin/sed 's/,//g')
	EQOUTSTR+="$eqbandtrmd"'/'"$eqinstrrmd"
	(( ncount++ ))
done

/bin/echo "$EQOUTSTR"
