import path from 'path';
import fs from 'fs';
import slugify from 'slugify';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';
import { SlugEntity } from '../../../../entities/SlugEntity';
import UIHelper from '../../../../util/UIHelper';
import { DiscoverView } from '../DiscoverViewHandler';
import ViewHelper from '../ViewHelper';

export default class SlugRenderer extends BaseRenderer<SlugEntity> {

  renderToListItem(slug: SlugEntity): RenderedListItem | null {
    const discoverView: DiscoverView = {
      name: 'discover',
      slug: slug.slug
    };
    const result: RenderedListItem = {
      service: 'mixcloud',
      type: 'folder',
      title: slug.name,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(discoverView)}`
    };
    const albumart = this.#getAlbumArt(slug);
    if (albumart) {
      result.albumart = albumart;
    }
    else {
      result.icon = 'fa fa-tag';
    }
    return result;
  }

  #getAlbumArt(slug: SlugEntity) {
    const filename = `${slugify(slug.name).toLowerCase()}.png`;
    const srcPath = `music_service/mixcloud/dist/assets/images/slugs/${filename}`;
    const realPath = path.resolve(__dirname, `../../../../../assets/images/slugs/${filename}`);
    let retPath: string | null = `/albumart?sourceicon=${encodeURIComponent(srcPath)}`;

    let exists;
    try {
      exists = fs.existsSync(realPath);
    }
    catch (err) {
      exists = false;
    }

    if (!exists) {
      try {
        retPath = UIHelper.getRandomAlbumArtFromDir('tags');
      }
      catch (err) {
        retPath = null;
      }
    }

    return retPath;
  }
}
