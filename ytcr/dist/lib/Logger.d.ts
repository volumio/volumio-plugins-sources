import winston from 'winston';
import { DefaultLogger, LogLevel } from 'yt-cast-receiver';
export default class Logger extends DefaultLogger {
    #private;
    constructor(volumioLogger: winston.Logger);
    toOutput(targetLevel: LogLevel, msg: string[]): void;
}
//# sourceMappingURL=Logger.d.ts.map