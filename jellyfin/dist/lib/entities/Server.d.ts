import { EntityType } from '../entities';
import BaseEntity from '../entities/BaseEntity';
interface Server extends BaseEntity {
    type: EntityType.Server;
    url: string;
    connectionUrl: string;
}
export default Server;
//# sourceMappingURL=Server.d.ts.map