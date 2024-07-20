## Blissify installation script
## !/bin/bash

echo ""
echo "Install Blissify-rs on your machine... "
echo ""

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

. "$HOME/.cargo/env"

cargo install blissify


echo ""
echo "Blissify-rs installed "
echo ""