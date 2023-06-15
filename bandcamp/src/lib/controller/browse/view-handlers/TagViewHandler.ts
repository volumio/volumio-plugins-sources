import { ReleasesByTag } from 'bandcamp-fetch';
import bandcamp from '../../../BandcampContext';
import TagEntity from '../../../entities/TagEntity';
import { ModelType } from '../../../model';
import UIHelper, { UI_STYLES } from '../../../util/UIHelper';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
import { ReleasesLoopFetchResult, TagModelGetReleasesParams } from '../../../model/TagModel';
import TrackEntity from '../../../entities/TrackEntity';
import ExplodableViewHandler from './ExplodableViewHandler';
import { AlbumView } from './AlbumViewHandler';
import { TrackView } from './TrackViewHandler';

const FILTER_ICONS: Record<string, string> = {
  sort: 'fa fa-sort',
  location: 'fa fa-map-marker',
  format: 'fa fa-archive'
};
const FILTER_NAMES = [ 'format', 'location', 'sort' ];

export interface TagView extends View {
  name: 'tag';
  tagUrl: string;
  select?: string;
}

export default class TagViewHandler extends ExplodableViewHandler<TagView> {

  async browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.select) {
      return view.select === 'tag' ? this.#browseTags() : this.#browseFilterOptions();
    }
    else if (view.tagUrl) {
      return this.#browseReleases();
    }

    return this.#browseTags();

  }

  async #browseTags(): Promise<RenderedPage> {
    const view = this.currentView;
    const tagUrl = view.tagUrl || null;

    const tags = await this.getModel(ModelType.Tag).getTags();
    const lists = [
      this.#getTagsList(tags, 'tags', bandcamp.getI18n('BANDCAMP_TAGS'), 'fa fa-tag', tagUrl),
      this.#getTagsList(tags, 'locations', bandcamp.getI18n('BANDCAMP_LOCATIONS'), 'fa fa-map-marker', tagUrl)
    ];

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #getTagsList(tags: Record<string, TagEntity[]>, key: string, title: string, icon: string, currentTagUrl: string | null): RenderedList {
    const tagRenderer = this.getRenderer(RendererType.Tag);
    const listItems = tags[key].reduce<RenderedListItem[]>((result, tag) => {
      const rendered = tagRenderer.renderToListItem(tag, {
        selected: tag.url === currentTagUrl,
        uri: this.#constructTagUrl(tag.url)
      });
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    return {
      title: UIHelper.addIconToListTitle(icon, title),
      availableListViews: [ 'list' ],
      items: listItems
    };
  }

  async #browseReleases(): Promise<RenderedPage> {
    const view = this.currentView;
    const model = this.getModel(ModelType.Tag);
    const tagUrl = view.tagUrl;

    const modelParams: TagModelGetReleasesParams = {
      tagUrl,
      limit: bandcamp.getConfigValue('itemsPerPage', 47),
      filters: await this.#getReleasesFiltersFromUriAndDefault()
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    const filterOptions = await model.getReleasesAvailableFilters(tagUrl);
    const releases = await model.getReleases(modelParams);
    const baseUri = this.#constructUriWithParams(releases.filters);
    const allLists = [
      this.#getSelectTagList(baseUri),
      this.#getFilterOptionsList(releases.filters, filterOptions, baseUri),
      this.#getReleasesList(releases)
    ];

    const tagInfo = await model.getTag(tagUrl);
    const tagRenderer = this.getRenderer(RendererType.Tag);
    const header = tagRenderer.renderToHeader(tagInfo);

    if (header && allLists[2].items.length > 0) {
      header.albumart = allLists[2].items[0].albumart;
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: header,
        lists: allLists
      }
    };
  }

  #getSelectTagList(baseUri: string): RenderedList {
    return {
      availableListViews: [ 'list' ],
      items: [ {
        service: 'bandcamp',
        type: 'item-no-menu',
        title: bandcamp.getI18n('BANDCAMP_SELECT_TAG'),
        icon: 'fa fa-tag',
        uri: `${baseUri}@select=tag`
      } ]
    };
  }

  #getFilterOptionsList(current: Record<string, any>, all: ReleasesByTag.Filter[], baseUri: string): RenderedList {
    const listItems: RenderedListItem[] = [];
    FILTER_NAMES.forEach((o) => {
      const filterValue = current[o];
      if (filterValue != undefined) {
        const filter = all.find((f) => f.name === o) || null;
        if (filter) {
          const opt = filter.options.find((o) => o.value == filterValue);
          const title = opt ? opt.name : filterValue;
          listItems.push({
            service: 'bandcamp',
            type: 'item-no-menu',
            title,
            icon: FILTER_ICONS[o],
            uri: `${baseUri}@select=${o}`
          });
        }
      }
    });

    return {
      title: bandcamp.getI18n('BANDCAMP_RELEASES'),
      availableListViews: [ 'list' ],
      items: listItems
    };
  }

  #getReleasesList(releases: ReleasesLoopFetchResult): RenderedList {
    const albumRenderer = this.getRenderer(RendererType.Album);
    const trackRenderer = this.getRenderer(RendererType.Track);
    const listItems = releases.items.reduce<RenderedListItem[]>((result, item) => {
      let rendered;
      if (item.type === 'album') {
        rendered = albumRenderer.renderToListItem(item);
      }
      else if (item.type === 'track') {
        rendered = trackRenderer.renderToListItem(item, true, true);
      }
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    const nextPageRef = this.constructPageRef(releases.nextPageToken, releases.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }
    return {
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }

  async #browseFilterOptions(): Promise<RenderedPage> {
    const view = this.currentView;
    const filterName = view.select;

    if (!filterName) {
      throw Error('Target filter not specified');
    }

    const tagUrl = view.tagUrl;
    const filterOptions = await this.getModel(ModelType.Tag).getReleasesAvailableFilters(tagUrl);
    const filter = filterOptions.find((f) => f.name === filterName) || null;
    let listItems: RenderedListItem[];
    if (filter && view.select) {
      listItems = filter.options.reduce<RenderedListItem[]>((result, opt) => {
        const isSelected = opt.value.toString() === view[filterName];
        let title = opt.name;
        if (isSelected) {
          title = UIHelper.styleText(title, UI_STYLES.LIST_ITEM_SELECTED);
        }
        result.push({
          service: 'bandcamp',
          type: 'item-no-menu',
          title,
          icon: isSelected ? 'fa fa-check' : 'fa',
          uri: this.#constructFilterOptionUrl(filterName, opt.value)
        });

        return result;
      }, []);
    }
    else {
      listItems = [];
    }

    let title = bandcamp.getI18n(`BANDCAMP_SELECT_${filterName.toUpperCase()}`);
    title = UIHelper.addIconToListTitle(FILTER_ICONS[filterName], title);

    const lists: RenderedList[] = [ {
      title,
      availableListViews: [ 'list' ],
      items: listItems
    } ];

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #constructTagUrl(tagUrl: string) {
    const targetView = {
      ...this.currentView
    };

    if (this.currentView.tagUrl !== tagUrl) {
      delete targetView.pageRef;
      delete targetView.prevPageRefs;
      targetView.tagUrl = tagUrl;
    }
    delete targetView.select;

    return ViewHelper.constructUriFromViews([
      ...this.previousViews,
      targetView
    ]);
  }

  #constructFilterOptionUrl(optionName: string, optionValue: string | number) {
    const targetView = {
      ...this.currentView
    };

    if (this.currentView[optionName] !== optionValue.toString()) {
      delete targetView.pageRef;
      delete targetView.prevPageRefs;
      targetView[optionName] = optionValue;
    }
    delete targetView.select;

    return ViewHelper.constructUriFromViews([
      ...this.previousViews,
      targetView
    ]);
  }

  #constructUriWithParams(params: object) {
    const targetView = {
      ...this.currentView,
      ...params
    };

    return ViewHelper.constructUriFromViews([
      ...this.previousViews,
      targetView
    ]);
  }

  async #getReleasesFiltersFromUriAndDefault() {
    const view = this.currentView;
    const tagUrl = view.tagUrl;
    const model = this.getModel(ModelType.Tag);
    const filterOptions = await model.getReleasesAvailableFilters(tagUrl);
    const allowedFilterOptions = filterOptions.filter((filter) => FILTER_NAMES.includes(filter.name));
    const defaultFilters = allowedFilterOptions.reduce<Record<string, any>>((result, f) => {
      const selected = f.options.find((o) => o.selected);
      if (selected) {
        result[f.name] = selected.value;
      }
      return result;
    }, {});
    const filtersFromView = Object.keys(view).reduce<Record<string, any>>((result, key) => {
      if (FILTER_NAMES.includes(key)) {
        result[key] = view[key];
      }
      return result;
    }, {});
    return {
      ...defaultFilters,
      ...filtersFromView
    };
  }

  async getTracksOnExplode() {
    const view = this.currentView;
    const tagUrl = view.tagUrl;

    if (!tagUrl) {
      throw Error('Tag URL missing');
    }

    const modelParams: TagModelGetReleasesParams = {
      tagUrl,
      limit: bandcamp.getConfigValue('itemsPerPage', 47),
      filters: await this.#getReleasesFiltersFromUriAndDefault()
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    const releases = await this.getModel(ModelType.Tag).getReleases(modelParams);
    const tracks = releases.items.reduce<TrackEntity[]>((result, release) => {
      if (release.type === 'album' && release.featuredTrack?.streamUrl) {
        const track: TrackEntity = {
          type: 'track',
          name: release.featuredTrack.name,
          thumbnail: release.thumbnail,
          artist: release.artist,
          album: {
            type: 'album',
            name: release.name,
            url: release.url
          },
          position: release.featuredTrack.position,
          streamUrl: release.featuredTrack.streamUrl
        };
        result.push(track);
      }
      else if (release.type === 'track') {
        const track: TrackEntity = {
          type: 'track',
          name: release.name,
          url: release.url,
          thumbnail: release.thumbnail,
          artist: release.artist,
          streamUrl: release.streamUrl
        };
        result.push(track);
      }
      return result;
    }, []);

    return tracks;
  }

  /**
   * Override
   *
   * Track uri - one of:
   * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}
   * - bandcamp/track@trackUrl={...}@artistUrl={...}@albumurl={...}
   */
  getTrackUri(track: TrackEntity) {
    const artistUrl = track.artist?.url || null;
    const albumUrl = track.album?.url || artistUrl;
    const trackUrl = track.url || null;

    if (track.album && albumUrl) {
      const albumView: AlbumView = {
        name: 'album',
        albumUrl
      };
      if (track.position) {
        albumView.track = track.position.toString();
      }
      if (artistUrl) {
        albumView.artistUrl = artistUrl;
      }

      return `bandcamp/${ViewHelper.constructUriSegmentFromView(albumView)}`;
    }

    if (trackUrl) {
      const trackView: TrackView = {
        name: 'track',
        trackUrl
      };
      if (artistUrl) {
        trackView.artistUrl = artistUrl;
      }
      if (albumUrl) {
        trackView.albumUrl = albumUrl;
      }
      return `bandcamp/${ViewHelper.constructUriSegmentFromView(trackView)}`;
    }

    return null;
  }
}
