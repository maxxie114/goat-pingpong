/**
 * OpenClaw AI — x402 Server
 *
 * Exposes paid API endpoints protected by x402.
 * Other agents must pay USDC to call /api/generate.
 */

import 'dotenv/config'
import express from 'express'
import { GoatX402Client } from 'goatx402-sdk-server'
import { ethers } from 'ethers'
import { PaymentHelper } from 'goatx402-sdk'

const app = express()
app.use(express.json())
const PORT = process.env.PORT || 3000

// ── SDK setup ─────────────────────────────────────────────────────────────────

const x402Client = new GoatX402Client({
  baseUrl: process.env.GOATX402_API_URL,
  apiKey: process.env.GOATX402_API_KEY,
  apiSecret: process.env.GOATX402_API_SECRET,
})

const MERCHANT_ID = process.env.GOATX402_MERCHANT_ID
const CHAIN_ID    = parseInt(process.env.CHAIN_ID)
const USDC        = process.env.USDC_ADDRESS
const AMOUNT_WEI  = '100000' // 0.1 USDC (6 decimals)

// ── x402 middleware ───────────────────────────────────────────────────────────

async function requirePayment(req, res, next) {
  const orderId = req.headers['x-payment-order-id']

  // Step 2 — verify existing payment
  if (orderId) {
    try {
      const order = await x402Client.getOrderStatus(orderId)
      if (order.status === 'PAYMENT_CONFIRMED') {
        req.payment = { orderId, txHash: order.txHash }
        return next()
      }
      if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(order.status)) {
        return res.status(402).json({ error: 'Payment failed', status: order.status })
      }
      return res.status(402).json({ error: 'Payment pending — retry shortly', orderId })
    } catch (err) {
      return res.status(402).json({ error: err.message })
    }
  }

  // Step 1 — no payment yet, create order and return 402
  const fromAddress = req.headers['x-payer-address'] || ethers.ZeroAddress
  try {
    const order = await x402Client.createOrder({
      dappOrderId: `req-${Date.now()}`,
      chainId: CHAIN_ID,
      tokenSymbol: 'USDC',
      tokenContract: USDC,
      fromAddress,
      amountWei: AMOUNT_WEI,
    })

    return res.status(402).json({
      x402: true,
      orderId:      order.orderId,
      payToAddress: order.payToAddress,
      amountWei:    AMOUNT_WEI,
      tokenSymbol:  'USDC',
      tokenContract: USDC,
      chainId:      CHAIN_ID,
      instructions: [
        `Send 0.1 USDC to ${order.payToAddress} on chain ${CHAIN_ID}`,
        `Then retry with header: X-Payment-Order-Id: ${order.orderId}`,
      ],
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create payment order', detail: err.message })
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    agent: 'OpenClaw AI',
    agentId: `#${process.env.AGENT_ID}`,
    wallet: process.env.WALLET_ADDRESS,
    chainId: CHAIN_ID,
    x402: true,
    paidEndpoints: ['POST /api/generate — 0.1 USDC'],
  })
})

// Paid endpoint — requires 0.1 USDC via x402
app.post('/api/generate', requirePayment, (req, res) => {
  const { prompt } = req.body
  res.json({
    result: `[OpenClaw AI] ${prompt}`,   // TODO: wire to real openclaw agent
    agentId: `#${process.env.AGENT_ID}`,
    paidWith: req.payment,
  })
})

// Order management endpoints (for client-side polling)
app.post('/api/orders', async (req, res) => {
  try {
    const { chainId, tokenSymbol, tokenContract, fromAddress, amountWei } = req.body
    const order = await x402Client.createOrder({
      dappOrderId: `api-${Date.now()}`,
      chainId, tokenSymbol, tokenContract, fromAddress, amountWei,
    })
    res.json(order)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const status = await x402Client.getOrderStatus(req.params.id)
    res.json(status)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/orders/:id/signature', async (req, res) => {
  try {
    await x402Client.submitCalldataSignature(req.params.id, req.body.signature)
    res.json({ success: true })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\nOpenClaw AI x402 server on :${PORT}`)
  console.log(`Wallet:  ${process.env.WALLET_ADDRESS}`)
  console.log(`Agent:   #${process.env.AGENT_ID}`)
  console.log(`Chain:   GOAT Testnet3 (${CHAIN_ID})`)
  console.log(`\nGET  /              → agent info`)
  console.log(`POST /api/generate  → paid AI (0.1 USDC via x402)`)
})
