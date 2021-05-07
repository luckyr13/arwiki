import { ArwikiCategory } from './arwiki-category';

export interface ArwikiCategoryIndex {
	[slug: string]: ArwikiCategory
}