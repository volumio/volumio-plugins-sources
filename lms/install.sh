## LMS installation script
echo "Installing LMS and its dependencies..."
INSTALLING="/home/volumio/lms-plugin.installing"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING
	arch=$(arch)
	echo "Detected architecture: " $arch

	if [ ! -f /usr/sbin/squeezeboxserver ] || [ $1 =  "force" ];
	then
		apt-get update

		# Download latest version of LMS
		echo "Downloading installation package..."
		if [ ! -d /home/volumio/logitechmediaserver ];
		then
			mkdir /home/volumio/logitechmediaserver
		else
			rm -rf /home/volumio/logitechmediaserver/*.*
		fi
		
		LATEST="https://downloads.slimdevices.com/releases/latest.xml"
		LATEST_LOCATION="/home/volumio/logitechmediaserver/latest.xml"

		wget -O $LATEST_LOCATION $LATEST

		if [ $arch = "armv6l" ] || [ $arch = "armv7l" ] || [ $arch = "armv8l" ]
		then
			FILE="$(cat $LATEST_LOCATION | grep debarm | awk -F 'url="|" version' '$0=$2')"
			wget -O /home/volumio/logitechmediaserver/logitechmediaserver_arm.deb $FILE
		elif [ $arch = "i686" ] || [ $arch = "x86_64" ]; then
			FILE="$(cat $LATEST_LOCATION | grep debamd64 | awk -F 'url="|" version' '$0=$2')"
			wget -O /home/volumio/logitechmediaserver/logitechmediaserver_amd64.deb $FILE
		else
			echo "Incompatible architecture. Installation cannot continue."
			rm -rf /home/volumio/logitechmediaserver
			rm $INSTALLING
			exit 1
		fi

		# Move the binary to the expected directory
		if [ -f /etc/squeezeboxserver ];
		then
			mv /etc/squeezeboxserver /usr/sbin/squeezeboxserver
		fi
		# Install package and dependencies
		echo "Installing downloaded package"
		for f in /home/volumio/logitechmediaserver/logitechmediaserver*.deb; do dpkg -i "$f"; done
		# Needed for SSL connections; e.g. github
		apt-get install libio-socket-ssl-perl lame unzip -y
		# Will fix any missing dependencies which is very likely
		apt-get -f install -y
		# These directories still use the old name; probably legacy code
		echo "Fixing directory rights"
		mkdir /var/lib/squeezeboxserver
		chown -R volumio:volumio /var/lib/squeezeboxserver
		# Add the squeezeboxserver user to the audio group
		usermod -aG audio squeezeboxserver
		# Add the systemd unit
		echo "Using the prepared systemd unit"
		rm -rf /etc/systemd/system/logitechmediaserver.service
		ln -fs /data/plugins/music_service/lms/unit/logitechmediaserver.service /etc/systemd/system/logitechmediaserver.service
		# Stop service and fix rights for preference folder
		service logitechmediaserver stop
		# Fix rights issue for preference, cache and log directory, needs execute right for prefs
		chmod 744 -R /var/lib/squeezeboxserver
		# Tidy up
		rm -rf /home/volumio/logitechmediaserver
		# Reload the systemd unit
		systemctl daemon-reload

		sleep 3
	else
		echo "A technical error occurred, the plugin already exists, but installation was able to continue. If you just want to install LMS again, try the force parameter: [sh script.sh force]."
	fi

	rm $INSTALLING
	#required to end the plugin install
	echo "plugininstallend"
else
	echo "Plugin is already installing! Not continuing..."
fi
