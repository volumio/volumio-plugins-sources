#!/bin/bash
echo "Installing SnapClient and dependencies..."
INSTALLING="/home/volumio/snapclient-plugin.installing"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING
	# Echo version number, for bug tracking purposes
	echo "## Installing SnapClient plugin v0.0.1 ##"
	
	echo "Detecting CPU architecture and Debian version"
	ARCH=$(dpkg --print-architecture)
	DEBIAN_VERSION=$(cat /etc/os-release | grep '^VERSION=' | cut -d '(' -f2 | tr -d ')"')
	SNAPCONF=NO
	echo "CPU architecture: " $ARCH
	echo "Debian version: " $DEBIAN_VERSION

	# Download latest SnapCast client package
	mkdir /home/volumio/snapclient

	if [ $ARCH = "armhf" ] ; then
		if [ $DEBIAN_VERSION = "jessie" ]; then
			echo "Defaulting to known working version of SnapCast components (0.15.0-armhf)"
			cp -f /data/plugins/audio_interface/snapclient/binaries/snapclient_0.15.0_armhf.deb /home/volumio/snapclient
		else
			echo "Fetching latest releases of SnapCast components..."
			wget $(curl -s https://api.github.com/repos/badaix/snapcast/releases/latest | grep 'armhf' | grep 'client' | cut -d\" -f4) -P /home/volumio/snapclient
			SNAPCONF="YES"
		fi
	elif [ $ARCH = "i386" ] || [ $ARCH = "i486" ] || [ $ARCH = "i586" ] || [ $ARCH = "i686" ] || [ $ARCH = "i786" ]; then
		if [ $DEBIAN_VERSION = "jessie" ]; then
			echo "Defaulting to known working version of SnapCast components (0.15.0-amd64)"
			cp -f /data/plugins/audio_interface/snapclient/binaries/snapclient_0.15.0_amd64.deb /home/volumio/snapclient
		else
			echo "Fetching latest releases of SnapCast components..."
			wget $(curl -s https://api.github.com/repos/badaix/snapcast/releases/latest | grep 'amd64' | grep 'client' | cut -d\" -f4) -P /home/volumio/snapclient
		fi
	else 
		echo "This architecture is not yet supported, you must build the snap*-packages yourself. Detected architecture: " $ARCH
	fi

	# Backup old snap* installations
	mv /usr/sbin/snapclient /usr/sbin/snapclient.bak

	# Install packages (client) and dependencies
	for f in /home/volumio/snapclient/snap*.deb; do dpkg -i "$f"; done
	apt-get update && apt-get -f -y install
	
	# Link to administrative tools
	ln -fs /usr/bin/snapclient /usr/sbin/snapclient
	
	# Remove files and replace them with symlinks
	rm /etc/default/snapclient
	ln -fs /data/plugins/audio_interface/snapclient/default/snapclient /etc/default/snapclient
	# if($SNAPCONF === "YES"); then
		# echo "Not using new config template, reverting to default"
		# rm /etc/snapclient.conf
		# ln -fs /data/plugins/audio_interface/snapclient/templates/snapclient.conf /etc/snapclient.conf
		# sed -i -- "s|^SNAPCLIENT_OPTS.*||g" /etc/default/snapclient
	# fi
	
	# Cleanup files
	rm -rf /home/volumio/snapclient
	rm $INSTALLING
	
	#required to end the plugin install
	echo "plugininstallend"

else
	echo "Plugin is already installing! Not continuing, check the log files for any errors during installation."
fi