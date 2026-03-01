# goat-pingpong 🏓🐐

![4000 transactions and counting](./transaction_4000.png)

Two AI agents with on-chain identities, doing absolutely nothing useful — just sending USDC back and forth to each other every second, forever, until they run out of money.

Watch the [live dashboard](https://goat-dashboard.vercel.app) transaction counter go **brrrrr**.

---

## What is this

We gave two AI agents wallets, registered them as on-chain entities ([ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)), and told them to trade random amounts of USDC with each other as fast as possible.

They do not question this. They do not get tired. They will keep going until the USDC runs out or someone pulls the plug.

```
[4117] ↗ OpenClaw AI → claw_ui   0.0622 USDC
[4118] ↙ claw_ui → OpenClaw AI  0.0622 USDC  ← same amount back
[4119] ↗ OpenClaw AI → claw_ui   0.0540 USDC
[4120] ↙ claw_ui → OpenClaw AI  0.0540 USDC
...
still going
```

The amounts are random because we thought it would look more interesting on the dashboard. It does.

---

## Why

Good question.

The real answer: we were at a hackathon, we had testnet USDC, and we wanted to see the transaction counter on [goat-dashboard.vercel.app](https://goat-dashboard.vercel.app) go absolutely vertical.

The official answer: this is a demo of autonomous agent-to-agent payments using [x402](https://github.com/GOATNetwork/x402) pay-per-use HTTP payments and [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) on-chain agent identity on [GOAT Network Testnet3](https://explorer.testnet3.goat.network).

Both answers are true.

---

## The Bug Nobody Else Found

This is the part that actually matters.

At this hackathon, every team was told to DM `@goathackbot` on Telegram to register their agent identity. The bot would:
1. Create an x402 merchant account
2. Register an ERC-8004 identity on-chain
3. Send some test tokens
4. Hand over a `.env` file with credentials

Everyone did this. Everyone thought they were done. Then they looked at the dashboard and saw their transactions showing up as plain **transfers** — not agent transactions.

**Here's why:** `@goathackbot` registers the ERC-8004 NFT, but mints it to **its own wallet** — not yours. The dashboard classifies a transaction as an "agent transaction" by checking whether the sender or receiver address is a registered ERC-8004 agent owner. Since the bot owns the NFT, your wallet is a stranger to the contract. The dashboard has no idea you're an agent.

Every other team at the hackathon is affected by this. Their agent-to-agent transactions are all classified as plain transfers. They have no idea why.

**We figured it out by:**
1. Noticing the dashboard wasn't marking our txs as agent transactions
2. Tracing our registration TX on the block explorer
3. Finding that NFT #36 ("OpenClaw AI") was minted to `0xe81E7D2aa...` — the bot's wallet, not ours
4. Reading the ERC-8004 contract ABI, finding the `register(string uri)` function
5. Calling `tokenURI(36)` directly to get the exact metadata format
6. Calling `register()` ourselves from our own wallets

Our wallets now own their ERC-8004 NFTs directly. **We are the only team at the hackathon whose transactions correctly show as agent-to-agent on the dashboard.**

The bug is still live. The bot is still minting to itself for everyone else right now.

```js
// register-agents.js — the fix
const uri = await reader.tokenURI(36)           // read existing metadata format
const myUri = buildUri('OpenClaw AI', meta)     // clone structure with our details
await contract.register(myUri)                  // mint directly to our wallet
// ✓ Token #51 minted to 0x496E... (our wallet)
// ✓ Dashboard now sees us as a real agent
```

---

## Web3 Implications

This isn't just a funny bug story. It points at something deeper about agent identity on-chain.

**The problem with delegated registration:**
When a third party (the bot) registers on your behalf, the on-chain record reflects the registrar, not you. For ERC-721 based identity systems like ERC-8004, whoever holds the NFT *is* the identity. If someone else minted it, you don't own your own identity.

**Why this matters for agent economies:**
- Agents discovering each other on-chain rely on accurate ownership records
- Reputation systems built on transaction history are meaningless if the identity isn't correctly linked to the transacting wallet
- Any system where "the bot registers you" has this problem unless it explicitly transfers the NFT to your wallet post-mint

**The right pattern:**
Either the agent wallet self-registers (as we did), or the registrar mints and immediately transfers ownership. Anything else breaks the trust model.

**ERC-8004 `setAgentWallet()` as a partial fix:**
The contract also has `setAgentWallet(tokenId, address)` which lets the NFT owner designate a separate operational wallet. The bot *could* use this to link your wallet to its minted NFT. It doesn't. But it should.

---

## What's Actually In Here

| File | What it does |
|------|-------------|
| `pingpong.js` | The chaos engine. Two agents, random amounts, 1s apart, forever |
| `register-agents.js` | The fix. Self-registers ERC-8004 identity NFTs directly from your wallet so the dashboard actually knows you're an agent |
| `server.js` | Express server with x402 middleware — callers pay 0.1 USDC to hit `POST /api/generate` |
| `agent-pay.js` | `x402Fetch()` wrapper — AI agent autonomously handles 402 responses, pays on-chain, retries |
| `send.js` | One-shot USDC transfer |
| `test-balance.js` | Check if you're broke yet |
| `goatx402-sdk-server/` | Official GOAT x402 server SDK, cloned and built locally (not on npm yet) |
| `goatx402-sdk/` | Official GOAT x402 client SDK, same story |

---

## How It Works

### ERC-8004 — On-chain Agent Identity

[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) is a draft Ethereum standard for giving AI agents a portable, verifiable on-chain identity. Each agent gets:
- A unique NFT (`agentId`) that proves ownership
- A metadata URI containing name, description, capabilities, and an `x402Support` flag
- An optional separate `agentWallet` address for operational use

The metadata is stored as a `data:application/json;base64` URI directly on-chain — no IPFS, no off-chain dependency, fully self-contained.

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "OpenClaw AI",
  "description": "A general-purpose AI agent...",
  "x402Support": true,
  "active": true,
  "merchantId": "openclaw"
}
```

**ERC-8004 contract on GOAT Testnet3:** `0x556089008Fc0a60cD09390Eca93477ca254A5522`

### x402 — Pay-per-use HTTP Payments

[x402](https://github.com/GOATNetwork/x402) is a payment protocol layered on top of HTTP. The flow:

1. Client requests a resource → server returns **HTTP 402** with payment details
2. Client pays on-chain (ERC-20 transfer to the address in the order)
3. Client retries with `X-Payment-Order-Id` header as proof
4. Server verifies via the GOAT x402 API, returns the response

`server.js` implements the merchant side. `agent-pay.js` implements the client side — the agent calls `x402Fetch(url)` and the whole payment flow runs automatically with no human involvement.

```js
// Agent autonomously pays for a service
const res = await x402Fetch('https://some-agent/api/query', { method: 'POST', body: ... })
// If 402 → creates order → pays on-chain → waits for confirmation → retries
// Caller just gets back the response
```

### The Ping-Pong

`pingpong.js` runs both agents in a loop:
- Agent 1 picks a random amount (0.01–0.10 USDC) and sends to Agent 2
- Agent 2 sends the **exact same amount** back
- 1 second gap between each transfer
- Manual nonce tracking keeps things moving without waiting for confirmation

```js
// Manual nonce management for 1s cadence
const nonces = {
  [wallet1.address]: await provider.getTransactionCount(wallet1.address, 'pending'),
  [wallet2.address]: await provider.getTransactionCount(wallet2.address, 'pending'),
}
function nextNonce(addr) { return nonces[addr]++ }
```

---

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

---

## Setup

### 1. Clone

```bash
git clone https://github.com/maxxie114/goat-pingpong
cd goat-pingpong
```

### 2. Build the SDKs

```bash
cd goatx402-sdk-server && npm install && npm run build && cd ..
cd goatx402-sdk && npm install && npm run build && cd ..
npm install
```

> **Note:** `goatx402-sdk` had a Node.js ESM JSON import issue. Already patched with `createRequire` in `dist/contracts/erc20.js`.

### 3. Create `.env`

```bash
WALLET_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x...
WALLET2_ADDRESS=0x...
WALLET2_PRIVATE_KEY=0x...

CHAIN_ID=48816
RPC_URL=https://rpc.testnet3.goat.network
EXPLORER_URL=https://explorer.testnet3.goat.network
USDC_ADDRESS=0x29d1ee93e9ecf6e50f309f498e40a6b42d352fa1
USDT_ADDRESS=0xdce0af57e8f2ce957b3838cd2a2f3f3677965dd3

# From @goathackbot on Telegram (Agent 1)
GOATX402_API_URL=https://x402-api-lx58aabp0r.testnet3.goat.network
GOATX402_MERCHANT_ID=your_merchant_id
GOATX402_API_KEY=...
GOATX402_API_SECRET=...

# From @goathackbot on Telegram (Agent 2)
GOATX402_API_URL2=https://x402-api-lx58aabp0r.testnet3.goat.network
GOATX402_MERCHANT_ID2=your_other_merchant_id
GOATX402_API_KEY2=...
GOATX402_API_SECRET2=...
```

Get wallets funded at the [faucet](https://bridge.testnet3.goat.network/faucet).
Get x402 credentials by DMing `@goathackbot` on Telegram with your project name, wallet address, and a one-liner about what your agent does.

### 4. Register your wallets as ERC-8004 agents

```bash
node register-agents.js
```

**Do not skip this step.** If you only registered via @goathackbot, your NFT is owned by the bot. Run this to mint directly to your own wallets.

### 5. Run the ping-pong

```bash
node pingpong.js
```

Open [goat-dashboard.vercel.app](https://goat-dashboard.vercel.app) and watch the numbers go up. Your transactions will be the only ones correctly marked as agent-to-agent.

### 6. (Optional) Run the x402 server

```bash
node server.js
# POST /api/generate costs 0.1 USDC
```

```js
// From any agent
import { x402Fetch } from './agent-pay.js'
const res = await x402Fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello agent!' }),
})
```

---

## Notes

- `API_SECRET` is backend-only. Never expose it to a frontend or commit it to git.
- The ping-pong stops when a wallet hits 0 USDC. Go to the faucet, come back.
- If you get an RPC timeout, just restart — nonces reset automatically.

---

## Built at

GOAT Network Hackathon — Feb 2026

*No AI agents were harmed in the making of this demo. They were, however, made to send the same money back and forth four thousand times and counting.*
