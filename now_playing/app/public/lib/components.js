import * as util from './util.js';
import { registry } from './registry.js';

export class Background {
  constructor(el) {
    this.el = el;
    this.currentSrc = null;
    // Non-webkit based browsers do not support 
    // CSS 'transition: background-image'. Use manual.
    this.useManualTransition = navigator.userAgent.indexOf('AppleWebKit') < 0;

    if (this.useManualTransition) {
      $(this.el).addClass('manual-transition');
    }
  }

  static init(el) {
    return new Background(el);
  }

  setImage(src) {
    if (this.currentSrc === src) {
      return;
    }
    this.currentSrc = src;
    let bgEl = $(this.el);
    if (this.useManualTransition && !bgEl.hasClass('fixed')) {
      this.updateByManualTransition();
    }
    else {
      util.setCSSVariable('--default-background-image', `url("${ src }")`, this);
    }
  }

  updateByManualTransition() {
    let self = this;
    let bgEl = $(self.el);
    let transitionBg = $('.transition-bg', bgEl);
    let transitioning = transitionBg.length > 0;

    if (!transitioning) {
      transitionBg = $('<div class="transition-bg"></div>');
      bgEl.append(transitionBg);
    }
    
    transitionBg.css('background-image', `url("${ self.currentSrc }")`);

    if (transitioning) {
      transitionBg.stop();
    }

    transitionBg.show('fade', 1000, () => {
      util.setCSSVariable('--default-background-image', `url("${ self.currentSrc }")`, self);
      transitionBg.remove();
    })
  }

}

export class ActionPanel {
  constructor(panel) {
    this.el = panel;
    this.slideVolumeTimer = null;
    this.slideVolumeValue = 0;

    const html = `
    <div class="volume">
      <span class="material-icons mute">volume_mute</span>
      <div class="volume-slider-wrapper">       
        <div class="volume-slider"></div>
      </div>
      <span class="material-icons max">volume_up</span>
    </div>
    <div class="actions-wrapper">
      <div class="screen-switcher">
        <div class="label-wrapper">
          <div class="label"><span class="material-icons">tv</span></div>
        </div>
        <div class="switches-wrapper">
          <div class="switch" data-screen="browseMusic"><span class="material-icons">library_music</span></div>
          <div class="switch" data-screen="nowPlaying"><span class="material-icons">art_track</span></div>
          <div class="switch" data-screen="queue"><span class="material-icons">queue_music</span></div>
        </div>
      </div>
      <div class="extra-switches-wrapper">
        <div class="action refresh"><span class="material-icons">refresh</span></div>
        <div class="action switch"><img src="/assets/volumio-icon.png" title=""></img></div>
      </div>
    </div>
    `;

    let self = this;
    let panelEl = $(this.el);

    panelEl.html(html);
    $('.action.refresh i', panelEl).attr('title', registry.i18n['REFRESH']);
    $('.action.switch img', panelEl).attr('title', registry.i18n['SWITCH_TO_VOLUMIO']);

    // Socket events
    registry.state.on('stateChanged', state => {
      self.updateVolumeSlider(state);
    });
    
    $(document).ready( () => {
      panelEl.dialog({
        classes: {
          "ui-dialog": "action-panel-container",
        },
        autoOpen: false,
        width: "80%",
        modal: true,
        resizable: false,
        draggable: false,
        position: {
          my: "center top",
          at: "center top",
        },
        show: {
          effect: "drop",
          direction: "up",
          duration: 100,
        },
        hide: {
          effect: "drop",
          direction: "up",
          duration: 100,
        },
        open: () => {
          // close popup when tapped outside
          $(".ui-widget-overlay").on("click", () => {
            self.hide();
          });
          // ...or swiped upwards
          $(".ui-widget-overlay").swipe({
            swipeUp: () => {
              self.hide();
            }
          });
        },
        beforeClose: () => {
          util.setScreenBlur(false);
        },
      });
  
      $('.volume-slider', panelEl).slider({
        orientation: 'horizontal',
        range: 'min',
        min: 0,
        max: 100,
        start: self.beginSlideVolume.bind(self),
        stop: self.endSlideVolume.bind(self),
        change: self.setVolume.bind(self),
        slide: self.slideVolume.bind(self)
      });
  
      $('.max', panelEl).on('click', () => {
        registry.socket.emit('volume', 100);
      });
  
      $('.mute', panelEl).on('click', function() {
        if ($(this).hasClass('active')) {
          registry.socket.emit('unmute');
        }
        else {
          registry.socket.emit('mute');
        }
      });
  
      $('.action.refresh', panelEl).on('click', function() {
        util.refresh();
      });
  
      $('.action.switch', panelEl).on('click', function() {
        self.switchToVolumioInterface();
      });

      $('.screen-switcher .switch', panelEl).on('click', function() {
        self.hide();
        let screen = $(this).data('screen');
        let screenOpts = {};
        if (screen === 'queue') {
          screenOpts.keepCurrentOpen = true;
          screenOpts.showEffect = 'slideUp';
        }
        registry.screens.manager.switch(registry.screens[screen], screenOpts);
      });

      registry.screens.manager.on('screenChanged', (current, previous) => {
        $('.screen-switcher .switch.active', panelEl).removeClass('active');
        $(`.screen-switcher .switch[data-screen="${ current.getScreenName() }"]`, panelEl).addClass('active');
      })
    });
  }

  static init(data) {
    return new ActionPanel(data);
  }

  show() {
    util.setScreenBlur(true);
    $(this.el).dialog("open");
  }

  hide() {
    if (this.isOpen()) {
      $(this.el).dialog("close");
    }
  }

  isOpen() {
    return $(this.el).dialog("isOpen");
  }

  switchToVolumioInterface() {
    window.location.href = '/volumio';
  }

  updateVolumeSlider(state) {
    let panelEl = $(this.el);
    let volumeSlider = $('.volume-slider', panelEl);
    if (!volumeSlider.data('sliding')) {
      volumeSlider.slider('option', 'value', state.volume);
    }
    if (state.disableVolumeControl) {
      $('.volume', panelEl).addClass('disabled');
    }
    else {
      $('.volume', panelEl).removeClass('disabled');
    }
    if (state.mute) {
      $('.mute', panelEl).addClass('active');
      $('.volume-slider', panelEl).addClass('muted');
    }
    else {
      $('.mute', panelEl).removeClass('active');
      $('.volume-slider', panelEl).removeClass('muted');
    }
  }

  setVolume(event, ui) {
    if (!event.originalEvent) { // No original event if programatically changed value
      return;
    }
    registry.socket.emit('volume', (ui.value));
  }
  
  slideVolume(event, ui) {
    this.slideVolumeValue = ui.value;
  }

  beginSlideVolume(event, ui) {
    if (this.slideVolumeTimer) {
      clearInterval(this.slideVolumeTimer);
    }
    this.slideVolumeValue = ui.value;
    this.slideVolumeTimer = setInterval(() => {
      registry.socket.emit('volume', this.slideVolumeValue);
    }, 300);
    let panelEl = $(this.el);
    $('.volume-slider', panelEl).data('sliding', true);
  }

  endSlideVolume(event, ui) {
    if (this.slideVolumeTimer) {
      clearInterval(this.slideVolumeTimer);
    }
    let panelEl = $(this.el);
    $('.volume-slider', panelEl).data('sliding', false);
  }
}

export class VolumeIndicator {

  constructor(options = {}) {
    this.oldVolume = null;
    
    let showDial = options.showDial !== undefined ? options.showDial : true;
    let dialHtml = showDial ? `
    <div class="circle-wrapper">
      <svg>
        <circle class="primary" cx="50%" cy="50%" r="3.5em"></circle>
        <circle class="highlight" cx="50%" cy="50%" r="3.5em" pathLength="100"></circle>
      </svg>
    </div>` : '';

    let id = VolumeIndicator.generateId();
    this.el = '#' + id;
    let html = `
      <div id="${ id }" class="volume-indicator${ !showDial ? ' no-dial' : ''}">
        ${ dialHtml }
        <div class="level-text"></div>
      </div>
    `;
    this.element = $(html);
    
    // Socket events
    registry.state.on('stateChanged', state => {
      this.update(state);
    });

    this.update(registry.state.get());
  }

  static create(options) {
    return new VolumeIndicator(options).getElement();
  }

  static generateId() {
    if (this.id == undefined) {
      this.id = 0;
    }
    else {
      this.id++;
    }

    return 'volume-indicator-' + this.id;
  }

  getElement() {
    return this.element;
  }

  update(state) {
    if (!state) {
      state = {
        volume: '0',
        mute: false
      }
    }
    let oldVolume = this.oldVolume;
    let volumeChanged = oldVolume ? (oldVolume.level !== state.volume || oldVolume.mute !== state.mute) : true;
    if (volumeChanged) {
      let volumeIndicator = this.getElement();
      util.setCSSVariable('--volume-level', state.volume + 'px', volumeIndicator);
      let levelText;
      if (state.mute) {
        levelText = `<span class="material-icons">volume_off</span>`;
        volumeIndicator.addClass('muted');
      }
      else {
        levelText = `<span class="material-icons">volume_up</span> ${ state.volume }%`;
        volumeIndicator.removeClass('muted');
      }
      $('.level-text', volumeIndicator).html(levelText);
      this.oldVolume = {
        level: state.volume,
        mute: state.mute
      };
    }
  }
}

export class VolumeIndicatorPanel {
  constructor(el, options = {}) {
    this.el = el;
    this.oldVolume = null;
    this.autohideTimer = null;
    this.autohide = options.autohide !== undefined ? options.autohide : true;
    this.enabled = true;

    let volumeIndicator = VolumeIndicator.create();
    let _el = $(this.el);
    _el.hide();
    _el.html('').append(volumeIndicator);
    
    let self = this;
    // Socket events
    registry.state.on('stateChanged', state => {
      self.update(state);
    });

    $(document).ready( () => {
      _el.on('click', function() {
        self.hide();
      });
    });
  }

  static init(el) {
    return new VolumeIndicatorPanel(el);
  }

  update(state) {
    if (!this.isEnabled() || registry.ui.actionPanel.isOpen() || registry.ui.volumePanel.isOpen()) {
      return;
    }
    let oldVolume = this.oldVolume;
    let volumeChanged = oldVolume ? (oldVolume.level !== state.volume || oldVolume.mute !== state.mute) : true;
    if (volumeChanged) {
      if (oldVolume) {
        this.show();
      }
      this.oldVolume = {
        level: state.volume,
        mute: state.mute
      };
    }
  }

  show() {
    let self = this;
    if (self.autohideTimer) {
      clearTimeout(self.autohideTimer);
      self.autohideTimer = null;
    }
    else {
      $(self.el).fadeIn(200);
    }
    if (self.autohide) {
      self.autohideTimer = setTimeout( () => {
        self.hide();
      }, 1500);
    }
  }

  hide(duration = 200) {
    if (this.autohideTimer) {
      clearTimeout(this.autohideTimer);
      this.autohideTimer = null;
    }
    $(this.el).fadeOut(duration);
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(value) {
    this.enabled = value ? true : false;
  }
}

export class DisconnectIndicator {
  constructor(el) {
    this.el = el;

    const html = `
    <i class="fa fa-spinner fa-spin"></i>
    `;

    $(this.el).html(html);

    let self = this;
    let socket = registry.socket;
    socket.on('connect', () => {
      self.hide();
    }); 

    socket.on('disconnect', () => {
      self.show();
    }); 
  }

  static init(el) {
    return new DisconnectIndicator(el);
  }

  show() {
    registry.ui.actionPanel.hide();
    $(this.el).addClass('active');
    util.trackTimer.stop();
  }

  hide() {
    $(this.el).removeClass('active');
  }
}

export class TrackBar {
  constructor(el) {
    this.el = el;
    this.albumartHandle = null;

    const html = `
    <div class="seekbar-wrapper noSwipe">
      <div class="seekbar"></div>
    </div>
    <div class="main">
      <div class="albumart"></div>
      <div class="track-info">
        <span class="title"></span>
        <span class="artist-album"></span>
        <div class="media-info"><img class="format-icon" /><span class="quality"></span></div>     
      </div>
      <div class="controls">
        <!--<button class="repeat"><i class="fa fa-repeat"></i></button>-->
        <button class="queue"><span class="material-icons">queue_music</span></button>
        <button class="previous"><span class="material-icons">skip_previous</span></button>
        <button class="play"><span class="material-icons">play</span></button>
        <button class="next"><span class="material-icons">skip_next</span></button>
        <button class="volume"><span class="material-icons">volume_up</span></button>
        <!--<button class="random"><i class="fa fa-random"></i></button>-->
      </div>
    </div>
    `;

    let trackBar = $(this.el);
    trackBar.html(html);

    util.trackTimer.attach(`${ this.el } .seekbar`);

    let self = this;
    let socket = registry.socket;
    registry.state.on('stateChanged', state => {
      if ( (state.title == undefined || state.title === '') &&
          (state.artist == undefined || state.artist === '') &&
          (state.album == undefined || state.album === '') ) {
        $('.track-info', trackBar).hide();
      }
      else {
        $('.track-info', trackBar).show();
      }

      self.refreshTrackInfo(state);
      self.refreshSeekbar(state);
      self.refreshControls(state);
    });

    $(document).ready( () => {
      $('.seekbar', trackBar).slider({
        orientation: 'horizontal',
        range: 'min',
        change: self.seekTo.bind(self),
        slide: self.seeking.bind(self)
      });

      $('.albumart, .title, .artist-album', trackBar).on('click', () => {
        registry.screens.manager.switch(registry.screens.nowPlaying);
      })

      let controls = $('.controls', trackBar);
  
/*      $('.repeat', controls).on('click', () => {
        let state = registry.state.get();
        if (state == null) {
          return;
        }
        let repeat = state.repeat ? (state.repeatSingle ? false : true) : true;
        let repeatSingle = repeat && state.repeat;
        socket.emit('setRepeat', { value: repeat, repeatSingle });
      });
  
      $('.random', controls).on('click', () => {
        let state = registry.state.get();
        if (state == null) {
          return;
        }
        socket.emit('setRandom', { value: !state.random });
      });*/

      $('.queue', controls).on('click', function() {
        if (!$(this).hasClass('active')) {
          registry.screens.manager.switch(registry.screens.queue, {
            showEffect: 'slideUp',
            keepCurrentOpen: true
          });
        }
        else {
          registry.screens.manager.closeCurrent();
        }
      });
  
      $('.previous', controls).on('click', () => {
        socket.emit('prev');
      });
  
      $('.play', controls).on('click', () => {
        socket.emit('toggle');
      });
  
      $('.next', controls).on('click', () => {
        socket.emit('next');
      });

      $('.volume', controls).on('click', function() {
        if (!registry.ui.volumePanel.isOpen()) {
          registry.ui.volumePanel.show();
        }
        else {
          registry.ui.volumePanel.hide();
        }
      })

      registry.screens.manager.on('screenChanged', (current, previous) => {
        if (current.getScreenName() === 'queue') {
          $('.queue', controls).addClass('active');
        }
        else {
          $('.queue', controls).removeClass('active');
        }
      })

      trackBar.swipe({
        swipeUp: () => {
          registry.screens.manager.switch(registry.screens.queue, {
            showEffect: 'slideUp',
            keepCurrentOpen: true
          });
        }
      })
    })
  }

  static init(el) {
    return new TrackBar(el);
  }

  refreshTrackInfo(state) {
    let trackBar = $(this.el);
    if (this.albumartHandle) {
      util.imageLoader.cancel(this.albumartHandle);
    }
    let albumartUrl = state.albumart;
    if (albumartUrl.startsWith('/')) {
      albumartUrl = registry.app.host + albumartUrl;
    }
    // load img into cache first to reduce flicker
    this.albumartHandle = util.imageLoader.load(albumartUrl, (src) => { 
      $('.albumart', trackBar).html(`<img src="${ src }"/>`);
    });

    let trackInfo = $('.track-info', trackBar);
    $('.title', trackInfo).html(state.title || '');

    let artistAlbum = state.artist || '';
    if (state.album) {
      artistAlbum += artistAlbum ? ' - ' : '';
      artistAlbum += state.album;
    }
    $('.artist-album', trackInfo).html(artistAlbum);

    let mediaInfo = $('.media-info', trackInfo);
    let mediaInfoText;
    if (state.trackType == 'webradio') {
      mediaInfoText = state.bitrate || '';
    }
    else {
      let mediaInfoValues = [];
      ['bitdepth', 'samplerate'].forEach( prop => {
        if (state[prop]) {
          mediaInfoValues.push(state[prop]);
        }
      });
      mediaInfoText = mediaInfoValues.join(' ');
    }
    $('.quality', mediaInfo).html(mediaInfoText);

    let mediaFormatIcon = util.getMediaFormatIcon(state.trackType);
    if (mediaFormatIcon) {
      $('.format-icon', mediaInfo).attr('src', mediaFormatIcon).show();
    }
    else {
      $('.format-icon', mediaInfo).hide();
    }
  }

  refreshSeekbar(state) {
    util.trackTimer.stop();

    let trackBar = $(this.el);
    let seekbarWrapper = $('.seekbar-wrapper', trackBar);
    if (state.duration == 0 || state.status == 'stop') {
      seekbarWrapper.css('visibility', 'hidden');
      trackBar.addClass('seekbar-hidden');
      return;
    }
    else {
      seekbarWrapper.css('visibility', 'visible');
      trackBar.removeClass('seekbar-hidden');
    }

    let duration = (state.duration || 0) * 1000;
    let seek = state.seek || 0;
    let seekbar = $('.seekbar', seekbarWrapper);
    seekbar.slider('option', 'max', duration);
    seekbar.slider('option', 'value', seek);

    if (state.status == 'play') {
      util.trackTimer.start();
    }
  }

  refreshControls(state) {
    let trackBar = $(this.el);
    let controls = $('.controls', trackBar);
    let icon = 'play_arrow';
    if (state.status == 'play') {
      icon = state.duration ? 'pause' : 'stop';
    }
    $('button.play span', controls).html(icon);

/*
    let repeatEl = $('button.repeat', controls);
    if (state.repeat) {
      repeatEl.addClass('active');
      $('i', repeatEl).html(state.repeatSingle ? '1' : '');
    }
    else {
      repeatEl.removeClass('active');
      $('i', repeatEl).html('');
    }

    let randomEl = $('button.random', controls);
    if (state.random) {
      randomEl.addClass('active');
    }
    else {
      randomEl.removeClass('active');
    }*/
  }

  // Handle seekbar events
  seekTo(event, ui) {
    if (!event.originalEvent) { // No original event if programatically changed value
      return;
    }
    util.trackTimer.stop();
    registry.socket.emit('seek', (ui.value / 1000));
  }

  seeking(event, ui) {
    util.trackTimer.stop();
  }

  show() {
    $(this.el).show('slide', { direction: 'down' }, 100);
  }

  hide() {
    $(this.el).hide('slide', { direction: 'down' }, 100);
  }
}

export class VolumePanel {
  constructor(panel, orientation = 'vertical') {
    this.el = panel;
    this.slideVolumeTimer = null;
    this.slideVolumeValue = 0;
    this.autoCloseHandler = (e) => {
      this.hide();
    };

    const html = `
    <div class="contents">
      <div class="volume">
        <span class="material-icons mute">volume_mute</span>
        <div class="volume-slider-wrapper">       
          <div class="volume-slider"></div>
        </div>
        <span class="material-icons max">volume_up</span>
      </div>
    </div>
    `; // This is for hoizontal orientation

    let self = this;
    let panelEl = $(this.el);

    panelEl.addClass(orientation);
    panelEl.hide();
    panelEl.html(html);

    if (orientation == 'vertical') {
      let sliderWrapperEl = $('.volume-slider-wrapper', panelEl);
      sliderWrapperEl.before($('.max', panelEl));
      sliderWrapperEl.after($('.mute', panelEl));
    }

    // Socket events
    registry.state.on('stateChanged', state => {
      self.updateVolumeSlider(state);
    });
    
    $(document).ready( () => {
      $('.volume-slider', panelEl).slider({
        orientation,
        range: 'min',
        min: 0,
        max: 100,
        start: self.beginSlideVolume.bind(self),
        stop: self.endSlideVolume.bind(self),
        change: self.setVolume.bind(self),
        slide: self.slideVolume.bind(self)
      });
  
      $('.max', panelEl).on('click', () => {
        registry.socket.emit('volume', 100);
      });
  
      $('.mute', panelEl).on('click', function() {
        if ($(this).hasClass('active')) {
          registry.socket.emit('unmute');
        }
        else {
          registry.socket.emit('mute');
        }
      });

      registry.screens.manager.on('screenChanged', (current, previous) => {
        self.hide();
      });

    });
  }

  static init(data) {
    return new VolumePanel(data);
  }

  show() {
    let panelEl = $(this.el);
    let contents = $('.contents', panelEl);
    contents.hide();
    panelEl.show();
    contents.show('drop', { direction: 'down' }, 100, () => {
      this.addOverlay();
    });
  }

  hide(complete) {
    let panelEl = $(this.el);
    let contents = $('.contents', panelEl);
    contents.hide('drop', { direction: 'down' }, 100, () => {
      panelEl.hide();
    });
  }

  isOpen() {
    return $(this.el).is(':visible');
  }

  updateVolumeSlider(state) {
    let panelEl = $(this.el);
    let volumeSlider = $('.volume-slider', panelEl);
    if (!volumeSlider.data('sliding')) {
      volumeSlider.slider('option', 'value', state.volume);
    }
    if (state.disableVolumeControl) {
      $('.volume', panelEl).addClass('disabled');
    }
    else {
      $('.volume', panelEl).removeClass('disabled');
    }
    if (state.mute) {
      $('.mute', panelEl).addClass('active');
      $('.volume-slider', panelEl).addClass('muted');
    }
    else {
      $('.mute', panelEl).removeClass('active');
      $('.volume-slider', panelEl).removeClass('muted');
    }
  }

  setVolume(event, ui) {
    if (!event.originalEvent) { // No original event if programatically changed value
      return;
    }
    registry.socket.emit('volume', (ui.value));
  }
  
  slideVolume(event, ui) {
    this.slideVolumeValue = ui.value;
  }

  beginSlideVolume(event, ui) {
    if (this.slideVolumeTimer) {
      clearInterval(this.slideVolumeTimer);
    }
    this.slideVolumeValue = ui.value;
    this.slideVolumeTimer = setInterval(() => {
      registry.socket.emit('volume', this.slideVolumeValue);
    }, 300);
    let panelEl = $(this.el);
    $('.volume-slider', panelEl).data('sliding', true);
  }

  endSlideVolume(event, ui) {
    if (this.slideVolumeTimer) {
      clearInterval(this.slideVolumeTimer);
    }
    let panelEl = $(this.el);
    $('.volume-slider', panelEl).data('sliding', false);
  }

  addOverlay() {
    let self = this;
    let overlay = $('<div class="transparent-overlay"></div>');
    $('body').append(overlay);
    $(self.el).css('z-index', '101');
    overlay.on('click', function() {
      $(this).remove();
      self.hide(() => {
        $(self.el).css('z-index', '');
      });
    });
  }
}

class Snackbar {

  constructor(data) {
    this.type = data.type;
    this.message = data.message;
    this.title = data.title;
  }

  show() {
    let html = `
      <div class="snackbar-wrapper">
        <div class="snackbar">
          <div class="icon"></div>
          <div class="contents">
            <div class="title"></div>
            <div class="message"></div>
          </div>
          <div class="actions">
            <button class="action close"><span class="material-icons">close</span></button>
          </div>
        </div>
      </div>
    `;

    let snackbarEl = $(html);
    let icon;
    switch(this.type) {
      case 'success':
        icon = 'check_circle_outline';
        break;
      case 'info':
        icon = 'info';
        break;
      case 'warning':
        icon = 'warning_amber';
        break;
      case 'error':
      case 'stickyerror':
        icon = 'error_outline';
        break;
    }
    if (icon) {
      $('.icon', snackbarEl).html(`<span class="material-icons">${ icon }</span>`);
    }
    if (this.title) {
      $('.title', snackbarEl).html(this.title);
    }
    else {
      $('.title', snackbarEl).remove();
    }
    if (this.message) {
      $('.message', snackbarEl).html(this.message);
    }
    if (this.type) {
      $('.snackbar', snackbarEl).addClass(this.type);
    }
    snackbarEl.hide();

    $('body').append(snackbarEl);
    this.el = snackbarEl;

    let self = this;
    snackbarEl.show('drop', { direction: 'down' }, 100, () => {
      self.dismissTimer = setTimeout(self.dismiss.bind(self), 5000);
    });

    $('.action.close', snackbarEl).on('click', () => {
      self.dismiss();
    });

    snackbarEl.swipe({
      swipeLeft: () => { self.dismiss({ effect: 'dropLeft' }); },
      swipeRight: () => { self.dismiss({ effect: 'dropRight' }); }
    });

    return this;
  }

  dismiss(options = {}) {
    let self = this;
    if (self.dismissTimer) {
      clearTimeout(self.dismissTimer);
      self.dismissTimer = null;
    }

    const onHide = () => {
      self.el.remove();
      if (options.complete) {
        options.complete();
      }
    };

    switch(options.effect) {
      case 'dropLeft':
        self.el.hide('drop', { direction: 'left' }, 200, onHide);
        break;
      case 'dropRight':
        self.el.hide('drop', { direction: 'right' }, 200, onHide);
        break;
      default:
        self.el.hide('fade', 200, onHide);
    }
  }
}

export const snackbar = { 
  create: data => new Snackbar(data)
};