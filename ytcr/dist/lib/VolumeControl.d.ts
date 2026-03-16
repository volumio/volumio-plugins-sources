import { type Logger, type Volume } from 'yt-cast-receiver';
export interface VolumioVolume {
    vol: number;
    mute: boolean;
}
interface VolumioVolumeChangeListener {
    (volume: VolumioVolume): Promise<void>;
}
export default class VolumeControl {
    #private;
    constructor(commandRouter: any, logger: Logger);
    init(): Promise<void>;
    setVolume(volume: Volume, setInternalOnly?: boolean): void;
    getVolume(): Promise<Volume>;
    registerVolumioVolumeChangeListener(listener: VolumioVolumeChangeListener): void;
    unregisterVolumioVolumeChangeListener(): void;
}
export {};
//# sourceMappingURL=VolumeControl.d.ts.map