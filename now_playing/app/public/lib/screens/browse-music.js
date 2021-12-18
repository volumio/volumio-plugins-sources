import * as util from '../util.js';
import { registry } from '../registry.js';

/**
 * navigation:
 * - info, e.g.:
 *   - service: 'mpd',
 *   - artist: isOrphanAlbum ? '*' : artist,
 *   - album: album,
 *   - albumart: albumart,
 *   - year: isOrphanAlbum ? '' : year,
 *   - genre: isOrphanAlbum ? '' : genre,
 *   - type: 'album',
 *   - trackType: albumTrackType,
 *   - duration: duration
 * - lists (each represented by a <section>)
 *   - availableListViews
 *   - title
 *   - items
 *     - album, albumart, artist, service, title, type, uri
 * - prev.uri
 */

 const ROOT_LOCATION = {
   type: 'browse',
   uri: '',
   service: null
 };

export class BrowseMusicScreen {
  constructor(el) {
    this.el = el;
    this.browseSources = [];
    this.currentRequest = null;
    this.currentLocation = { 
      type: 'browse', 
      uri: '', 
      service: null 
    };
    this.backHistory = [];

    const html = `
      <div class="contents">
        <div class="header">
          <div class="main-actions">
            <button class="action home"><span class="material-icons">home</span></button>
            <button class="action back"><span class="material-icons">arrow_back</span></button>
            <button class="action list-view-toggle" data-current="grid"><span></span></button>
            <button class="action search-expand"><span class="material-icons">search</span></button>
            <div class="search-input icon-text-input noSwipe hidden">
              <input type="text" class="action search" />
              <span class="material-icons">search</span>
            </div>
          </div>
          <div class="screen-actions">
            <button class="action show-action-panel"><span class="material-icons">more_horiz</span></button>
            <button class="action close"><span class="material-icons">close</span></button>
          </div>
        </div>
        <div class="navigation-wrapper">
          <div class="navigation"></div>
        </div>
      </div>
    `;

    let screen = $(this.el);
    screen.html(html);
    screen.data('screenName', this.getScreenName());

    let self = this;
    let socket = registry.socket;
    
    socket.on('pushBrowseSources', data => {
      self.browseSources = data;
      self.showBrowseSources();
    });

    socket.on('pushBrowseLibrary', data => {
      // Only handle search results.
      // For browsing library we use REST API
      if (data.navigation && data.navigation.isSearchResult) {
        self.showSearchResults(data);
      }
    })

    $('.header', screen).swipe({
      swipeDown: () => {
        registry.ui.actionPanel.show();
      }
    });
    
    $('.navigation', screen).on('click', 'section .items .item', function() {
      self.handleItemClick($(this));
      return false;
    });

    $('.navigation', screen).on('click', 'section .items .item .action.play', function() {
      self.handleItemPlayButtonClicked($(this).parents('.item'));
      return false;
    });

    $('.navigation', screen).on('click', '.info-header .action.play', function() {
      self.handleInfoHeaderPlayButtonClicked($(this).parents('.info-header'));
      return false;
    });

    $('.action.list-view-toggle', screen).on('click', function() {
      let current = $(this).attr('data-current');
      let toggled = current == 'list' ? 'grid' : 'list';
      $(this).attr('data-current', toggled);
      $('section:not(.fixed-list-view)', screen).toggleClass('list grid');
    })

    $('.action.show-action-panel', screen).on('click', function() {
      registry.ui.actionPanel.show();
    })

    $('.action.close', screen).on('click', function() {
      registry.screens.manager.closeCurrent();
    });
    
    $('.action.home', screen).on('click', function() {
      self.browse(ROOT_LOCATION);
    });

    $('.action.back', screen).on('click', function() {
      self.handleBackClicked();
    })

    $('.action.search-expand', screen).on('click', function() {
      let thisEl = $(this);
      thisEl.toggleClass('active');
      $('.search-input', screen).toggleClass('hidden');
      if (thisEl.hasClass('active')) {
        $('.action.search', screen).focus();
      }
      else {
        $('.action.search', screen).blur();
      }
    })

    $('.action.search', screen).on('input', function() {
      let inputTimer = $(this).data('inputTimer');
      if (inputTimer) {
        clearTimeout(inputTimer);
        $(this).data('inputTimer', null);
      }
      let query = $(this).val().trim();
      if (query.length >= 3) {
        inputTimer = setTimeout(() => {
          self.search(query);
        }, 500);
        $(this).data('inputTimer', inputTimer);
      }
    })

    $(document).ready(() => {
      let supportsHover = !window.matchMedia('(hover: none)').matches;
      $('.navigation-wrapper', screen).overlayScrollbars({
        scrollbars: {
          autoHide: supportsHover ? 'leave' : 'scroll'
        }
      });
    })

    /*
     * Temporary workaround for my plugins that provide in-title links
     */
    const _angularBrowseFn = {
      fetchLibrary: (data) => {
        self.browse({
          type: 'browse',
          service: self.currentLocation.service,
          uri: data.uri
        });
      },
      socketService: registry.socket
    };
    const _angularBrowsePageEl = {
      scope: () => {
        return {
          browse: _angularBrowseFn
        }
      }
    }
    const angular = {
      element: (t) => {
        if (t === '#browse-page') {
          return _angularBrowsePageEl;
        }
      }
    };
    window.angular = angular;
  }

  /*
   * Temporary workaround for my plugins that provide rich titles
   */
  formatRichTitle(s) {
    let hasHtml = /<[a-z][\s\S]*>/i.test(s);
    if (!hasHtml) {
      return s;
    }
    let titleEl = $('<div>' + s + '</div>');

    // Process images
    titleEl.find('img').each( function() {
      let img = $(this);
      let src = img.attr('src');
      if (src.startsWith('/albumart')) {
        img.attr('src', registry.app.host + src);
      }
      // Also format image containers
      let container = img.parent('div');
      container.css({
        'display': 'flex',
        'align-items': 'center'
      });
      if (container.css('text-align') == 'right') {
        container.css('justify-content', 'flex-end');
      }
    });

    // Process divs
    titleEl.find('div').each( function() {
      let div = $(this);
      // Remove negative bottom margins and relative top positions
      // because our screens do not show insanely huge default margins
      if (div.css('margin-bottom') && parseInt(div.css('margin-bottom'), 10) < 0) {
        div.css('margin-bottom', '0');
      }
      if (div.css('top')) {
        div.css('top', '0');
      }
    })

    let html = `
      <div class="rich-title">
        ${ titleEl.html() }
      </div>`;
    return html;
  }

  static init(el) {
    return new BrowseMusicScreen(el);
  }

  getScreenName() {
    return 'browseMusic';
  }

  getDefaultShowEffect() {
    return 'fadeIn';
  }

  usesTrackBar() {
    return true;
  }

  showBrowseSources() {
    let cr = !this.currentRequest || this.currentRequest.type !== 'browse' || (this.currentRequest.uri !== '/' && this.currentRequest.uri !== '');
    let cl = this.currentLocation.type !== 'browse' || (this.currentLocation.uri !== '/' && this.currentLocation.uri !== '');

    if (cr && cl) {
      return;
    }

    let sources = this.browseSources;
    let section = this.createSection({
      items: sources,
      availableListViews: ['grid']
    });

    let screen = $(this.el);
    $('.navigation', screen).empty().append(section);
    $('.action.back', screen).hide();
    $('.action.list-view-toggle', screen).hide();
    this.scrollToTop();
  }

  createInfoHeader(data) {
    const excludeItemTypes = [
      'play-playlist'
    ];
    if (excludeItemTypes.includes(data.type)) {
      return;
    }

    let html = `
      <div class="info-header">
        <div class="bg">
          <img src="" />
        </div>
        <div class="main">
          <div class="albumart"></div>
          <div class="info">
            <div class="title"></div>
            <div class="artist"></div>
            <div class="media-info"></div>
            <div class="buttons"></div>
          </div>
        </div>
      </div>
    `;

    let infoEl = $(html);

    let fallbackImgSrc = registry.app.host + '/albumart';
    let albumartUrl = data.albumart || fallbackImgSrc;
    if (albumartUrl.startsWith('/')) {
      albumartUrl = registry.app.host + albumartUrl;
    }
    let fallbackImgJS = `onerror="if (this.src != '${ fallbackImgSrc }') this.src = '${ fallbackImgSrc }';"`;

    $('.albumart', infoEl).html(`<img src="${ albumartUrl }" ${ fallbackImgJS }/>`);
    $('.bg', infoEl).html(`<img src="${ albumartUrl }" ${ fallbackImgJS }/>`);

    let titleText = data.title || data.album || data.artist || '';
    let titleIsArtist = !data.title && !data.album && data.artist;
    let artistText = titleIsArtist ? '' : data.artist || '';
    let mediaInfoFields = ['year', 'duration', 'genre', 'trackType'];
    let mediaInfoComponents = [];
    mediaInfoFields.forEach( field => {
      if (data[field]) {
        mediaInfoComponents.push(`<span>${ data[field] }</span>`);
      }
    });
    let dotHtml = '<i class="fa fa-circle dot"></i>';
    $('.title', infoEl).html(titleText);
    $('.artist', infoEl).html(artistText);
    $('.media-info', infoEl).html(mediaInfoComponents.join(dotHtml));

    let buttons = $('.buttons', infoEl);
    if (this.hasPlayButton(data)) {
      let playButtonHtml = '<button class="action play"><span class="material-icons">play_arrow</span><span>Play</span></button>';
      buttons.append($(playButtonHtml));
    }

    infoEl.data('raw', data);

    return infoEl;
  }

  createSection(data) {
    let self = this;
    let title = data.title ? self.formatRichTitle(data.title) : '';
    let availableListViews = data.availableListViews;;
    if (!Array.isArray(availableListViews) || availableListViews.length == 0) {
      availableListViews = ['list', 'grid'];
    }
    let items = data.items || [];
    let preferredListView = $(`${ self.el } .action.list-view-toggle`).attr('data-current');
    let listView = availableListViews.includes(preferredListView) ? preferredListView : availableListViews[0];
    let sectionClasses = '';
    if (!title) {
      sectionClasses += ' no-title';
    }
    if (availableListViews.length === 1) {
      sectionClasses += ' fixed-list-view';
    }
    let html = `
      <section class="${ listView }${ sectionClasses }">
        <div class="title">${ title }</div>
        <div class="items"></div>
      </section>
    `;
    let section = $(html);
    let itemList = $('.items', section);
    let hasAlbum = false,
        hasArtist = false,
        hasDuration = false,
        hasEllipsis = false;
    items.forEach( (item, index) => {
      let itemEl = self.createItem(item);
      itemEl.data('index', index);
      itemList.append(itemEl);
      if (item.album) { hasAlbum = true; }
      if (item.artist) { hasArtist = true; }
      if (item.duration) { hasDuration = true; }
      //TODO: hasEllipsis - menu
    });
    if (!hasAlbum) { itemList.addClass('no-album'); }
    if (!hasArtist) { itemList.addClass('no-artist'); }
    if (!hasDuration) { itemList.addClass('no-duration'); }
    if (!hasEllipsis) { itemList.addClass('no-ellipsis'); }

    section.data('raw', data);

    return section;
    // TODO: If no items then display No Results as title
  }

  createItem(data) {
    let title = data.title || data.name || '';
    let album = data.album || '';
    let artist = data.artist || '';
    let duration = data.duration ? util.secondsToString(data.duration) : '';

    let itemClasses = '';
    if (!album) {
      itemClasses += ' no-album';
    }
    if (!artist) {
      itemClasses += ' no-artist';
    }

    let albumArtist = data.album || '';
    if (data.artist) {
      albumArtist += albumArtist ? ' - ' : '';
      albumArtist += data.artist;
    }

    let html = `
      <div class="item ${ itemClasses }">
        <div class="albumart">
        </div>
        <div class="title-album-artist">
          <div class="text title">${ title }</div>
          <div class="text album">${ album }</div>
          <div class="text artist">${ artist }</div>
          <div class="text album-artist">${ albumArtist }</div>
        </div>
        <div class="text duration">${ duration }</div>
        <div class="ellipsis"><button class="menu-trigger"><i class="fa fa-ellipsis-v"></i></button></div>
      </div>
    `;
    let item = $(html);

    if (data.albumart || (!data.icon && data.tracknumber == undefined)) {
      let fallbackImgSrc = registry.app.host + '/albumart';
      let albumartUrl = data.albumart || fallbackImgSrc;
      if (albumartUrl.startsWith('/')) {
        albumartUrl = registry.app.host + albumartUrl;
      }
      let fallbackImgJS = `onerror="if (this.src != '${ fallbackImgSrc }') this.src = '${ fallbackImgSrc }';"`;
      $('.albumart', item).html(`<img src="${ albumartUrl }" ${ fallbackImgJS }/>`);
    }
    else if (data.icon) {
      let iconHtml = `<div class="icon"><i class="${ data.icon }"></i></div>`;
      $('.albumart', item).html(iconHtml);
    }
    else { // track number
      let trackNumberHtml = `<div class="track-number">${ data.tracknumber }</div>`;
      $('.albumart', item).html(trackNumberHtml);
    }

    if (this.hasPlayButton(data)) {
      let buttonContainerHtml = `
        <div class="button-container">
          <button class="action play"><span></span></button>
        </div>`;
      let buttonContainer = $(buttonContainerHtml);
      $('.albumart', item).append(buttonContainer);
    }

    item.data('raw', data);

    return item;
  }

  handleItemClick(itemEl) {
    let item = itemEl.data('raw');
    if (!item.uri) {
      return;
    }

    if (this.isPlayOnDirectClick(item.type)) {
      this.doPlayOnClick(itemEl);
    }
    else {
      let location = {
        type: 'browse',
        uri: item.uri
      }
      if (!item.service && !item.plugin_name) {
        location.service = null;
      }
      else if (item.plugin_name) { // itemEl refers to a browse source
        location.service = {
          name: item.plugin_name,
          prettyName: item.plugin_name !== 'mpd' ? item.name : 'Music Library'
        };
      }
      else if (!this.currentLocation.service || item.service !== this.currentLocation.service.name) {
        let prettyName = '';
        if (item.service === 'mpd') {
          prettyName = 'Music Library';
        }
        else {
          let itemService = this.browseSources.find(source => source.plugin_name === item.service);
          prettyName = itemService ? itemService.name : '';
        }
        location.service = {
          name: item.service,
          prettyName
        };
      }
      else {
        location.service = this.currentLocation.service;
      }
      
      this.browse(location);
    }
  }

  handleItemPlayButtonClicked(itemEl) {
    this.doPlayOnClick(itemEl);
  }

  handleInfoHeaderPlayButtonClicked(infoHeaderEl) {
    this.doPlayOnClick(infoHeaderEl);
  }

  // Should item of the given type play when clicked directly (i.e. not using the play button)
  isPlayOnDirectClick(itemType) {
    const playOnDirectClickTypes = [
      'song',
      'webradio',
      'mywebradio',
      'cuesong'/*,
      'cd' // What's this? Can see in Volumio UI code but not in the backend...Leaving it out until I know how it's actually used
      */
    ]
    return playOnDirectClickTypes.includes(itemType);
  }

  // Based on:
  // https://github.com/volumio/Volumio2-UI/blob/master/src/app/browse-music/browse-music.controller.js
  hasPlayButton(item) {
    if (!item) {
      return false;
    }
    // We avoid that by mistake one clicks on play all NAS or USB, freezing volumio
    if ((item.type === 'folder' && item.uri && item.uri.startsWith('music-library/') && item.uri.split('/').length < 4 ) ||
        item.disablePlayButton === true) {
      return false;
    }
    const playButtonTypes = [
      'folder',
      'album',
      'artist',
      'song',
      'mywebradio',
      'webradio',
      'playlist',
      'cuesong',
      'remdisk',
      'cuefile',
      'folder-with-favourites',
      'internal-folder'
    ]
    return playButtonTypes.includes(item.type);
  }

  showBrowseResults(data) {
    let self = this;
    if (!data.navigation) {
      return;
    }
    let screen = $(self.el);
    let nav = $('.navigation', screen);
    nav.empty();
    if (data.navigation.info) {
      nav.append(self.createInfoHeader(data.navigation.info));
    }
    if (Array.isArray(data.navigation.lists)) {
      data.navigation.lists.forEach( list => {
        let section = self.createSection(list);
        nav.append(section);
      })
      if ($('section:not(.fixed-list-view)', nav).length > 0) {
        $('.action.list-view-toggle', screen).show();
      }
      else {
        $('.action.list-view-toggle', screen).hide();
      }
    }
    $('.action.back', screen).show();
    self.scrollToTop();
  }

  showSearchResults(data) {
    let screen = $(this.el);
    let searchInputValue = $('.action.search', screen).val().trim();
    if (!this.currentRequest || this.currentRequest.type !== 'search' || this.currentRequest.query !== searchInputValue) {
      return;
    }
    if (data.navigation) {
      this.currentLocation.scrollPosition = this.getScrollPosition();
      this.showBrowseResults(data);
      this.addToBackHistory(this.currentLocation);
      let location = Object.assign({}, this.currentRequest, { pageData: data } );
      this.setCurrentLocation(location);
    }
    this.currentRequest = null;
    this.stopFakeLoadingBar(true);
  }

  requestRestApi(url, callback) {
    this.stopFakeLoadingBar();
    if (url === '' || url === '/') {
      this.showBrowseSources();
    }
    else {
      this.startFakeLoadingBar();
      $.getJSON(url, data => {
        if (callback) {
          callback(data);
        }
      });
    }
  }

  browse(location) {
    if (location.type !== 'browse') {
      return;
    }
    let self = this;
    self.currentRequest = location;
    self.stopFakeLoadingBar();
    if (location.uri === '' || location.uri === '/') {
      self.showBrowseSources();
      self.setCurrentLocation(location);
      self.resetBackHistory();
    }
    else {
      // Double encode uri because Volumio will decode it after
      // it has already been decoded by Express query parser.
      let requestUrl = `${ registry.app.host }/api/v1/browse?uri=${ encodeURIComponent(encodeURIComponent(location.uri)) }`;
      self.startFakeLoadingBar();
      self.requestRestApi(requestUrl, data => {
        if (data.error) {
          self.stopFakeLoadingBar(true);
          util.showSnackbar({
            type: 'error',
            message: data.error
          });
        }
        else if (data.navigation && self.currentRequest && self.currentRequest.type === 'browse' && self.currentRequest.uri === location.uri) {
          self.currentLocation.scrollPosition = self.getScrollPosition();
          self.showBrowseResults(data);
          self.addToBackHistory(self.currentLocation);
          location.pageData = data;
          self.setCurrentLocation(location);
          self.stopFakeLoadingBar(true);
          self.currentRequest = null;
        }
      });
    }
  }

  search(query, service) {
    // Volumio REST API for search does NOT have the same implementation as Websocket API!
    // Must use Websocket because REST API does not allow for source-specific searching.
    let payload = {
      value: query
      // In Volumio musiclibrary.js, the payload also has a 'uri' field - what is it used for???
    }
    if (service) {
      payload.service = service.name;
    }
    else if (this.currentLocation.service) {
      payload.service = this.currentLocation.service.name;
    }
    this.currentRequest = {
      type: 'search',
      query,
      service: service || this.currentLocation.service || null
    }
    this.startFakeLoadingBar();
    registry.socket.emit('search', payload);
  }

  setCurrentLocation(location) {
    this.currentLocation = location;
    let screen = $(this.el);
    $('.action.search', screen).attr('placeholder', location.service ? location.service.prettyName : '');
  }

  addToBackHistory(location) {
    this.backHistory.push(location);
  }

  getScrollPosition() {
    let screen = $(this.el);
    let scroll = $('.navigation-wrapper', screen).overlayScrollbars().scroll() || {};
    return scroll.position || { x: 0, y: 0 };
  }

  resetBackHistory() {
    this.backHistory = [];
  }

  handleBackClicked() {
    this.startFakeLoadingBar();
    let prevLocation = this.backHistory.pop();
    if (!prevLocation || (prevLocation.type === 'browse' && (prevLocation.uri === '' || prevLocation.uri === '/'))) {
      this.browse(ROOT_LOCATION);
    }
    else if (prevLocation.type === 'browse' || prevLocation.type === 'search') {
      this.showBrowseResults(prevLocation.pageData);
      if (prevLocation.scrollPosition) {
        let screen = $(this.el);
        $('.navigation-wrapper', screen).overlayScrollbars().scroll(prevLocation.scrollPosition, 0);
      }
      this.setCurrentLocation(prevLocation);
    }
    this.stopFakeLoadingBar(true);
  }

  scrollToTop() {
    let screen = $(this.el);
    //$('.navigation', screen).scrollTop(0);
    $('.navigation-wrapper', screen).overlayScrollbars().scroll(0);
  }

  doPlayOnClick(itemEl) {
    let socket = registry.socket;
    let item = itemEl.data('raw');

    if (item.type === 'cuesong') {
      socket.emit('addPlayCue', {
        uri: item.uri,
        number: item.number,
        service: (item.service || null)
      });
    }
    else if (item.type === 'playlist') {
      socket.emit('playPlaylist', {
        name: item.title
      });
    }
    else {
      let list;
      let index;
      let playEntireListTypes = [
        'song'
      ];
      let playEntireList = playEntireListTypes.includes(item.type);
      if (playEntireList) {
        list = itemEl.parents('section').data('raw');
        index = itemEl.data('index');
      }
      if (list && list.items && index != undefined) {
        socket.emit('playItemsList', {
          item,
          list: list.items,
          index
        });
      }
      else {
        socket.emit('playItemsList', { item });
      }
      
    }
  }

  startFakeLoadingBar() {
    let self = this;
    let screen = $(self.el);
    self.stopFakeLoadingBar();
    screen.addClass('loading');
    // Based on https://codepen.io/1117/pen/zYxbqxO
    let step = 0.5;
    let currentProgress = 0;
    let timer = setInterval(function() {
      currentProgress += step;
      let progress = Math.round(Math.atan(currentProgress) / (Math.PI / 2) * 100 * 1000) / 1000;
      util.setCSSVariable('--loading-percent', progress + '%', self);
      if (progress >= 100){
          self.stopFakeLoadingBar();
      }
      else if (progress >= 70) {
          step = 0.1;
      }
    }, 100);
    screen.data('loading-timer', timer);
  }

  stopFakeLoadingBar(complete = false) {
    let screen = $(this.el);
    let loadingTimer = screen.data('loading-timer');
    if (loadingTimer) {
      clearInterval(loadingTimer);
      screen.data('loading-timer', null);
    }
    let hideTimer = screen.data('hide-timer');
    if (hideTimer) {
      clearTimeout(hideTimer);
      screen.data('hide-timer', null);
    }

    const cleanup = () => {
      screen.data('hide-timer', null);
      util.setCSSVariable('--loading-percent', '0', this);
      screen.removeClass('loading');
    };

    if (complete) {
      util.setCSSVariable('--loading-percent', '100%', this);
      hideTimer = setTimeout(() => {
        cleanup();
      }, 200);
      screen.data('hide-timer', hideTimer);
    }
    else {
      cleanup();
    }
  }
}
