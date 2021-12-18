import { registry } from './registry.js';

// Util functions / class
export function timeToString(ms) {
  let mm = Math.trunc(ms / 1000 / 60);
  let ss = `${Math.trunc((ms / 1000) % 60)}`;
  if (ss.length == 1) {
    ss = '0' + ss;
  }
  return `${mm}:${ss}`;
}

export function secondsToString(s) {
  let mm = Math.trunc(s / 60);
  let ss = `${Math.trunc(s % 60)}`;
  if (ss.length == 1) {
    ss = '0' + ss;
  }
  return `${mm}:${ss}`;
}

// Track timer for incrementing seekbar position at 1s interval
class TrackTimer {
  constructor() {
    this.trackTimer = null;
    this.trackTimerSliders = [];
  }

  attach(slider) {
    if (!this.trackTimerSliders.includes(slider)) {
      this.trackTimerSliders.push(slider);
    }
  }

  start() {
    if (this.trackTimer) {
      return;
    }
    else {
      this.trackTimer = setInterval(() => {
        if (this.trackTimerSliders.length > 0) {
          $(this.trackTimerSliders.join(',')).each( (index, el) => {
            el = $(el);
            let seek = el.slider('option', 'value') + 1000;
            el.siblings('.seek').text(timeToString(seek));
            el.slider('option', 'value', seek);
          })
        }
      }, 1000);
    }
  }

  stop() {
    if (this.trackTimer) {
      clearInterval(this.trackTimer);
      this.trackTimer = null;
    }
  }
}

class ImageLoader {
  constructor() {
    this.handles = {};
    this.handleCount = 0;
  }

  load(src, onload, onerror, fallback = true, handle) {
    this.handleCount++;
    if (!handle) {
      handle = {
        id: 'il' + this.handleCount
      };
    }
    this.handles[handle.id] = handle;
    let img = new Image();
    img.onload = () => {
      if (!this.isCancelled(handle)) {
        delete this.handles[handle.id];
        if (onload) {
          onload(src);
        }
      }
    }
    img.onerror = () => {
      if (!this.isCancelled(handle)) {
        if (fallback) {
          this.load(registry.app.host + '/albumart', onload, onerror, false, handle);
        }
        else {
          delete this.handles[handle.id];
          if (onerror) {
            onerror(src);
          }
        }
      }
    }
    img.src = src;

    return handle;
  }

  cancel(handle) {
    delete this.handles[handle.id];
  }

  isCancelled(handle) {
    return this.handles[handle.id] ? false : true;
  }
}

export function getMediaFormatIcon(trackType) {
  if (!trackType) {
    return null;
  }
  let url;
  switch (trackType) {
    case 'dff':
    case 'dsf':
      url = 'dsd';
      break;
    case 'ogg':
    case 'oga':
      url = 'ogg';
      break;
    case 'wv':
      url = 'wavpack'
      break;
    case 'aac':
    case 'aiff':
    case 'alac':
    case 'dsd':
    case 'dts':
    case 'flac':
    case 'm4a':
    case 'mp3':
    case 'mp4':
    case 'opus':
    case 'spotify':
    case 'wav':
    case 'wawpack':
    case 'airplay':
    case 'YouTube':
    case 'rr':
    case 'bt':
    case 'cd':
    case 'tidal':
    case 'qobuz':
    case 'mg':
    case 'mb':
    case 'wma':
    case 'qobuz':
    case 'tidal':
      url = trackType
      break;
    default:
      url = null;
  }
  if (url) {
    return `${ registry.app.host }/app/assets-common/format-icons/${ url }.svg`;
  }
  else {
    return null;
  }
}

export function setCSSVariable(varName, value, target = 'root') {
  let style;
  if (target === 'root') {
    style = document.documentElement.style;
  }
  else if (target instanceof jQuery) {
    style = target.prop('style');
  }
  else if (target.el) {
    style = $(target.el).prop('style');
  }

  if (style) {
    style.setProperty(varName, value);
  }
}

export function refresh() {
  window.location.reload();
}

export function setScreenBlur(blur = true) {
  if (blur) {
    $("#screen-wrapper").addClass("blur");
  }
  else {
    $("#screen-wrapper").removeClass("blur");
  }
}

let currentSnackbar;
export function showSnackbar(data) {
  const show = () => {
    currentSnackbar = registry.ui.snackbar.create(data).show();
  }
  if (currentSnackbar) {
    currentSnackbar.dismiss({
      complete: show
    });
  }
  else {
    show();
  }
}

/*let screenStack = [];

export function setActiveScreen(screen, options = {}) {
  let currentActive = $('#screen-wrapper .screen.active');
  if (currentActive.length > 0 && 
    currentActive.data('screenName') === screen.getScreenName()) {
      return;
  }

  let reorderScreenStack = [];
  let zIndexes = {};
  let currentZIndex = 1;
  screenStack.forEach( _screen => {
    if (_screen.getScreenName() !== screen.getScreenName()) {
      reorderScreenStack.push(_screen);
      zIndexes[_screen.getScreenName()] = currentZIndex;
      currentZIndex++;
    }
  });
  zIndexes[screen.getScreenName()] = currentZIndex;
  reorderScreenStack.push(screen);
  screenStack = reorderScreenStack;

  $('#screen-wrapper .screen').each(function() {
    let _screen = $(this);
    _screen.css('z-index', zIndexes[_screen.data('screenName')] || 0);
  })

  if (!options.keepCurrentOpen) {
    if (currentActive.length > 0) {
      currentActive.fadeOut(100, 'swing', function() {
        $(this).removeClass('active');
      });
    }
  }
  else {
    currentActive.removeClass('active');
    currentActive.addClass('visible-under-active');
  }

  let screenEl = $(screen.el);
  let showTrackBar = false;
  let defaultShowEffect = null;

  if (typeof screen.usesTrackBar === 'function' && screen.usesTrackBar()) {
    let trackBarHeight = $(registry.ui.trackBar.el).css('height');
    screenEl.css('height', `calc(100% - ${ trackBarHeight }`);
    showTrackBar = true;
  }
  if (typeof screen.getDefaultShowEffect === 'function') {
    defaultShowEffect = screen.getDefaultShowEffect();
  }

  if (!screenEl.hasClass('visible-under-active')) {
    screenEl.hide(); // So that it remains hidden when 'active' class is added
    screenEl.addClass('active');

    let showEffect = options.showEffect || defaultShowEffect;
    switch (showEffect) {
      case 'slideDown':
        screenEl.show('slide', { direction: 'up' }, 100);
        break;
      case 'slideUp': 
        screenEl.show('slide', { direction: 'down' }, 100);
        break;
      case 'slideRight':
        screenEl.show('slide', { direction: 'left' }, 100);
        break;
      case 'slideLeft':
        screenEl.show('slide', { direction: 'right' }, 100);
        break;
      case 'fadeIn':
        screenEl.fadeIn(100);
      default:
        screenEl.show();
    }
  }
  else {
    screenEl.removeClass('visible-under-active');
    screenEl.addClass('active');
  }

  if (showTrackBar) {
    registry.ui.trackBar.show();
  }
  else {
    registry.ui.trackBar.hide();
  }

  let actionPanel = $(registry.ui.actionPanel.el);
  $('.screen-switcher .switch.active', actionPanel).removeClass('active');
  $(`.screen-switcher .switch[data-screen="${ screen.getScreenName() }"]`, actionPanel).addClass('active');

  $('#screen-wrapper').attr('data-active', screen.getScreenName());
}

export function closeActiveScreen() {
  let currentActive = $('#screen-wrapper .screen.active');
  if (currentActive.length === 0) {
    return;
  }

  if (screenStack.length > 1) {
    let newActive = screenStack[screenStack.length - 2];
    setActiveScreen(newActive);
  }
}*/

export let trackTimer = new TrackTimer();
export let imageLoader = new ImageLoader();
