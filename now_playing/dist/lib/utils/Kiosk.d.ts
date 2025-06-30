export declare function checkVolumioKiosk(): {
    exists: boolean;
    display?: undefined;
} | {
    exists: boolean;
    display: string;
};
export declare function volumioKioskBackupPathExists(): boolean;
export declare function configureVolumioKiosk(display: 'nowPlaying' | 'default'): Promise<void>;
export declare function restoreVolumioKiosk(): Promise<void>;
export declare function modifyVolumioKioskScript(oldPort: number, newPort: number, restartService?: boolean): Promise<string | undefined>;
export declare function restartVolumioKioskService(): Promise<string | undefined>;
//# sourceMappingURL=Kiosk.d.ts.map