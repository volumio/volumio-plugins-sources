#!/bin/bash

IDSTR="MinosseDSP::mdsp-core-execpost.sh: "

VUSER="volumio"
VGROUP="volumio"

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')

### Load folder and file locations
. "$MDSP_BF_DIRS"

/bin/chown "$VUSER":"$VGROUP" "$core_fifo"

### Start MPC client callback and store its process id
/bin/echo '{"event":"start-mpdclient","data":""}' > "$core_fifo"

### Start gdbus monitor and store its process id
/bin/echo "$IDSTR""setting up gdbus monitor for Brutefir failure detection"
#/usr/bin/gdbus monitor --system --dest org.freedesktop.systemd1 --object-path /org/freedesktop/systemd1/unit/mdsp_2dbf_2eservice | grep "'ActiveState': <'failed'>," > "$core_fifo" &
/usr/bin/gdbus monitor --system --dest org.freedesktop.systemd1 --object-path /org/freedesktop/systemd1/unit/mdsp_2dbf_2eservice > "$core_fifo" &
PGDBUS=$!
RETVAL="$(/usr/bin/jq '.pid_gdbus = "'"$PGDBUS"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"

### Resize I/O FIFO
/bin/cat -n <>"$brutefir_in_fifo_folder"mdsp-mpd.fifo &
PCAT=$!
/bin/sleep 0.5
#"$minosse_bin_folder"mdsp-resizefifo.pl "$brutefir_in_fifo_folder"mdsp-mpd.fifo 1048576
#"$minosse_bin_folder"mdsp-resizefifo.pl "$brutefir_in_fifo_folder"mdsp-mpd.fifo $((8388608*4))
"$minosse_bin_folder"mdsp-resizefifo.pl "$brutefir_in_fifo_folder"mdsp-mpd.fifo $((8388608*2))
/bin/kill "$PCAT"
/bin/sleep 0.5

### The user interface can now populate "$MDSP_BF_CONF" json file with volume, coefficient id, etc.

### Set audio device number parameter
ADNUM=$("$minosse_bin_folder"mdsp-getcardnum.sh)
RETVAL="$(/usr/bin/jq '.out_device_number = "'"$ADNUM"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"

### Some audio cards need to be initialized the hard way...
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
"$minosse_bin_folder"mdsp-amixmute.sh
if [[ "$audio_type" == "2.0" ]]
then
	"$minosse_bin_folder"mdsp-chkchannels.sh "4.0"
else
	"$minosse_bin_folder"mdsp-chkchannels.sh "2.0"
fi
"$minosse_bin_folder"mdsp-chkchannels.sh "$audio_type"
