#!/bin/bash

MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

mapfile -t ALLOUT < <("$minosse_bin_folder"mdsp-mpd-cmd.sh "outputs" | /bin/grep "outputid:" | /bin/grep -o -P '(?<=: ).*(?=$)')
/bin/echo ${ALLOUT[@]}

for nout in "${ALLOUT[@]}"
do
	"$minosse_bin_folder"mdsp-mpd-cmd.sh "disableoutput ""$nout"
done
