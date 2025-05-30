import type { RadikoProgramData } from './models/RadikoProgramModel';
export default class RdkProg {
    private readonly logger;
    private readonly db;
    private lastStation;
    private lastTime;
    private cachedProgram;
    constructor(logger: Console);
    getCurProgram(station: string): Promise<RadikoProgramData | undefined>;
    putProgram(prog: RadikoProgramData): Promise<void>;
    clearOldProgram(): Promise<void>;
    updatePrograms(): Promise<void>;
    dbClose(): Promise<void>;
    allData(): Promise<string>;
    private initDBIndexes;
    private getCurrentTime;
    private getCurrentDate;
}
//# sourceMappingURL=prog.d.ts.map