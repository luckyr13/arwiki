export interface UserProfile {
	username: string;
	handleName: string;
	name: string;
	bio: string;
	address: string;
	avatar: string;
	banner: string;
	avatarURL: string;
	bannerURL: string;
	links: Record<string, string>;
	wallets: Record<string, string>;
	email: string;
}