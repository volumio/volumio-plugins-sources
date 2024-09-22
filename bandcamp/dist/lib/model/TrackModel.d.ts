import BaseModel from './BaseModel';
import TrackEntity from '../entities/TrackEntity';
export default class TrackModel extends BaseModel {
    #private;
    getTrack(trackUrl: string): Promise<TrackEntity>;
}
//# sourceMappingURL=TrackModel.d.ts.map