#!/bin/bash

IDSTR="MinosseDSP::mdsp-bf-makedelaystr.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
filter_coeff_id=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_id')
sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
delay_file_name=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.delay_file_name')
eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

### Load folder and file locations
. "$MDSP_BF_DIRS"

if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi

DIRFILTERS="$coefficient_folder""$audio_type""/"

if [[ "$1" == "" || "$1" == "null" ]]
then
	/bin/echo "$IDSTR"'ERROR - invalid string parameter'
	exit 1
fi

### Create an array of subfolders (channels) based on "$audio_type"
### Convert mdsp-getchanlist.sh to an array
mapfile -t DIRFIL < <("$minosse_bin_folder"mdsp-getchanlist.sh)

DELAY_FILE="$DIRFILTERS""$delay_file_name"

### "$1" examples for $audio_type="2.1":
#	"left,right,sub,sub"
#	"cod 0 left; cod 1 right; cod 2 sub; cod 3 sub"
DELAY_STRING="$1"

_zero_delays() {
	### Delay file or coefficient ID not found, so set all delays to zero
	if [[ "$audio_type" == "2.0" ]]
	then
		DELAY_STRING="${DELAY_STRING/left/0}"
		DELAY_STRING="${DELAY_STRING/right/0}"
	elif [[ "$audio_type" == "2.1" ]]
	then
		DELAY_STRING="${DELAY_STRING/left/0}"
		DELAY_STRING="${DELAY_STRING/right/0}"
		DELAY_STRING="${DELAY_STRING/sub/0}"
		DELAY_STRING="${DELAY_STRING/sub/0}"
	elif [[ "$audio_type" == "4.0" ]]
	then
		DELAY_STRING="${DELAY_STRING/left-bass/0}"
		DELAY_STRING="${DELAY_STRING/right-bass/0}"
		DELAY_STRING="${DELAY_STRING/left-treble/0}"
		DELAY_STRING="${DELAY_STRING/right-treble/0}"
	elif [[ "$audio_type" == "4.1" ]]
	then
		DELAY_STRING="${DELAY_STRING/left-bass/0}"
		DELAY_STRING="${DELAY_STRING/right-bass/0}"
		DELAY_STRING="${DELAY_STRING/left-treble/0}"
		DELAY_STRING="${DELAY_STRING/right-treble/0}"
		DELAY_STRING="${DELAY_STRING/sub/0}"
		DELAY_STRING="${DELAY_STRING/sub/0}"
	elif [[ "$audio_type" == "6.0" ]]
	then
		DELAY_STRING="${DELAY_STRING/left-midrange/0}"
		DELAY_STRING="${DELAY_STRING/right-midrange/0}"
		DELAY_STRING="${DELAY_STRING/left-treble/0}"
		DELAY_STRING="${DELAY_STRING/right-treble/0}"
		DELAY_STRING="${DELAY_STRING/left-bass/0}"
		DELAY_STRING="${DELAY_STRING/right-bass/0}"
	elif [[ "$audio_type" == "6.1" ]]
	then
		DELAY_STRING="${DELAY_STRING/left-midrange/0}"
		DELAY_STRING="${DELAY_STRING/right-midrange/0}"
		DELAY_STRING="${DELAY_STRING/left-treble/0}"
		DELAY_STRING="${DELAY_STRING/right-treble/0}"
		DELAY_STRING="${DELAY_STRING/left-bass/0}"
		DELAY_STRING="${DELAY_STRING/right-bass/0}"
		DELAY_STRING="${DELAY_STRING/sub/0}"
		DELAY_STRING="${DELAY_STRING/sub/0}"
	elif [[ "$audio_type" == "8.0" ]]
	then
		DELAY_STRING="left-midrange,right-midrange,left-midbass,right-midbass,left-treble,right-treble,left-bass,right-bass"
		DELAY_STRING="${DELAY_STRING/left-midrange/0}"
		DELAY_STRING="${DELAY_STRING/right-midrange/0}"
		DELAY_STRING="${DELAY_STRING/left-midbass/0}"
		DELAY_STRING="${DELAY_STRING/right-midbass/0}"
		DELAY_STRING="${DELAY_STRING/left-treble/0}"
		DELAY_STRING="${DELAY_STRING/right-treble/0}"
		DELAY_STRING="${DELAY_STRING/left-bass/0}"
		DELAY_STRING="${DELAY_STRING/right-bass/0}"
	fi
}

### Check if a delay file exists
if [[ -f "$DELAY_FILE" ]]
then
	
	DELAY_LIST=$(/bin/cat "$DELAY_FILE" | /usr/bin/jq -r '.'\"$filter_coeff_id\")
	#/bin/echo "$DELAY_LIST"
	
	if [[ "$DELAY_LIST" != "null" ]]
	then
				
		for ndirs in "${DIRFIL[@]}"
		do
			VDELSTR=$(/bin/cat "$DELAY_FILE" | /usr/bin/jq -r '.'\"$filter_coeff_id\"'.'\"$ndirs\")
			#/bin/echo "$VDELSTR"
			
			### Convert comma to decimal point
			VDELDEC=$(/bin/sed 's/,/./g' <<<$(/bin/echo "$VDELSTR"))
			#/bin/echo "$VDELDEC"
			
			NSMP=$(/usr/bin/bc <<< "scale=10; ($VDELDEC * $sampling_rate) / 1000")
			#/bin/echo "$NSMP"
			
			### Number of samples equivalent to the required ms
			RNSMP=$(/bin/echo "($NSMP + 0.5) / 1" | /usr/bin/bc)
			#/bin/echo "$RNSMP"
			
			### If present, "sub" strings are always two, so repeat the command twice
			DELAY_STRING="${DELAY_STRING/${ndirs}/${RNSMP}}"
			DELAY_STRING="${DELAY_STRING/${ndirs}/${RNSMP}}"
			
		done
		
	else
		_zero_delays
	fi

else
	_zero_delays
fi

/bin/echo "$DELAY_STRING"
