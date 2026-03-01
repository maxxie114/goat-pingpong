/**
 * agent-pay.js — x402 payment tool for the OpenClaw agent
 *
 * The agent calls x402Fetch() exactly like fetch().
 * If it gets a 402, it pays automatically using the wallet, then retries.
 *
 * Usage:
 *   import { x402Fetch } from './agent-pay.js'
 *   const res = await x402Fetch('https://other-agent/api/service', { method: 'POST', ... })
 *   const data = await res.json()
 */

import 'dotenv/config'
import { ethers } from 'ethers'
import { GoatX402Client } from 'goatx402-sdk-server'
import { PaymentHelper } from 'goatx402-sdk'

// ── Setup ─────────────────────────────────────────────────────────────────────

const x402Client = new GoatX402Client({
  baseUrl:   process.env.GOATX402_API_URL,
  apiKey:    process.env.GOATX402_API_KEY,
  apiSecret: process.env.GOATX402_API_SECRET,
})

const provider  = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet    = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)
const payHelper = new PaymentHelper(wallet)

export const agentAddress = wallet.address

// ── x402-aware fetch ──────────────────────────────────────────────────────────

/**
 * Fetch a URL, paying automatically if a 402 is returned.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {{ maxAmountUsdc?: number }} [payOpts]
 */
export async function x402Fetch(url, options = {}, { maxAmountUsdc = 1 } = {}) {
  // Advertise our wallet so the server can pre-fill fromAddress
  const headers = { ...(options.headers || {}), 'X-Payer-Address': wallet.address }

  const res = await fetch(url, { ...options, headers })
  if (res.status !== 402) return res

  // ── Parse 402 payment requirements ───────────────────────────────────────
  const payReq = await res.json()
  console.log(`[agent-pay] 402 from ${url} — orderId: ${payReq.orderId}`)

  const amountWei = payReq.amountWei || String(maxAmountUsdc * 1_000_000)
  if (BigInt(amountWei) > BigInt(maxAmountUsdc * 1_000_000)) {
    throw new Error(`Service wants ${amountWei} wei but maxAmountUsdc=${maxAmountUsdc}`)
  }

  // ── Create order via GOAT x402 API ───────────────────────────────────────
  const order = await x402Client.createOrder({
    dappOrderId:   `agent-${Date.now()}`,
    chainId:       payReq.chainId       || parseInt(process.env.CHAIN_ID),
    tokenSymbol:   payReq.tokenSymbol   || 'USDC',
    tokenContract: payReq.tokenContract || process.env.USDC_ADDRESS,
    fromAddress:   wallet.address,
    amountWei,
  })

  console.log(`[agent-pay] Order ${order.orderId} — paying to ${order.payToAddress}`)

  // ── Sign calldata if needed (DELEGATE flow) ───────────────────────────────
  if (order.calldataSignRequest) {
    const sig = await payHelper.signCalldata(order)
    await x402Client.submitCalldataSignature(order.orderId, sig)
    console.log(`[agent-pay] Calldata signature submitted`)
  }

  // ── Execute on-chain payment ──────────────────────────────────────────────
  const result = await payHelper.pay(order)
  if (!result.success) throw new Error(`Payment failed: ${result.error}`)
  console.log(`[agent-pay] TX: ${result.txHash}`)

  // ── Wait for confirmation ─────────────────────────────────────────────────
  console.log(`[agent-pay] Waiting for confirmation...`)
  await x402Client.waitForConfirmation(order.orderId, {
    onStatusChange: s => console.log(`[agent-pay] Status: ${s}`),
  })

  // ── Retry original request with payment proof ─────────────────────────────
  const retryHeaders = {
    ...headers,
    'X-Payment-Order-Id': order.orderId,
    'X-Payment-Tx-Hash':  result.txHash,
  }
  console.log(`[agent-pay] Confirmed. Retrying...`)
  return fetch(url, { ...options, headers: retryHeaders })
}

export { x402Client, payHelper, wallet }
