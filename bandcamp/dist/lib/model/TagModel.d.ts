import BaseModel from './BaseModel';
export default class TagModel extends BaseModel {
    getTags(): Promise<{
        tags: import("../entities/TagEntity").default[];
        locations: import("../entities/TagEntity").default[];
    }>;
    getRelatedTags(tags: string[]): Promise<import("../entities/TagEntity").default[]>;
}
//# sourceMappingURL=TagModel.d.ts.map