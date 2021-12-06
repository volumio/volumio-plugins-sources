#!/bin/bash

MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

TMPADD='
# Audio Output ################################################################

resampler {
	plugin		"soxr"
	quality		"${mdsp_soxr_quality}"
	threads		"0"
}

audio_output {
	type		"fifo"
	name		"minossedsp-nosox"
	path		"/usr/local/etc/minossedsp/mdsp-mpd.fifo"
}

audio_output {
	type		"fifo"
	name		"minossedsp-sox"
	path		"/usr/local/etc/minossedsp/mdsp-mpd.fifo"
	enabled		"no"
	format		"${mdsp_fallback_sr}:f:2"
}

#replaygain			"album"
#replaygain_preamp		"0"
volume_normalization		"no"
###############################################################################
'

/bin/rm -v -f "$brutefir_in_fifo_folder"mpd.conf
/bin/rm -v -f /tmp/mpd.conf.temp

#TMPREM=$(/usr/bin/awk '/# Audio Output ###################/,/^###################/' "$brutefir_in_fifo_folder"mpd.conf)

/bin/sed '/# Audio Output ###################/,/###################/d' /etc/mpd.conf > /tmp/mpd.conf.temp

/bin/echo "$TMPADD" >> /tmp/mpd.conf.temp

/bin/cp -v -f /tmp/mpd.conf.temp "$brutefir_in_fifo_folder"mpd.conf
