#!/bin/bash

echo "Installing crossfader switch Dependencies"
## sudo apt-get update
# Install the required packages via apt-get
## sudo apt-get -y install


cd /volumio/app/plugins/music_service/mpd/

if grep -q "crossfade" mpd.conf.tmpl ; then
    echo "mpd.conf.tmpl already modified"
    
else
	sed /'${special_settings}/a crossfade "5" \n mixramp_analyzer "yes"' mpd.conf.tmpl > temp && mv temp mpd.conf.tmpl
    echo "mpd.conf.tmpl properly modified."
    echo "mpd service will restart."
    sudo service mpd restart
    echo "MPD service has restarted."
fi


# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

#required to end the plugin install
echo "plugininstallend"
