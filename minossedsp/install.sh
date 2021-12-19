#!/bin/bash -e

### Load folder and file locations

MDSP_BF_CONF="/data/plugins/audio_interface/minossedsp/conf/mdsp-bf-conf.json.tmpl"
MDSP_BF_DIRS="/data/plugins/audio_interface/minossedsp/conf/mdsp-sys-dirs.sh"
#MDSP_BF_DIRS="/home/volumio/minossedsp/conf/mdsp-sys-dirs.sh"
. "$MDSP_BF_DIRS"

### Load required parameters
core_fifo=$(/bin/cat "$MDSP_BF_CONF" | /usr/bin/jq -r '.core_fifo')

VUSER="volumio"
VGROUP="volumio"

FILERSURL="https://github.com/KarlitoswayXYZ/minosse-filters/archive/refs/tags/v0.0.2.tar.gz"

ISUPDATE="true"

trap '_cleanup' EXIT
trap '_rollback' ERR

_cleanup() {
	
	set +e
	
	echo "========== Erasing installation files... =========="
	#sudo rm -r -f "$PWD"*
	sudo rm -r -f "$minosse_plugin_folder"bin
	sudo rm -r -f "$minosse_plugin_folder"brutefir
	sudo rm -r -f "$minosse_plugin_folder"conf
	sudo rm -r -f "$minosse_plugin_folder"img
	sudo rm -r -f "$minosse_plugin_folder"core
	sudo rm -r -f "$minosse_plugin_folder"debug
	#sudo rm -r -f "$minosse_plugin_folder"gui
	
	### Unwanted Git and Eclipse folders
	sudo rm -r -f "$minosse_plugin_folder"*git
	sudo rm -r -f "$minosse_plugin_folder"*project
	sudo rm -r -f "$minosse_plugin_folder"*settings
	
	if [ "$ISUPDATE" != "false" ]
	then
		#echo '============ Rebooting now... ============'
		#sudo shutdown -r now
		/bin/echo '{"event":"pushmsg","data":{"type":"warning","content":"UPDATE_REBOOT","extra":""}}' > "$core_fifo"
	fi

}

_rollback() {
	
	set +e
	
	echo "========== ERROR! Rolling back installation... =========="
	sudo "$minosse_plugin_folder"uninstall.sh

}

_deps_c() {
	
	# If you need to differentiate install for armhf and i386 you can get the variable like this
	#DPKG_ARCH=`dpkg --print-architecture`
	# Then use it to differentiate your install
	
	echo '============ Installing Minosse dependencies... ============'
	sudo apt-get -q update
	# Install the required packages via apt-get
	sudo apt-get -y -q install mc wget curl socat flex bison bc	\
	    make build-essential libfftw3-dev libjack-dev			\
		libglib2.0-bin libasound2-dev --no-install-recommends
	
}

_deps() {
	
	# If you need to differentiate install for armhf and i386 you can get the variable like this
	#DPKG_ARCH=`dpkg --print-architecture`
	# Then use it to differentiate your install
	
	echo '============ Installing Minosse dependencies... ============'
	sudo apt-get -q update
	# Install the required packages via apt-get
	sudo apt-get -y -q install mc wget curl socat bc brutefir libglib2.0-bin --no-install-recommends
	
}

_copy() {
	
	### Copy core commands
	sudo cp -f "$minosse_plugin_folder"brutefir/mdsp-*.sh "$minosse_bin_folder"
	sudo cp -f "$minosse_plugin_folder"core/mdsp-*.sh "$minosse_bin_folder"
	sudo cp -f "$minosse_plugin_folder"core/mdsp-*.js "$minosse_bin_folder"
	sudo cp -f "$minosse_plugin_folder"core/mdsp-*.pl "$minosse_bin_folder"
	sudo cp -f "$minosse_plugin_folder"debug/mdsp-*.sh "$minosse_bin_folder"
	#sudo cp -f "$minosse_plugin_folder"gui/mdsp-*.sh "$minosse_bin_folder"
	sudo chmod +x "$minosse_bin_folder"mdsp-* > /dev/null 2>&1
	
	### mdsp-bf.service as a system service
	sudo cp -f "$minosse_plugin_folder"brutefir/mdsp-*.service /etc/systemd/system/
	### mdsp-mpd.service as a system service
	sudo cp -f "$minosse_plugin_folder"core/mdsp-*.service /etc/systemd/system/
	
	### Copy configuration files
	#sudo rm -r -f "$minosse_data_folder"
	if [ ! -d "$minosse_data_folder" ]
	then
		sudo mkdir "$minosse_data_folder"
		sudo mkdir "$brutefir_fftw_wisdom_folder"
		ISUPDATE="false"
	fi
	sudo cp -r -f "$minosse_plugin_folder"img/ "$minosse_data_folder"
	sudo cp -f "$minosse_plugin_folder"conf/mdsp-* "$minosse_data_folder"
	#sudo cp -f "$minosse_plugin_folder"conf/mpd.service "$minosse_data_folder"
	sudo cp -f "$minosse_plugin_folder"conf/override.conf "$minosse_data_folder"
	#sudo chown -R "$VUSER":"$VGROUP" "$minosse_data_folder"
	sudo chown -R "$VUSER":"$VGROUP" "$minosse_data_folder" > /dev/null 2>&1
	
	### Create FIFO input file
	sudo rm -r -f "$brutefir_in_fifo_folder"
	sudo mkdir "$brutefir_in_fifo_folder"
	sudo mkfifo "$brutefir_in_fifo_folder"mdsp-mpd.fifo
	sudo chmod 777 "$brutefir_in_fifo_folder"mdsp-mpd.fifo
	#sudo chown -R "$VUSER":"$VGROUP" "$brutefir_in_fifo_folder"
	sudo chown -R "$VUSER":"$VGROUP" "$brutefir_in_fifo_folder"
	
}

_filters() {
	
	if [ ! -d "$minosse_data_folder"filters/ ]
	then
		echo "========== Downloading demo filters from GitHub/KarlitoswayXYZ... =========="
		#git clone -b master --single-branch https://github.com/KarlitoswayXYZ/minosse-filters.git "$minosse_data_folder"filters/
		git clone -b master --depth 1 --single-branch https://github.com/KarlitoswayXYZ/minosse-filters.git "$minosse_data_folder"filters/
		sudo rm -r -f "$minosse_data_folder"filters/.??*
		#sudo chown -R "$VUSER":"$VGROUP" "$minosse_data_folder"
		sudo chown -R "$VUSER":"$VGROUP" "$minosse_data_folder" > /dev/null 2>&1
	fi
}

_filters_tar() {
	
	if [ ! -d "$minosse_data_folder"filters/ ]
	then
		echo "========== Downloading demo filters from GitHub/KarlitoswayXYZ... =========="
		wget -P "$minosse_data_folder" "$FILERSURL"
		TARN=$(/usr/bin/basename "$FILERSURL")
		tar -xzf "$minosse_data_folder""$TARN" -C "$minosse_data_folder"
		rm -f "$minosse_data_folder""$TARN"
		mv "$minosse_data_folder"minosse-filters-* "$minosse_data_folder"filters
		sudo chown -R "$VUSER":"$VGROUP" "$minosse_data_folder" > /dev/null 2>&1
	fi
}

_brutefir() {
	
	echo "========== Installing Brutefir from source... =========="
	cd "$minosse_src_folder"
	
	# Download Brutefir source from author official site
	sudo wget https://torger.se/anders/files/brutefir-1.0o.tar.gz
	#sudo chown "$VUSER":"$VGROUP" brutefir-1.0o.tar.gz
	#sudo tar -xvzf brutefir-1.0o.tar.gz
	sudo tar -xzf brutefir-1.0o.tar.gz
	sudo rm -f brutefir-1.0o.tar.gz
	
	# Download Brutefir source from Debian Buster repo
	#sudo wget http://deb.debian.org/debian/pool/main/b/brutefir/brutefir_1.0o.orig.tar.gz
	#sudo tar -xvzf brutefir_1.0o.orig.tar.gz
	#sudo rm -f brutefir_1.0o.orig.tar.gz
	
	#sudo chown -R "$VUSER":"$VGROUP" brutefir-1.0o
	sudo chown -R "$VUSER":"$VGROUP" "$brutefir_folder" > /dev/null 2>&1
	
	### Patch mdsp-bf.patch created as follows (some manual editing needed, though):
	### git log
	### git diff 2685c656e95acd95d2fdf65302fe490111837636 f4aa5799d4d509e1f4a8efde874d57894b6f4fe6 > mdsp-bf.patch
	#cp -f "$PREVDIR"mdsp-bf.patch "$BFSRCFOLDER"brutefir-1.0o
	#cd brutefir-1.0o
	#git apply mdsp-bf.patch
	
	cp -f "$minosse_plugin_folder"conf/*.patch "$brutefir_folder"
	
	cd "$brutefir_folder"
	patch -u bfconf.c -i bfconf.patch
	#patch -u bfio_file.c -i bfio_file.patch
	make clean
	
	#make CFLAGS="-march=native -mtune=native -v" install	# Debug only
	#make -s CFLAGS="-march=native -mtune=native" install		# Production
	
	#make CFLAGS="-march=native -mtune=native -v"	# Debug only
	make -s CFLAGS="-march=native -mtune=native"		# Production
}

_fftw() {
	
#	DPKG_ARCH=`dpkg --print-architecture`
#	if [ "$DPKG_ARCH" = "amd64" ]
#	then
#		# x86-64 architecture
#		sudo "$minosse_bin_folder"mdsp-fftw-install.sh
#	fi
	
	ISSSE2=$(/usr/bin/lscpu | /bin/grep "Flags:" | /bin/grep -i "sse2")
	if [ "$ISSSE2" != "" ]
	then
		### SSE2 detected, recompile FFTW library
		sudo "$minosse_bin_folder"mdsp-fftw-install.sh
	fi
}

#_deps_c
_deps
_copy
#_filters
_filters_tar
#_brutefir
#_fftw

echo "================================ Installation finished ================================="

#requred to end the plugin install
echo "plugininstallend"
