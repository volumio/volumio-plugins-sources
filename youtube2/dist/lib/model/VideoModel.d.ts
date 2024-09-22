import VideoPlaybackInfo from '../types/VideoPlaybackInfo';
import { BaseModel } from './BaseModel';
export default class VideoModel extends BaseModel {
    #private;
    getPlaybackInfo(videoId: string): Promise<VideoPlaybackInfo | null>;
}
//# sourceMappingURL=VideoModel.d.ts.map