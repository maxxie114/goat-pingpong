/**
 * ERC20 Token Contract Helpers
 */
import { ethers } from 'ethers';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ERC20_ABI = require('../abis/ERC20.json');
export class ERC20Token {
    constructor(tokenAddress, signerOrProvider) {
        this.contract = new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
    }
    /**
     * Get token balance
     */
    async balanceOf(address) {
        return this.contract.balanceOf(address);
    }
    /**
     * Get token allowance
     */
    async allowance(owner, spender) {
        return this.contract.allowance(owner, spender);
    }
    /**
     * Get token decimals
     */
    async decimals() {
        return this.contract.decimals();
    }
    /**
     * Get token symbol
     */
    async symbol() {
        return this.contract.symbol();
    }
    /**
     * Approve spender to transfer tokens
     */
    async approve(spender, amount) {
        return this.contract.approve(spender, amount);
    }
    /**
     * Transfer tokens to recipient
     */
    async transfer(to, amount) {
        return this.contract.transfer(to, amount);
    }
    /**
     * Check if approval is needed and approve if necessary
     * Returns true if a new approval transaction was sent
     */
    async ensureApproval(owner, spender, amount) {
        const currentAllowance = await this.allowance(owner, spender);
        if (currentAllowance >= amount) {
            return { needed: false };
        }
        // Approve max uint256 for better UX (fewer future approvals)
        const tx = await this.approve(spender, ethers.MaxUint256);
        return { needed: true, tx };
    }
}
/**
 * Parse amount string to wei (bigint)
 */
export function parseUnits(amount, decimals) {
    return ethers.parseUnits(amount, decimals);
}
/**
 * Format wei to human-readable amount
 */
export function formatUnits(amount, decimals) {
    return ethers.formatUnits(amount, decimals);
}
//# sourceMappingURL=erc20.js.map