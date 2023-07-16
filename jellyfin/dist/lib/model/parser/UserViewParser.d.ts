import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import UserView from '../../entities/UserView';
import BaseParser from './BaseParser';
export default class UserViewParser extends BaseParser<UserView> {
    parseDto(data: BaseItemDto, api: Api): Promise<UserView | null>;
}
//# sourceMappingURL=UserViewParser.d.ts.map