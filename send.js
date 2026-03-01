import 'dotenv/config'
import { ethers } from 'ethers'

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
]

const TO     = '0x00289Dbbb86b64881CEA492D14178CF886b066Be'
const AMOUNT = '0.1'  // USDC

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet   = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)
const usdc     = new ethers.Contract(process.env.USDC_ADDRESS, ERC20_ABI, wallet)

const decimals  = await usdc.decimals()
const amountWei = ethers.parseUnits(AMOUNT, decimals)

console.log(`From:   ${wallet.address}`)
console.log(`To:     ${TO}`)
console.log(`Amount: ${AMOUNT} USDC`)
console.log(`Chain:  GOAT Testnet3 (${process.env.CHAIN_ID})`)
console.log('Sending...')

const tx      = await usdc.transfer(TO, amountWei)
console.log(`TX:     ${tx.hash}`)
console.log(`Explorer: ${process.env.EXPLORER_URL}/tx/${tx.hash}`)

const receipt = await tx.wait()
console.log(`Confirmed in block ${receipt.blockNumber} ✓`)
