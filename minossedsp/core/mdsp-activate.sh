#!/bin/bash

### To be called for plugin activation and also each time the sound device or the audio type (2.0, 2.1, 4.0, etc.) is changed

VUSER="volumio"
VGROUP="volumio"

### Init the configuration template
MDSP_BF_CONF_TMPL="/data/INTERNAL/minossedsp/mdsp-bf-conf.json.tmpl"
MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
/bin/rm -v -f "$MDSP_BF_CONF"
/bin/cp -v -f "$MDSP_BF_CONF_TMPL" "$MDSP_BF_CONF"
/bin/chown "$VUSER":"$VGROUP" "$MDSP_BF_CONF"

MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

### Check if audio type parameter has been provided, if not set 2.0 (stereo)
if [ "$1" != "" ]; then AT="$1"; else AT="2.0"; fi

### Set audio type parameter
RETVAL="$(/usr/bin/jq '.audio_type = "'"$AT"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"

### Reconfigure MPD service
#/bin/cp -v -f "/lib/systemd/system/mpd.service" "/lib/systemd/system/mpd.service.bak"
#/bin/cp -v -f "$minosse_data_folder"mpd.service "/lib/systemd/system/"
/bin/rm -v -r -f "/etc/systemd/system/mpd.service.d/"
/bin/mkdir -p "/etc/systemd/system/mpd.service.d/"
/bin/cp -v -f "$minosse_data_folder"override.conf "/etc/systemd/system/mpd.service.d/"
/bin/systemctl daemon-reload

### Configure mpd.conf.tmpl with fallback sampling rate and soxr quality
"$minosse_bin_folder"mdsp-mpd-maketmpl.sh
"$minosse_bin_folder"mdsp-bf-wrapper1.sh

### Remove fftw wisdom files
/bin/rm -v -f "$brutefir_fftw_wisdom_folder"mdsp-*

### Needs reboot!!!
