import Innertube from 'volumio-youtubei.js';
import Auth from '../util/Auth';
export interface InnertubeLoaderGetInstanceResult {
    innertube: Innertube;
    auth: Auth;
}
export default class InnertubeLoader {
    #private;
    static getInstance(): Promise<InnertubeLoaderGetInstanceResult>;
    static reset(): void;
    static hasInstance(): Auth | null;
    static applyI18nConfig(): void;
}
//# sourceMappingURL=InnertubeLoader.d.ts.map