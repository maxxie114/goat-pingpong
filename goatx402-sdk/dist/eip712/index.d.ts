/**
 * EIP-712 Typed Data Signing Utilities
 */
import { ethers } from 'ethers';
import type { CalldataSignRequest, EIP712Domain, EIP712Type } from '../types.js';
/**
 * Sign EIP-712 typed data using ethers.js signer
 *
 * @param signer - Ethers signer
 * @param signRequest - Calldata sign request from order
 * @returns Signature string (0x prefixed)
 */
export declare function signTypedData(signer: ethers.Signer, signRequest: CalldataSignRequest): Promise<string>;
/**
 * Compute the hash of calldata for verification
 *
 * @param calldata - Raw calldata bytes (0x prefixed)
 * @returns keccak256 hash (0x prefixed)
 */
export declare function hashCalldata(calldata: string): string;
/**
 * Verify that a signature matches the expected signer
 *
 * @param signRequest - Calldata sign request
 * @param signature - Signature to verify
 * @param expectedSigner - Expected signer address
 * @returns True if signature is valid
 */
export declare function verifySignature(signRequest: CalldataSignRequest, signature: string, expectedSigner: string): boolean;
/**
 * Build EIP-712 domain separator
 */
export declare function buildDomainSeparator(domain: EIP712Domain): string;
export type { CalldataSignRequest, EIP712Domain, EIP712Type };
//# sourceMappingURL=index.d.ts.map