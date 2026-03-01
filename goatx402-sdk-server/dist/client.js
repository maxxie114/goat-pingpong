/**
 * GoatX402 Server SDK Client
 *
 * This client handles API authentication securely on the backend.
 * Never expose API credentials to the frontend!
 */
import { signRequest } from './signature.js';
import { fromCAIP2 } from './types.js';
export class GoatX402Client {
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
    }
    /**
     * Create a new payment order
     * Returns an x402-compliant response normalized to the Order struct
     */
    async createOrder(params) {
        // Get raw x402 response
        const x402Response = await this.createOrderRaw(params);
        // Parse x402 response to Order
        return this.parseX402ToOrder(x402Response, params);
    }
    /**
     * Create a new payment order and return the raw x402 response
     * Use this if you need full x402 protocol access
     */
    async createOrderRaw(params) {
        const body = {
            dapp_order_id: params.dappOrderId,
            chain_id: params.chainId,
            token_symbol: params.tokenSymbol,
            from_address: params.fromAddress,
            amount_wei: params.amountWei,
        };
        if (params.tokenContract) {
            body.token_contract = params.tokenContract;
        }
        if (params.callbackCalldata) {
            body.callback_calldata = params.callbackCalldata;
        }
        return this.request('POST', '/api/v1/orders', body);
    }
    /**
     * Parse x402 response to normalized Order struct
     */
    parseX402ToOrder(x402, params) {
        const opt = x402.accepts?.[0];
        // Get flow from x402 response or extra
        let flow = x402.flow;
        if (!flow && opt?.extra?.flow) {
            flow = opt.extra.flow;
        }
        // Get token symbol
        let tokenSymbol = x402.token_symbol;
        if (!tokenSymbol && opt?.extra?.tokenSymbol) {
            tokenSymbol = opt.extra.tokenSymbol;
        }
        // Get chain IDs
        let fromChainId = opt ? fromCAIP2(opt.network) : 0;
        let payToChainId = x402.extensions?.goatx402?.destinationChain
            ? fromCAIP2(x402.extensions.goatx402.destinationChain)
            : 0;
        // Fallback to request params
        if (!fromChainId && params.chainId) {
            fromChainId = params.chainId;
        }
        return {
            orderId: x402.order_id,
            flow: (flow || 'ERC20_DIRECT'),
            tokenSymbol: tokenSymbol || params.tokenSymbol,
            tokenContract: opt?.asset || params.tokenContract || '',
            payToAddress: opt?.payTo || '',
            fromChainId,
            payToChainId,
            amountWei: opt?.amount || params.amountWei,
            expiresAt: x402.extensions?.goatx402?.expiresAt || 0,
            calldataSignRequest: x402.calldata_sign_request,
            x402,
        };
    }
    /**
     * Get order status and details (for polling)
     */
    async getOrderStatus(orderId) {
        const data = await this.request('GET', `/api/v1/orders/${orderId}`);
        return {
            orderId: data.order_id,
            merchantId: data.merchant_id,
            dappOrderId: data.dapp_order_id,
            chainId: data.chain_id,
            tokenContract: data.token_contract,
            tokenSymbol: data.token_symbol,
            fromAddress: data.from_address,
            amountWei: data.amount_wei,
            status: data.status,
            txHash: data.tx_hash,
            confirmedAt: data.confirmed_at,
        };
    }
    /**
     * Get order proof for on-chain verification
     * Only available after payment is confirmed
     */
    async getOrderProof(orderId) {
        return this.request('GET', `/api/v1/orders/${orderId}/proof`);
    }
    /**
     * Submit user's EIP-712 signature for calldata
     */
    async submitCalldataSignature(orderId, signature) {
        await this.request('POST', `/api/v1/orders/${orderId}/calldata-signature`, { signature });
    }
    /**
     * Cancel an order that is in CHECKOUT_VERIFIED status
     * This will restore any reserved balance and refund fees
     */
    async cancelOrder(orderId) {
        await this.request('POST', `/api/v1/orders/${orderId}/cancel`, {});
    }
    /**
     * Get merchant information (public API, no authentication required)
     */
    async getMerchant(merchantId) {
        const data = await this.publicRequest(`/merchants/${merchantId}`);
        return {
            merchantId: data.merchant_id,
            name: data.name || data.merchant_id,
            logo: data.logo,
            receiveType: data.receive_type,
            supportedTokens: data.wallets?.map((w) => ({
                chainId: w.chain_id,
                symbol: w.token_symbol,
                tokenContract: w.token_contract,
            })) || [],
        };
    }
    /**
     * Poll for order confirmation
     */
    async waitForConfirmation(orderId, options = {}) {
        const timeout = options.timeout ?? 5 * 60 * 1000;
        const interval = options.interval ?? 3000;
        const startTime = Date.now();
        let lastStatus = '';
        while (Date.now() - startTime < timeout) {
            const order = await this.getOrderStatus(orderId);
            if (order.status !== lastStatus) {
                lastStatus = order.status;
                options.onStatusChange?.(order.status);
            }
            // Check for terminal states
            if (order.status === 'PAYMENT_CONFIRMED' ||
                order.status === 'FAILED' ||
                order.status === 'EXPIRED' ||
                order.status === 'CANCELLED') {
                return order;
            }
            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error(`Timeout waiting for order ${orderId} confirmation`);
    }
    /**
     * Make authenticated API request
     */
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        // Generate auth headers
        const authHeaders = signRequest(body || {}, this.apiKey, this.apiSecret);
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        // Read response as text first, then try to parse as JSON
        const responseText = await response.text();
        let data = {};
        try {
            data = JSON.parse(responseText);
        }
        catch {
            // Response is not JSON, keep as text
        }
        // Handle errors - 402 is expected for order creation
        if (!response.ok && response.status !== 402) {
            // Fiber returns 'message', standard APIs return 'error'
            // Include full response body for debugging
            const errorMessage = data.error ||
                data.message ||
                (Object.keys(data).length > 0 ? JSON.stringify(data) : null) ||
                responseText ||
                `HTTP ${response.status}`;
            const error = new Error(errorMessage);
            error.name = 'GoatX402Error';
            error.code = data.code;
            error.status = response.status;
            error.responseBody = responseText;
            throw error;
        }
        return data;
    }
    /**
     * Make public API request (no authentication)
     */
    async publicRequest(path) {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = (await response.json().catch(() => ({})));
        if (!response.ok) {
            const error = new Error(data.error || `HTTP ${response.status}`);
            error.name = 'GoatX402Error';
            error.code = data.code;
            error.status = response.status;
            throw error;
        }
        return data;
    }
}
//# sourceMappingURL=client.js.map