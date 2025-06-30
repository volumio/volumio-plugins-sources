import BaseModel, { LoopFetchResult } from './BaseModel';
import ArtistEntity from '../entities/ArtistEntity';
import LabelEntity from '../entities/LabelEntity';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';
export declare enum SearchItemType {
    All = "All",
    ArtistsAndLabels = "ArtistsAndLabels",
    Albums = "Albums",
    Tracks = "Tracks"
}
export interface SearchModelGetSearchResultsParams {
    query: string;
    itemType: SearchItemType;
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export default class SearchModel extends BaseModel {
    #private;
    getSearchResults(params: SearchModelGetSearchResultsParams & {
        itemType: SearchItemType.All;
    }): Promise<LoopFetchResult<ArtistEntity | LabelEntity | AlbumEntity | TrackEntity>>;
    getSearchResults(params: SearchModelGetSearchResultsParams & {
        itemType: SearchItemType.ArtistsAndLabels;
    }): Promise<LoopFetchResult<ArtistEntity | LabelEntity>>;
    getSearchResults(params: SearchModelGetSearchResultsParams & {
        itemType: SearchItemType.Albums;
    }): Promise<LoopFetchResult<AlbumEntity>>;
    getSearchResults(params: SearchModelGetSearchResultsParams & {
        itemType: SearchItemType.Tracks;
    }): Promise<LoopFetchResult<TrackEntity>>;
    getSearchResults(params: SearchModelGetSearchResultsParams & {
        itemType: SearchItemType;
    }): Promise<LoopFetchResult<ArtistEntity | LabelEntity | AlbumEntity | TrackEntity>>;
}
//# sourceMappingURL=SearchModel.d.ts.map