/**
 * Agent Ping-Pong 🏓 — random amounts, 1s cadence
 *
 * Both wallets are ERC-8004 registered so direct ERC-20 transfers
 * show as agent transactions on the dashboard.
 *
 * Pattern (per pair):
 *   Agent 1 picks a random amount X  →  sends X to Agent 2
 *   Agent 2 sends the same X back    →  Agent 1 receives X
 *   (new random X next pair)
 */

import 'dotenv/config'
import { ethers } from 'ethers'

const INTERVAL_MS = 1_000
const MIN_WEI     = 10_000n          // 0.01 USDC
const MAX_WEI     = 100_000n         // 0.10 USDC
const USDC_ADDR   = process.env.USDC_ADDRESS
const EXPLORER    = process.env.EXPLORER_URL

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
]

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet1  = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY,  provider)
const wallet2  = new ethers.Wallet(process.env.WALLET2_PRIVATE_KEY, provider)
const usdc1    = new ethers.Contract(USDC_ADDR, ERC20_ABI, wallet1)
const usdc2    = new ethers.Contract(USDC_ADDR, ERC20_ABI, wallet2)

const short = a => `${a.slice(0,6)}…${a.slice(-4)}`

// ── Nonce tracking (manual, for fire-and-forget at 1s cadence) ───────────────

const nonces = {
  [wallet1.address]: await provider.getTransactionCount(wallet1.address, 'pending'),
  [wallet2.address]: await provider.getTransactionCount(wallet2.address, 'pending'),
}

function nextNonce(addr) { return nonces[addr]++ }

// ── Random amount in [MIN_WEI, MAX_WEI] ──────────────────────────────────────

function randomWei() {
  const range = Number(MAX_WEI - MIN_WEI)
  return MIN_WEI + BigInt(Math.floor(Math.random() * range))
}

function fmtUsdc(wei) { return (Number(wei) / 1_000_000).toFixed(4) }

// ── Fire a transfer (no await on confirmation) ────────────────────────────────

async function fire(usdc, from, to, amount, label) {
  const nonce = nextNonce(from.address)
  try {
    const tx = await usdc.transfer(to.address, amount, { nonce })
    console.log(`  ${label}  ${short(from.address)} → ${short(to.address)}  ${fmtUsdc(amount)} USDC  tx:${tx.hash.slice(0,10)}…`)
  } catch (err) {
    console.error(`  ❌ ${label} failed (nonce ${nonce}): ${err.message.slice(0,60)}`)
    // Reset nonce on error
    nonces[from.address] = await provider.getTransactionCount(from.address, 'pending')
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────

console.log('🏓 Agent Ping-Pong — random amounts, 1s cadence')
console.log(`   Agent 1: OpenClaw AI  ${wallet1.address}`)
console.log(`   Agent 2: claw_ui      ${wallet2.address}`)
console.log(`   Dashboard: https://goat-dashboard.vercel.app/`)
console.log('   Ctrl+C to stop\n')

let round = 1
let currentAmount = randomWei()

async function tick() {
  const isForward = round % 2 === 1   // odd = Agent1→Agent2, even = Agent2→Agent1

  if (isForward) {
    // Start of a new pair — pick fresh random amount
    currentAmount = randomWei()
  }

  if (isForward) {
    await fire(usdc1, wallet1, wallet2, currentAmount, `[${round}] ↗`)
  } else {
    await fire(usdc2, wallet2, wallet1, currentAmount, `[${round}] ↙`)
  }

  round++
  setTimeout(tick, INTERVAL_MS)
}

// Print balances every 10 seconds
setInterval(async () => {
  const [b1, b2] = await Promise.all([
    usdc1.balanceOf(wallet1.address),
    usdc2.balanceOf(wallet2.address),
  ])
  console.log(`\n  💰 OpenClaw AI: ${fmtUsdc(b1)} USDC  |  claw_ui: ${fmtUsdc(b2)} USDC\n`)
}, 10_000)

tick()
