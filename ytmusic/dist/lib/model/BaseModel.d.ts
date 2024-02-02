import { IParsedResponse } from 'volumio-youtubei.js';
export declare abstract class BaseModel {
    protected getInnertube(): Promise<import("./InnertubeLoader").InnertubeLoaderGetInstanceResult>;
    protected expandSectionList(response: IParsedResponse, url: '/browse' | '/search'): Promise<void>;
}
//# sourceMappingURL=BaseModel.d.ts.map