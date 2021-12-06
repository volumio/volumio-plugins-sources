#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
fallback_sr=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.fallback_sr')
out_device=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_device')
out_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_bit_depth')

### Load folder and file locations
. "$MDSP_BF_DIRS"

NCH=$("$minosse_bin_folder"mdsp-at2ch.sh "$1")

CNUMB=$("$minosse_bin_folder"mdsp-getcardnum.sh)
PREVNCH=$(/usr/bin/amixer -c "$CNUMB" get "Channel Mode" | /bin/grep -o -P "(?<=Item0: ').*(?=ch')")

### Doesn't work if the output device is busy
if [[ $(/usr/local/bin/volumio status | /usr/bin/jq -r '.status') == "play" ]]; then /usr/local/bin/volumio stop > /dev/null 2>&1; fi
if (/bin/systemctl is-active --quiet mdsp-bf.service); then /bin/systemctl stop mdsp-bf.service > /dev/null 2>&1; fi

/usr/bin/amixer -c "$CNUMB" set "Channel Mode" "$NCH""ch" > /dev/null 2>&1 || true
### RETVAL example:
#	Playing raw data 'stdin' : Signed 16 bit Little Endian, Rate 48000 Hz, Channels 8
#	aplay: set_params:1345: Channels count non available
set +e
RETVAL=$(LANG=C /usr/bin/aplay --device="$out_device" --format="$out_bit_depth" --channels="$NCH" --nonblock --rate="$fallback_sr" 2>&1 <<< /dev/zero)

if [[ $(/bin/echo "$RETVAL" | /bin/grep "aplay: ") != "" ]]
then
	/usr/bin/amixer -c "$CNUMB" set "Channel Mode" "$PREVNCH""ch" > /dev/null 2>&1 || true
	/bin/echo "false"
	exit
fi

/bin/echo "true"
