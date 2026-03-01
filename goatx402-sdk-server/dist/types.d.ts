/**
 * GoatX402 Server SDK Type Definitions
 */
export interface GoatX402Config {
    /** API base URL */
    baseUrl: string;
    /** Merchant API Key */
    apiKey: string;
    /** Merchant API Secret (keep this secure on the server!) */
    apiSecret: string;
}
export type PaymentFlow = 'ERC20_DIRECT' | 'ERC20_3009' | 'ERC20_APPROVE_XFER';
export interface CreateOrderParams {
    /** Unique order ID from DApp */
    dappOrderId: string;
    /** Source chain ID (where user pays) */
    chainId: number;
    /** Token symbol (e.g., 'USDC', 'USDT') */
    tokenSymbol: string;
    /** Token contract address (optional, looked up by symbol) */
    tokenContract?: string;
    /** Payer wallet address */
    fromAddress: string;
    /** Payment amount in wei (string for big numbers) */
    amountWei: string;
    /** Optional callback calldata for DELEGATE merchants */
    callbackCalldata?: string;
}
export interface Order {
    /** Order ID from GoatX402 */
    orderId: string;
    /** Payment flow type */
    flow: PaymentFlow;
    /** Token symbol (e.g., "USDC", "USDT") */
    tokenSymbol: string;
    /** Token contract address on source chain */
    tokenContract: string;
    /** Recipient address for payment */
    payToAddress: string;
    /** Source chain ID (where user pays) */
    fromChainId: number;
    /** Destination chain ID (where merchant receives) */
    payToChainId: number;
    /** Payment amount in wei */
    amountWei: string;
    /** Order expiration timestamp (unix seconds) */
    expiresAt: number;
    /** Calldata sign request (for DELEGATE merchants) */
    calldataSignRequest?: CalldataSignRequest;
    /** Raw x402 response for advanced use cases */
    x402?: X402PaymentRequired;
}
export type OrderStatus = 'CHECKOUT_VERIFIED' | 'PAYMENT_CONFIRMED' | 'INVOICED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
export interface EIP712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}
export interface EIP712Type {
    name: string;
    type: string;
}
export interface CalldataSignRequest {
    domain: EIP712Domain;
    types: Record<string, EIP712Type[]>;
    primaryType: string;
    message: {
        token: string;
        owner: string;
        payer: string;
        amount: string;
        orderId: string;
        calldataNonce: string;
        deadline: string;
        calldataHash: string;
        permit2?: string;
    };
}
export interface OrderProof {
    orderId: string;
    merchantId: string;
    dappOrderId: string;
    chainId: number;
    tokenContract: string;
    tokenSymbol: string;
    fromAddress: string;
    amountWei: string;
    status: OrderStatus;
    txHash?: string;
    confirmedAt?: string;
}
export interface OrderProofResponse {
    payload: {
        order_id: string;
        tx_hash: string;
        log_index: number;
        from_addr: string;
        to_addr: string;
        amount_wei: string;
        chain_id: number;
        flow: string;
    };
    signature: string;
}
export interface MerchantInfo {
    merchantId: string;
    name: string;
    logo?: string;
    receiveType: 'DIRECT' | 'DELEGATE';
    supportedTokens: MerchantToken[];
}
export interface MerchantToken {
    chainId: number;
    symbol: string;
    tokenContract: string;
}
export declare class GoatX402Error extends Error {
    code?: string;
    status?: number;
    constructor(message: string, code?: string, status?: number);
}
/** x402 Resource describes the protected resource */
export interface X402Resource {
    url: string;
    description?: string;
    mimeType?: string;
}
/** x402 Payment Option describes one payment method the server accepts */
export interface X402PaymentOption {
    /** Payment scheme (e.g., "exact", "exact-eip3009") */
    scheme: string;
    /** Network in CAIP-2 format (e.g., "eip155:97") */
    network: string;
    /** Amount in atomic units as string */
    amount: string;
    /** Token contract address */
    asset: string;
    /** Recipient address */
    payTo: string;
    /** Maximum timeout in seconds */
    maxTimeoutSeconds: number;
    /** Additional data */
    extra?: {
        flow?: string;
        tokenSymbol?: string;
        eip712Domain?: EIP712Domain;
        eip712Types?: Record<string, EIP712Type[]>;
        eip712PrimaryType?: string;
        eip712Message?: Record<string, unknown>;
        [key: string]: unknown;
    };
}
/** GoatX402-specific extension in x402 response */
export interface X402GoatExtension {
    /** Destination chain in CAIP-2 format */
    destinationChain: string;
    /** Expiration timestamp (unix seconds) */
    expiresAt: number;
    /** Endpoint to submit signature (only present for EIP-3009 flow) */
    signatureEndpoint?: string;
    /** Payment method: "transfer" for direct transfer, "eip3009-signature" for gasless */
    paymentMethod: 'transfer' | 'eip3009-signature';
    /** Receive type: DIRECT, DELEGATE, or VERIFY (informational) */
    receiveType?: 'DIRECT' | 'DELEGATE' | 'VERIFY';
}
/** x402 Payment Required response (HTTP 402) */
export interface X402PaymentRequired {
    /** x402 protocol version */
    x402Version: number;
    /** Error message if any */
    error?: string;
    /** Protected resource info */
    resource: X402Resource;
    /** Accepted payment options */
    accepts: X402PaymentOption[];
    /** Protocol extensions */
    extensions?: {
        goatx402?: X402GoatExtension;
        [key: string]: unknown;
    };
    order_id: string;
    flow: string;
    token_symbol: string;
    /** Calldata sign request for DELEGATE merchants with callback */
    calldata_sign_request?: CalldataSignRequest;
}
/**
 * Convert chain ID to CAIP-2 format
 * @example toCAIP2(97) returns "eip155:97"
 */
export declare function toCAIP2(chainId: number): string;
/**
 * Parse CAIP-2 network identifier to chain ID
 * @example fromCAIP2("eip155:97") returns 97
 */
export declare function fromCAIP2(network: string): number;
/**
 * Parse base64-encoded x402 PAYMENT-REQUIRED header
 */
export declare function parseX402Header(headerValue: string): X402PaymentRequired | null;
//# sourceMappingURL=types.d.ts.map