## LMS installation update script
## !/bin/bash

echo "Updating LMS and its dependencies..."

cd /home/volumio/Blissanalyser
touch logitechmediaserver_8.3.1.txt
## wget https://downloads.slimdevices.com/LogitechMediaServer_v8.3.1/logitechmediaserver_8.3.1_all.deb
echo "Download finished..."

## /etc/init.d/logitechmediaserver stop

VAR="$(grep -R "Logitech Version 8" /usr/share/squeezeboxserver/ | cut -c75- | head -1)"
echo "$VAR"
VAR2="$(find logitechmediaserver* | head -1)"
VAR3=${VAR2:20:5}
echo "$VAR3"


if [ ! $VAR = $VAR3 ];
	then
	mkdir /home/volumio/logitechmediaserver
	wget https://downloads.slimdevices.com/LogitechMediaServer_v8.3.1/logitechmediaserver_8.3.1_all.deb
	echo "Download finished..."
	# Install package and dependencies
	echo "Installing downloaded package"
	dpkg --force-depends --install logitechmediaserver_8.3.1_all.deb
else
	echo "Already in last version..."
fi