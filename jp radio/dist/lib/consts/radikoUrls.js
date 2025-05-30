"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROG_URL = exports.PROG_DAILY_URL = exports.MAX_RETRY_COUNT = exports.PLAY_URL = exports.CHANNEL_FULL_URL = exports.CHANNEL_AREA_URL = exports.AUTH2_URL = exports.AUTH1_URL = exports.AUTH_KEY = exports.LOGOUT_URL = exports.CHECK_URL = exports.LOGIN_URL = void 0;
exports.LOGIN_URL = 'https://radiko.jp/ap/member/webapi/member/login';
exports.CHECK_URL = 'https://radiko.jp/ap/member/webapi/v2/member/login/check';
exports.LOGOUT_URL = 'https://radiko.jp/ap/member/webapi/member/logout';
exports.AUTH_KEY = 'bcd151073c03b352e1ef2fd66c32209da9ca0afa';
exports.AUTH1_URL = 'https://radiko.jp/v2/api/auth1';
exports.AUTH2_URL = 'https://radiko.jp/v2/api/auth2';
exports.CHANNEL_AREA_URL = 'http://radiko.jp/v3/station/list/%s.xml';
exports.CHANNEL_FULL_URL = 'http://radiko.jp/v3/station/region/full.xml';
exports.PLAY_URL = 'https://f-radiko.smartstream.ne.jp/%s/_definst_/simul-stream.stream/playlist.m3u8';
exports.MAX_RETRY_COUNT = 2;
exports.PROG_DAILY_URL = 'https://radiko.jp/v3/program/station/date/%s/%s.xml';
exports.PROG_URL = 'http://radiko.jp/v3/program/date/%s/%s.xml';
//# sourceMappingURL=radikoUrls.js.map