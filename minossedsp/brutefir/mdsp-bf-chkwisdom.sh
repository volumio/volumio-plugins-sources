#!/bin/bash

IDSTR="MinosseDSP::mdsp-bf-chkwisdom.sh: "

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"
MDSP_BF_DIRS="/data/INTERNAL/minossedsp/mdsp-sys-dirs.sh"

### Load required parameters
sampling_rate=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.sampling_rate')
in_bit_depth=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.in_bit_depth')
#core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')
gui_msg_file=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.gui_msg_file')

### Load folder and file locations
. "$MDSP_BF_DIRS"

FFTWISD="$brutefir_fftw_wisdom_folder"'mdsp-convolver_'"$sampling_rate"'_'"$in_bit_depth"

if [[ ! -f "$FFTWISD" ]]
then
	### This message has to bypass the core loop because it would be postponed for too long
	#/bin/echo '{"event":"pushmsg","data":{"type":"info","content":"FFTW_WISDOM_CREATE","extra":""}}' > "$core_fifo"
	/bin/echo '{"type":"info","content":"FFTW_WISDOM_CREATE","extra":""}' > "$gui_msg_file"
	/bin/systemctl start mdsp-bf.service > /dev/null 2>&1
	/bin/sleep 4.8
	/bin/systemctl stop mdsp-bf.service > /dev/null 2>&1
fi
