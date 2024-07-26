import { BaseModel } from './BaseModel';
import Endpoint from '../types/Endpoint';
import MusicItemPlaybackInfo from '../types/MusicItemPlaybackInfo';
export default class MusicItemModel extends BaseModel {
    #private;
    getPlaybackInfo(endpoint: Endpoint): Promise<MusicItemPlaybackInfo | null>;
    getLyrics(videoId: string): Promise<import("now-playing-common").MetadataLyrics | null>;
}
//# sourceMappingURL=MusicItemModel.d.ts.map