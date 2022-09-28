# Evo Sabre as a Volumio 3 Plugin.


This is the source code used to build a plugin handling the Evo Sabre hardware for Volumio3. 

The goal of this project is to provide a user-friendly way of installing all dependencies and scripts needed to use the Evo hardware in the Volumio3 environment.

As an alternative to custom distributions that requires a user to download a whole image, a plugin can be dynamically installed or removed on a Volumio3 release just from the user interface and without requiring any programming skill. 

Moreover this also alows most of hardware options to be accessible from the plugin options. 

## What this actually does : 
* It comes packaged with the latest version of our OLED#2 script which is installed as a service and driven from volumio plugin UI
* It installs and configure LIRC as to work with EVO SABRE Remote.


## What this does not do : 
* I could not add the option to easily import a custom logo for startup, this framework is not really designed for making a HTMLcanvas pop in the UI and do image analysis on the fly. I might add that later as a secondary utility. 
* Changing timezone (so the display will show the correct time without having to use SSH). This is a work in progress and will be available soon.

## Installation : 
This plugin has not been validated yet. So the only option until then is to follow the build from source section then do
```
volumio plugin install
```
This will not be necessary anymore when the plugin has been validated.

## (re)Build from source : 
If you need to rebuild this plugin from source just do the following (preferably on a fresh system) : 

* clone and enter this repo 

```
sudo bash app/build_me.sh 
npm install
volumio plugin package 
```

If you are not using this specific DAC board with Volumio3 running on a Raspberry Pi 4, you might be at the wrong place.


