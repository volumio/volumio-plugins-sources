# Tidal Autoplay

### Manual installation

```
sudo apt update
sudo apt install unzip -y
curl -sL $(curl -s https://api.github.com/repos/fernfrost/volumio-plugin-tidal-autoplay/releases/latest | grep browser_download_url | cut -d\" -f4) -o plugin.zip
unzip -o plugin.zip
rm plugin.zip
volumio plugin install
```

### Manual update

```
./update.sh
```

or

```
curl -sL $(curl -s https://api.github.com/repos/fernfrost/volumio-plugin-tidal-autoplay/releases/latest | grep browser_download_url | cut -d\" -f4) -o plugin.zip
unzip -o plugin.zip
rm plugin.zip
volumio plugin refresh
volumio vrestart
```
