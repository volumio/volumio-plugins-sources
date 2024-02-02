declare class MyBackgroundMonitor {
    #private;
    constructor();
    getImages(): {
        name: string;
        path: string;
    }[];
    start(): void;
    stop(): Promise<void>;
}
declare const myBackgroundMonitor: MyBackgroundMonitor;
export default myBackgroundMonitor;
//# sourceMappingURL=MyBackgroundMonitor.d.ts.map