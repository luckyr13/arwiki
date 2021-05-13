import { ArwikiPage } from './arwiki-page';

export interface ArwikiPageIndex {
	[pageId: string]: ArwikiPage;
}