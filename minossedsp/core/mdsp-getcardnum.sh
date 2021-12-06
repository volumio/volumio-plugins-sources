#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
out_device=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_device')

### Load folder and file locations
. "$MDSP_BF_DIRS"

ASFILE="/etc/asound.conf"

### ASFILE example:
#	[...]
#	# There is always a plug before the hardware to be safe
#	pcm.volumioOutput {
#	    type plug
#	    slave.pcm "volumioHw"
#	}
#	
#	pcm.volumioHw {
#	    type hw
#	    card "I82801AAICH"
#	}
CNAME=$(/usr/bin/awk '/pcm.'"$out_device"' {/,/}/' "$ASFILE" | /bin/grep "card" | /bin/grep -o -P "(?<=card \").*(?=\")")
CNUMB=$(/usr/bin/aplay -l | /bin/grep "$CNAME" -m 1 | /bin/grep -o -P "(?<=card ).*(?=: $CNAME)")

/bin/echo "$CNUMB"
