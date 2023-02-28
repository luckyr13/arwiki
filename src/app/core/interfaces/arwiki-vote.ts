export interface ArwikiVote {
	key: string;
	nays: number;
	note: string;
	recipient: string;
	start: number;
	status: string;
	totalWeight: number;
	type: string;
	value: string|number;
	voted: string[];
	yays: number;
	qty?: number;
	lockLength?: number;
	target?: string;
}