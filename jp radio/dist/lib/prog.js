"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const got_1 = __importDefault(require("got"));
const nedb_promises_1 = __importDefault(require("nedb-promises"));
const fast_xml_parser_1 = require("fast-xml-parser");
const util_1 = require("util");
const p_limit_1 = __importDefault(require("p-limit"));
const radikoUrls_1 = require("./consts/radikoUrls");
const EMPTY_PROGRAM = {
    station: '',
    id: '',
    ft: '',
    tt: '',
    title: '',
    pfm: '',
};
class RdkProg {
    constructor(logger) {
        this.db = nedb_promises_1.default.create({ inMemoryOnly: true });
        this.lastStation = '';
        this.lastTime = '';
        this.cachedProgram = { ...EMPTY_PROGRAM };
        this.logger = logger;
        this.initDBIndexes();
    }
    async getCurProgram(station) {
        const currentTime = this.getCurrentTime();
        if (station !== this.lastStation || currentTime !== this.lastTime) {
            try {
                const result = await this.db.findOne({
                    station,
                    ft: { $lte: currentTime },
                    tt: { $gte: currentTime },
                });
                if (isRadikoProgramData(result)) {
                    this.cachedProgram = result;
                }
                else {
                    this.cachedProgram = { ...EMPTY_PROGRAM };
                }
                this.lastStation = station;
                this.lastTime = currentTime;
            }
            catch (error) {
                this.logger.error(`JP_Radio::DB find error for station ${station}`, error);
            }
        }
        return this.cachedProgram.id ? this.cachedProgram : undefined;
    }
    async putProgram(prog) {
        try {
            await this.db.insert(prog);
        }
        catch (error) {
            if (error?.errorType !== 'uniqueViolated') {
                this.logger.error('JP_Radio::DB insert error', error);
            }
        }
    }
    async clearOldProgram() {
        try {
            await this.db.remove({ tt: { $lt: this.getCurrentTime() } }, { multi: true });
        }
        catch (error) {
            this.logger.error('JP_Radio::DB delete error', error);
        }
    }
    async updatePrograms() {
        const currentDate = this.getCurrentDate();
        const parser = new fast_xml_parser_1.XMLParser({
            attributeNamePrefix: '@',
            ignoreAttributes: false,
            allowBooleanAttributes: true,
        });
        const areaIDs = Array.from({ length: 47 }, (_, i) => `JP${i + 1}`);
        const limit = (0, p_limit_1.default)(5);
        const tasks = areaIDs.map((areaID) => limit(async () => {
            const url = (0, util_1.format)(radikoUrls_1.PROG_URL, currentDate, areaID);
            try {
                const response = await (0, got_1.default)(url);
                const xmlData = parser.parse(response.body);
                const stations = xmlData?.radiko?.stations?.station ?? [];
                for (const stationData of stations) {
                    const stationId = stationData['@id'];
                    const progRaw = stationData.progs?.prog;
                    if (!progRaw)
                        continue;
                    const progs = Array.isArray(progRaw) ? progRaw : [progRaw];
                    for (const prog of progs) {
                        const program = {
                            station: stationId,
                            id: stationId + prog['@id'],
                            ft: prog['@ft'],
                            tt: prog['@to'],
                            title: prog['title'],
                            pfm: prog['pfm'] ?? '',
                        };
                        await this.putProgram(program);
                    }
                }
            }
            catch (error) {
                this.logger.error(`JP_Radio::Failed to update program for ${areaID}`, error);
            }
        }));
        await Promise.all(tasks);
    }
    async dbClose() {
        this.logger.info('JP_Radio::DB compacting');
        await this.db.persistence.compactDatafile();
    }
    async allData() {
        const data = await this.db.find({});
        return JSON.stringify(data, null, 2);
    }
    initDBIndexes() {
        this.db.ensureIndex({ fieldName: 'id', unique: true });
        this.db.ensureIndex({ fieldName: 'station' });
        this.db.ensureIndex({ fieldName: 'ft' });
        this.db.ensureIndex({ fieldName: 'tt' });
    }
    getCurrentTime() {
        return (0, date_fns_1.format)(new Date(), 'yyyyMMddHHmm');
    }
    getCurrentDate() {
        return (0, date_fns_1.format)(new Date(), 'yyyyMMdd');
    }
}
exports.default = RdkProg;
function isRadikoProgramData(data) {
    return (typeof data?.station === 'string' &&
        typeof data?.id === 'string' &&
        typeof data?.ft === 'string' &&
        typeof data?.tt === 'string' &&
        typeof data?.title === 'string' &&
        typeof data?.pfm === 'string');
}
//# sourceMappingURL=prog.js.map