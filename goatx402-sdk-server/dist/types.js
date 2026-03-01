/**
 * GoatX402 Server SDK Type Definitions
 */
// ============================================================================
// Error Types
// ============================================================================
export class GoatX402Error extends Error {
    constructor(message, code, status) {
        super(message);
        this.name = 'GoatX402Error';
        this.code = code;
        this.status = status;
    }
}
// ============================================================================
// CAIP-2 Helper Functions
// See: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
// ============================================================================
/**
 * Convert chain ID to CAIP-2 format
 * @example toCAIP2(97) returns "eip155:97"
 */
export function toCAIP2(chainId) {
    return `eip155:${chainId}`;
}
/**
 * Parse CAIP-2 network identifier to chain ID
 * @example fromCAIP2("eip155:97") returns 97
 */
export function fromCAIP2(network) {
    const match = network.match(/^eip155:(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
}
/**
 * Parse base64-encoded x402 PAYMENT-REQUIRED header
 */
export function parseX402Header(headerValue) {
    try {
        const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=types.js.map