/**
 * GoatX402 Client SDK Type Definitions
 *
 * These types are used for frontend wallet interactions.
 * Order data is received from your backend (which uses goatx402-sdk-server).
 */
// ============================================================================
// Error Types
// ============================================================================
export class PaymentError extends Error {
    constructor(message, code, txHash) {
        super(message);
        this.name = 'PaymentError';
        this.code = code;
        this.txHash = txHash;
    }
}
//# sourceMappingURL=types.js.map