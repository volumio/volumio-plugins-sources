export default class ConfigBackupHelper {
    #private;
    static getBackupNames(): Promise<string[]>;
    static createBackup(backupName: string): void;
    static deleteBackup(backupName: string): void;
    static replacePluginConfigWithBackup(backupName: string): Promise<void>;
}
//# sourceMappingURL=ConfigBackupHelper.d.ts.map