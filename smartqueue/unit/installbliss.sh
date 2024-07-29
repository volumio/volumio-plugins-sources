#!/bin/bash

echo ""
echo "Install Blissify on your machine..."
echo ""

# Définir les URLs des binaires pour chaque architecture
BINARIES_URLS=(
    "https://rubadubmix.go.yn.fr/volumio/blissify-x86_64"   # URL pour x86_64
    "https://rubadubmix.go.yn.fr/volumio/blissify-armv7l"   # URL pour armv7l
    "https://rubadubmix.go.yn.fr/volumio/blissify-aarch64"  # URL pour aarch64
)

# Déterminer l'architecture de la machine
ARCH=$(uname -m)

# Télécharger le binaire correspondant
case "$ARCH" in
    x86_64)
        URL=${BINARIES_URLS[0]}
        ;;
    armv7l)
        URL=${BINARIES_URLS[1]}
        ;;
    aarch64)
        URL=${BINARIES_URLS[2]}
        ;;
    *)
        echo "Architecture $ARCH non supportée."
        exit 1
        ;;
esac


# Download latest version of Blissify
		echo "Downloading installation package..."
		if [ ! -d /home/volumio/blissify ];
		then
			mkdir /home/volumio/blissify
		else
			rm -rf /home/volumio/blissify/*.*
		fi

cd /home/volumio/blissify

echo "Téléchargement du binaire pour l'architecture $ARCH..."
curl -L -o blissify "$URL"

# Rendre le binaire exécutable
chmod +x blissify

echo ""
echo "Blissify installé et prêt à l'emploi."
echo ""
