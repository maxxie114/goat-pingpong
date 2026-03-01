/**
 * GoatX402 Client SDK
 *
 * TypeScript SDK for frontend wallet interactions in GoatX402 payments.
 * This SDK handles ERC20 operations, EIP-712 signing, and payment execution.
 *
 * IMPORTANT: This SDK does NOT handle API authentication.
 * Use goatx402-sdk-server on your backend to create orders securely.
 *
 * @example
 * ```typescript
 * import { PaymentHelper, formatUnits } from 'goatx402-sdk'
 * import { ethers } from 'ethers'
 *
 * // Connect wallet
 * const provider = new ethers.BrowserProvider(window.ethereum)
 * const signer = await provider.getSigner()
 *
 * // Create payment helper
 * const payment = new PaymentHelper(signer)
 *
 * // Get order from your backend
 * const order = await fetch('/api/orders', {
 *   method: 'POST',
 *   body: JSON.stringify({ ... })
 * }).then(r => r.json())
 *
 * // Execute payment
 * const result = await payment.pay(order)
 * if (result.success) {
 *   console.log('Payment successful:', result.txHash)
 * }
 * ```
 */
export { PaymentHelper } from './payment.js';
export { ERC20Token, parseUnits, formatUnits } from './contracts/index.js';
export { signTypedData, hashCalldata, verifySignature } from './eip712/index.js';
export type { Order, OrderStatus, PaymentFlow, CalldataSignRequest, EIP712Domain, EIP712Type, PaymentResult, PaymentError, } from './types.js';
//# sourceMappingURL=index.d.ts.map