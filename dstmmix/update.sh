## LMS installation update script
## !/bin/bash
echo ""
echo "Check LMS update status... "
echo ""

if [ ! -d "/home/volumio/Blissanalyser" ]; then
mkdir /home/volumio/Blissanalyser
fi

cd /home/volumio/Blissanalyser || exit

## create update file (possibly to be touched to latest version )
chmod 755 -R /home/volumio/Blissanalyser/
rm -f LMS*.txt

wget -q -r -np -nd https://dl.rexnvs.com/dl/update/ -P /home/volumio/Blissanalyser/ -A *.txt


##cd /home/volumio/logitechmediaserver/

LATEST="https://lyrion.org/lms-server-repository/latest.xml"
LATEST_LOCATION="/home/volumio/logitechmediaserver/latest.xml"

echo "Downloading installation package..."
	if [ ! -d /home/volumio/logitechmediaserver ];
	then
		mkdir /home/volumio/logitechmediaserver
	else
		rm -rf /home/volumio/logitechmediaserver/*.*
fi

wget -O $LATEST_LOCATION $LATEST

if [ -f $LATEST_LOCATION ]; then
echo "Latest.xml downloaded successfully"
else
echo "Failed to download Latest.xml"
exit 1
fi

## find logitechmedia server version installed
VAR="$(grep -R "Logitech Version 8" /usr/share/squeezeboxserver/ | cut -c75- | head -1)"
echo "Installed version is $VAR"

## find logitechmedia server version available
VERSION="$(cat $LATEST_LOCATION | grep -oP 'version="\K[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
echo "Latest version is $VERSION"
echo ""


if [ ! "$VAR" = "$VERSION" ];
	then

	echo "LMS will be updated to version $VERSION from version $VAR"
	echo ""

      cd /home/volumio/logitechmediaserver || exit

		apt-get install libxml2-utils


		FILE="$(xmllint --xpath "//deb/@url" $LATEST_LOCATION | awk -F'"' '{print $2}')"
		echo "FILE: $FILE"
		wget -O /home/volumio/logitechmediaserver/logitechmediaserver.deb $FILE
				
		# Move the binary to the expected directory
		if [ -f /etc/squeezeboxserver ];
		then
			mv /etc/squeezeboxserver /usr/sbin/squeezeboxserver
		fi
		# Install package and dependencies
		apt-get -f install -y
		echo "Installing downloaded package"
		echo volumio | sudo -S dpkg --force-depends -i /home/volumio/logitechmediaserver/logitechmediaserver.deb
		

		# Needed for SSL connections; e.g. github
		apt --fix-broken install

  else
	echo "Already in last version $VAR3..."
	echo "Nothing to do..."
	exit
fi