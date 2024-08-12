## Bliss installation script

echo "launching shell..."

/usr/bin/pkill /shellinaboxd*

# create a web shell for LMS update attempt
shellinaboxd -t -b -p 10002 --no-beep -s '/install/:volumio:volumio:/:/bin/bash /data/plugins/user_interface/smartqueue/unit/installbliss.sh'
shellinaboxd -t -b -p 10003 --no-beep -s '/update/:volumio:volumio:/:/bin/bash /data/plugins/user_interface/smartqueue/unit/updatebliss.sh'


echo "Launching shell finished..."
