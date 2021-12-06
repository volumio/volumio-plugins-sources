#!/bin/bash

BINDIR="/usr/local/bin/"
ETCDIR="/data/INTERNAL/minossedsp/"
FIFODIR="/usr/local/etc/minossedsp/"
BFSRCDIR="/usr/local/src/"

#mdsp-logo.sh

# Uninstall dependendencies
# apt-get remove -y

_fftw() {
	
#	DPKG_ARCH=`dpkg --print-architecture`
#	if [ "$DPKG_ARCH" = "amd64" ]
#	then
#		# x86-64 architecture
#		sudo "$minosse_bin_folder"mdsp-fftw-uninstall.sh
#	fi
	
	ISSSE2=$(/usr/bin/lscpu | /bin/grep "Flags:" | /bin/grep -i "sse2")
	if [ "$ISSSE2" != "" ]
	then
		### SSE2 detected
		sudo "$minosse_bin_folder"mdsp-fftw-uninstall.sh
	fi
}

_do_uninstall() {
	
	sudo rm -v -r -f "$BFSRCDIR"brutefir-1.0o
	#sudo rm -v -f "$BFSRCDIR"brutefir-1.0o.tar.gz
	
	sudo rm -v -f /etc/systemd/system/mdsp-*.service
	sudo rm -v -f "/lib/systemd/system/mpd.service.bak"
	sudo rm -v -r -f "$BINDIR"mdsp-*
	sudo rm -v -r -f "$FIFODIR"
	sudo rm -v -r -f "$ETCDIR"
}

#echo ""
#echo "You are about to uninstall Minosse plugin."
#read -p "Please, confirm: (y/n)?" choice
#case "$choice" in
#  y|Y ) _do_uninstall;;
#  n|N ) echo "Operation aborted.";;
#  * ) echo "Invalid answer, operation aborted.";;
#esac

### Give Minosse onStop function time to clean up the system
sleep 3

#_fftw
_do_uninstall

echo "Done"
echo "pluginuninstallend"

#echo '============ Rebooting now... ============'
#sudo shutdown -r now
