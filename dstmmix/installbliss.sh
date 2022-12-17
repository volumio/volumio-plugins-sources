## Bliss installation script


		# check and create DIR
		if [ ! -d /home/volumio/Blissanalyser ];
		then
			mkdir /home/volumio/Blissanalyser
		fi
		
		# Dowload Script
		chmod 755 -R /home/volumio/Blissanalyser/
		
		cd /home/volumio/Blissanalyser/
		wget -O bliss-analyser https://dl.rexnvs.com/dl/bliss-analyser%20primo%20ARMf71
		wget -O LICENCEBliss https://dl.rexnvs.com/dl/LICENSE
	
				
				
		if [ `find /media -type f | wc -l` -eq 0 ] ;
		then
			wget -O config.ini https://dl.rexnvs.com/dl/config.ini
			echo "media on NAS"
		else
			wget -O config.ini https://dl.rexnvs.com/dl/configusb.ini
			echo "media on usb"		
		fi
		
	
		# Fix rights issue for preference, cache and log directory, needs execute right for prefs
		chmod 755 -R /home/volumio/Blissanalyser/bliss-analyser
		
		# create a web shell for bliss analyse
		shellinaboxd -t -b -p 10000 --no-beep -s '/bliss_shell/:volumio:volumio:/:/home/volumio/Blissanalyser/bliss-analyser analyse -c /home/volumio/Blissanalyser/config.ini'
		
		# create a web shell for bliss upload
		shellinaboxd -t -b -p 10001 --no-beep -s '/bliss_shell/:volumio:volumio:/:/home/volumio/Blissanalyser/bliss-analyser upload -c /home/volumio/Blissanalyser/config.ini'
		