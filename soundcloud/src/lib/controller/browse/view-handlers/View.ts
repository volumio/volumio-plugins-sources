interface View extends Record<string, any> {
  name: string;
  pageRef?: PageRef;
  prevPageRefs?: PageRef[];
  limit?: number;
  // Flags
  inSection?: '1';
  noExplode?: '1';
}

export interface PageRef {
  pageToken?: string;
  pageOffset?: number;
}

export default View;
