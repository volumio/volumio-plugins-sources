#!/bin/bash

### Brutefir wrapper level 1 (outermost) #############################
#		Take data from from "$MDSP_BF_CONF" and "$MDSP_BF_DIRS" files
#		and elaborate the missing values making decisions based on
#		hardware configuration and user choices. Then, pass everything
#		to the level 0.

IDSTR="MinosseDSP::mdsp-bf-wrapper1.sh: "

### "$MDSP_BF_CONF" json file format example #############################
#	{
#		"fallback_sr": "192000",
#		"audio_type": "2.0",
#		"out_device": "volumioHw",
#		"out_bit_depth": "S32_LE",
#		[...]
#	}
MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"

### "$MDSP_BF_DIRS" json file format example #############################
#	export brutefir_conf_folder="/data/INTERNAL/minossedsp/"
#	export brutefir_conf_file="/data/INTERNAL/minossedsp/mdsp-bfconf.txt"
#	export coefficient_folder="/data/INTERNAL/minossedsp/filters/"
#	export fftw_wisdom_folder="/data/INTERNAL/minossedsp/fftw-wisdom/"
#	[...]
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load folder and file locations
. "$MDSP_BF_DIRS"

_out_sr_and_bit_depth() {
	
	### Always reload required parameters locally, as the previous functions may have changed them
	fallback_sr=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.fallback_sr')
	out_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_bit_depth')
	audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
	out_device=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_device')
	eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')
	
	if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi
	
	if [[ "$fallback_sr" == "" || "$out_bit_depth" == "" ]]
	then
		
		### Find the best bit depth and sample rate for the chosen output device
		OFORMAT="S32_LE"	# output format to test
		IOSRATE="192000"	# sample rate to test
		### SSE2 detection (used by Brutefir 64 bit)
#		ISSSE2=$(/usr/bin/lscpu | /bin/grep "Flags:" | /bin/grep -i "sse2")
#		if [[ "$ISSSE2" == "" ]]
#		then
#			### SSE2 CPU flag not detected, reduce the fallback sample rate
#			IOSRATE="192000"	# sample rate to test
#		fi
		
		NCH=$("$minosse_bin_folder"mdsp-at2ch.sh "$audio_type")
		
		### RETVAL example:
		#	Playing raw data 'stdin' : Signed 16 bit Little Endian, Rate 44100 Hz, Stereo
		#	aplay: set_params:1339: Sample format non available
		#	Available formats:
		#	- S16_LE
		#	- S32_LE
		#	- SPECIAL
		#	- DSD_U32_BE
		set +e
		RETVAL=$(LANG=C /usr/bin/aplay --device="$out_device" --format="$OFORMAT" --channels="$NCH" --nonblock --rate="$IOSRATE"  2>&1 <<< /dev/zero)
		TESTBD=$(/bin/echo "$RETVAL" | /bin/grep "Available formats:")
		if [ "$TESTBD" != "" ]
		then
			
			STEST=$(/bin/echo "$RETVAL" | /bin/grep "S24_LE")
			if [ "$STEST" != "" ]
			then
				OFORMAT="S24_4LE"
			else
				STEST2=$(/bin/echo "$RETVAL" | /bin/grep "S24_3LE")
				if [ "$STEST2" != "" ]
				then
					OFORMAT="S24_3LE"
				else
					OFORMAT="S16_LE"
				fi
			fi
			RETVAL=$(LANG=C /usr/bin/aplay --device="$out_device" --format="$OFORMAT" --channels="$NCH" --nonblock --rate="$IOSRATE"  2>&1 <<< /dev/zero)
			
		fi
		
		### RETVAL examples:
		#	Playing raw data 'stdin' : Signed 24 bit Little Endian in 3bytes, Rate 192000 Hz, Stereo
		#	Warning: rate is not accurate (requested = 192000Hz, got = 96000Hz)
		#	         please, try the plug plugin
		TESTSR=$(/bin/echo $RETVAL | /bin/grep "Warning: rate is not accurate")
		if [ "$TESTSR" != "" ]
		then
			IOSRATE=$(/bin/echo $TESTSR | /bin/grep -o -P '(?<=got = ).*(?=Hz\))')
		fi
		
		RETVAL="$(/usr/bin/jq '.fallback_sr = "'"$IOSRATE"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		RETVAL="$(/usr/bin/jq '.out_bit_depth = "'"$OFORMAT"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		
		### Configure mpd.conf.tmpl with fallback sampling rate and soxr quality
		
		/bin/sed -i -e 's#${mdsp_fallback_sr}#'"$IOSRATE"'#g' "$brutefir_in_fifo_folder"mpd.conf
		
		ISSSE2=$(/usr/bin/lscpu | /bin/grep "Flags:" | /bin/grep -i "sse2")
		if [[ "$ISSSE2" == "" ]]
		then
			/bin/echo "$IDSTR""SSE2 CPU flag not detected, choosing high quality soxr resampler"
			# "$brutefir_in_fifo_folder"mpd.conf
			/bin/sed -i -e 's#${mdsp_soxr_quality}#high#g' "$brutefir_in_fifo_folder"mpd.conf
		else
			/bin/echo "$IDSTR""SSE2 CPU flag detected, choosing very high quality soxr resampler"
			/bin/sed -i -e 's#${mdsp_soxr_quality}#very high#g' "$brutefir_in_fifo_folder"mpd.conf
		fi
		
	fi
	
}

_check_input_sr() {
	
	### Always reload required parameters locally, as the previous functions may have changed them
	fallback_sr=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.fallback_sr')
	sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
	out_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_bit_depth')
	in_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.in_bit_depth')
	audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
	out_device=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_device')
	core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')
	eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')
	
	if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi
	
	### Check if the required sampling rate is supported by the output device
	set +e
	TESTSR=""
	if [[ "$sampling_rate" != "NO_PCM_FORMAT" ]]
	then
		RETVAL=$(LANG=C /usr/bin/aplay --device="$out_device" --format="$out_bit_depth" --channels=2 --nonblock --rate="$sampling_rate"  2>&1 <<< /dev/zero)
		TESTSR=$(/bin/echo $RETVAL | /bin/grep "Warning: rate is not accurate")
	fi
	if ([[ "$TESTSR" != "" ]] || [[ "$sampling_rate" == "NO_PCM_FORMAT" ]])
	then
		
		### The required sample rate is not supported, so set the fallback sample rate and activate MPD resampled out
		RETVAL="$(/usr/bin/jq '.unsupported_sr = "'"$sampling_rate"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		RETVAL="$(/usr/bin/jq '.sampling_rate = "'"$fallback_sr"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		### Resampler always exits with floating point precision
		RETVAL="$(/usr/bin/jq '.in_bit_depth = "FLOAT_LE"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		
		"$minosse_bin_folder"mdsp-mpd-soxout.sh
		
		### Flush message queue to avoid a messy start of the audio file
		"$minosse_bin_folder"mdsp-flushfifo.sh "$core_fifo"
		
		### Send a message to the user interface
		if [[ "$sampling_rate" == "NO_PCM_FORMAT" ]]
		then
			/bin/echo '{"event":"pushmsg","data":{"type":"warning","content":"RECONFIGURING_AUDIO_NO_PCM","extra":""}}' > "$core_fifo"
		else
			/bin/echo '{"event":"pushmsg","data":{"type":"warning","content":"RECONFIGURING_AUDIO_UNSUPPORTED_RATE","extra":""}}' > "$core_fifo"
		fi
		
	else
		
		### The required sample rate is supported, so restore MPD out without resampling
		RETVAL="$(/usr/bin/jq '.unsupported_sr = ""' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		
		"$minosse_bin_folder"mdsp-mpd-nosoxout.sh
		
		### Flush message queue to avoid a messy start of the audio file
		"$minosse_bin_folder"mdsp-flushfifo.sh "$core_fifo"
		
		### Send a message to the user interface
		/bin/echo '{"event":"pushmsg","data":{"type":"success","content":"RECONFIGURING_AUDIO","extra":""}}' > "$core_fifo"
		
	fi
	
}

_filter_partitions() {
	
	### Always reload required parameters locally, as the previous functions may have changed them
	filter_partitions=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_partitions')
	sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
	audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
	eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')
	
	if [[ "$eq_enabled" == "true" ]]; then audio_type="2.0"; fi
	
	#if [[ "$filter_partitions" == "" || "$filter_partitions" == "null" ]]
	#then
	
		NPART=32
		if [[ "$sampling_rate" -ge "176400" ]]
		then
			NPART=$(("$NPART"/2))
		fi
			
		### SSE2 detection (used by Brutefir 64 bit)
		ISSSE2=$(/usr/bin/lscpu | /bin/grep "Flags:" | /bin/grep -i "sse2")
		if [[ "$ISSSE2" == "" ]]
		then
			/bin/echo ""
			/bin/echo "$IDSTR""INFO - SSE2 CPU flag not detected. Reducing the number of Brutefir filter partitions..."
			NPART=$(("$NPART"/2))
			
			if [[ "$audio_type" == "2.1" || "$audio_type" == "4.0" ]]
			then
				/bin/echo ""
				/bin/echo "$IDSTR""INFO - multichannel configuration detected (2.1 or 4.0). Reducing the number of Brutefir filter partitions..."
				NPART=$(("$NPART"/2))
			elif [[ "$audio_type" == "4.1" || "$audio_type" == "6.0" ]]
			then
				/bin/echo ""
				/bin/echo "$IDSTR""INFO - multichannel configuration detected (4.1 or 6.0). Reducing the number of Brutefir filter partitions..."
				NPART=$(("$NPART"/4))
			elif [[ "$audio_type" == "6.1" || "$audio_type" == "8.0" ]]
			then
				/bin/echo ""
				/bin/echo "$IDSTR""INFO - multichannel configuration detected (6.1 or 8.0). Reducing the number of Brutefir filter partitions..."
				NPART=$(("$NPART"/8))
			fi
			
		else
			/bin/echo ""
			/bin/echo "$IDSTR""INFO - SSE2 CPU flag detected"
			
			if [[ "$audio_type" == "4.1" || "$audio_type" == "6.0" || "$audio_type" == "6.1" || "$audio_type" == "8.0" ]]
			then
				/bin/echo ""
				/bin/echo "$IDSTR""INFO - multichannel configuration detected (4.1, 6.0, 6.1 or 8.0). Reducing the number of Brutefir filter partitions..."
				NPART=$(("$NPART"/2))
			fi
			
		fi
		
		RETVAL="$(/usr/bin/jq '.filter_partitions = "'"$NPART"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		
	#fi
}

_apply_dither() {
	
	### Always reload required parameters locally, as the previous functions may have changed them
	apply_dither=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.apply_dither')
	out_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_bit_depth')
	
	#if [[ "$apply_dither" == "" || "$apply_dither" == "null" ]]
	#then
		
		APPDITH="false"
		if [[ "$out_bit_depth" == "S16_LE" ]]
		then
			APPDITH="true"
		fi
		
		RETVAL="$(/usr/bin/jq '.apply_dither = "'"$APPDITH"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		
	#fi
}

_max_delay() {
	
	### Always reload required parameters locally, as the previous functions may have changed them
	sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
	
	### Maximum delay is always 1 second
	RETVAL="$(/usr/bin/jq '.max_delay = "'"$sampling_rate"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	
}

_check_volume() {
	
	### Always reload required parameters locally, as the previous functions may have changed them
	out_volume=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_volume')
	
	### If $out_volume is undefined set it to a safe level
	if [[ "$out_volume" == "" || "$out_volume" == "null" ]]
	then
		RETVAL="$(/usr/bin/jq '.out_volume = "60.0"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	fi
	
}

_check_coeffid() {
	
	### Always reload required parameters locally, as the previous functions may have changed them
	filter_coeff_id=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_id')
	eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')
	
	if [[ "$eq_enabled" != "true" ]]
	then
		### If $filter_coeff_id is undefined choose the first one
		if [[ "$filter_coeff_id" == "" || "$filter_coeff_id" == "null" || "$filter_coeff_id" == "undefined" ]]
		then
			mapfile -t COEFFS < <("$minosse_bin_folder"mdsp-getcoefflist.sh)
			RETVAL="$(/usr/bin/jq '.filter_coeff_id = "'"${COEFFS[0]}"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
		fi
	fi
	
}

### Doesn't work if the output device is busy
if [[ $(/usr/local/bin/volumio status | /usr/bin/jq -r '.status') == "play" ]]; then /usr/local/bin/volumio stop > /dev/null 2>&1; fi
if (/bin/systemctl is-active --quiet mdsp-bf.service); then /bin/systemctl stop mdsp-bf.service > /dev/null 2>&1; fi

_out_sr_and_bit_depth

sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
in_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.in_bit_depth')

if [[ "$sampling_rate" != "" && "$in_bit_depth" != "null" ]]
then
	_check_input_sr
	_filter_partitions
	_apply_dither
	_max_delay
	_check_volume
	_check_coeffid
	"$minosse_bin_folder"mdsp-bf-wrapper0.sh
fi
