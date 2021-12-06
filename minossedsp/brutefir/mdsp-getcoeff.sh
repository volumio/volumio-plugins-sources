#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"

### Load required parameters
filter_coeff_id=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.filter_coeff_id')
#eq_enabled=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.eq_enabled')

#if [[ "$eq_enabled" != "true" ]]
#then
	/bin/echo "$filter_coeff_id"
#fi
