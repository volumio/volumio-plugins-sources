#!/bin/bash

VUSER="volumio"
VGROUP="volumio"

### Init the configuration template
MDSP_BF_CONF_TMPL="/data/INTERNAL/minossedsp/mdsp-bf-conf.json.tmpl"
MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
/bin/rm -v -f "$MDSP_BF_CONF"
/bin/cp -v -f "$MDSP_BF_CONF_TMPL" "$MDSP_BF_CONF"
/bin/chmod 666 "$MDSP_BF_CONF"
/bin/chown "$VUSER":"$VGROUP" "$MDSP_BF_CONF"

### Load required parameters
gui_msg_file=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.gui_msg_file')
core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')

### Load folder and file locations
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"
. "$MDSP_BF_DIRS"

/bin/rm -v -f "$gui_msg_file"
/usr/bin/touch "$gui_msg_file"
/bin/chmod 666 "$gui_msg_file"
/bin/chown "$VUSER":"$VGROUP" "$gui_msg_file"

/bin/rm -f "$core_fifo"
/usr/bin/mkfifo "$core_fifo"
/bin/chmod 777 "$core_fifo"
/bin/chown "$VUSER":"$VGROUP" "$core_fifo"
