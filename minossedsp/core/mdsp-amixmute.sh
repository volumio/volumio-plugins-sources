#!/bin/bash -e

MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

CNUMB=$("$minosse_bin_folder"mdsp-getcardnum.sh)

### See: https://www.csa.iisc.ac.in/~udayb/alsamch.shtml
/usr/bin/amixer -c "$CNUMB" set "Headphone" mute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "Master" mute > /dev/null 2>&1 || true
/usr/bin/amixer -c "$CNUMB" set "PCM" mute > /dev/null 2>&1 || true
