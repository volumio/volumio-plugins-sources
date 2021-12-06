#!/bin/bash

IDSTR="MinosseDSP::mdsp-turnvol.sh: "

MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

if [[ "$1" == "" || "$1" == "null" ]]
then
	/bin/echo "$IDSTR"'ERROR - invalid volume parameter'
	exit 1
fi

if (/bin/systemctl is-active --quiet mdsp-bf.service)
then
	
	RETV=$("$minosse_bin_folder"mdsp-getvol.sh)
	NV=$(/usr/bin/bc <<< "scale=1; $RETV - $1")
	"$minosse_bin_folder"mdsp-setvol.sh "$NV"
	
fi
