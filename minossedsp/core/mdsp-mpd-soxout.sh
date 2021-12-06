#!/bin/bash

MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

### Disable all MPD outputs
"$minosse_bin_folder"mdsp-mpd-disallout.sh

### Enable the required Minosse output
SOX=$("$minosse_bin_folder"mdsp-mpd-getoutnum.sh "minossedsp-sox")
#NOSOX=$("$minosse_bin_folder"mdsp-mpd-getoutnum.sh "minossedsp-nosox")

#"$minosse_bin_folder"mdsp-mpd-cmd.sh "disableoutput ""$NOSOX"
"$minosse_bin_folder"mdsp-mpd-cmd.sh "enableoutput ""$SOX"
