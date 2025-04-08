interface View extends Record<string, any> {
    name: string;
    pageRef?: PageRef;
    prevPageRefs?: PageRef[];
    limit?: number;
    inSection?: '1';
    noExplode?: '1';
}
export interface PageRef {
    pageToken: string;
    pageOffset: number;
}
export default View;
//# sourceMappingURL=View.d.ts.map