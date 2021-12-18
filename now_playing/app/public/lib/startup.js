import * as Components from './components.js';
import { State } from './state.js';
import { BrowseMusicScreen } from './screens/browse-music.js';
import { NowPlayingScreen } from './screens/np.js';
import { QueueScreen } from './screens/queue.js';
import { ScreenManager } from './screen-manager.js';
import { refresh } from './util.js';
import { registry } from './registry.js';

export function init(data) {
  registry.app = Object.assign({}, data.app);
  registry.socket = getSocket();
  registry.i18n = data.i18n || {};
  if (data.ui) {
    registry.state = State.init();
    registry.ui = {};
    registry.ui.background = Components.Background.init(data.ui.background);
    registry.ui.actionPanel = Components.ActionPanel.init(data.ui.actionPanel);
    registry.ui.volumeIndicatorOverlay = Components.VolumeIndicatorPanel.init(data.ui.volumeIndicatorOverlay);
    registry.ui.disconnectIndicator = Components.DisconnectIndicator.init(data.ui.disconnectIndicator);
    registry.ui.trackBar = Components.TrackBar.init(data.ui.trackBar);
    registry.ui.volumePanel = Components.VolumePanel.init(data.ui.volumePanel);
  }
  if (data.screens) {
    registry.screens = {};
    registry.screens.browseMusic = BrowseMusicScreen.init(data.screens.browseMusic);
    registry.screens.nowPlaying = NowPlayingScreen.init(data.screens.nowPlaying);
    registry.screens.queue = QueueScreen.init(data.screens.queue);

    $(window).on('resize', () => {
      // Resize active screen that has the trackbar showing
      let trackBar = $(registry.ui.trackBar.el);
      if (trackBar.is(':visible')) {
        let screen = $('#screen-wrapper .screen.active');
        let trackBarHeight = trackBar.css('height');
        screen.css('height', `calc(100% - ${ trackBarHeight }`);
      }
    });
  }
  registry.screens.manager = ScreenManager.init();
  registry.ui.snackbar = Components.snackbar;
}

let _socket;
function getSocket() {
  if (!_socket) {
    _socket = io.connect(registry.app.host, { autoConnect: false });

    _socket.on("nowPlayingPluginInfo", (info) => {
      if (`${info.appPort}` !== registry.app.port) {
        let href = window.location.href.replace(
          `:${ registry.app.port }`,
          `:${ info.appPort }`
        );
        window.location.href = href;
      } else if (info.pluginVersion !== registry.app.version) {
        refresh();
      }
    });

    _socket.on('connect', () => {
      _socket.emit('getBrowseSources');
      _socket.emit('getState');
      _socket.emit('getQueue');
    });

    _socket.on('reconnect', () => {
      _socket.emit('getBrowseSources');
      _socket.emit('getState');
      _socket.emit('getQueue');
    });

    _socket.on("reconnect", () => {
      _socket.emit("callMethod", {
        endpoint: "user_interface/now_playing",
        method: "broadcastPluginInfo",
      });
    });

    _socket.on("nowPlayingRefresh", () => {
      refresh();
    });
  }

  return _socket;
}
