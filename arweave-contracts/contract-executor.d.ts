
/// <reference no-default-lib="true"/>

declare function ContractAssert(cond: boolean, message: string): void;
declare class ContractError extends Error {}
declare class SmartWeaveClass {
	contracts: {
		readContractState(contractId: string): Promise<any>
	};
	transaction: {
		id: string,
		owner: any,
		target: any,
		quantity: any,
		reward: any,
		tags: { name: string, value: any }[],
	};
	block: {
		height: number,
		indep_hash: string,
		timestamp: number,
	};
	arweave: {
		crypto(): any;
		utils(): any;
		ar(): any;
		wallets(): any;
	}
}

declare var SmartWeave: SmartWeaveClass;

declare module '@verto/flex';

declare interface ActionInterface {
  input: any;
  caller: string;
};