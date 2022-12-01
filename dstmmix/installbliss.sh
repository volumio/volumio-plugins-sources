## Bliss installation script

echo "Downloading installation package..."

		# check and create DIR
		if [ ! -d /home/volumio/Blissanalyser ];
		then
			mkdir /home/volumio/Blissanalyser
		else
			rm -rf /home/volumio/Blissanalyser/*.*
		fi
		
		# Dowload Script
		chmod 755 -R /home/volumio/Blissanalyser/
		
		cd /home/volumio/Blissanalyser/
		wget -O bliss-analyser https://dl.rexnvs.com/dl/bliss-analyser%20primo%20ARMf71
		wget -O LICENCEBliss https://dl.rexnvs.com/dl/LICENSE
		wget https://dl.rexnvs.com/dl/config.ini
		
		# Install shellinabox
#		sudo apt-get -f install shellinabox -y
		
	
		# Fix rights issue for preference, cache and log directory, needs execute right for prefs
		chmod 755 -R /home/volumio/Blissanalyser/bliss-analyser
		
		# Launch web shell for bliss
		shellinaboxd -t -b -p 10000 --no-beep -s '/bliss_shell/:volumio:volumio:/:/home/volumio/Blissanalyser/bliss-analyser analyse -c /home/volumio/Blissanalyser/config.ini'
		
		
echo "Downloading finished..."