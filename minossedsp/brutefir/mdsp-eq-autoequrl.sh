#!/bin/bash

IDSTR="MinosseDSP::mdsp-eq-autoequrl.sh: "

### Change URL from...
#	https://github.com/jaakkopasanen/AutoEq/blob/master/results/oratory1990/harman_over-ear_2018/Stax%20SR-L700
### to...
#	https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results/oratory1990/harman_over-ear_2018/Stax%20SR-L700/Stax%20SR-L700%20FixedBandEQ.txt

TMPFILE="/tmp/mdsp-eq-download.txt"
STRTXT="%20FixedBandEQ.txt"

OHOST="https://github.com"
NHOST="https://raw.githubusercontent.com"

PURL1=$(/bin/echo "$1" | /bin/sed 's#https://github.com#https://raw.githubusercontent.com#g')
#/bin/echo "$IDSTR""$PURL1"

PURL2=$(/bin/echo "$PURL1" | /bin/sed 's#/blob/#/#g')
#/bin/echo "$IDSTR""$PURL2"

PURL3=$(basename "$PURL2")
#/bin/echo "$IDSTR""$PURL3"

PURL4="$PURL2""/""$PURL3""$STRTXT"
#/bin/echo "$IDSTR""$PURL4"

PURL5=$(/bin/echo "$PURL4" | /bin/sed 's#\&amp;#\&#g')
/bin/echo "$IDSTR""$PURL5"

/usr/bin/curl -s -g "$PURL5" > "$TMPFILE"
