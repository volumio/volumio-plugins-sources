#!/bin/bash

MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

RETVAL=$("$minosse_bin_folder"mdsp-mpd-cmd.sh "outputs" | /bin/grep -B 1 "$1" | /bin/grep "outputid:" | /bin/grep -o -P '(?<=: ).*(?=$)')

/bin/echo "$RETVAL"
