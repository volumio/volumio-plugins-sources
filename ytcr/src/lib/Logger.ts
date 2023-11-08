import { EOL } from 'os';
import winston from 'winston';
import { DefaultLogger, LogLevel, LOG_LEVELS } from 'yt-cast-receiver';

export default class Logger extends DefaultLogger {

  #logger: winston.Logger;

  constructor(volumioLogger: winston.Logger) {
    super();
    this.#logger = volumioLogger;
  }
  // Override
  toOutput(targetLevel: LogLevel, msg: string[]): void {
    const str = msg.join(EOL);
    switch (targetLevel) {
      case LOG_LEVELS.ERROR:
        this.#logger.error(str);
        break;
      case LOG_LEVELS.WARN:
        this.#logger.warn(str);
        break;
      case LOG_LEVELS.INFO:
        this.#logger.info(str);
        break;
      case LOG_LEVELS.DEBUG:
        this.#logger.verbose(str);
        break;
      default:
    }
  }
}
