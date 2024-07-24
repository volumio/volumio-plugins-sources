## Blissify updating script
## !/bin/bash

echo ""
echo "Launch Bliss update... "
echo ""

#pgrep shellinaboxd | xargs /bin/kill -9
/usr/bin/pgrep blissify | xargs -r /bin/kill -15
echo "blissify restarted"

# Chemin vers le fichier song.db
DB_PATH="/home/volumio/.local/share/bliss-rs/songs.db"

# Vérifier la présence du fichier song.db

if [ -f "$DB_PATH" ]; then
    echo "song.db found, updating blissify..."
    # Lancer la commande de mise à jour si le fichier existe
    #/usr/bin/cpulimit -l 80 -- /home/volumio/.cargo/bin/blissify update
     /usr/bin/nice -15 /home/volumio/.cargo/bin/blissify update --number-cores 2
else
    echo "song.db not found, initializing blissify..."
    # Lancer la commande d'initialisation si le fichier n'existe pas
     /usr/bin/nice -15 /home/volumio/.cargo/bin/blissify init --number-cores 2 /mnt
fi