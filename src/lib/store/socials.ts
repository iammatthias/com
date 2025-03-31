import { readable } from 'svelte/store';

export interface SocialPlatform {
	name: string;
	url: string;
	username: string;
	blurb: string;
}

export const socials = readable<SocialPlatform[]>([
	{
		name: 'Warpcast',
		url: 'https://warpcast.com/iammatthias',
		username: '@iammatthias',
		blurb:
			'Farcaster is a "sufficiently decentralized" social protocol. There are multiple clients, but I use Warpcast.'
	},
	{
		name: 'Glass',
		url: 'https://glass.photo/iam',
		username: '@iam',
		blurb: 'Glass is a photography-centric platform, and is where I post most of my pictures.'
	},
	{
		name: 'Instagram',
		url: 'https://instagram.com/iammatthias',
		username: '@iammatthias',
		blurb: 'Not as active as it used to be, I share pictures on Glass these days.'
	},
	{
		name: 'Threads',
		url: 'https://www.threads.net/@iammatthias',
		username: '@iammatthias',
		blurb: 'Mostly inactive.'
	},
	{
		name: 'GitHub',
		url: 'https://github.com/iammatthias',
		username: '@iammatthias',
		blurb: 'Work and side projects.'
	},
	{
		name: 'LinkedIn',
		url: 'https://linkedin.com/in/iammatthias',
		username: '@iammatthias',
		blurb: 'An up-to-date snapshot of my professional career.'
	},
	{
		name: 'Mastadon',
		url: 'https://mastodon.social/@iammatthias',
		username: '@iammatthias',
		blurb: 'I maintain an account, but I am not active.'
	},
	{
		name: 'Twitter',
		url: 'https://twitter.com/iammatthias',
		username: '@iammatthias',
		blurb: 'I maintain an account, but I have deleted almost all content.'
	}
]);
