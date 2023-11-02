import { Metadata } from 'now-playing-common';
type ItemType = 'song' | 'album' | 'artist';
declare class MetadataAPI {
    #private;
    constructor();
    clearCache(): void;
    setAccessToken(accessToken: string): void;
    fetchInfo(params: {
        type: ItemType;
        name: string;
        album?: string;
        artist?: string;
    }): Promise<Metadata>;
}
declare const metadataAPI: MetadataAPI;
export default metadataAPI;
//# sourceMappingURL=MetadataAPI.d.ts.map