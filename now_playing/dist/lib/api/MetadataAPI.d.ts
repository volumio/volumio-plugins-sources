import { Metadata } from 'now-playing-common';
import { MetadataServiceOptions } from '../config/PluginConfig';
type ItemType = 'song' | 'album' | 'artist';
declare class MetadataAPI {
    #private;
    constructor();
    clearCache(): void;
    updateSettings(settings: MetadataServiceOptions): void;
    fetchInfo(params: {
        type: ItemType;
        name: string;
        album?: string;
        artist?: string;
        uri?: string;
        service?: string;
    }): Promise<Metadata>;
}
declare const metadataAPI: MetadataAPI;
export default metadataAPI;
//# sourceMappingURL=MetadataAPI.d.ts.map