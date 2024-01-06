import ytmusic from '../../../YTMusicContext';
import { ContentItem, PageElement } from '../../../types';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import ExplodableViewHandler from './ExplodableViewHandler';
import View, { ContinuationBundle } from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedHeader, RenderedListItem } from './renderers/BaseRenderer';
import { ContinuationBundleOption } from './renderers/OptionRenderer';
import { SectionItem } from '../../../types/PageElement';
import AutoplayHelper from '../../../util/AutoplayHelper';
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
  ContentItem.Album |
  ContentItem.Playlist |
  ContentItem.MusicItem |
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
      // Don't show single tab, but use its title where appropriate
      if (contents.tabs.length === 1) {
        const tabTitle = contents.tabs[0].text;
        if (tabTitle && lists[0] && !lists[0].title) {
          lists[0].title = tabTitle;
        }
      }
      else {
        const tabsToListItem = this.renderToListItem(this.#createOptionFromTabs(contents.tabs), contents);
        if (tabsToListItem) {
          if (lists[0].isFiltersAndButtons) {
            lists[0].items.unshift(tabsToListItem);
          }
          else {
            lists.unshift({
              availableListViews: [ 'list' ],
              items: [ tabsToListItem ]
            });
          }
        }
      }
    }

    return { navigation: nav };
  }

  #sectionToLists(contents: PageContent, section: PageElement.Section, header?: RenderedHeader | null, parentContinuationBundle?: ContinuationBundle): RenderedList[] {
    const listsForSection: RenderedList[] = [];
    const continuationBundle = this.createContinuationBundle(contents, section);
    const passOnBundle = JSON.parse(JSON.stringify(continuationBundle));
    if (parentContinuationBundle) {
      if (!passOnBundle.section.filters) {
        passOnBundle.section.filters = parentContinuationBundle.section.filters;
        passOnBundle.section.filtersFromParent = true;
      }
      if (!passOnBundle.section.buttons) {
        passOnBundle.section.buttons = parentContinuationBundle.section.buttons;
        passOnBundle.section.buttonsFromParent = true;
      }
    }
    let hasNestedSections = false; // Talking about nested sections with actual contents

    // List: section main items
    const mainItems: RenderedListItem[] = [];
    const commonAutoplayContext = AutoplayHelper.getAutoplayContext(section.items.filter((item) => item.type !== 'section'));
    // Disregard nested section when determining if every item is song / video, because
    // The nested section will be converted to separate list(s).
    const isAllMusicItems = section.items.every((item) => item.type === 'section' || item.type === 'song' || item.type === 'video');
    section.items?.forEach((item) => {
      if (item.type === 'section') {
        const nestedSectionToLists = this.#sectionToLists(contents, item, header, passOnBundle);
        if (nestedSectionToLists.length > 0) {
          listsForSection.push(...nestedSectionToLists);
          hasNestedSections = true;
        }
      }
      else {
        const isMusicItem = item.type === 'video' || item.type === 'song';
        if (isMusicItem) {
          const autoplayContext = commonAutoplayContext || AutoplayHelper.getAutoplayContext(item);
          if (autoplayContext) {
            item.autoplayContext = autoplayContext;
          }
        }
        const listItem = this.renderToListItem(item, contents);
        if (listItem) {
          if (isMusicItem && !isAllMusicItems) {
            // Setting type to 'album' ensures only this item will get exploded when clicked. The exception
            // Is when listing songs / videos in a playlist.
            listItem.type = 'album';
          }
          mainItems.push(listItem);
        }
      }
    });

    if (mainItems.length > 0) {
      listsForSection.unshift({
        availableListViews: this.getAvailableListViews(section),
        items: mainItems
      });
    }

    // Section title
    const prevItemCount = this.#getContinuationPrevItemCount();
    const currentItemCount = prevItemCount + mainItems.length;
    const isNextContinuation = EndpointHelper.isType(section.continuation?.endpoint, EndpointType.BrowseContinuation, EndpointType.SearchContinuation);
    const showingResultsText = mainItems.length > 0 && (isNextContinuation ||
      (contents.type === 'page' && contents.isContinuation && prevItemCount > 0)) ?
      ytmusic.getI18n('YTMUSIC_SHOWING_RESULTS', prevItemCount + 1, currentItemCount) : null;
    let sectionTitle = section.title /*|| (!header ? contents.header?.title : undefined)*/;
    if (section.subtitle) {
      sectionTitle = sectionTitle ? `${sectionTitle}: ${section.subtitle}` : section.subtitle;
    }
    if (showingResultsText) {
      if (!sectionTitle && !header && contents.header?.title) {
        sectionTitle = contents.header.title;
      }
      if (sectionTitle) {
        sectionTitle = `${sectionTitle} (${showingResultsText.charAt(0).toLocaleLowerCase()}${showingResultsText.substring(1)})`;
      }
      else {
        sectionTitle = showingResultsText;
      }
    }

    if (section.continuation) {
      const continuationItem = this.constructContinuationItem({
        continuation: section.continuation,
        prevItemCount: isNextContinuation ? currentItemCount : 0,
        bundle: passOnBundle
      });
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
      const view = this.currentView;
      const currentViewEndpoint = view.endpoint || null;
      if (EndpointHelper.isType(currentViewEndpoint,
        EndpointType.Browse, EndpointType.BrowseContinuation,
        EndpointType.Search, EndpointType.SearchContinuation)) {
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

    // -- Buttons
    if (continuationBundle.section?.buttons) {
      const defaultDest = dataStartItems.length === 0 ? dataStartItems : dataEndItems;
      continuationBundle.section.buttons.forEach((button) => {
        const buttonEndpointItem: ContentItem.EndpointLink = {
          type: 'endpointLink',
          title: button.text,
          endpoint: button.endpoint
        };
        switch (button.placement) {
          case 'top':
            dataStartItems.push(buttonEndpointItem);
            break;
          case 'bottom':
            dataEndItems.push(buttonEndpointItem);
            break;
          default:
            defaultDest.push(buttonEndpointItem);
        }
      });
    }

    const startItems = dataStartItems.reduce<RenderedListItem[]>((rendered, data) => {
      const listItem = this.renderToListItem(data, contents);
      if (listItem) {
        rendered.push(listItem);
      }
      return rendered;
    }, []);

    const endItems = dataEndItems.reduce<RenderedListItem[]>((rendered, data) => {
      const listItem = this.renderToListItem(data, contents);
      if (listItem) {
        rendered.push(listItem);
      }
      return rendered;
    }, []);

    if (startItems.length > 0) {
      listsForSection.unshift({
        availableListViews: [ 'list' ],
        items: [ ...startItems ],
        isFiltersAndButtons: true
      });
    }

    if (endItems.length > 0) {
      listsForSection.push({
        availableListViews: [ 'list' ],
        items: [ ...endItems ],
        isFiltersAndButtons: true
      });
    }

    // Set section title
    if (listsForSection.length > 0 && !listsForSection[0].title) {
      listsForSection[0].title = sectionTitle;
    }

    const hasChipCloudTypeFilter = section.filters ? section.filters.some((filter) => filter.subtype === 'chipCloud') : false;

    if (mainItems.length === 0 && !hasNestedSections && (sectionTitle || hasChipCloudTypeFilter)) {
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
      case 'album':
        return this.getRenderer(RendererType.Album).renderToHeader(data as PageElement.AlbumHeader);
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
        subtitle: section.subtitle || null,
        filters: section.filters || null,
        buttons: section.buttons || null,
        filtersFromParent: false,
        buttonsFromParent: false
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

    if (bundle && contents?.sections && !contents.isReload) {
      const continuationSection = contents.sections[0];
      if (continuationSection) {
        const firstItemIsSection = continuationSection.items?.[0]?.type === 'section';
        if (bundle.section?.title && !firstItemIsSection && !continuationSection.title) {
          continuationSection.title = bundle.section.title;
          if (bundle.section.subtitle) {
            continuationSection.subtitle = bundle.section.subtitle;
          }
        }
        let targetSectionForFilters = continuationSection;
        let targetSectionForButtons = continuationSection;
        if (bundle.section?.filtersFromParent || bundle.section?.buttonsFromParent) {
          const parentSection: PageElement.Section = {
            type: 'section',
            items: [ continuationSection ]
          };
          contents.sections[0] = parentSection;
          if (bundle.section.filtersFromParent) {
            targetSectionForFilters = parentSection;
          }
          if (bundle.section.buttonsFromParent) {
            targetSectionForButtons = parentSection;
          }
        }
        if (bundle.section?.filters) {
          targetSectionForFilters.filters = bundle.section.filters;
        }
        if (bundle.section?.buttons) {
          targetSectionForButtons.buttons = bundle.section.buttons;
        }
      }
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected renderToListItem(data: RenderableItem, contents: PageContent): RenderedListItem | null {
    switch (data.type) {
      case 'channel':
        return this.getRenderer(RendererType.Channel).renderToListItem(data);
      case 'endpointLink':
        return this.getRenderer(RendererType.EndpointLink).renderToListItem(data);
      case 'playlist':
        return this.getRenderer(RendererType.Playlist).renderToListItem(data);
      case 'album':
        return this.getRenderer(RendererType.Album).renderToListItem(data);
      case 'video':
      case 'song':
        return this.getRenderer(RendererType.MusicItem).renderToListItem(data);
      case 'option':
      case 'continuationBundleOption':
        return this.getRenderer(RendererType.Option).renderToListItem(data);
      default:
        return null;
    }
  }

  protected getAvailableListViews(section: PageElement.Section): RenderedList['availableListViews'] {
    const items = section.items.filter((item) => item.type !== 'section');

    if (items.every((item) => item.type === 'channel' || item.type === 'album' || item.type === 'playlist')) {
      return [ 'grid' ];
    }

    if (section.itemLayout !== undefined) {
      return [ section.itemLayout ];
    }

    // Note: Volumio only enforces availableListViews = ['list']. If a list is set to ['grid'], it can still be switched to list
    // If there are other switchable lists and the user clicks the switch view button.
    const isBrowseEndpointLinkWithIcon = (item: PageElement.SectionItem) =>
      item.type === 'endpointLink' &&
      item.icon && !item.icon.startsWith('YTMUSIC_') &&
      !EndpointHelper.isType(item.endpoint, EndpointType.Watch);

    if (items.length === 0 ||
      !items.some((item) => item.type !== 'section' && isBrowseEndpointLinkWithIcon(item)) ||
      items.every((item) => item.type === 'song')) {
      return [ 'list' ];
    }

    return [ 'list', 'grid' ];
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
      subtype: 'tab',
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
