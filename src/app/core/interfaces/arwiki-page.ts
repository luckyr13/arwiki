import { ArwikiPageUpdate } from './arwiki-page-update';

export interface ArwikiPage {
	id: string;
	title: string;
	slug: string;
	category: string;
	language: string;
	order?: number;
	img?: string;
	block?: any;
	value?: number;
	sponsor?: string;
	active?: boolean;
	updates?: ArwikiPageUpdate[];
	lastUpdateAt?: number;
	rawContent?: string;
	showInMenu?: boolean;
	showInMainPage?: boolean;
	showInFooter?: boolean;
	nft?: string;
	owner?: string;
	dataInfo?: { size: string|number, type: string };
}