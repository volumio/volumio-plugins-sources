#!/bin/bash -e

VUSER="volumio"
VGROUP="volumio"

INSTDIR="/tmp/minosse/"
BINDIR="/usr/local/bin/"
NODEDIR="/data/plugins/audio_interface/minosse/"

_deps() {
	
	# If you need to differentiate install for armhf and i386 you can get the variable like this
	#DPKG_ARCH=`dpkg --print-architecture`
	# Then use it to differentiate your install
	
	echo 'MinosseDSP::update.sh: ============ Installing Minosse dependencies... ============'
	/usr/bin/sudo apt-get update
	# Install the required packages via apt-get
	/usr/bin/sudo apt-get -y install mc wget curl socat flex bison bc	\
	    make build-essential libssl-dev zlib1g-dev libbz2-dev	\
		libreadline-dev libsqlite3-dev libfftw3-dev libjack-dev	\
		libasound2-dev --no-install-recommends
		
	#npm install compare-versions
}

_copy() {
	
	echo 'MinosseDSP::update.sh: ============ Copying files... ============'
	
	### Copy core commands
	/usr/bin/sudo cp -f "$INSTDIR"bin/mdsp-*.sh "$BINDIR"
	/usr/bin/sudo cp -f "$INSTDIR"bin/mdsp-*.js "$BINDIR"
	
	### mdsp-bf.service as a system service
	/usr/bin/sudo cp -f "$INSTDIR"bin/mdsp-*.service /etc/systemd/system/
	#/usr/bin/sudo systemctl enable mdsp-bf.service
	#/usr/bin/sudo systemctl enable mdsp-mpd.service
	
	### Copy Node files
	/usr/bin/sudo cp -f "$INSTDIR"/i18n/*.* "$NODEDIR"/i18n/
	/usr/bin/sudo cp -f "$INSTDIR"/*.* "$NODEDIR"
	/usr/bin/sudo chown -R "$VUSER":"$VGROUP" "$NODEDIR"
	
	### Unwanted Git and Eclipse folders
	sudo rm -r -f "$NODEDIR"*git
	sudo rm -r -f "$NODEDIR"*project
	sudo rm -r -f "$NODEDIR"*settings
	
}

#_deps
_copy

/bin/sleep 3
