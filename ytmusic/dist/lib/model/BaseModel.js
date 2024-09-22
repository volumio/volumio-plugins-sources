"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = void 0;
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const InnertubeLoader_1 = __importDefault(require("./InnertubeLoader"));
const MAX_APPEND_SECTIONS_COUNT = 10;
class BaseModel {
    getInnertube() {
        return InnertubeLoader_1.default.getInstance();
    }
    async expandSectionList(response, url) {
        const { innertube } = await this.getInnertube();
        const sectionLists = response.contents_memo?.getType(volumio_youtubei_js_1.YTNodes.SectionList) || [];
        for (const sectionList of sectionLists) {
            let sectionListContinuation = sectionList.continuation;
            if (sectionList.continuation_type !== 'next') {
                sectionListContinuation = undefined;
            }
            let appendCount = 0;
            while (sectionListContinuation && appendCount < MAX_APPEND_SECTIONS_COUNT) {
                const response = await innertube.actions.execute(url, { token: sectionListContinuation, client: 'YTMUSIC' });
                const page = volumio_youtubei_js_1.Parser.parseResponse(response.data);
                if (page.continuation_contents instanceof volumio_youtubei_js_1.SectionListContinuation && page.continuation_contents.contents) {
                    sectionList.contents.push(...page.continuation_contents.contents);
                    sectionListContinuation = page.continuation_contents.continuation;
                    appendCount++;
                }
                else {
                    break;
                }
            }
            delete sectionList.continuation;
        }
    }
}
exports.BaseModel = BaseModel;
//# sourceMappingURL=BaseModel.js.map