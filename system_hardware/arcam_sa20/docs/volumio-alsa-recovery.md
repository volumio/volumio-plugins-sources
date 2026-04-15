# Volumio ALSA Recovery Notes

## Symptom

Volumio playback failed with an error like:

```text
Failed to open "alsa" (alsa); Failed to open ALSA device "volumio"
```

In the UI this appeared as:

```text
Failed to open "alsa" (alsa); Failed to open ALSA device "volumio": No such file or directory
```

and later:

```text
Failed to open "alsa" (alsa); Failed to open ALSA device "volumio": Permission denied
```

## What Was Not Broken

- The Raspberry Pi ALSA stack still detected the real hardware devices.
- `aplay -l` still showed the HiFiBerry card.
- This SA20 plugin did not remove or replace the ALSA driver.

## Root Cause

Volumio's MPD configuration outputs to the ALSA PCM named `volumio`:

```text
/etc/mpd.conf -> device "volumio"
```

That alias resolves through `/etc/asound.conf` and depends on Volumio's multiroom switch files under:

```text
/tmp/multiroom/server/
```

Two failures were present:

1. The runtime files `switch.target` and `switch.fifo` were missing, so the `volumio` PCM could not be opened at all.
2. After restoring them, the FIFO permissions were still wrong for `mpd`, so MPD hit `Permission denied`.

This is consistent with a Volumio runtime / bootstrapping issue around the volatile `/tmp/multiroom` state, not with a missing driver.

## Recovery Applied On The RPi

The following state was restored:

- `/tmp/multiroom/server/switch.target` set to `volumioLocalPlayback`
- `/tmp/multiroom/server/switch.fifo` recreated
- ownership / permissions adjusted so `mpd` can use the FIFO through the `audio` group

Persistent recovery files installed on the RPi:

- `/usr/local/bin/volumio-multiroom-init.sh`
- `/etc/systemd/system/volumio-multiroom-init.service`

The service ensures the multiroom switch files exist with usable permissions after boot.

## Useful Checks

Verify the hardware still exists:

```bash
aplay -l
```

Verify the Volumio PCM alias chain:

```bash
grep -n 'device' /etc/mpd.conf
sed -n '1,240p' /etc/asound.conf
```

Verify the runtime switch files:

```bash
ls -la /tmp/multiroom/server
cat /tmp/multiroom/server/switch.target
```

Quick functional test:

```bash
aplay -D volumio -d 1 /usr/share/sounds/alsa/Front_Center.wav
```

## Practical Conclusion

If this error comes back, inspect Volumio's `/tmp/multiroom` state first. The failing component is the `volumio` PCM runtime chain, not the ARCAM SA20 control plugin.
