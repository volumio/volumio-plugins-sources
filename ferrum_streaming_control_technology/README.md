# Ferrum Streaming Control Technology™ (FSCT) Volumio Plugin

The **Ferrum Streaming Control Technology (FSCT) Volumio Plugin** adds support for devices supporting FSCT (e.g. Ferrum Wandla) into Volumio system.
It uses [FSCT-host](https://github.com/HEM-RnD/fsct-host) node.js bindings.
This plugin provides current track title, artist and album, progress bar and playback status to connected DAC.

It requires Volumio version with FSCT capable DAC user access. If you are about to implement FSCT in your DAC please prepare proper udev rule and PR for it to Volumio OS.


---

## Installation
Please find this plugin in the official Volumio plugin store and click install.

You can also clone this repository into Volumio board, get into this directory and type `volumio plugin install`, but
this is not recommended method.

***Please remember to enable the plugin in Volumio UI.***


---

## Contributing

We welcome contributions to the FSCT Volumio Plugin! To contribute:
1. Fork the repository.
2. Create a dedicated branch for your changes (`feature/your-feature-name`).
3. Submit a pull request once your changes are tested.

--- 

## Troubleshooting

If you experience issues:
1. Verify that FSCT-host is running and accessible on your network.
2. Ensure the correct FSCT-host API settings are entered in the plugin configuration.
3. Check the Volumio logs for plugin-related errors:
   ```bash
   sudo journalctl -f | grep fsct
   ```

---

## License

This plugin is licensed under the [Apache License, Version 2.0](./LICENSE). You are free to use, modify, and distribute it in alignment with the license.

This software implements FSCT, which is subject to the Ferrum Streaming Control Technology™ License,
Version 1.0. Please refer to the [LICENSE-FSCT.md](./LICENSE-FSCT.md) for details.

