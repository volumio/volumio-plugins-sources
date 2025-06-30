import sc from '../SoundCloudContext';
import BaseModel, { LoopFetchResult } from './BaseModel';
import { Selection, Collection } from 'soundcloud-fetch';
import Mapper from './Mapper';
import SelectionEntity from '../entities/SelectionEntity';

export interface SelectionModelGetSelectionsParams {
  mixed?: boolean;
}

export default class SelectionModel extends BaseModel {

  getSelections(options: SelectionModelGetSelectionsParams) {
    if (!options.mixed) {
      const result: LoopFetchResult<SelectionEntity> = {
        items: [],
        nextPageToken: null,
        nextPageOffset: 0
      };
      return result;
    }

    return this.loopFetch({
      callbackParams: {},
      getFetchPromise: this.#getSelectionsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getSelectionsFromFetchResult.bind(this),
      convertToEntity: this.#convertFetchedSelectionToEntity.bind(this)
    });
  }

  #getSelectionsFetchPromise() {
    const api = this.getSoundCloudAPI();

    // Only mixed selections supported (without options)
    return sc.getCache().getOrSet(
      this.getCacheKeyForFetch('selections', { mixed: true }),
      () => api.getMixedSelections()
    );
  }

  #getSelectionsFromFetchResult(result: Collection<Selection>) {
    return result.items;
  }

  #convertFetchedSelectionToEntity(item: Selection): Promise<SelectionEntity> {
    return Mapper.mapSelection(item);
  }
}
