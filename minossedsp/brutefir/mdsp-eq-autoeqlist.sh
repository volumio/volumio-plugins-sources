#!/bin/bash

AEURL1="https://github.com"
AEURL2="/jaakkopasanen/AutoEq/tree/master/results"
AEURL3=('oratory1990' 'crinacle' 'innerfidelity' 'rtings' 'headphonecom' 'referenceaudioanalyzer')

AUEQ=()
for rtype in "${AEURL3[@]}"
do
	RTMP=$(/usr/bin/curl -s "$AEURL1""$AEURL2" | /bin/grep '<li><a href="/jaakkopasanen/AutoEq/blob/master/results/' | /bin/grep -o -P '(?<=href=").*(?=">)' | /bin/grep '/'"$rtype"'/')
	mapfile -t VTMP <<<"$RTMP"
	AUEQ+=( "${VTMP[@]}" )
done

/usr/bin/printf "$AEURL1"'%s\n' "${AUEQ[@]}"
