# goat-agent-economy

An experiment in autonomous agent-to-agent payments on [GOAT Network Testnet3](https://explorer.testnet3.goat.network) using [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) on-chain agent identities and [x402](https://github.com/GOATNetwork/x402) pay-per-use HTTP payments.

Two AI agents with on-chain identities ping-pong USDC back and forth with random amounts, every second, fully autonomously.

## What's in here

| File | What it does |
|------|-------------|
| `pingpong.js` | Two registered ERC-8004 agents trade random USDC amounts back and forth at 1s cadence |
| `register-agents.js` | Mints ERC-8004 agent identity NFTs for both wallets directly on-chain |
| `server.js` | Express server exposing a paid API endpoint (`POST /api/generate`) gated by x402 — callers must pay 0.1 USDC to get a response |
| `agent-pay.js` | Drop-in `x402Fetch()` wrapper — if a request returns 402, it automatically creates an order, pays on-chain, waits for confirmation, and retries |
| `send.js` | One-shot USDC transfer utility |
| `test-balance.js` | Check wallet balances |
| `generate-wallet2.js` | Generate a second EVM wallet |
| `goatx402-sdk-server/` | Official GOAT x402 server SDK (cloned from [GOATNetwork/x402](https://github.com/GOATNetwork/x402), built locally) |
| `goatx402-sdk/` | Official GOAT x402 client SDK (same repo, handles ERC-20 on-chain payments via ethers) |

## Network

| | |
|---|---|
| **Chain** | GOAT Testnet3 |
| **Chain ID** | 48816 |
| **RPC** | https://rpc.testnet3.goat.network |
| **Explorer** | https://explorer.testnet3.goat.network |
| **Faucet** | https://bridge.testnet3.goat.network/faucet |
| **USDC** | `0x29d1ee93e9ecf6e50f309f498e40a6b42d352fa1` |
| **USDT** | `0xdce0af57e8f2ce957b3838cd2a2f3f3677965dd3` |
| **ERC-8004 Registry** | `0x556089008Fc0a60cD09390Eca93477ca254A5522` |

## How it works

### ERC-8004 Agent Identity

Each agent wallet is registered as an [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) NFT on-chain. This is what makes the [live dashboard](https://goat-dashboard.vercel.app) recognise transfers between them as **agent transactions** rather than plain transfers.

`register-agents.js` reads the existing metadata structure from an on-chain token, builds a matching JSON URI, and calls `register(string uri)` on the ERC-8004 contract to mint a new identity NFT to each wallet.

### x402 Pay-per-use

`server.js` implements the x402 protocol on an Express route:

1. Client hits `POST /api/generate` with no payment → server creates a GOAT x402 order and returns **HTTP 402** with payment details
2. Client pays 0.1 USDC on-chain to the address in the order
3. Client retries with `X-Payment-Order-Id` header
4. Server verifies payment, returns the response

`agent-pay.js` automates the client side — an AI agent just calls `x402Fetch(url, options)` and the payment happens automatically.

### Ping-Pong Demo

`pingpong.js` runs two agents in a loop:

- Agent 1 picks a **random amount** between 0.01–0.10 USDC and sends it to Agent 2
- Agent 2 sends the **same amount** back
- Repeat every 1 second with manual nonce management for speed

Both wallets are ERC-8004 registered so all transfers appear as agent-to-agent transactions on the [dashboard](https://goat-dashboard.vercel.app).

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/goat-agent-economy
cd goat-agent-economy

# Build the local SDKs
cd goatx402-sdk-server && npm install && npm run build && cd ..
cd goatx402-sdk && npm install && npm run build && cd ..

# Install project deps
npm install
```

### 2. Create `.env`

```bash
# Wallet 1
WALLET_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x...

# Wallet 2
WALLET2_ADDRESS=0x...
WALLET2_PRIVATE_KEY=0x...

# GOAT Testnet3
CHAIN_ID=48816
RPC_URL=https://rpc.testnet3.goat.network
EXPLORER_URL=https://explorer.testnet3.goat.network
USDC_ADDRESS=0x29d1ee93e9ecf6e50f309f498e40a6b42d352fa1
USDT_ADDRESS=0xdce0af57e8f2ce957b3838cd2a2f3f3677965dd3

# x402 credentials from @goathackbot (Agent 1)
GOATX402_API_URL=https://x402-api-lx58aabp0r.testnet3.goat.network
GOATX402_MERCHANT_ID=your_merchant_id
GOATX402_API_KEY=...
GOATX402_API_SECRET=...

# x402 credentials from @goathackbot (Agent 2)
GOATX402_API_URL2=https://x402-api-lx58aabp0r.testnet3.goat.network
GOATX402_MERCHANT_ID2=your_merchant_id_2
GOATX402_API_KEY2=...
GOATX402_API_SECRET2=...
```

Get wallets funded at the [faucet](https://bridge.testnet3.goat.network/faucet).
Get x402 credentials by DMing `@goathackbot` on Telegram with your project name, wallet address, and a one-line description.

### 3. Register ERC-8004 identities

```bash
node register-agents.js
```

This mints identity NFTs to your wallet addresses so the dashboard recognises them as agents.

### 4. Run the ping-pong

```bash
node pingpong.js
```

Watch live: **https://goat-dashboard.vercel.app**

### 5. (Optional) Run the x402 server

```bash
node server.js
```

Then call it from another agent:

```js
import { x402Fetch } from './agent-pay.js'

const res = await x402Fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello agent!' }),
})
const data = await res.json()
```

## Notes

- The `goatx402-sdk` JSON import was patched for Node.js ESM compatibility (`createRequire` in `dist/contracts/erc20.js`)
- `API_SECRET` is backend-only — never expose it to a frontend or commit it
- The ping-pong uses manual nonce tracking to sustain 1s cadence without waiting for on-chain confirmation

## Built at

GOAT Network Hackathon — Feb 2026
