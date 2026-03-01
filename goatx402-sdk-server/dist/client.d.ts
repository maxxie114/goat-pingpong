/**
 * GoatX402 Server SDK Client
 *
 * This client handles API authentication securely on the backend.
 * Never expose API credentials to the frontend!
 */
import type { GoatX402Config, CreateOrderParams, Order, OrderProof, OrderProofResponse, MerchantInfo, X402PaymentRequired } from './types.js';
export declare class GoatX402Client {
    private baseUrl;
    private apiKey;
    private apiSecret;
    constructor(config: GoatX402Config);
    /**
     * Create a new payment order
     * Returns an x402-compliant response normalized to the Order struct
     */
    createOrder(params: CreateOrderParams): Promise<Order>;
    /**
     * Create a new payment order and return the raw x402 response
     * Use this if you need full x402 protocol access
     */
    createOrderRaw(params: CreateOrderParams): Promise<X402PaymentRequired>;
    /**
     * Parse x402 response to normalized Order struct
     */
    private parseX402ToOrder;
    /**
     * Get order status and details (for polling)
     */
    getOrderStatus(orderId: string): Promise<OrderProof>;
    /**
     * Get order proof for on-chain verification
     * Only available after payment is confirmed
     */
    getOrderProof(orderId: string): Promise<OrderProofResponse>;
    /**
     * Submit user's EIP-712 signature for calldata
     */
    submitCalldataSignature(orderId: string, signature: string): Promise<void>;
    /**
     * Cancel an order that is in CHECKOUT_VERIFIED status
     * This will restore any reserved balance and refund fees
     */
    cancelOrder(orderId: string): Promise<void>;
    /**
     * Get merchant information (public API, no authentication required)
     */
    getMerchant(merchantId: string): Promise<MerchantInfo>;
    /**
     * Poll for order confirmation
     */
    waitForConfirmation(orderId: string, options?: {
        timeout?: number;
        interval?: number;
        onStatusChange?: (status: string) => void;
    }): Promise<OrderProof>;
    /**
     * Make authenticated API request
     */
    private request;
    /**
     * Make public API request (no authentication)
     */
    private publicRequest;
}
//# sourceMappingURL=client.d.ts.map