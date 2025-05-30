import 'date-utils';
import { ChildProcess } from 'child_process';
import type { StationInfo, RegionData } from './models/StationModel';
import type { LoginAccount } from './models/AuthModel';
export default class Radiko {
    private port;
    private logger;
    private acct;
    private token;
    private areaID;
    private cookieJar;
    private loginState;
    stations: Map<string, StationInfo>;
    stationData: RegionData[];
    areaData: Map<string, {
        areaName: string;
        stations: string[];
    }>;
    constructor(port: number, logger: Console, acct: LoginAccount);
    init(acct?: LoginAccount | null, forceGetStations?: boolean): Promise<void>;
    private login;
    private checkLogin;
    private getToken;
    private auth1;
    private getPartialKey;
    private auth2;
    private getStations;
    getStationAsciiName(stationID: string): Promise<string>;
    play(station: string): Promise<ChildProcess | null>;
    private genTempChunkM3u8URL;
    getProgramDaily(station: string, date: string): Promise<any>;
}
//# sourceMappingURL=radiko.d.ts.map