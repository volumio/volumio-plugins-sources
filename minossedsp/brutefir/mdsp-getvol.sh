#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"

### Load required parameters
out_volume=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.out_volume')

#if [[ $(/bin/systemctl is-active mdsp-bf.service) == "active" ]]
if (/bin/systemctl is-active --quiet mdsp-bf.service)
then
	
	### RETLF example:
	#	> Filters:
	#	  0: "left"
	#	      coeff set: 0
	#	      delay blocks: 0 (0 samples)
	#	      from inputs:  0/0.0 
	#	      to outputs:   0/27.0 
	#	      from filters: 
	#	      to filters:   
	#	  1: "right"
	#	      coeff set: 1
	#	      delay blocks: 0 (0 samples)
	#	      from inputs:  1/0.0 
	#	      to outputs:   1/27.0 
	#	      from filters: 
	#	      to filters:   
	#	
	#	>
	RETLF=$(mdsp-bf-cmd.sh "lf")
	/bin/echo "$RETLF" | /bin/grep "to outputs:" | /bin/grep -o -P '(?<=0/).*(?=$)'

else
	/bin/echo "$out_volume"
fi
