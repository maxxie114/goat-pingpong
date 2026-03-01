/**
 * HMAC-SHA256 signature utilities for GoatX402 API authentication
 */
/**
 * Calculate HMAC-SHA256 signature for API request
 *
 * Algorithm:
 * 1. Sort all parameters by key in ASCII order
 * 2. Concatenate as key1=value1&key2=value2 format
 * 3. Encrypt using HMAC-SHA256 algorithm
 * 4. Return hexadecimal string
 */
export declare function calculateSignature(params: Record<string, string>, secret: string): string;
/**
 * Generate authentication headers for API request
 */
export declare function signRequest(params: Record<string, unknown>, apiKey: string, apiSecret: string): {
    'X-API-Key': string;
    'X-Timestamp': string;
    'X-Nonce': string;
    'X-Sign': string;
};
//# sourceMappingURL=signature.d.ts.map