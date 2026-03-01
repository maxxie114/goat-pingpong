/**
 * GoatX402 Server SDK
 *
 * TypeScript SDK for server-side GoatX402 payment integration.
 * This SDK handles API authentication securely - never expose credentials to the frontend!
 *
 * @example
 * ```typescript
 * import { GoatX402Client } from 'goatx402-sdk-server'
 *
 * const client = new GoatX402Client({
 *   baseUrl: 'https://api.goatx402.io',
 *   apiKey: process.env.GOATX402_API_KEY!,
 *   apiSecret: process.env.GOATX402_API_SECRET!,
 * })
 *
 * // Create an order
 * const order = await client.createOrder({
 *   dappOrderId: 'my-order-123',
 *   chainId: 97,
 *   tokenSymbol: 'USDC',
 *   tokenContract: '0x...',
 *   fromAddress: userWalletAddress,
 *   amountWei: '1000000',
 * })
 *
 * // Return order to frontend for payment
 * res.json(order)
 * ```
 */
export { GoatX402Client } from './client.js';
export { calculateSignature, signRequest } from './signature.js';
// x402 helper functions
export { toCAIP2, fromCAIP2, parseX402Header } from './types.js';
//# sourceMappingURL=index.js.map