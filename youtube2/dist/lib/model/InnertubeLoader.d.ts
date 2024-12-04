import Innertube from 'volumio-youtubei.js';
export interface InnertubeLoaderGetInstanceResult {
    innertube: Innertube;
}
export default class InnertubeLoader {
    #private;
    static getInstance(): Promise<InnertubeLoaderGetInstanceResult>;
    static reset(): void;
    static hasInstance(): boolean;
    static applyI18nConfig(): void;
}
//# sourceMappingURL=InnertubeLoader.d.ts.map