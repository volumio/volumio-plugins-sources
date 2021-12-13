#!/bin/bash

TMPFILE="/tmp/mdsp-eq-download.txt"

### Input file example:
#	Preamp: -8.1 dB
#	Filter 1: ON PK Fc 31 Hz Gain -0.6 dB Q 1.41
#	Filter 2: ON PK Fc 62 Hz Gain -4.4 dB Q 1.41
#	Filter 3: ON PK Fc 125 Hz Gain -6.9 dB Q 1.41
#	Filter 4: ON PK Fc 250 Hz Gain -7.2 dB Q 1.41
#	Filter 5: ON PK Fc 500 Hz Gain -0.1 dB Q 1.41
#	Filter 6: ON PK Fc 1000 Hz Gain 2.8 dB Q 1.41
#	Filter 7: ON PK Fc 2000 Hz Gain -1.2 dB Q 1.41
#	Filter 8: ON PK Fc 4000 Hz Gain 0.5 dB Q 1.41
#	Filter 9: ON PK Fc 8000 Hz Gain 7.5 dB Q 1.41
#	Filter 10: ON PK Fc 16000 Hz Gain 6.8 dB Q 1.41

EQSTR=''
while IFS= read -r line
do
	VTMP=$(/bin/echo "$line" | /bin/grep -o -P '(?<=ON PK Fc ).*(?= Hz)')
	if [[ "$VTMP" != "" ]]
	then
		EQSTR+=","$(/bin/echo "$line" | /bin/grep -o -P '(?<=Gain ).*(?= dB)')
	fi
done < "$TMPFILE"

/bin/echo "${EQSTR/,/}"
