import { BaseModel } from './BaseModel';
import Endpoint from '../types/Endpoint';
import MusicItemPlaybackInfo from '../types/MusicItemPlaybackInfo';
export default class MusicItemModel extends BaseModel {
    #private;
    getPlaybackInfo(endpoint: Endpoint): Promise<MusicItemPlaybackInfo | null>;
}
//# sourceMappingURL=MusicItemModel.d.ts.map