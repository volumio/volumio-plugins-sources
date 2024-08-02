## Blissify updating script
## !/bin/bash

echo ""
echo "Launch Bliss update... "
echo ""


/usr/bin/pgrep blissify | xargs -r /bin/kill -15
echo "blissify restarted"

DB_PATH="/home/volumio/.local/share/bliss-rs/songs.db"


if [ -f "$DB_PATH" ]; then
    echo "song.db found, updating blissify..."
     /usr/bin/nice -15 /home/volumio/blissify/blissify update --number-cores 2
else
    echo "song.db not found, initializing blissify..."
     /usr/bin/nice -15 /home/volumio/blissify/blissify init --number-cores 2 /mnt
fi