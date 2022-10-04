
# Roonumio

Roonumio is a plugin for Volumio 3 that allows you to use the Roon Bridge software provided by Roon and display the track metadata in Volumio.

## THIS PROJECT IS WORK-IN-PROGRESS
This plugin is completely work-in-progress and will likely cause problems with your Volumio installation. There is still a lot to be done before it even reaches the testing phase.

I have chosen to use the Roon core_found and core_lost properties instead of the core_paired and core_unpaired. This is mostly because during testing at my home I had my Roon Server running and Roon on my laptop. They would both show up as cores and neither would be paired. 

I have also chosen to mimic the Roon extension Display_Zone to avoid having to manually authorize the implementation in Roon. I want minimum-fuss plug and play. If anyone can think of a better way to do this then I'm all ears.

This methods in the plugin are messy! I will refactor when I work out the kinks. Of which there are many.

What is working so far: Album Art, Full track metadata, player controls and seek (although the seek doesn't really sync very well to volumio.) If you are running multiple cores it is very likely the incorrect one will be picked first. This means that album art may default to the volumio logo. If you close the remaining cores and leave just one alive then it should wake up the interface eventually. I have tried to mitigate this but my brain is a bit fried so I may have missed a lot.

Trying to push the updated seek from Roon every second to Volumio just causes timing problems. If anyone on Volumio dev side can point me in the right direction that would be great.

## Acknowledgements

This plugin was inspired and started out based entirely on Christopher Rieke's [RoonBridge plugin](https://github.com/crieke/volumio-plugins-sources), which is also a plugin for Volumio 3, but lacks any interfacing at all with Volumio.
