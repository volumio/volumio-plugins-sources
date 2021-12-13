#!/bin/bash

AUEQ=$(/usr/bin/curl -s https://github.com/jaakkopasanen/AutoEq/tree/master/results | grep '<li><a href="/jaakkopasanen/AutoEq/blob/master/results/')
HREFVEC=()
while IFS= read -r line
do
	VTMP=$(/bin/echo "$line" | /bin/grep -o -P '(?<=href=").*(?=">)')
	HREFVEC+=( "https://github.com""$VTMP" )
done <<< "$AUEQ"

#/usr/bin/printf '%s\n' "${HREFVEC[@]}" | /usr/bin/sort -u
/usr/bin/printf '%s\n' "${HREFVEC[@]}"
