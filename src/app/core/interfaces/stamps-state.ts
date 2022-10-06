interface Stamp {
	asset: string;
	address: string;
	flagged: boolean;
	timestamp: number;
}

export interface StampsState {
	pairs: [],
	halted: boolean;
	stamps: Record<string, Stamp>;
	ticker: string;
	creator: string;
	balances: Record<string, number>;
	canEvolve: boolean;
	invocations: any;
  foreignCalls: any;
  usedTransfers: any;
  emergencyHaltWallet: string;
}
