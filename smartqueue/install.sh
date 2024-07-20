##  installation script
echo "Installing Smartqueue and its dependencies..."
INSTALLING="/home/volumio/Smartqueue.installing"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING
	arch=$(arch)
	echo "Detected architecture: " $arch

		apt-get update

		echo "Installing ShellInAbox..."
		apt-get install -f shellinabox -y

		#echo "Installing php-server..."
		#apt-get install -f php -y

		# Needed for blissify
		apt --fix-broken install
		apt install -f clang libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libsqlite3-dev -y
		apt install -f python-pip -y
		pip install requests
		apt-get -f install -y
		apt --fix-broken install

		mkdir -p /data/configuration/user_interface/smartqueue
		cp /data/plugins/user_interface/smartqueue/config.json /data/configuration/user_interface/smartqueue/config.json
		chown volumio:volumio /data/configuration/user_interface/smartqueue/config.json
		chmod 755 /data/configuration/user_interface/smartqueue/config.json

		sleep 1

	rm $INSTALLING
 #required to end the plugin install
	echo "plugininstallend"
else
	echo "Plugin is already installing! Not continuing..."
fi