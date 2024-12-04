"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountInitialInfo = getAccountInitialInfo;
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
const SIGNED_OUT = {
    isSignedIn: false,
    list: null,
    active: null
};
function convertAccountItem(data) {
    const name = InnertubeResultParser_1.default.unwrap(data.account_name);
    const photo = InnertubeResultParser_1.default.parseThumbnail(data.account_photo);
    const handle = InnertubeResultParser_1.default.unwrap(data.channel_handle);
    const [pageId, datasyncIdToken] = (() => {
        let pageId = undefined;
        let datasyncIdToken = undefined;
        if (Array.isArray(data.endpoint.payload.supportedTokens)) {
            for (const token of data.endpoint.payload.supportedTokens) {
                if (Reflect.has(token, 'pageIdToken') && Reflect.has(token.pageIdToken, 'pageId')) {
                    pageId = String(token.pageIdToken.pageId);
                }
                else if (Reflect.has(token, 'datasyncIdToken') && Reflect.has(token.datasyncIdToken, 'datasyncIdToken')) {
                    datasyncIdToken = String(token.datasyncIdToken.datasyncIdToken);
                }
            }
        }
        return [pageId, datasyncIdToken];
    })();
    if (!name || !handle || !datasyncIdToken) {
        return null;
    }
    return {
        name,
        photo,
        active: data.is_selected,
        handle,
        pageId,
        datasyncIdToken
    };
}
async function getAccountInitialInfo(innertube) {
    if (!innertube.session.logged_in) {
        return SIGNED_OUT;
    }
    const accounts = await innertube.account.getInfo(true);
    const list = accounts.reduce((result, ac) => {
        if (!ac.is_disabled) {
            const item = convertAccountItem(ac);
            if (item) {
                result.push(item);
            }
        }
        return result;
    }, []);
    const active = list.find((ac) => ac.active);
    if (!active) {
        return SIGNED_OUT;
    }
    return {
        isSignedIn: true,
        list,
        active
    };
}
//# sourceMappingURL=AccountModelHelper.js.map