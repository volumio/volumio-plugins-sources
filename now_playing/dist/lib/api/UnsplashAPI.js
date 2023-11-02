"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const BASE_URL = 'https://unsplash.com/napi/search/photos';
const FALLBACK_URL = 'https://source.unsplash.com/random';
const PER_PAGE = 20;
const SAMPLE_SIZE = 500;
class UnsplashAPI {
    async getRandomPhoto(params) {
        const { keywords, w, h } = params;
        const matchSize = (w > 0 && h > 0) ? { w, h } : null;
        const doFetch = async (url, page = 1) => {
            url.searchParams.set('page', page.toString());
            const resp = await (0, node_fetch_1.default)(url);
            return resp.json();
        };
        const fallback = () => {
            // Fallback to using 'https://source.unsplash.com/random/...' (deprecated; occasional 503 response as of late)
            const qs = keywords ? encodeURIComponent(keywords) : '';
            const screenSizePart = matchSize ? `${matchSize.w}x${matchSize.h}/` : '';
            const url = `${FALLBACK_URL}/${screenSizePart}${qs ? `?${qs}` : ''}`;
            return `${url + (qs ? '&' : '?')}sig=${Date.now()}`;
        };
        const url = new URL(BASE_URL);
        url.searchParams.append('query', keywords);
        url.searchParams.append('per_page', PER_PAGE.toString());
        if (matchSize && matchSize.w > 0 && matchSize.h > 0) {
            const ratio = matchSize.w / matchSize.h;
            const orientation = ratio > 1 ? 'landscape' : ratio < 1 ? 'portrait' : 'squarish';
            url.searchParams.append('orientation', orientation);
        }
        const firstFetch = await doFetch(url);
        const total = firstFetch.total;
        if (!total) {
            return fallback();
        }
        const randomOffset = Math.floor(Math.random() * ((total > SAMPLE_SIZE ? SAMPLE_SIZE : total) - 1)); // 0-based
        const randomOffsetToPage = {
            page: Math.floor(randomOffset / PER_PAGE) + 1,
            offset: randomOffset % PER_PAGE
        };
        const finalFetch = await doFetch(url, randomOffsetToPage.page);
        let result = finalFetch.results?.[randomOffsetToPage.offset];
        if (!result) {
            return fallback();
        }
        if (matchSize) {
            const matchWidth = Math.min(matchSize.w, result.width);
            const matchHeight = (matchWidth / result.width) * result.height;
            if (matchWidth < matchSize.w || matchHeight < matchSize.h) {
                result = finalFetch.results.find((img) => {
                    const matchImgWidth = Math.min(matchSize.w, img.width);
                    const matchImgHeight = (matchImgWidth / img.width) * img.height;
                    return matchImgWidth >= matchSize.w && matchImgHeight >= matchSize.h;
                }) || result;
            }
        }
        const resultUrl = result.urls?.raw;
        if (!resultUrl) {
            return fallback();
        }
        if (matchSize) {
            return `${resultUrl}&q=80&w=${matchSize.w}`;
        }
        return `${resultUrl}&q=80`;
    }
}
const unsplashAPI = new UnsplashAPI();
exports.default = unsplashAPI;
//# sourceMappingURL=UnsplashAPI.js.map