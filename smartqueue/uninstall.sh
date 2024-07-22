## LMS uninstallation script
echo "Uninstalling Smartqueue and its dependencies..."
INSTALLING="/home/volumio/Smartqueue.uninstalling"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING

	# Uninstall RUST and cleaning up

	rustup self uninstall -y

	apt-get -f autoremove shellinabox -y --purge

	apt-get -f clang libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libsqlite3-dev -y --purge
	
	
 	# Not uninstalling dependencies, because they might be used by other plugins.

 	rm $INSTALLING

# 	#required to end the plugin uninstall
 	echo "pluginuninstallend"
 else
 	echo "Plugin is already uninstalling! Not continuing..."
 fi