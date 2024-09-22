/// <reference types="node" />
export interface PluginInfo {
    appPort: number;
    version: string | null;
    appUrl: string;
    previewUrl: string;
    apiPath: string;
}
export declare function fileExists(path: string): boolean;
export declare function dirExists(path: string): boolean;
export declare function findInFile(path: string, str: string): boolean;
export declare function replaceInFile(path: string, search: string, replace: string): Buffer;
export declare function copyFile(src: string, dest: string, opts?: {
    asRoot?: boolean;
    createDestDirIfNotExists?: boolean;
}): void;
export declare function isSystemdServiceActive(service: string): Promise<boolean>;
export declare function restartSystemdService(service: string): Promise<string>;
export declare function readdir(path: string, ignoreIfContains?: string): string[];
export declare function getPluginVersion(): string | null;
export declare function getPluginInfo(): PluginInfo;
//# sourceMappingURL=System.d.ts.map