import type { BrowseResult } from './models/BrowseResultModel';
export default class JpRadio {
    #private;
    private readonly app;
    private server;
    private readonly task;
    private readonly port;
    private readonly logger;
    private readonly acct;
    private readonly commandRouter;
    private prg;
    private rdk;
    constructor(port: number | undefined, logger: Console, acct: any | undefined, commandRouter: any);
    radioStations(): Promise<BrowseResult>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=radio.d.ts.map