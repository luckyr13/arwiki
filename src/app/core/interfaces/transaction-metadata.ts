export interface TransactionMetadata {
	id: string;
  owner: string;
  blockId?: string;
  blockHeight?: number;
  blockTimestamp?: number|string;
  dataSize?: number;
	dataType?: string;
  tags?: {name: string, value: string}[];
}