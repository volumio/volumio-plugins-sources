import bandcamp from '../../../../BandcampContext';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import UIHelper from '../../../../util/UIHelper';
import ArticleEntity, { ArticleEntityMediaItem } from '../../../../entities/ArticleEntity';
import TrackEntity from '../../../../entities/TrackEntity';
import AlbumEntity from '../../../../entities/AlbumEntity';
import { ArticleView } from '../ArticleViewHandler';
import ViewHelper from '../ViewHelper';

export default class ArticleRenderer extends BaseRenderer<ArticleEntity> {

  renderToListItem(data: ArticleEntity): RenderedListItem | null {
    if (!data.url) {
      return null;
    }
    const articleView: ArticleView = {
      name: 'article',
      articleUrl: data.url
    };
    return {
      service: 'bandcamp',
      type: 'folder',
      title: data.title,
      artist: `${data.category?.name} - ${data.date}`,
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(articleView)}`
    };
  }

  renderToHeader(data: ArticleEntity): RenderedHeader | null {
    return {
      uri: this.uri,
      service: 'bandcamp',
      type: 'song',
      title: data.title,
      albumart: data.thumbnail,
      artist: `${bandcamp.getI18n('BANDCAMP_DAILY')} - ${data.category?.name}`,
      year: UIHelper.reformatDate(data.date),
      duration: data.author ? bandcamp.getI18n('BANDCAMP_ARTICLE_BY', data.author.name) : undefined
    };
  }

  renderMediaItemTrack(article: ArticleEntity, mediaItem: ArticleEntityMediaItem<AlbumEntity | TrackEntity>, track: TrackEntity): RenderedListItem {
    const articleView: ArticleView = {
      name: 'article',
      articleUrl: article.url,
      mediaItemRef: mediaItem.mediaItemRef,
      track: track.position?.toString()
    };
    return {
      service: 'bandcamp',
      type: 'song',
      title: track.name,
      album: mediaItem.name,
      artist: mediaItem.artist ? mediaItem.artist.name : '',
      albumart: mediaItem.thumbnail,
      duration: track.duration,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(articleView)}`
    };
  }
}
