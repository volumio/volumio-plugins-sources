## Bliss installation script

echo "launching shell..."

if [ -e /home/volumio/Blissanalyser/config.ini ]
then

   # create a web shell for bliss analyse
		shellinaboxd -t -b -p 10000 --no-beep -s '/bliss_shell/:volumio:volumio:/:/home/volumio/Blissanalyser/bliss-analyser analyse -c /home/volumio/Blissanalyser/config.ini'

		# create a web shell for bliss upload
		shellinaboxd -t -b -p 10001 --no-beep -s '/bliss_shell/:volumio:volumio:/:/home/volumio/Blissanalyser/bliss-analyser upload -c /home/volumio/Blissanalyser/config.ini'

else
    echo "error"
fi

# lsof -n -i4TCP:8080 | grep LISTEN | tr -s ' ' | cut -f 2 -d ' ' | xargs kill -9

wait

# Launch PHPserver

if [ -e /home/volumio/Blissanalyser/php.ini ]
then
cd /home/volumio/Blissanalyser && php -S 0.0.0.0:10005 -c php.ini
else
    echo "error"
fi


# create a web shell for LMS update attempt
shellinaboxd -t -b -p 10002 --no-beep -s '/update/:volumio:volumio:/:/bin/bash /data/plugins/music_service/dstmmix/update.sh'


echo "Launching shell finished..."
