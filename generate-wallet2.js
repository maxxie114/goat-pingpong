import 'dotenv/config'
import { ethers } from 'ethers'
import { readFileSync, writeFileSync } from 'fs'

const wallet = ethers.Wallet.createRandom()

console.log('\n========== Agent 2 Wallet ==========')
console.log(`Address:  ${wallet.address}`)
console.log(`Mnemonic: ${wallet.mnemonic.phrase}`)
console.log('=====================================\n')

// Append to existing .env
const env = readFileSync('.env', 'utf8')
const addition = `
# Agent 2 Wallet
WALLET2_ADDRESS=${wallet.address}
WALLET2_PRIVATE_KEY=${wallet.privateKey}
WALLET2_MNEMONIC="${wallet.mnemonic.phrase}"
AGENT2_ID=
`
writeFileSync('.env', env + addition)
console.log('Appended to .env\n')
console.log(`Fund this at: https://bridge.testnet3.goat.network/faucet`)
console.log(`Address:      ${wallet.address}`)
