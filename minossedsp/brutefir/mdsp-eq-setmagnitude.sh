#!/bin/bash

IDSTR="MinosseDSP::mdsp-setmagnitude.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

if [[ "$1" == "" || "$1" == "null" ]]
then
	/bin/echo "$IDSTR"'ERROR - invalid magnitude values'
	exit 1
fi

RETVAL="$(/usr/bin/jq '.eq_magnitude = "'"$1"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"

#if [[ $(/bin/systemctl is-active mdsp-bf.service) == "active" ]]
if (/bin/systemctl is-active --quiet mdsp-bf.service)
then
	COMMAND="lmc eq 0 mag "
	COMMAND+=$("$minosse_bin_folder"mdsp-eq-strcmd.sh "$1")
	"$minosse_bin_folder"mdsp-bf-cmd.sh "$COMMAND" >/dev/null 2>&1
fi
