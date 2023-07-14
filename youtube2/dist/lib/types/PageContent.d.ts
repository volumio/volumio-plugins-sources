import { PageElement } from '.';
interface PageContent {
    type: 'page';
    isContinuation: boolean;
    header?: PageElement.Header;
    sections: PageElement.Section[];
    tabs?: PageElement.Tab[];
}
export default PageContent;
//# sourceMappingURL=PageContent.d.ts.map