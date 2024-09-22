/**
 * Note: this is not a general-purpose utility class, but one made specifically for
 * keeping track of the seek position in MPD 'stop' events handled by PlayController.
 */
export default class StopWatch {
    #private;
    constructor();
    start(startElapsedMS?: number): this;
    stop(): this;
    getElapsed(): number;
}
//# sourceMappingURL=StopWatch.d.ts.map