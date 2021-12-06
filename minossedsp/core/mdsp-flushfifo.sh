#!/bin/bash

/bin/cat -n <>"$1" &
PCAT=$!
/bin/sleep 0.2
/bin/kill "$PCAT"
/bin/sleep 0.2
