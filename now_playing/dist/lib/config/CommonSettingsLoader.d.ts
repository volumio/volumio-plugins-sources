import { CommonSettingsCategory, CommonSettingsOf } from 'now-playing-common';
export default class CommonSettingsLoader {
    #private;
    static get<T extends CommonSettingsCategory>(category: T): CommonSettingsOf<T>;
}
//# sourceMappingURL=CommonSettingsLoader.d.ts.map