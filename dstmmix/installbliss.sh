## Bliss installation script


		# check and create DIR
		if [ ! -d /home/volumio/Blissanalyser ];
		then
			mkdir /home/volumio/Blissanalyser
		fi

		# Download Script
		chmod 755 -R /home/volumio/Blissanalyser/

		cd /home/volumio/Blissanalyser/
		
		arch=$(uname -m)
		if [[ $arch == *86* ]]; then
		    echo "X64 Architecture"
		wget -O bliss-analyser https://dl.rexnvs.com/dl/bliss-analyser%20x86     
				    
		elif  [[ $arch == arm* ]]; then
		    echo "ARM Architecture"
		wget -O bliss-analyser https://dl.rexnvs.com/dl/bliss-analyser%20primo%20ARMf71    
		fi  
		
		
		wget -O LICENCEBliss https://dl.rexnvs.com/dl/LICENSE


		# Download ini file based on music location
		if [ `find /media -type f | wc -l` -eq 0 ] ;
		then
			wget -O config.ini https://dl.rexnvs.com/dl/config.ini
			echo "media on NAS"
		else
			wget -O config.ini https://dl.rexnvs.com/dl/configusb.ini
			echo "media on USB"
		fi


    	# Download upload html static file
		 wget -O dbb.html https://dl.rexnvs.com/dl/dbb.html


		# Fix rights issue for preference, cache and log directory, needs execute right for prefs
		chmod 755 -R /home/volumio/Blissanalyser/bliss-analyser

		# create a web shell for bliss analyse
		shellinaboxd -t -b -p 10000 --no-beep -s '/bliss_shell/:volumio:volumio:/:/home/volumio/Blissanalyser/bliss-analyser analyse -c /home/volumio/Blissanalyser/config.ini'

		# create a web shell for bliss upload
		shellinaboxd -t -b -p 10001 --no-beep -s '/bliss_shell/:volumio:volumio:/:/home/volumio/Blissanalyser/bliss-analyser upload -c /home/volumio/Blissanalyser/config.ini'
