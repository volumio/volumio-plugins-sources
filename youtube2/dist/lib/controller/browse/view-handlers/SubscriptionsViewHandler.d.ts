import PageContent from '../../../types/PageContent';
import GenericViewHandler, { GenericView } from './GenericViewHandler';
export interface SubscriptionsView extends Omit<GenericView, 'name'> {
    name: 'subscriptions';
}
export default class SubscriptionsViewHandler extends GenericViewHandler<SubscriptionsView> {
    protected getContents(): Promise<PageContent>;
}
//# sourceMappingURL=SubscriptionsViewHandler.d.ts.map