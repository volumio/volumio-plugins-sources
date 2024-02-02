"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const DiscoverViewHandler_1 = __importDefault(require("./DiscoverViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class FeaturedViewHandler extends DiscoverViewHandler_1.default {
    getListType() {
        return 'featured';
    }
    getTitle(selectedTags) {
        const tagNames = selectedTags.map((t) => t.name).join(' &amp; ');
        let title = MixcloudContext_1.default.getI18n('MIXCLOUD_FEATURED_TITLE', tagNames);
        if (!this.currentView.inSection && selectedTags.length > 0) {
            const discoverLinkData = this.getSwitchViewLinkData(selectedTags);
            const discoverLink = this.constructGoToViewLink(discoverLinkData.text, discoverLinkData.uri);
            title = UIHelper_1.default.constructListTitleWithLink(title, discoverLink, true);
        }
        return title;
    }
    getSwitchViewLinkData(selectedTags) {
        // "View all { tag } shows"
        const discoverView = {
            name: 'discover',
            slug: selectedTags[0].slug
        };
        const tagNames = selectedTags.map((t) => t.name).join(' &amp; ');
        return {
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(discoverView)}`,
            text: MixcloudContext_1.default.getI18n('MIXCLOUD_VIEW_ALL_SHOWS', tagNames)
        };
    }
}
exports.default = FeaturedViewHandler;
//# sourceMappingURL=FeaturedViewHandler.js.map