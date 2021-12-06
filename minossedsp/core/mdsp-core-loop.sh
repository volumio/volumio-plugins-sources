#!/bin/bash

IDSTR="MinosseDSP::mdsp-core-loop.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')
gui_msg_file=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.gui_msg_file')

### Load folder and file locations
. "$MDSP_BF_DIRS"

while [ true ]
do
    while read -r line
    do
		### $line examples:
		#	{"event":"play","data":"44100:16:2"}
		#	{"event":"pause","data":""}
		#	{"event":"pushmsg","data":{"type":"warning","content":"RECONFIGURING_AUDIO_NO_PCM","extra":""}}
		#	{"event":"mdsp-activate","data":"4.1"}
		#/bin/echo "$IDSTR""$line"
		
		STRVAL=$(/bin/echo "$line" | /bin/grep "'ActiveState': <'failed'>,")
		STRVAL2=$(/bin/echo "$line" | /bin/grep '"event":')
		if [[ "$STRVAL" != "" ]]
		then
			#enable_pushmsg=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.enable_pushmsg')
			#if [[ "$enable_pushmsg" == "true" ]]; then /bin/echo '{"type":"error","content":"BRUTEFIR_ERROR","extra":""}' > "$gui_msg_file"; fi
			ADATA=$("$minosse_bin_folder"mdsp-mpd-cmd.sh "status" | /bin/grep "audio:" | /bin/grep -o -P '(?<=audio: ).*(?=$)')
			"$minosse_bin_folder"mdsp-audiomonitor.sh "$ADATA"
		elif [[ "$STRVAL2" != "" ]]
		then
			
			LEVENT=$(/bin/echo "$line" | /usr/bin/jq -r '.event')
			#/bin/echo "$IDSTR""$LEVENT"
			LDATA=$(/bin/echo "$line" | /usr/bin/jq -r '.data')
			#/bin/echo "$IDSTR""$LDATA"
			
			case "$LEVENT" in
				"play")
					"$minosse_bin_folder"mdsp-audiomonitor.sh "$LDATA"
					/bin/echo "$IDSTR""$line"
				;;
				"stop")
					if (/bin/systemctl is-active --quiet mdsp-bf.service); then /bin/systemctl stop mdsp-bf.service > /dev/null 2>&1; fi
					/bin/echo "$IDSTR""$line"
				;;
				"pause")
					if (/bin/systemctl is-active --quiet mdsp-bf.service); then /bin/systemctl stop mdsp-bf.service > /dev/null 2>&1; fi
					/bin/echo "$IDSTR""$line"
				;;
				"pushmsg")
					enable_pushmsg=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.enable_pushmsg')
					if [[ "$enable_pushmsg" == "true" ]]; then /bin/echo "$LDATA" > "$gui_msg_file"; fi
					/bin/echo "$IDSTR""$line"
				;;
				"mdsp-activate")
					### Call this for plugin activation and also each time the sound device or the audio type (2.0, 2.1, 4.0, etc.) is changed
					"$minosse_bin_folder"mdsp-activate.sh "$LDATA"
					/bin/echo "$IDSTR""$line"
				;;
				"mdsp-deactivate")
					### Call this for plugin deactivation
					"$minosse_bin_folder"mdsp-deactivate.sh
					/bin/echo "$IDSTR""$line"
				;;
				"reconfigure-channels")
					RETVAL=$("$minosse_bin_folder"mdsp-chkchannels.sh "$LDATA")
					#/bin/echo "$IDSTR""$RETVAL"
					if [[ "$RETVAL" == "true" ]]
					then
						"$minosse_bin_folder"mdsp-activate.sh "$LDATA"
					fi
					/bin/echo "$IDSTR""$line"
				;;
				"start-mpdclient")
					/usr/bin/nice -n -20 "$minosse_bin_folder"mdsp-mpdclient.js &
					PCLIENT=$!
					RETVAL="$(/usr/bin/jq '.pid_mpdclient = "'"$PCLIENT"'"' "$MDSP_BF_CONF")" && echo "${RETVAL}" > "$MDSP_BF_CONF"
				;;
			esac
			
		fi
		
    done < "$core_fifo"
    /bin/sleep 0.6
done
