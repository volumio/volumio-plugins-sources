# ARCAM SA20 Volumio Plugin

This plugin runs inside Volumio and controls an ARCAM SA20 over its documented TCP interface, normally on port `50000`.

Implemented behavior:
- Persistent TCP session to the amplifier for responsive control
- Automatic SA20 discovery on the local network
- Manual source, power, mute and balance control from the plugin UI
- DAC filter selection from the plugin UI
- Volumio main volume control mapped to the SA20
- Automatic status polling via the SA20 system-status command with diff-based updates
- Optional Play automation:
  - power on the SA20
  - wait a configurable delay
  - switch to a configured playback source
  - set a configured startup volume
- Optional idle auto-standby and playback-stop handling if the amplifier becomes unavailable

Operational notes:
- The plugin does not install or manage ALSA drivers on the Raspberry Pi.
- Volume override is enabled only while the plugin is running and is restored on plugin stop.
- The plugin now clears all delayed startup retries on `onStop()`, so it does not keep reapplying its effects after shutdown.

Connection notes:
- Default ARCAM TCP control port is `50000`.
- Discovery tries port `50000` first and then the configured port if it differs.

Repository:
- [GitHub: MKlee333/Volumio-Amp-Plugin-SA20](https://github.com/MKlee333/Volumio-Amp-Plugin-SA20)

Additional documentation:
- `docs/volumio-alsa-recovery.md`
