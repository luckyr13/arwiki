import { ArwikiPageUpdate } from './arwiki-page-update';

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
	value?: number;
	start?: number;
	pageRewardAt?: number;
	sponsor?: string;
	author?: string;
	active?: boolean;
	updates?: ArwikiPageUpdate[]
}