import bcfetch from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel from './BaseModel';
import EntityConverter from '../util/EntityConverter';

export default class TagModel extends BaseModel {

  async getTags() {
    const tags = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('tags'),
      () => bcfetch.limiter.tag.list());

    return {
      tags: tags.tags.map((tag) => EntityConverter.convertTag(tag)),
      locations: tags.locations.map((tag) => EntityConverter.convertTag(tag))
    };
  }

  async getRelatedTags(tags: string[]) {
    const related = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('relatedTags', tags),
      () => bcfetch.limiter.tag.getRelated({ tags }));

    let tagsArr;
    if (related.combo && related.combo.length > 0) {
      tagsArr = related.combo;
    }
    else {
      tagsArr = related.single.find((row) => row.related.length > 0)?.related;
    }

    if (tagsArr && tagsArr.length > 0) {
      return tagsArr.map((tag) => EntityConverter.convertTag(tag));
    }
    return [];
  }
}
