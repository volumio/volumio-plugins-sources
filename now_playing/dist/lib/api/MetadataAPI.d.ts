import { Metadata } from 'now-playing-common';
import { MetadataServiceOptions } from '../config/PluginConfig';
type ItemType = 'song' | 'album' | 'artist';
export interface MetadataAPIFetchInfoParams {
    type: ItemType;
    name: string;
    album?: string;
    artist?: string;
    duration?: number;
    uri?: string;
    service?: string;
}
declare class MetadataAPI {
    #private;
    constructor();
    clearCache(): void;
    updateSettings(settings: MetadataServiceOptions): void;
    fetchInfo(params: MetadataAPIFetchInfoParams): Promise<Metadata>;
}
declare const metadataAPI: MetadataAPI;
export default metadataAPI;
//# sourceMappingURL=MetadataAPI.d.ts.map