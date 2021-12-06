#!/bin/bash

VUSER="volumio"
VGROUP="volumio"

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
bf_client_connection=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.bf_client_connection')

### Load folder and file locations
. "$MDSP_BF_DIRS"

COUNT=0
ATTEMPTS=20
while [[ $COUNT -le $ATTEMPTS ]]
do
	if [[ -S "$bf_client_connection" ]]
	then
		/bin/chown "$VUSER":"$VGROUP" "$bf_client_connection"
		exit 0
		#break
	fi
	(( COUNT++ ))
	/bin/sleep 0.5
done

exit 1
