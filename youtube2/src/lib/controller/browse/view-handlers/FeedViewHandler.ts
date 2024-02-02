import yt2 from '../../../YouTube2Context';
import { ContentItem, PageElement } from '../../../types';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import ExplodableViewHandler from './ExplodableViewHandler';
import View, { ContinuationBundle } from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedHeader, RenderedListItem } from './renderers/BaseRenderer';
import { ContinuationBundleOption } from './renderers/OptionRenderer';
import { SectionItem } from '../../../types/PageElement';
import EndpointHelper from '../../../util/EndpointHelper';
import { PageContent } from '../../../types/Content';

/**
 * View handler for feed contents consisting of sections and optional header.
 */

export interface FeedView extends View {
  endpoint?: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint;
}

type RenderableItem = ContentItem.Channel |
                      ContentItem.EndpointLink |
                      ContentItem.GuideEntry |
                      ContentItem.Playlist |
                      ContentItem.Video |
                      PageElement.Option |
                      ContinuationBundleOption;

export default abstract class FeedViewHandler<V extends FeedView = FeedView> extends ExplodableViewHandler<V> {

  async browse(): Promise<RenderedPage> {
    const contents = await this.getContents();

    if (!contents) {
      throw Error('No contents');
    }

    this.applyContinuationBundle(contents);

    const header = this.getHeader(contents.header);
    const lists: RenderedList[] = [];

    contents?.sections?.forEach((section) => {
      lists.push(...this.#sectionToLists(contents, section, header));
    });

    if (lists.length === 0) {
      lists.push({
        availableListViews: [ 'list' ],
        items: []
      });
    }

    if (!lists[0].title && !header && contents.header?.title) {
      lists[0].title = contents.header.title;
    }

    const nav: RenderedPage['navigation'] = {
      info: header,
      prev: {
        uri: this.constructPrevUri()
      },
      lists
    };

    if (contents.tabs) {
      const tabsToListItem = this.#renderToListItem(this.#createOptionFromTabs(contents.tabs));
      if (tabsToListItem) {
        lists.unshift({
          availableListViews: [ 'list' ],
          items: [ tabsToListItem ]
        });
      }
    }

    return { navigation: nav };
  }

  #sectionToLists(contents: PageContent, section: PageElement.Section, header?: RenderedHeader | null): RenderedList[] {
    const listsForSection: RenderedList[] = [];
    const isPlaylistContents = contents.header?.type === 'playlist';
    const continuationBundle = this.createContinuationBundle(contents, section);
    let hasNestedSections = false; // Talking about nested sections with actual contents

    // List: section main items
    const mainItems: RenderedListItem[] = [];
    // Disregard nested section when determining if every item is video, because
    // The nested section will be converted to separate list(s).
    const isAllVideos = section.items.every((item) => item.type === 'section' || item.type === 'video');
    section.items?.forEach((item) => {
      if (item.type === 'section') {
        const nestedSectionToLists = this.#sectionToLists(contents, item, header);
        if (nestedSectionToLists.length > 0) {
          listsForSection.push(...this.#sectionToLists(contents, item, header));
          hasNestedSections = true;
        }
      }
      else {
        const ytPlaybackMode = yt2.getConfigValue('ytPlaybackMode');
        const listItem = this.#renderToListItem(item);
        if (listItem) {
          if (item.type === 'video' && (!isAllVideos ||
            (isPlaylistContents ? ytPlaybackMode.playlistVideos : ytPlaybackMode.feedVideos))) {
            // Setting type to 'album' ensures only this item will get exploded when clicked. The exception
            // Is when listing videos in a playlist.
            listItem.type = 'album';
          }
          mainItems.push(listItem);
        }
      }
    });

    if (mainItems.length > 0) {
      listsForSection.unshift({
        availableListViews: this.getAvailableListViews(section.items.filter((item) => item.type !== 'section') as RenderableItem[]),
        items: mainItems
      });
    }

    // Section title
    const prevItemCount = this.#getContinuationPrevItemCount();
    const currentItemCount = prevItemCount + mainItems.length;
    const showingResultsText = mainItems.length > 0 && (section.continuation || (contents.type === 'page' && contents.isContinuation)) && isPlaylistContents ?
      yt2.getI18n('YOUTUBE2_SHOWING_RESULTS', prevItemCount + 1, currentItemCount) : null;
    let sectionTitle = section.title;
    if (showingResultsText) {
      if (section.title) {
        sectionTitle = `${section.title} (${showingResultsText.charAt(0).toLocaleLowerCase()}${showingResultsText.substring(1)})`;
      }
      else {
        sectionTitle = showingResultsText;
      }
    }

    if (section.continuation) {
      const continuationItem = this.constructContinuationItem({ continuation: section.continuation, prevItemCount: currentItemCount, bundle: continuationBundle });
      if (!hasNestedSections) {
        mainItems.push(continuationItem);
      }
      else {
        listsForSection.push({
          availableListViews: [ 'list' ],
          items: [ continuationItem ]
        });
      }
    }

    const dataStartItems: RenderableItem[] = [];
    const dataEndItems: RenderableItem[] = [];

    // List: section start items
    // -- Filters
    if (continuationBundle.section?.filters) {
      // Check if selected filter has an endpoint and if none, set it to current.
      // (Targeting 'All' in Home, but maybe there are others as well)
      const view = this.currentView;
      const currentViewEndpoint = view.endpoint || null;
      if (!EndpointHelper.isType(currentViewEndpoint, EndpointType.Watch)) {
        continuationBundle.section.filters.forEach((filter) => {
          const selected = filter.optionValues.find((ov) => ov.selected);
          if (selected && !selected.endpoint) {
            selected.endpoint = currentViewEndpoint;
          }
        });
      }
      continuationBundle.section.filters.forEach((filter, index) => {
        dataStartItems.push(this.#createContinuationBundleOption(continuationBundle, `section.filters.${index}`));
      });
    }

    // -- Menus
    if (continuationBundle.section?.menus) {
      continuationBundle.section.menus.forEach((menu, index) => {
        dataStartItems.push(this.#createContinuationBundleOption(continuationBundle, `section.menus.${index}`));
      });
    }

    // -- Buttons
    if (continuationBundle.section?.buttons) {
      const targetItems = dataStartItems.length === 0 ? dataStartItems : dataEndItems;
      continuationBundle.section.buttons.forEach((button) => {
        const buttonEndpointItem: ContentItem.EndpointLink = {
          type: 'endpointLink',
          title: button.text,
          endpoint: button.endpoint
        };
        targetItems.push(buttonEndpointItem);
      });
    }

    const startItems = dataStartItems.reduce<RenderedListItem[]>((rendered, data) => {
      const listItem = this.#renderToListItem(data);
      if (listItem) {
        rendered.push(listItem);
      }
      return rendered;
    }, []);

    const endItems = dataEndItems.reduce<RenderedListItem[]>((rendered, data) => {
      const listItem = this.#renderToListItem(data);
      if (listItem) {
        rendered.push(listItem);
      }
      return rendered;
    }, []);

    if (startItems.length > 0) {
      listsForSection.unshift({
        availableListViews: [ 'list' ],
        items: [ ...startItems ]
      });
    }

    if (endItems.length > 0) {
      listsForSection.push({
        availableListViews: [ 'list' ],
        items: [ ...endItems ]
      });
    }

    // Set section title
    if (listsForSection.length > 0 && !listsForSection[0].title) {
      listsForSection[0].title = sectionTitle;
    }

    if (mainItems.length === 0 && !hasNestedSections && (sectionTitle || startItems.length > 0 || endItems.length > 0)) {
      listsForSection.push({
        title: sectionTitle,
        availableListViews: [ 'list' ],
        items: []
      });
    }

    return listsForSection;
  }

  protected abstract getContents(): Promise<PageContent | null>;

  getHeader(data?: PageElement.Header): RenderedHeader | null {
    if (!data) {
      return null;
    }

    switch (data.type) {
      case 'channel':
        return this.getRenderer(RendererType.Channel).renderToHeader(data);
      case 'playlist':
        return this.getRenderer(RendererType.Playlist).renderToHeader(data as PageElement.PlaylistHeader);
      default:
        return null;
    }
  }

  // Creates a bundle that passes to the next continuation of the specified section.
  // The bundle gets appended to the continuation uri and shall ultimately be passed
  // Back to this handler, which will then apply the bundle to the continuation contents
  // Before creating the view.
  createContinuationBundle(contents: PageContent, section: PageElement.Section): ContinuationBundle {
    const bundle = {
      section: {
        title: section.title || null,
        filters: section.filters || null,
        menus: section.menus || null,
        buttons: section.buttons || null
      },
      contents: {
        header: contents.header || null,
        tabs: contents.tabs || null
      }
    };

    return bundle;
  }

  applyContinuationBundle(contents: PageContent) {
    if (!contents.isContinuation) {
      return false;
    }

    const view = this.currentView;
    const bundle = view.continuationBundle || null;

    if (!bundle || !contents) {
      return false;
    }

    if (bundle.contents?.header && !contents.header) {
      contents.header = bundle.contents.header;
    }

    if (bundle.contents?.tabs && !contents.tabs) {
      contents.tabs = bundle.contents.tabs;
    }

    if (bundle && contents?.sections) {
      const continuationSection = contents.sections[0];
      if (continuationSection) {
        const firstItemIsSection = continuationSection.items?.[0]?.type === 'section';
        if (bundle.section?.title && !firstItemIsSection && !continuationSection.title) {
          continuationSection.title = bundle.section.title;
        }
        if (bundle.section?.filters) {
          continuationSection.filters = bundle.section.filters;
        }
        if (bundle.section?.menus) {
          continuationSection.menus = bundle.section.menus;
        }
        if (bundle.section?.buttons) {
          continuationSection.buttons = bundle.section.buttons;
        }
      }
    }

    return true;
  }

  #renderToListItem(data: RenderableItem): RenderedListItem | null {
    switch (data.type) {
      case 'channel':
        return this.getRenderer(RendererType.Channel).renderToListItem(data);
      case 'endpointLink':
      case 'guideEntry':
        return this.getRenderer(RendererType.EndpointLink).renderToListItem(data);
      case 'playlist':
        return this.getRenderer(RendererType.Playlist).renderToListItem(data);
      case 'video':
        return this.getRenderer(RendererType.Video).renderToListItem(data);
      case 'option':
      case 'continuationBundleOption':
        return this.getRenderer(RendererType.Option).renderToListItem(data);
      default:
        return null;
    }
  }

  protected getAvailableListViews(items: RenderableItem[]): RenderedList['availableListViews'] {
    // Note: Volumio only enforces availableListViews = ['list']. If a list is set to ['grid'], it can still be switched to list
    // If there are other switchable lists and the user clicks the switch view button.
    if (items.length === 0 || this.#hasNoThumbnails(items)) {
      return [ 'list' ];
    }
    else if (items?.every((item) => item.type === 'channel')) {
      return [ 'grid' ];
    }

    return [ 'list', 'grid' ];

  }

  #hasNoThumbnails(items: RenderableItem[]) {
    return !items.find(
      (item) => item.type === 'continuationBundleOption' || item.type === 'option' || item.thumbnail);
  }

  #getContinuationPrevItemCount() {
    const continuation = this.currentView.continuation;
    if (continuation) {
      return continuation.prevItemCount || 0;
    }
    return 0;
  }

  #createContinuationBundleOption(bundle: ContinuationBundle, targetKey: string): ContinuationBundleOption {
    return {
      type: 'continuationBundleOption',
      continuationBundle: bundle,
      targetKey
    };
  }

  #createOptionFromTabs(tabs: PageElement.Tab[]): PageElement.Option {
    return {
      type: 'option',
      optionValues: tabs
    };
  }

  protected findAllItemsInSection(target: PageElement.Section | PageElement.Section[], predicate?: (item: SectionItem) => boolean): SectionItem[] {
    if (!target) {
      return [];
    }

    if (Array.isArray(target)) {
      return target.reduce<SectionItem[]>((result, section) => {
        result.push(...this.findAllItemsInSection(section, predicate));
        return result;
      }, []);
    }

    const result: SectionItem[] = [];
    target.items?.forEach((item) => {
      if (item.type === 'section') {
        result.push(...this.findAllItemsInSection(item, predicate));
      }
      else if (typeof predicate !== 'function' || predicate(item)) {
        result.push(item);
      }
    });

    return result;
  }

  protected findAllEndpointsInSection<T extends Endpoint>(target?: PageElement.Section | PageElement.Section[], predicate?: (endpoint: Endpoint) => boolean): T[] {
    if (!target) {
      return [];
    }

    const __applyPredicate = (endpoint: Endpoint): endpoint is T => {
      if (typeof predicate !== 'function') {
        return true;
      }
      return predicate(endpoint);
    };

    if (Array.isArray(target)) {
      return target.reduce<T[]>((result, section) => {
        result.push(...this.findAllEndpointsInSection<T>(section, predicate));
        return result;
      }, []);
    }

    const result: T[] = [];
    const haystack = [
      ...target.buttons || [],
      ...target.items
    ];

    for (const needle of haystack) {
      if (needle.type === 'section') {
        result.push(...this.findAllEndpointsInSection<T>(needle, predicate));
      }
      else if (needle.endpoint && __applyPredicate(needle.endpoint)) {
        result.push(needle.endpoint);
      }
    }

    return result;
  }
}
