/**
 * PaymentHelper - High-level payment execution for frontend
 *
 * This helper handles wallet interactions for executing payments.
 * Order data should be fetched from your backend.
 *
 * Payment Flow:
 * - All flows require the user to directly transfer tokens to payToAddress
 * - DIRECT mode: payToAddress = merchant address
 * - DELEGATE mode: payToAddress = TSS wallet address
 */
import { ethers } from 'ethers';
import type { Order, PaymentResult } from './types.js';
export declare class PaymentHelper {
    private signer;
    constructor(signer: ethers.Signer);
    /**
     * Get the signer's address
     */
    getAddress(): Promise<string>;
    /**
     * Execute payment based on order
     *
     * All payment flows require the user to directly transfer tokens to payToAddress.
     * The difference is only in where the tokens go:
     * - DIRECT mode: payToAddress = merchant's receiving address
     * - DELEGATE mode: payToAddress = TSS wallet address
     *
     * @param order - Order from your backend
     * @returns Payment result with transaction hash
     */
    pay(order: Order): Promise<PaymentResult>;
    /**
     * Transfer tokens to payToAddress
     */
    private transfer;
    /**
     * Sign calldata for DELEGATE merchants
     *
     * This is only needed when order.calldataSignRequest is present.
     * The signature should be submitted to your backend which will forward it to GoatX402.
     *
     * @param order - Order with calldataSignRequest
     * @returns Signature (0x prefixed)
     */
    signCalldata(order: Order): Promise<string>;
    /**
     * Get token balance
     */
    getTokenBalance(tokenContract: string): Promise<bigint>;
    /**
     * Get token allowance for a spender
     */
    getTokenAllowance(tokenContract: string, spender: string): Promise<bigint>;
    /**
     * Approve tokens for a spender (rarely needed for standard flows)
     */
    approveToken(tokenContract: string, spender: string, amount?: bigint): Promise<ethers.TransactionResponse>;
    /**
     * Transfer tokens directly (low-level, use pay() instead)
     */
    transferToken(tokenContract: string, to: string, amount: bigint): Promise<ethers.TransactionResponse>;
}
//# sourceMappingURL=payment.d.ts.map