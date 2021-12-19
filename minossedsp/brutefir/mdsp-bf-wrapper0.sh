#!/bin/bash

### Brutefir wrapper level 0 (innermost) #############################
#		No decisions are made at this level (only basic calculation),
#		just take data from "$MDSP_BF_CONF" and "$MDSP_BF_DIRS" files
#		and create Brutefir configuration file. If any data are missing
#		or wrong, exit with an error code. Fixed data are already
#		hardcoded in the templates.

IDSTR="MinosseDSP::mdsp-bf-wrapper0.sh: "

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

bf_client_connection=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.bf_client_connection')
audio_type=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.audio_type')
float_bits=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.float_bits')
out_device=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_device')
out_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_bit_depth')
out_volume=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_volume')
filter_coeff_id=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_id')
filter_coeff_extension=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_extension')
filter_coeff_format=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_format')
apply_dither=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.apply_dither')
filter_partitions=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_partitions')
sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
in_fifo="$brutefir_in_fifo_folder"$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.in_fifo')
in_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.in_bit_depth')
max_delay=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.max_delay')
delay_file_name=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.delay_file_name')
eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')
eq_bands=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_bands')
eq_magnitude=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_magnitude')
eq_phase=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_phase')

### Load folder and file locations
. "$MDSP_BF_DIRS"

CIDSEP='-'

if [[ "$eq_enabled" == "true" ]]
then
	audio_type="2.0"
	FILTER_SIZE=131072
else
	
	DIRFILTERS="$coefficient_folder""$audio_type""/"
	
	### Create an array of subfolders (channels) based on "$audio_type"
	### Convert mdsp-getchanlist.sh to an array
	mapfile -t DIRFIL < <("$minosse_bin_folder"mdsp-getchanlist.sh)
	
	### Create an array of coefficient names extracted from file names (using the first subfolder in DIRFIL)
	### Convert mdsp-getcoefflist.sh to an array
	mapfile -t COEFFS < <("$minosse_bin_folder"mdsp-getcoefflist.sh)
	
	COEFF_FILE="$DIRFILTERS""${DIRFIL[0]}""/""$filter_coeff_id""$CIDSEP""$sampling_rate""$filter_coeff_extension"
	#/bin/echo "$COEFF_FILE"
	if [ ! -f "$COEFF_FILE" ]
	then
		/bin/echo "$IDSTR"'ERROR - coefficient file '"$COEFF_FILE"' not found'
		exit 1
	fi
	
	FILTER_DIV=0
	if [ "$filter_coeff_format" == 'FLOAT32_LE' ]
	then
		FILTER_DIV=4
	elif [ "$filter_coeff_format" == 'FLOAT64_LE' ]
	then
		FILTER_DIV=8
	else
		/bin/echo "$IDSTR"'ERROR - only FLOAT32_LE and FLOAT64_LE coefficient formats are supported, got '"$filter_coeff_format"' instead'
		exit 1
	fi
	
	FILTER_SIZE=$(($(wc -c <"$COEFF_FILE")/$FILTER_DIV))

fi

PARTITION_SIZE=$(($FILTER_SIZE/$filter_partitions))

GENERAL_TEMPLATE='

 ##################################################
 #                                                #
 #   This file was generated automatically. Do    #
 #  not edit because your changes will be lost!   #
 #                                                #
 ##################################################

sampling_rate: '"$sampling_rate"';
filter_length: '"$PARTITION_SIZE"','"$filter_partitions"';
overflow_warnings: false;
show_progress: false;
float_bits: '"$float_bits"';
powersave: false;
max_dither_table_size: 0;
allow_poll_mode: true;
modules_path: ".";
monitor_rate: false;
lock_memory: true;
# sdf_length: -1;
convolver_config: "'"$brutefir_fftw_wisdom_folder"'mdsp-convolver_'"$sampling_rate"'_'"$in_bit_depth"'";
'

### Copy the general template to the target configuration file
/bin/echo "$GENERAL_TEMPLATE" > "$brutefir_conf_file"

INPUT_TEMPLATE='
input "left_in", "right_in" {
	#device: "alsa" {device: "hw:Loopback,1";};
	device: "file" {path: "'"$in_fifo"'";};
	sample: "'"$in_bit_depth"'";
	channels: 2;
	delay: 0,0;
};
'

### Copy the input template to the target configuration file
/bin/echo "$INPUT_TEMPLATE" >> "$brutefir_conf_file"

if [[ "$audio_type" == "2.0" ]]
then
	OUTPUT_STRING='"left_out","right_out"'
	NCH="2"
elif [[ "$audio_type" == "2.1" ]]
then
	OUTPUT_STRING='"left_out","right_out","sub_1_out","sub_2_out"'
	NCH="4"
elif [[ "$audio_type" == "4.0" ]]
then
	OUTPUT_STRING='"left-bass_out","right-bass_out","left-treble_out","right-treble_out"'
	NCH="4"
elif [[ "$audio_type" == "4.1" ]]
then
	OUTPUT_STRING='"left-bass_out","right-bass_out","left-treble_out","right-treble_out","sub_1_out","sub_2_out"'
	NCH="6"
elif [[ "$audio_type" == "6.0" ]]
then
	OUTPUT_STRING='"left-midrange_out","right-midrange_out","left-treble_out","right-treble_out","left-bass_out","right-bass_out"'
	NCH="6"
elif [[ "$audio_type" == "6.1" ]]
then
	OUTPUT_STRING='"left-midrange_out","right-midrange_out","left-treble_out","right-treble_out","left-bass_out","right-bass_out","sub_1_out","sub_2_out"'
	NCH="8"
elif [[ "$audio_type" == "8.0" ]]
then
	OUTPUT_STRING='"left-midrange_out","right-midrange_out","left-midbass_out","right-midbass_out","left-treble_out","right-treble_out","left-bass_out","right-bass_out"'
	NCH="8"
fi

if [ "$eq_enabled" == "true" ]
then

	#//========== EQUALIZER IS ENABLED ==========
	
	EQ_MAGNITUDE=$("$minosse_bin_folder"mdsp-eq-strcmd.sh "$eq_magnitude")
	EQ_PHASE=$("$minosse_bin_folder"mdsp-eq-strcmd.sh "$eq_phase")
	
	EQ_TEMPLATE='
### Connect using "socat - UNIX-CLIENT:'"$bf_client_connection"'"
logic: "cli" { port: "'"$bf_client_connection"'";},

### connect using "telnet localhost 3002"
#logic: "cli" { port: 3002;},

"eq"  {
	debug_dump_filter: "/tmp/mdsp-eq10-rendered-%d";
	{
		coeff: "eq10";
		#coeff: 0, 1;
		#bands: "ISO octave";
		#bands: "ISO 1/3 octave";
		bands: '"$eq_bands"';
		#magnitude: 31.5/0.0,63/0.0,125/0.0,250/0.0,500/0.0,1000/0.0,2000/0.0,4000/0.0,8000/0.0,16000/0.0;
		magnitude: '"$EQ_MAGNITUDE"';
		#phase: 31.5/0.0,63/0.0,125/0.0,250/0.0,500/0.0,1000/0.0,2000/0.0,4000/0.0,8000/0.0,16000/0.0;
		phase: '"$EQ_PHASE"';
	};
};

coeff "eq10" {
	filename: "dirac pulse";
	shared_mem: true;
	blocks: 4;
};

filter "left" {
	from_inputs: "left_in";
	to_outputs: "left_out"/'"$out_volume"';
	coeff: "eq10";
	process: -1;
	#crossfade: true;
};

filter "right" {
	from_inputs: "right_in";
	to_outputs: "right_out"/'"$out_volume"';
	coeff: "eq10";
	process: -1;
	#crossfade: true;
};
'
	
	DELAY_STRING=$("$minosse_bin_folder"mdsp-eq-getdelay.sh)
	
	### Copy the equalizer template to the target configuration file
	/bin/echo "$EQ_TEMPLATE" >> "$brutefir_conf_file"
	
else
	
	#//========== DIGITAL ROOM CORRECTION IS ENABLED ==========
	
	PARAM_STRING=$(/bin/echo "$OUTPUT_STRING" | /bin/sed 's/_out//g' | /bin/sed 's/_1//g' | /bin/sed 's/_2//g' | /bin/sed 's/"//g')
	DELAY_STRING=$("$minosse_bin_folder"mdsp-makedelaystr.sh "$PARAM_STRING")
	
	CLI_TEMPLATE_DRC='
### Connect using "socat - UNIX-CLIENT:'"$bf_client_connection"'"
logic: "cli" { port: "'"$bf_client_connection"'";};

### connect using "telnet localhost 3002"
#logic: "cli" { port: 3002;};
'
	
	### Copy the cli template to the target configuration file
	/bin/echo "$CLI_TEMPLATE_DRC" >> "$brutefir_conf_file"
	
	COEFF_TEMPLATE='
coeff "${coeffname}" {
	filename: "${coeffile}";
	format: "'"$filter_coeff_format"'";
	attenuation: 0;
};
'
	
	### Add a coefficient section to the target configuration file for each coefficient name
	for ncoeffs in "${COEFFS[@]}"
	do
		for ndirs in "${DIRFIL[@]}"
		do
			BFNAME="$DIRFILTERS""$ndirs""/""$ncoeffs""$CIDSEP""$sampling_rate""$filter_coeff_extension"
			if [ ! -f "$BFNAME" ]
			then
				/bin/echo "$IDSTR"'ERROR - coefficient file '"$BFNAME"' not found'
				exit 1
			fi
			### Copy the coefficient template to the target configuration file
		    /bin/echo "$COEFF_TEMPLATE" >> "$brutefir_conf_file"
		    /bin/sed -i -e 's/${coeffname}/'"$ncoeffs""_""$ndirs"'/g' "$brutefir_conf_file"
			/bin/sed -i -e 's#${coeffile}#'"$BFNAME"'#g' "$brutefir_conf_file"
		done
	done
	
	FILTER_TEMPLATE='
filter "${filtname}" {
	from_inputs: ${inchannels};
	to_outputs: ${outchannels};
	coeff: "${coeffname}";
	process: -1;
	#crossfade: true;
};
'
	
	if [[ "$out_volume" == "" || "$out_volume" == "null" || $(echo "(0 <= "$out_volume") && ("$out_volume" <= 100)" | /usr/bin/bc -l) == "0" ]]
	then
		/bin/echo "$IDSTR"'ERROR - volume value '"$out_volume"' is out of range (0-100)'
		exit 1
	fi
	
	### Add a filter section to the target configuration file for each audio type subfolder
	#ccount=0
	for ndirs in "${DIRFIL[@]}"
	do
		### Copy the filter template to the target configuration file
		/bin/echo "$FILTER_TEMPLATE" >> "$brutefir_conf_file"
	    /bin/sed -i -e 's/${filtname}/'"$ndirs"'/g' "$brutefir_conf_file"
	    /bin/sed -i -e 's/${coeffname}/'"$filter_coeff_id""_""$ndirs"'/g' "$brutefir_conf_file"
	
		### Configure filter inputs
		if [[ $(/bin/echo "$ndirs" | /bin/grep "left") != "" ]]; then /bin/sed -i -e 's#${inchannels}#"left_in"#g' "$brutefir_conf_file"
		elif [[ $(/bin/echo "$ndirs" | /bin/grep "right") != "" ]]; then /bin/sed -i -e 's#${inchannels}#"right_in"#g' "$brutefir_conf_file"
		elif [[ $(/bin/echo "$ndirs" | /bin/grep "sub") != "" ]]; then /bin/sed -i -e 's#${inchannels}#"left_in"/0.0,"right_in"/0.0#g' "$brutefir_conf_file"
		fi
		
		### Configure filter outputs
		#/bin/sed -i -e 's/${outchannel}/'"$ndirs"'/g' "$brutefir_conf_file"
		if [[ $(/bin/echo "$ndirs" | /bin/grep -E "left|right") != "" ]]; then /bin/sed -i -e 's#${outchannels}#"'"$ndirs"'_out"/'"$out_volume"'#g' "$brutefir_conf_file"
		elif [[ $(/bin/echo "$ndirs" | /bin/grep "sub") != "" ]]; then /bin/sed -i -e 's#${outchannels}#"sub_1_out"/'"$out_volume"',"sub_2_out"/'"$out_volume"'#g' "$brutefir_conf_file"
		fi
		
	    #((ccount+=1))
	done
	
	#DELAY_STRING=$("$minosse_bin_folder"mdsp-makedelaystr.sh "$PARAM_STRING")
	
fi

OUTPUT_TEMPLATE='
output '"$OUTPUT_STRING"' {
	device: "alsa" {device: "'"$out_device"'"; ignore_xrun: true; };
	#device: "file" {path: "/dev/stdout";};
	#device: "alsa" {device: "hw:2"; ignore_xrun: true; };
	sample: "'"$out_bit_depth"'";
	channels: '"$NCH"';
	dither: '"$apply_dither"';
	maxdelay: '"$max_delay"';
	delay: '"$DELAY_STRING"';
};
'

### Copy the output template to the target configuration file
/bin/echo "$OUTPUT_TEMPLATE" >> "$brutefir_conf_file"

