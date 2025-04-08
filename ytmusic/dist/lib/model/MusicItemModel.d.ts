import { BaseModel } from './BaseModel';
import type Endpoint from '../types/Endpoint';
import type MusicItemPlaybackInfo from '../types/MusicItemPlaybackInfo';
export default class MusicItemModel extends BaseModel {
    #private;
    getPlaybackInfo(endpoint: Endpoint): Promise<MusicItemPlaybackInfo | null>;
    getLyrics(videoId: string): Promise<import("now-playing-common").MetadataLyrics | null>;
}
//# sourceMappingURL=MusicItemModel.d.ts.map