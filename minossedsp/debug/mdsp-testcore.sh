#!/bin/bash

### Load folder and file locations
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"
. "$MDSP_BF_DIRS"

### Test if the plugin is already active
TEST1=$("$minosse_bin_folder"mdsp-testactive.sh)
if [[ "$TEST1" == "true" ]]
then
	### The plugin is activated

	### Simply fire mdsp-core.service to boot the plugin, it will take care of the basics
	sudo systemctl start mdsp-core.service
	
	### Populate MDSP_BF_CONF with configuration data from your user interface
	MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
	RETVAL="$(/usr/bin/jq '.audio_type = "2.0"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	#RETVAL="$(/usr/bin/jq '.sampling_rate = "192000"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	#RETVAL="$(/usr/bin/jq '.filter_coeff_id = "Demo2-BASIN"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	#RETVAL="$(/usr/bin/jq '.in_bit_depth = "S16_LE"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	RETVAL="$(/usr/bin/jq '.float_bits = "64"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	RETVAL="$(/usr/bin/jq '.eq_enabled = "false"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
	# [...]
	
	### Initialize Brutefir
	"$minosse_bin_folder"mdsp-bf-wrapper1.sh
	
	### Ready to go!
	cat "$brutefir_conf_file"
	
	cat "$MDSP_BF_CONF"
	
	systemctl status mdsp-bf
	systemctl status mdsp-core

else
	### The plugin is not activated
	
	"$minosse_bin_folder"mdsp-activate.sh "2.0"
	echo "Plugin activated, please reboot before using it!"

fi