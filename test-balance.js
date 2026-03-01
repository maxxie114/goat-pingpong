import 'dotenv/config'
import { ethers } from 'ethers'

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet   = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)

const tokens = {
  USDC: process.env.USDC_ADDRESS,
  USDT: process.env.USDT_ADDRESS,
}

console.log(`Wallet: ${wallet.address}`)

for (const [symbol, addr] of Object.entries(tokens)) {
  const token    = new ethers.Contract(addr, ERC20_ABI, provider)
  const [bal, dec] = await Promise.all([token.balanceOf(wallet.address), token.decimals()])
  console.log(`${symbol}: ${ethers.formatUnits(bal, dec)}`)
}

const gas = await provider.getBalance(wallet.address)
console.log(`BTC (gas): ${ethers.formatEther(gas)}`)
