export interface ArweaveGateway {
	host: string;
	port: number;
	protocol: "http" | "https";
	useArweaveGW: boolean;
	contractAddress: string;
}