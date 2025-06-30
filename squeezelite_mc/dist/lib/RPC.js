"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRpcRequest = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const Util_1 = require("./Util");
const BASE_REQUEST_BODY = {
    'id': 1,
    'method': 'slim.request'
};
const BASE_HEADERS = {
    'Content-Type': 'application/json'
};
async function sendRpcRequest(connectParams, params, abortController) {
    const body = {
        ...BASE_REQUEST_BODY,
        params
    };
    const url = `${connectParams.host}:${connectParams.port}/jsonrpc.js`;
    const headers = { ...BASE_HEADERS };
    if (connectParams.username) {
        headers.Authorization = `Basic ${(0, Util_1.encodeBase64)(`${connectParams.username}:${connectParams.password || ''}`)}`;
    }
    try {
        const response = await (0, node_fetch_1.default)(url, {
            method: 'post',
            body: JSON.stringify(body),
            headers,
            signal: abortController ? abortController.signal : undefined
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(`${response.status} - ${response.statusText}`);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return { _requestAborted: true };
        }
        throw error;
    }
}
exports.sendRpcRequest = sendRpcRequest;
module.exports = {
    sendRpcRequest
};
//# sourceMappingURL=RPC.js.map