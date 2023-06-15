import BaseModel from './BaseModel';
import ArtistEntity from '../entities/ArtistEntity';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';
import LabelEntity from '../entities/LabelEntity';
export interface BandModelGetLabelArtistsParams {
    labelUrl: string;
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export interface BandModelGetDiscographyParams {
    bandUrl: string;
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export default class BandModel extends BaseModel {
    #private;
    getLabelArtists(params: BandModelGetLabelArtistsParams): Promise<import("./BaseModel").LoopFetchResult<ArtistEntity>>;
    getDiscography(params: BandModelGetDiscographyParams): Promise<import("./BaseModel").LoopFetchResult<TrackEntity | AlbumEntity>>;
    getBand(bandUrl: string): Promise<ArtistEntity | LabelEntity>;
}
//# sourceMappingURL=BandModel.d.ts.map