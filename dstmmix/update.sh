## LMS installation update script
## !/bin/bash

echo "Check LMS update status... "

cd /home/volumio/Blissanalyser

## create update file (possibly to be touched to latest version )
rm -f logitech*.txt
echo >> logitechmediaserver_8.3.1.txt

## find logitechmedia server version installed

VAR="$(grep -R "Logitech Version 8" /usr/share/squeezeboxserver/ | cut -c75- | head -1)"
echo "Installed version is $VAR"

## recover logitechmedia server possible update (locally for the moment)
VAR2="$(find logitechmediaserver* | head -1)"
VAR3=${VAR2:20:5}
echo "Latest version is $VAR3"


if [ ! $VAR = $VAR3 ];
	then
	echo "LMS will be updated to version $VAR3"
	mkdir /home/volumio/logitechmediaserver
	wget https://downloads.slimdevices.com/LogitechMediaServer_v8.3.1/logitechmediaserver_8.3.1_all.deb
	echo "Download finished..."
	# Install package and dependencies
	echo "Installing downloaded package"
	dpkg --force-depends --install logitechmediaserver_8.3.1_all.deb
else
	echo "Already in last version $VAR3..."
	echo "Nothing to do..."
fi