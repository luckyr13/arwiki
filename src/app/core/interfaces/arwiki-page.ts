export interface ArwikiPage {
	title: string;
	slug: string;
	category: string;
	language: string;
	content?: string;
	img?: string;
	txaddress?: string;
	owner?: string;
}