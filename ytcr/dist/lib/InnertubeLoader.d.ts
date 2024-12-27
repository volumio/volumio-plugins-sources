import Innertube from 'volumio-youtubei.js';
import { type Logger } from 'yt-cast-receiver';
export interface InnertubeLoaderGetInstanceResult {
    innertube: Innertube;
}
export default class InnertubeLoader {
    #private;
    constructor(logger: Logger, onCreate?: (innertube: Innertube) => void);
    getInstance(): Promise<InnertubeLoaderGetInstanceResult>;
    reset(): void;
    hasInstance(): boolean;
    applyI18nConfig(): void;
}
//# sourceMappingURL=InnertubeLoader.d.ts.map