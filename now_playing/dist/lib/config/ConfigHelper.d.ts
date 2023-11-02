interface ListEntry {
    value: string;
    label: string;
}
export default class ConfigHelper {
    static parseCoordinates(str: string): {
        lat: number;
        lon: number;
    } | null;
    static getVolumioLocale(): string;
    static getLocaleList(): ListEntry[];
    static getTimezoneList(): Promise<ListEntry[]>;
}
export {};
//# sourceMappingURL=ConfigHelper.d.ts.map