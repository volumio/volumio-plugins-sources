interface View extends Record<string, any> {
  name: string;
  username?: string;
  serverId?: string;
  parentId?: string;
  startIndex?: number;
  limit?: number;
  fixedView?: string;
  saveFilter?: string;
  noExplode?: '1';
}

export default View;
