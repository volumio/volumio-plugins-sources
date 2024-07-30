## LMS uninstallation script
echo "Uninstalling Smartqueue and its dependencies..."
INSTALLING="/home/volumio/Smartqueue.uninstalling"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING

	apt-get -f autoremove shellinabox -y --purge

	rm -rf /home/volumio/blissify

	# apt-get -f clang libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libsqlite3-dev -y --purge
	
 	rm $INSTALLING

# 	#required to end the plugin uninstall
 	echo "pluginuninstallend"
 else
 	echo "Plugin is already uninstalling! Not continuing..."
 fi