/**
 * ERC20 Token Contract Helpers
 */
import { ethers } from 'ethers';
export declare class ERC20Token {
    private contract;
    constructor(tokenAddress: string, signerOrProvider: ethers.Signer | ethers.Provider);
    /**
     * Get token balance
     */
    balanceOf(address: string): Promise<bigint>;
    /**
     * Get token allowance
     */
    allowance(owner: string, spender: string): Promise<bigint>;
    /**
     * Get token decimals
     */
    decimals(): Promise<number>;
    /**
     * Get token symbol
     */
    symbol(): Promise<string>;
    /**
     * Approve spender to transfer tokens
     */
    approve(spender: string, amount: bigint): Promise<ethers.TransactionResponse>;
    /**
     * Transfer tokens to recipient
     */
    transfer(to: string, amount: bigint): Promise<ethers.TransactionResponse>;
    /**
     * Check if approval is needed and approve if necessary
     * Returns true if a new approval transaction was sent
     */
    ensureApproval(owner: string, spender: string, amount: bigint): Promise<{
        needed: boolean;
        tx?: ethers.TransactionResponse;
    }>;
}
/**
 * Parse amount string to wei (bigint)
 */
export declare function parseUnits(amount: string, decimals: number): bigint;
/**
 * Format wei to human-readable amount
 */
export declare function formatUnits(amount: bigint, decimals: number): string;
//# sourceMappingURL=erc20.d.ts.map