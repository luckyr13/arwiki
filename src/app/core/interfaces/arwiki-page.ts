export interface ArwikiPage {
	id: string;
	title: string;
	slug: string;
	category: string;
	language: string;
	owner: string;
	content?: string;
	img?: string;
	block?: any;
}