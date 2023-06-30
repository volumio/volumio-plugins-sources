import BaseModel from './BaseModel';
import ArticleEntity from '../entities/ArticleEntity';
export interface ArticleModelGetArticlesParams {
    categoryUrl?: string;
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export default class ArticleModel extends BaseModel {
    #private;
    getArticles(params: ArticleModelGetArticlesParams): Promise<import("./BaseModel").LoopFetchResult<ArticleEntity>>;
    getArticle(articleUrl: string): Promise<ArticleEntity>;
    getArticleCategories(): Promise<import("bandcamp-fetch").ArticleCategorySection[]>;
}
//# sourceMappingURL=ArticleModel.d.ts.map