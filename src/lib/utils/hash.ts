import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Creates a deterministic hash using keccak256
 * The hash is based on the content's title, publish date, and update date
 */
export function generateHash(title: string, publishDate?: string, updateDate?: string): string {
	// Combine all inputs into a single string
	const input = [title || '', publishDate || '', updateDate || ''].join('|');

	// Convert string to Uint8Array
	const data = new TextEncoder().encode(input);

	// Generate keccak256 hash and convert to hex
	return bytesToHex(keccak_256(data));
}
