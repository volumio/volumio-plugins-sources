import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Parser from './Parser';
import BaseEntity from '../../entities/BaseEntity';
export default abstract class BaseParser<T extends BaseEntity> implements Parser<BaseEntity> {
    parseDto(data: BaseItemDto, api: Api): Promise<T | BaseEntity | null>;
    getThumbnailUrl(data: BaseItemDto, api: Api): Promise<string | null>;
    protected ticksToSeconds(ticks: number): number;
    protected getGenres(data: BaseItemDto): {
        id: string;
        name: string;
    }[];
}
//# sourceMappingURL=BaseParser.d.ts.map