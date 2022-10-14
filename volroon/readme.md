
# volroon

volroon is a plugin for Volumio 3 that allows you to use the Roon Bridge software provided by Roon and display the track metadata in Volumio.

## THIS PROJECT IS WORK-IN-PROGRESS
This plugin is completely work-in-progress and will likely cause problems with your Volumio installation. There is still a lot to be done before it even reaches the testing phase.

I have chosen to use the Roon core_found and core_lost properties instead of the core_paired and core_unpaired. This is mostly because during testing at my home I had my Roon Server running and Roon on my laptop. They would both show up as cores and neither would be paired. This is a by-product of the statement below.

I have also chosen to mimic the Roon extension Display_Zone to avoid having to manually authorize the implementation in Roon. I want minimum-fuss plug and play. If anyone can think of a better way to do this then I'm all ears.

This methods in the plugin are messy! I will refactor when I work out the kinks. Of which there are many.

What is working so far: Album Art, Full track metadata, player controls and seek (although the seek doesn't really sync very well to volumio.) With multiple cores in use, the correct one does seem to be picked based on the way I've done it. I haven't thought of every permutation so you might find some different behaviour.

Trying to push the updated seek from Roon every second to Volumio just causes timing problems (so I don't do it). If anyone on Volumio dev side can point me in the right direction that would be great.

I still need to bundle the node-roon-api. Npm install takes an absolute age! 15-20 minutes easy on my Pi4!

## Acknowledgements

This plugin was inspired and started out based entirely on Christopher Rieke's [RoonBridge plugin](https://github.com/crieke/volumio-plugins-sources), which is also a plugin for Volumio 3, but lacks any interfacing at all with Volumio.
