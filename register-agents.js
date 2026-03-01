/**
 * Register our wallets directly as ERC-8004 agents on-chain.
 * Reads token #36's URI from the contract to get the exact JSON structure,
 * then registers both our wallets with matching metadata.
 */

import 'dotenv/config'
import { ethers } from 'ethers'

const ERC8004 = '0x556089008Fc0a60cD09390Eca93477ca254A5522'
const ABI = [
  'function register(string uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
]

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet1  = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY,  provider)
const wallet2  = new ethers.Wallet(process.env.WALLET2_PRIVATE_KEY, provider)
const reader   = new ethers.Contract(ERC8004, ABI, provider)

// ── Read existing token URI to get JSON structure ──────────────────────────────
console.log('Reading tokenURI(36) from contract...')
const uri36 = await reader.tokenURI(36)
const b64   = uri36.replace('data:application/json;base64,', '')
const meta  = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
console.log('Existing metadata structure:', JSON.stringify(meta, null, 2))

// ── Build URIs preserving the same structure ───────────────────────────────────
function makeUri(name, description, metadataId) {
  const m   = { ...meta, name, description, metadataId }
  const b64 = Buffer.from(JSON.stringify(m)).toString('base64')
  return `data:application/json;base64,${b64}`
}

const uri1 = makeUri(
  'OpenClaw AI',
  'A general-purpose AI agent that answers questions, performs tasks, and accepts x402 micro-payments per request on GOAT Testnet3.',
  'openclaw'
)
const uri2 = makeUri(
  'claw_ui',
  'A counter-agent for OpenClaw AI, trading back and forth to demonstrate on-chain agent-to-agent x402 payments on GOAT Testnet3.',
  'claw_ui'
)

// ── Register both wallets ──────────────────────────────────────────────────────
const iface = new ethers.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
])

async function register(wallet, uri, label) {
  const contract = new ethers.Contract(ERC8004, ABI, wallet)
  console.log(`\nRegistering ${label}...`)
  console.log(`  Wallet: ${wallet.address}`)
  const tx      = await contract.register(uri)
  console.log(`  TX:     ${tx.hash}`)
  const receipt = await tx.wait()
  const log     = receipt.logs.find(l => { try { iface.parseLog(l); return true } catch { return false } })
  const tokenId = log ? iface.parseLog(log).args.tokenId : '?'
  console.log(`  ✓ Token ID #${tokenId}  block ${receipt.blockNumber}`)
  console.log(`  Explorer: ${process.env.EXPLORER_URL}/tx/${tx.hash}`)
  return tokenId
}

const id1 = await register(wallet1, uri1, 'OpenClaw AI (Agent 1)')
const id2 = await register(wallet2, uri2, 'claw_ui     (Agent 2)')

console.log(`\n✅ Both wallets registered as ERC-8004 agents!`)
console.log(`   Agent 1 Token #${id1} → ${wallet1.address}`)
console.log(`   Agent 2 Token #${id2} → ${wallet2.address}`)
console.log(`   Dashboard: https://goat-dashboard.vercel.app/`)
