## LMS installation update script
## !/bin/bash
echo ""
echo "Check LMS update status... "
echo ""

cd /home/volumio/Blissanalyser || exit

## create update file (possibly to be touched to latest version )

rm -f LMS*.txt

wget -q -r -np -nd https://dl.rexnvs.com/dl/update/ -P /home/volumio/Blissanalyser/ -A *.txt

## find logitechmedia server version installed
VAR="$(grep -R "Logitech Version 8" /usr/share/squeezeboxserver/ | cut -c75- | head -1)"
echo "Installed version is $VAR"

## recover logitechmedia server possible update (locally for the moment)
VAR2="$(find LMS* | head -1)"
VAR3=${VAR2:12:5}
echo "Latest version is $VAR3"
echo ""


if [ ! "$VAR" = "$VAR3" ];
	then

	echo "LMS will be updated to version $VAR3"
	echo ""

      if [ ! -d "/home/volumio/logitechmediaserver" ]; then
        mkdir /home/volumio/logitechmediaserver
        else
        sudo rm -r "/home/volumio/logitechmediaserver"
        mkdir /home/volumio/logitechmediaserver
      fi

      cd /home/volumio/logitechmediaserver || exit

      wget -q https://downloads.slimdevices.com/LogitechMediaServer_v"$VAR3"/logitechmediaserver_"$VAR3"_all.deb

      if [ -f "logitechmediaserver_"$VAR3"_all.deb" ]; then
        echo ""
        echo "Download finished..."
        echo ""
        echo "Installing downloaded package"
        echo "Password is volumio"
        echo ""
        sudo dpkg --force-depends --install logitechmediaserver_"$VAR3"_all.deb
        echo ""
        echo "Update process finished"
        echo "Cleaning"
        sudo rm -r "/home/volumio/logitechmediaserver"

        if [ ! -d "/home/volumio/logitechmediaserver" ]; then
            echo "Cleaning successfull"
            else
            echo "Cleaning went wrong"
        fi

        else
        echo "There was a problem downloading update package"
        echo "process aborted, sorry for inconvenience"
        exit
      fi

  else
	echo "Already in last version $VAR3..."
	echo "Nothing to do..."
	exit
fi