import { registry } from './registry.js';

export class ScreenManager {

  constructor() {
    this.visibleStack = [];
    this.emitter = new EventEmitter();
  }

  static init() {
    return new ScreenManager();
  }

  on(event, handler) {
    this.emitter.addListener(event, handler);
  }

  off(event, handler) {
    this.emitter.removeListener(event, handler);
  }

  getCurrent() {
    return this.visibleStack[this.visibleStack.length - 1] || null;
  }

  switch(screen, options = {}) {
    let current = this.getCurrent();
    if (current && current.getScreenName() === screen.getScreenName()) {
      return;
    }

    let reorderedStack = [];
    let zIndexes = {};
    let currentZIndex = 1;
    let notInStack = true;
    this.visibleStack.forEach(_screen => {
      if (screen.getScreenName() !== screen.getScreenName() || !current ||
          current.getScreenName() !== _screen.getScreenName() || 
          options.keepCurrentOpen) {
        reorderedStack.push(_screen);
        zIndexes[_screen.getScreenName()] = currentZIndex;
        currentZIndex++;
      }
      if (screen.getScreenName() === _screen.getScreenName()) {
        notInStack = false;
      }
    });
    if (notInStack) {
      zIndexes[screen.getScreenName()] = currentZIndex;
      reorderedStack.push(screen);
    }
    this.visibleStack = reorderedStack;

    $('#screen-wrapper .screen').each(function () {
      let _screen = $(this);
      _screen.css('z-index', zIndexes[_screen.data('screenName')] || 0);
    })

    if (current) {
      let currentEl = $(current.el);
      if (!options.keepCurrentOpen) {
        currentEl.fadeOut(100, 'swing', function () {
          if (typeof current.beforeInactive === 'function') {
            current.beforeInactive();
          }
          $(this).removeClass('active');
        });
      }
      else {
        if (typeof current.beforeInactive === 'function') {
          current.beforeInactive();
        }
        currentEl.removeClass('active');
        currentEl.addClass('visible-under-active');
      }
    }

    let screenEl = $(screen.el);
    let showTrackBar = false;
    let defaultShowEffect = null;

    if (typeof screen.usesTrackBar === 'function' && screen.usesTrackBar()) {
      let trackBarHeight = $(registry.ui.trackBar.el).css('height');
      screenEl.css('height', `calc(100% - ${trackBarHeight}`);
      showTrackBar = true;
    }
    if (typeof screen.getDefaultShowEffect === 'function') {
      defaultShowEffect = screen.getDefaultShowEffect();
    }

    if (!screenEl.hasClass('visible-under-active')) {
      screenEl.hide(); // So that it remains hidden when 'active' class is added
      if (typeof screen.beforeActive === 'function') {
        screen.beforeActive();
      }
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
          break;
        default:
          screenEl.show();
      }
    }
    else {
      screenEl.removeClass('visible-under-active');
      if (typeof screen.beforeActive === 'function') {
        screen.beforeActive();
      }
      screenEl.addClass('active');
    }

    if (showTrackBar) {
      registry.ui.trackBar.show();
    }
    else {
      registry.ui.trackBar.hide();
    }
    
    $('#screen-wrapper').attr('data-active', screen.getScreenName());

    this.emitter.emitEvent('screenChanged', [screen, current]);
  }

  closeCurrent() {
    let current = this.getCurrent();;
    if (!current) {
      return;
    }

    if (this.visibleStack.length > 1) {
      this.switch(this.visibleStack[this.visibleStack.length - 2]);
    }
    else {
      this.switch(registry.screens.nowPlaying);
    }
  }
}

