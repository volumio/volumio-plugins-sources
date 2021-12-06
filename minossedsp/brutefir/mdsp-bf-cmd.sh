#!/bin/bash

MDSP_BF_CONF="/tmp/mdsp-bf-conf.json"

### Load required parameters
bf_client_connection=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.bf_client_connection')

#/bin/echo "$1" | /usr/bin/sudo /usr/bin/socat - UNIX-CONNECT:"$bf_client_connection"
/bin/echo "$1" | /usr/bin/socat - UNIX-CONNECT:"$bf_client_connection"
