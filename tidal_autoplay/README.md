# Tidal Autoplay

### Manual installation

```
sudo apt update
sudo apt install unzip -y
curl -sL $(curl -s https://api.github.com/repos/fernfrost/volumio-plugins-sources/releases/latest | grep browser_download_url | cut -d\" -f4) -o plugin.zip
unzip plugin.zip
rm plugin.zip
volumio plugin install
```

### Manual update

```
curl -sL $(curl -s https://api.github.com/repos/fernfrost/volumio-plugins-sources/releases/latest | grep browser_download_url | cut -d\" -f4) -o plugin.zip
unzip -o plugin.zip
rm plugin.zip
volumio plugin refresh
volumio vrestart
```
