declare class UnsplashAPI {
    getRandomPhoto(params: {
        keywords: string;
        w: number;
        h: number;
    }): Promise<string>;
}
declare const unsplashAPI: UnsplashAPI;
export default unsplashAPI;
//# sourceMappingURL=UnsplashAPI.d.ts.map