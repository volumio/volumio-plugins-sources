import { ArticleCategory, ArticleCategorySection } from 'bandcamp-fetch';
import bandcamp from '../../../BandcampContext';
import AlbumEntity from '../../../entities/AlbumEntity';
import ArticleEntity, { ArticleEntityMediaItem } from '../../../entities/ArticleEntity';
import TrackEntity from '../../../entities/TrackEntity';
import { ModelType } from '../../../model';
import UIHelper, { UILink, UI_STYLES } from '../../../util/UIHelper';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
import ViewHelper from './ViewHelper';
import ExplodableViewHandler from './ExplodableViewHandler';
import { ArticleModelGetArticlesParams } from '../../../model/ArticleModel';
import { AlbumView } from './AlbumViewHandler';
import { TrackView } from './TrackViewHandler';

const ARTICLE_CATEGORY_ALL = {
  url: 'all',
  name: 'All categories'
};

export interface ArticleView extends View {
  name: 'article';
  articleUrl?: string;
  select?: boolean;
  categoryUrl?: string;
  mediaItemRef?: string;
  track?: string;
}

interface ArticleMediaItemExplodeTrack extends TrackEntity {
  // For `getTrackUri()`
  articleUrl: string;
  mediaItemRef?: string;
}

export default class ArticleViewHandler extends ExplodableViewHandler<ArticleView> {

  browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.articleUrl) {
      return this.#browseArticle(view.articleUrl);
    }
    else if (view.select) {
      return this.#browseCategories();
    }

    return this.#browseList();

  }

  async #browseList(): Promise<RenderedPage> {
    const category = await this.#getCategoryFromUriOrDefault();
    if (!category.url) {
      throw Error('Category URL missing');
    }
    const lists: RenderedList[] = [ this.#getParamsList(category) ];
    const articleList = await this.#getArticleList(category.url);
    lists.push(articleList);

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  async #getCategoryFromUriOrDefault(): Promise<ArticleCategory> {
    const categoryUrl = this.currentView.categoryUrl;
    if (categoryUrl === ARTICLE_CATEGORY_ALL.url) {
      return ARTICLE_CATEGORY_ALL;
    }

    if (categoryUrl) {
      const categorySections = await this.getModel(ModelType.Article).getArticleCategories();
      const category = this.#findCategoryInSections(categoryUrl, categorySections);
      if (category) {
        return category;
      }
    }

    return bandcamp.getConfigValue('defaultArticleCategory', ARTICLE_CATEGORY_ALL, true);
  }

  #findCategoryInSections(categoryUrl: string, sections: ArticleCategorySection[]): ArticleCategory | null {
    for (const section of sections) {
      if (section.sections) {
        const result = this.#findCategoryInSections(categoryUrl, section.sections);
        if (result) {
          return result;
        }
      }
      else if (section.categories) {
        const result = section.categories.find((category) => category.url === categoryUrl);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  #getParamsList(category: ArticleCategory) {
    const setDefaultJS = `
                const params = ${JSON.stringify(category)};
                const payload = {
                    'endpoint': 'music_service/bandcamp',
                    'method': 'saveDefaultArticleCategory',
                    'data': params
                };
                angular.element('#browse-page').scope().browse.socketService.emit('callMethod', payload);`;
    const setDefaultLink: UILink = {
      url: '#',
      icon: { type: 'fa', class: 'fa fa-cog' },
      text: bandcamp.getI18n('BANDCAMP_SET_DEFAULT_ARTICLE_CATEGORY'),
      onclick: setDefaultJS.replace(/"/g, '&quot;').replace(/\r?\n|\r/g, '')
    };
    const title = UIHelper.constructListTitleWithLink(UIHelper.addBandcampIconToListTitle(bandcamp.getI18n('BANDCAMP_DAILY')), setDefaultLink, true);
    const paramsList: RenderedList = {
      title,
      availableListViews: [ 'list' ],
      items: []
    };
    const categoryName = category.url !== ARTICLE_CATEGORY_ALL.url ? category.name : bandcamp.getI18n('BANDCAMP_ALL_CATEGORIES');
    paramsList.items.push({
      service: 'bandcamp',
      type: 'item-no-menu',
      title: categoryName,
      icon: 'fa fa-filter',
      uri: `${this.uri}@select=category`
    });
    return paramsList;
  }

  async #getArticleList(categoryUrl: string): Promise<RenderedList> {
    const view = this.currentView;
    const modelParams: ArticleModelGetArticlesParams = {
      limit: view.inSection ? bandcamp.getConfigValue('itemsPerSection', 5) : bandcamp.getConfigValue('itemsPerPage', 47)
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    if (categoryUrl !== ARTICLE_CATEGORY_ALL.url) {
      modelParams.categoryUrl = categoryUrl;
    }

    const articleList = await this.getModel(ModelType.Article).getArticles(modelParams);
    const articleRenderer = this.getRenderer(RendererType.Article);
    const listItems = articleList.items.reduce<RenderedListItem[]>((result, article) => {
      const rendered = articleRenderer.renderToListItem(article);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    const nextPageRef = this.constructPageRef(articleList.nextPageToken, articleList.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    return {
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }

  async #browseCategories(): Promise<RenderedPage> {
    const currentCategory = await this.#getCategoryFromUriOrDefault();
    const firstList: RenderedList = {
      title: UIHelper.addIconToListTitle('fa fa-filter', bandcamp.getI18n('BANDCAMP_ARTICLE_CATEGORIES')),
      availableListViews: [ 'list' ],
      items: []
    };
    let allCategoriesTitle = bandcamp.getI18n('BANDCAMP_ALL_CATEGORIES');
    const isAllCategories = currentCategory.url === ARTICLE_CATEGORY_ALL.url;
    if (isAllCategories) {
      allCategoriesTitle = UIHelper.styleText(allCategoriesTitle, UI_STYLES.LIST_ITEM_SELECTED);
    }
    firstList.items.push({
      service: 'bandcamp',
      type: 'item-no-menu',
      title: allCategoriesTitle,
      icon: isAllCategories ? 'fa fa-check' : 'fa',
      uri: this.#constructArticleCategoryUri(ARTICLE_CATEGORY_ALL.url)
    });

    const categorySections = await this.getModel(ModelType.Article).getArticleCategories();
    const lists = this.#getArticleCategoryListPerSection(categorySections, currentCategory);
    lists.unshift(firstList);

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #getArticleCategoryListPerSection(sections: ArticleCategorySection[], currentCategory: ArticleCategory, lists: RenderedList[] = []) {
    sections.forEach((section) => {
      if (section.sections) {
        this.#getArticleCategoryListPerSection(section.sections, currentCategory, lists);
      }
      else if (section.categories) {
        const categoryList: RenderedList = {
          title: section.title,
          availableListViews: [ 'list' ],
          items: []
        };
        section.categories.forEach((category) => {
          if (category.url) {
            const isSelected = currentCategory ? currentCategory.url === category.url : false;
            let title = category.name;
            if (isSelected) {
              title = UIHelper.styleText(title, UI_STYLES.LIST_ITEM_SELECTED);
            }
            categoryList.items.push({
              service: 'bandcamp',
              type: 'item-no-menu',
              title,
              icon: isSelected ? 'fa fa-check' : 'fa',
              uri: this.#constructArticleCategoryUri(category.url)
            });
          }
        });

        lists.push(categoryList);
      }
    });

    return lists;
  }

  #constructArticleCategoryUri(categoryUrl: string) {
    const targetView = { ...this.currentView };

    if (targetView.categoryUrl !== categoryUrl) {
      delete targetView.pageRef;
      delete targetView.prevPageRefs;
      if (categoryUrl) {
        targetView.categoryUrl = categoryUrl;
      }
      else {
        delete targetView.categoryUrl;
      }
    }
    delete targetView.select;

    return ViewHelper.constructUriFromViews([ ...this.previousViews, targetView ]);
  }

  async #browseArticle(articleUrl: string) {
    const article = await this.getModel(ModelType.Article).getArticle(articleUrl);

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: this.getRenderer(RendererType.Article).renderToHeader(article),
        lists: this.#getArticleSectionLists(article)
      }
    };
  }

  #getArticleSectionLists(article: ArticleEntity) {
    // Each 'list' in Volumio contains the article section's text,
    // As well as the track featured in the next section (if any).
    // If the article covers a single media item (album / track) and
    // There is no nextSection, then all tracks will be shown instead
    // Of just the featured track.
    const articleRenderer = this.getRenderer(RendererType.Article);
    const isSingleMediaItem = article.mediaItems?.length === 1;
    const lists: RenderedList[] = [];

    article.sections?.forEach((section, sectionIndex, allSections) => {
      const nextSection = allSections[sectionIndex + 1];
      let listItems: RenderedListItem[] = [];
      let title = '';

      // First section has 'View on Bandcamp' link
      if (sectionIndex === 0) {
        const viewArticleLink: UILink = {
          url: article.url,
          text: bandcamp.getI18n('BANDCAMP_VIEW_LINK_ARTICLE'),
          icon: { type: 'bandcamp' },
          target: '_blank'
        };
        title = UIHelper.constructListTitleWithLink('', viewArticleLink, true);
      }

      // Section text
      title += UIHelper.wrapInDiv(this.#formatArticleText(section.text), UI_STYLES.ARTICLE_SECTION.TEXT);

      // Next section's featured track (or all tracks if single media item)
      if (isSingleMediaItem && !nextSection) {
        const album = article.mediaItems?.find((mi) => mi.type === 'album') as ArticleEntityMediaItem<AlbumEntity>;
        if (album) {
          let albumTitle = '';
          if (album.artist) {
            albumTitle = `${UIHelper.styleText(album.artist.name, UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_ARTIST)}<br/>`;
          }
          albumTitle += UIHelper.styleText(album.name, UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_NAME);
          const gotoLink = this.#getGoToMediaItemLink(album);
          if (gotoLink) {
            let titleWithGoto = UIHelper.constructListTitleWithLink(albumTitle, gotoLink, true);
            titleWithGoto = UIHelper.wrapInDiv(titleWithGoto, 'position: relative; top: 18px;');
            title += titleWithGoto;
          }
          listItems = album.tracks?.map((track) => articleRenderer.renderMediaItemTrack(article, album, track)) || [];
        }
      }
      else if (nextSection?.mediaItemRef) {
        const mediaItem = article.mediaItems?.find((mi) => mi.mediaItemRef === nextSection.mediaItemRef);
        if (mediaItem) {
          let featuredTrack;
          if (mediaItem.type === 'album') {
            const album = mediaItem as ArticleEntityMediaItem<AlbumEntity>;
            featuredTrack = album.tracks?.find((tr) => tr.position == album.featuredTrackPosition);
          }
          if (mediaItem.type === 'track') {
            featuredTrack = mediaItem;
          }
          if (featuredTrack) {
            let mediaItemTitle = '';
            if (nextSection.heading) {
              if (mediaItem.artist) {
                mediaItemTitle = `${UIHelper.styleText(mediaItem.artist.name, UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_ARTIST)}<br/>`;
              }
              mediaItemTitle += UIHelper.styleText(mediaItem.name, UI_STYLES.ARTICLE_SECTION.MEDIA_ITEM_NAME);
            }
            const gotoLink = this.#getGoToMediaItemLink(mediaItem);
            if (gotoLink) {
              let titleWithGoto = UIHelper.constructListTitleWithLink(mediaItemTitle, gotoLink, true);
              if (!nextSection.heading) {
                titleWithGoto = UIHelper.wrapInDiv(titleWithGoto, 'position: relative; top: 28px;');
              }
              else {
                titleWithGoto = UIHelper.wrapInDiv(titleWithGoto, 'position: relative; top: 18px;');
              }
              title += titleWithGoto;
            }
            listItems.push(articleRenderer.renderMediaItemTrack(article, mediaItem, featuredTrack));
          }
        }
      }

      if (sectionIndex > 0) {
        title = UIHelper.wrapInDiv(title, 'width: 100%; margin-top: -48px;');
      }
      else {
        title = UIHelper.wrapInDiv(title, 'width: 100%;');
      }
      if (!UIHelper.supportsEnhancedTitles()) {
        title = bandcamp.getI18n('BANDCAMP_UI_CONTENT_HIDDEN');
      }

      lists.push({
        title,
        availableListViews: [ 'list' ],
        items: listItems
      });

    });

    if (article.category?.url) {
      const articleView: ArticleView = {
        name: 'article',
        categoryUrl: article.category.url
      };
      const moreUri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(articleView)}`;
      const moreItem: RenderedListItem = {
        service: 'bandcamp',
        type: 'item-no-menu',
        'title': bandcamp.getI18n('BANDCAMP_MORE_CATEGORY_ARTICLES', article.category.name),
        'uri': `${moreUri}@noExplode=1`,
        'icon': 'fa fa-arrow-circle-right'
      };

      const last = lists[lists.length - 1];
      if (last?.items?.length === 0) {
        last.items.push(moreItem);
      }
      else {
        lists.push({
          availableListViews: [ 'list' ],
          items: [ moreItem ]
        });
      }
    }

    return lists;
  }

  #formatArticleText(s: string): string {
    return s.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  }

  #getGoToMediaItemLink(mediaItem: ArticleEntityMediaItem<AlbumEntity | TrackEntity>): UILink | null {
    if (!mediaItem.url) {
      return null;
    }
    let gotoView;
    if (mediaItem.type === 'album') {
      gotoView = {
        name: 'album',
        albumUrl: mediaItem.url
      } as AlbumView;
    }
    else {
      gotoView = {
        name: 'track',
        trackUrl: mediaItem.url
      } as TrackView;
    }
    const gotoPath = `${this.uri}/${ViewHelper.constructUriSegmentFromView(gotoView)}`;
    const gotoText = mediaItem.type === 'album' ? bandcamp.getI18n('BANDCAMP_GO_TO_ALBUM') : bandcamp.getI18n('BANDCAMP_GO_TO_TRACK');
    return {
      url: '#',
      text: gotoText,
      onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${gotoPath}'})`,
      icon: {
        type: 'fa',
        class: 'fa fa-arrow-circle-right',
        float: 'right',
        color: '#54c688'
      }
    };
  }

  async getTracksOnExplode(): Promise<ArticleMediaItemExplodeTrack | ArticleMediaItemExplodeTrack[]> {
    const articleUrl = this.currentView.articleUrl;
    if (!articleUrl) {
      throw Error('No article URL specified');
    }

    const _setTrackProps = (track: TrackEntity, article: ArticleEntity, mediaItem: ArticleEntityMediaItem<AlbumEntity | TrackEntity>) => {
      const result: ArticleMediaItemExplodeTrack = {
        ...track,
        articleUrl: article.url,
        mediaItemRef: mediaItem.mediaItemRef
      };

      // Set props so track can be parsed
      result.thumbnail = mediaItem.thumbnail;
      delete result.artist;
      if (mediaItem.artist) {
        result.artist = mediaItem.artist;
      }
      if (mediaItem.type === 'album') {
        result.album = {
          type: 'album',
          name: mediaItem.name,
          url: mediaItem.url
        };
      }

      return result;
    };

    const article = await this.getModel(ModelType.Article).getArticle(articleUrl);
    const { mediaItemRef, track } = this.currentView;
    if (mediaItemRef && track) {
      const trackPosition = parseInt(track, 10);
      // Return track corresponding to mediaItemRef and track position
      const mediaItem = article.mediaItems?.find((mi) => mi.mediaItemRef === mediaItemRef);
      if (mediaItem?.type === 'album') {
        const track = mediaItem.tracks?.find((tr) => tr.position === trackPosition);
        if (track) {
          return _setTrackProps(track, article, mediaItem);
        }
      }
      // Not found
      return [];
    }

    // Return all featured tracks
    const tracks = article.mediaItems?.reduce<ArticleMediaItemExplodeTrack[]>((result, mediaItem) => {
      let track;
      if (mediaItem.type === 'album') {
        track = mediaItem.tracks?.find((tr) => tr.position == mediaItem.featuredTrackPosition);
      }
      else if (mediaItem.type === 'track') {
        track = mediaItem;
      }
      if (track) {
        result.push(_setTrackProps(track, article, mediaItem));
      }
      return result;
    }, []);

    return tracks || [];
  }

  /**
   * Override
   *
   * Track uri:
   * bandcamp/articles@articleUrl={articleUrl}@mediaItemRef={...}@track={trackPosition}@artistUrl={...}@albumUrl={...}
   */
  protected getTrackUri(track: ArticleMediaItemExplodeTrack): string | null {
    const artistUrl = track.artist?.url || null;
    const albumUrl = track.album?.url || artistUrl;

    const articleView: ArticleView = {
      name: 'article',
      articleUrl: track.articleUrl,
      mediaItemRef: track.mediaItemRef,
      track: track.position?.toString()
    };

    if (artistUrl) {
      articleView.artistUrl = artistUrl;
    }
    if (albumUrl) {
      articleView.albumUrl = albumUrl;
    }

    const uri = `bandcamp/${ViewHelper.constructUriSegmentFromView(articleView)}`;

    return uri;
  }
}
