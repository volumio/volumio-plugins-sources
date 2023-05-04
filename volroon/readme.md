
# volroon

volroon is a plugin for Volumio 3 that allows you to use the Roon Bridge software provided by Roon and display the track metadata in Volumio.

## THE LATEST V1.0.4 REQUIRES YOU TO REAUTHORIZE IN ROON!!!

I gave up on trying to get my plugin to work without authorization in the Roon Extensions panel in settings. This means that if you were using a previous version you will have to reauthorize in order to get it to work again.

What is working so far: Album Art, Full track metadata, player controls and seek. With multiple cores in use, the correct one does seem to be picked based on the way I've done it. I haven't thought of every permutation so you might find some different behaviour.

Trying to push the updated seek from Roon every second to Volumio just causes timing problems (so I don't do it). If anyone on Volumio dev side can point me in the right direction that would be great.

## Acknowledgements

This plugin was inspired and started out based entirely on Christopher Rieke's [RoonBridge plugin](https://github.com/crieke/volumio-plugins-sources), which is also a plugin for Volumio 3, but lacks any interfacing at all with Volumio.
