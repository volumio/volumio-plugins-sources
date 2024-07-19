import { UIConfigSelect } from '../config/UIConfig';
import { UIConfigSectionKey } from '../config/UIConfigSchema';
export declare const FONT_DIR = "/data/INTERNAL/NowPlayingPlugin/Fonts";
export default class FontHelper {
    #private;
    static getFonts(): string[];
    static fillUIConfSelectElements<K extends UIConfigSectionKey>(...elements: {
        el: UIConfigSelect<K>;
        value: string;
    }[]): void;
}
//# sourceMappingURL=FontHelper.d.ts.map