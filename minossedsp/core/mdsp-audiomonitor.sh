#!/bin/bash

VUSER="volumio"
VGROUP="volumio"

IDSTR="MinosseDSP::mdsp-audiomonitor.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
fallback_sr=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.fallback_sr')
unsupported_sr=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.unsupported_sr')
sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
in_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.in_bit_depth')
core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')
in_fifo_delay=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.in_fifo_delay')

### Load folder and file locations
. "$MDSP_BF_DIRS"

### Check if Volumio is playing anything
#ISPLAY=$(/usr/bin/curl -sS "http://127.0.0.1:3000/api/v1/getstate" | /usr/bin/jq -r '.status')
ISPLAY=$(/usr/local/bin/volumio status | /usr/bin/jq -r '.status')
if [[ "$ISPLAY" == "play" ]]
then
	
	### "$1" examples:
	#	44100:16:2
	#	dsd64:2
	SRATEMPD=$(/bin/echo "$1" | /bin/grep -o -P "(?<=^).*(?=:)" | /bin/grep -o -P "(?<=^).*(?=:)")
	BD=$(/bin/echo "$1" | /bin/grep -o -P "(?<=:).*(?=:)")
	
	### In case of non PCM audio formats (DSD, etc.) sampling rate might be a special value
	### Brutefir only works with PCM formats, hence set a fallback sampling rate
	if [[ "$SRATEMPD" != "44100" ]] &&  \
	   [[ "$SRATEMPD" != "48000" ]] &&  \
	   [[ "$SRATEMPD" != "88200" ]] &&  \
	   [[ "$SRATEMPD" != "96000" ]] &&  \
	   [[ "$SRATEMPD" != "176400" ]] && \
	   [[ "$SRATEMPD" != "192000" ]]
	then
		SRATEMPD="NO_PCM_FORMAT"
		### Resampler always exits with floating point precision
		BD="f"
	fi
	
	### Loopback is limited to 192000 Hz
	### See https://alsa-user.narkive.com/ZeBRKkwU/alsa-loopback-in-384khz
	#if [ "$SRATEMPD" -gt "192000" ]; then SRATEMPD="192000"; fi
	
	### Normalize MPD bit depth
	if [[ "$BD" == "16" ]]; then BDEPTHMPD="S16_LE"
	elif [[ "$BD" == "24" ]]; then BDEPTHMPD="S24_4LE"
	elif [[ "$BD" == "f" ]]; then BDEPTHMPD="FLOAT_LE"
	else BDEPTHMPD="S32_LE"
	fi
	
	#/bin/echo "$IDSTR""Requested SR:""$SRATEMPD"" - Brutefir SR:""$sampling_rate"" - Unsupported SR:""$unsupported_sr"
	#/bin/echo "$IDSTR""Requested bit depth:""$BDEPTHMPD"" - Brutefir bit depth:""$in_bit_depth"
	if ([[ "$SRATEMPD" != "" ]] && [[ "$SRATEMPD" != "$sampling_rate" ]] && [[ "$SRATEMPD" != "$unsupported_sr" ]]) ||	\
		([[ "$BDEPTHMPD" != "" ]] && [[ "$SRATEMPD" == "$sampling_rate" ]] && [[ "$BDEPTHMPD" != "$in_bit_depth" ]])
	then
		
		RETVAL="$(/usr/bin/jq '.sampling_rate = "'"$SRATEMPD"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		RETVAL="$(/usr/bin/jq '.in_bit_depth = "'"$BDEPTHMPD"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		
		if [[ $(/usr/local/bin/volumio status | /usr/bin/jq -r '.status') == "play" ]]; then /usr/local/bin/volumio stop > /dev/null 2>&1; fi
		if (/bin/systemctl is-active --quiet mdsp-bf.service); then /bin/systemctl stop mdsp-bf.service > /dev/null 2>&1; fi
		
		### Mute the sound card to avoid unpleasant noises
		"$minosse_bin_folder"mdsp-amixmute.sh
		
		"$minosse_bin_folder"mdsp-bf-wrapper1.sh
		
		### Check if fftw wisdom file exists for this combination of sampling rate and bit depth
		"$minosse_bin_folder"mdsp-bf-chkwisdom.sh
		
		### Unmute the sound card
		"$minosse_bin_folder"mdsp-amixunmute.sh
		
		/usr/local/bin/volumio play > /dev/null 2>&1
		
		/bin/sleep "$in_fifo_delay"
		
		/bin/systemctl start mdsp-bf.service > /dev/null 2>&1
		
	else
	
		if [[ "$SRATEMPD" == "$sampling_rate" ]]
		then
			RETVAL="$(/usr/bin/jq '.unsupported_sr = ""' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		fi
		
		CHKVAR=$(/bin/systemctl is-active mdsp-bf.service)
		if [[ "$CHKVAR" == "failed" || "$CHKVAR" == "inactive" ]]
		then
			if [[ "$CHKVAR" == "failed" ]]
			then
				/bin/echo '{"event":"pushmsg","data":{"type":"error","content":"BRUTEFIR_ERROR","extra":""}}' > "$core_fifo"
			fi
			"$minosse_bin_folder"mdsp-bf-wrapper0.sh
			/bin/systemctl start mdsp-bf.service > /dev/null 2>&1
		fi
		
	fi
	
	### Change mode and owner of fftw-wisdom files
	/bin/chmod 666 "$brutefir_fftw_wisdom_folder"mdsp-*
	/bin/chown "$VUSER":"$VGROUP" "$brutefir_fftw_wisdom_folder"mdsp-*
	
#	CHKVAR=$(/bin/systemctl is-active mdsp-bf.service)
#	if [[ "$CHKVAR" == "failed" ]]
#	then
#		
#		TODO: Restore audio after Brutefir failure
#		
#	fi
	
fi
