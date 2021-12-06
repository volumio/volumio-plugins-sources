#!/bin/bash

TEST1=$(/bin/cat "/lib/systemd/system/mpd.service" | /bin/grep "/usr/local/etc/minossedsp/mpd.conf")

#if [[ "$TEST1" != "" ]] && [[ -f "/usr/local/etc/minossedsp/mpd.conf" ]]
if [[ -f "/etc/systemd/system/mpd.service.d/override.conf" ]] && [[ -f "/usr/local/etc/minossedsp/mpd.conf" ]]
then
	TEST2=$(/bin/cat "/usr/local/etc/minossedsp/mpd.conf" | /bin/grep "minossedsp-sox")
	TEST3=$(/bin/cat "/usr/local/etc/minossedsp/mpd.conf" | /bin/grep "minossedsp-nosox")
	if [[ "$TEST2" != "" ]] && [[ "$TEST3" != "" ]]
	then
		/bin/echo "true"
		exit 0
	fi
fi
/bin/echo "false"
