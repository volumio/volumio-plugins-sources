## LMS uninstallation script
echo "Uninstalling LMS and its dependencies..."
INSTALLING="/home/volumio/lms-plugin.uninstalling"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING

	# Uninstall LMS and cleaning up
	dpkg -P squeezeboxserver
	dpkg -P logitechmediaserver
	unlink /etc/systemd/system/logitechmediaserver.service
	
	# Not uninstalling dependencies, because they might be used by other plugins.

	rm $INSTALLING

	#required to end the plugin uninstall
	echo "pluginuninstallend"
else
	echo "Plugin is already uninstalling! Not continuing..."
fi
