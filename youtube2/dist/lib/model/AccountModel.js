"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AccountModel_instances, _AccountModel_getChannelInfo;
Object.defineProperty(exports, "__esModule", { value: true });
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const Endpoint_1 = require("../types/Endpoint");
const BaseModel_1 = require("./BaseModel");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
const util_1 = require("../util");
const AccountModelHelper_1 = require("./AccountModelHelper");
class AccountModel extends BaseModel_1.BaseModel {
    constructor() {
        super(...arguments);
        _AccountModel_instances.add(this);
    }
    async getInfo() {
        const { innertube } = await this.getInnertube();
        const account = await (0, AccountModelHelper_1.getAccountInitialInfo)(innertube);
        if (account.isSignedIn) {
            const channel = await __classPrivateFieldGet(this, _AccountModel_instances, "m", _AccountModel_getChannelInfo).call(this);
            if (channel) {
                account.active.channel = channel;
            }
        }
        return account;
    }
}
_AccountModel_instances = new WeakSet(), _AccountModel_getChannelInfo = async function _AccountModel_getChannelInfo() {
    const menu = await this.fetchAccountMenu();
    const title = (0, util_1.findInObject)(menu, (key) => key === 'manageAccountTitle')[0];
    if (title) {
        const text = new volumio_youtubei_js_1.Misc.Text(title);
        const endpoint = InnertubeResultParser_1.default.parseEndpoint(text.endpoint, Endpoint_1.EndpointType.Browse);
        if (text.text && endpoint?.payload.browseId.startsWith('UC')) {
            return {
                title: text.text,
                endpoint
            };
        }
    }
    return null;
};
exports.default = AccountModel;
//# sourceMappingURL=AccountModel.js.map