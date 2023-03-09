import { ArwikiPage } from './arwiki-page';

export interface ArwikiMenuCategory {
  category_slug: string;
  pages: ArwikiPage[];
  subcategories: ArwikiMenuCategory[];
}