"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../../../YouTube2Context"));
const model_1 = require("../../../model");
const InnertubeLoader_1 = __importDefault(require("../../../model/InnertubeLoader"));
const Endpoint_1 = require("../../../types/Endpoint");
const Auth_1 = require("../../../util/Auth");
const GenericViewHandler_1 = __importDefault(require("./GenericViewHandler"));
const CHANNEL_DISPLAY_LIMIT = 6;
class SubscriptionsViewHandler extends GenericViewHandler_1.default {
    // Override
    async getContents() {
        const contents = (await super.getContents()) || {};
        if (contents.isContinuation) {
            return contents;
        }
        // We should never come to this, but just in case...
        if (!contents.sections || contents.sections.length === 0) {
            contents.sections = [];
        }
        const { auth } = await InnertubeLoader_1.default.getInstance();
        if (auth.getStatus().status === Auth_1.AuthStatus.SignedIn) {
            const endpointModel = this.getModel(model_1.ModelType.Endpoint);
            const channelsEndpoint = {
                type: Endpoint_1.EndpointType.Browse,
                payload: {
                    browseId: 'FEchannels'
                }
            };
            const channelList = await endpointModel.getContents(channelsEndpoint);
            let channels, hasMoreChannels = false;
            if (channelList?.sections) {
                channels = this.findAllItemsInSection(channelList?.sections, (item) => item.type === 'channel');
                hasMoreChannels = channels.length > CHANNEL_DISPLAY_LIMIT;
                if (hasMoreChannels) {
                    channels.splice(CHANNEL_DISPLAY_LIMIT - 1);
                }
            }
            else {
                channels = [];
            }
            if (channels.length > 0) {
                const insertSection = {
                    type: 'section',
                    items: channels
                };
                if (hasMoreChannels) {
                    insertSection.items.push({
                        type: 'endpointLink',
                        title: YouTube2Context_1.default.getI18n('YOUTUBE2_SEE_ALL'),
                        endpoint: channelsEndpoint
                    });
                }
                contents.sections.unshift(insertSection);
            }
        }
        return contents;
    }
}
exports.default = SubscriptionsViewHandler;
//# sourceMappingURL=SubscriptionsViewHandler.js.map