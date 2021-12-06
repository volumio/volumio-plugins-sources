#!/bin/bash

VUSER="volumio"
VGROUP="volumio"

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
bf_client_connection=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.bf_client_connection')

### Load folder and file locations
. "$MDSP_BF_DIRS"

/bin/rm -f "$bf_client_connection"
