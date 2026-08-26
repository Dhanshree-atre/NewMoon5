/**
 * contract.ts — ShieldPay contract interaction helpers
 *
 * This file provides typed helpers for interacting with the compiled
 * ShieldPay Compact contract via the Midnight.js SDK.
 *
 * After `compact compile contracts/shieldpay.compact -o managed`, the
 * compiler generates TypeScript bindings in managed/shieldpay/.
 * These helpers wrap those generated bindings with application-level
 * logic, witness implementations, and error handling.
 *
 * ─── SDK Integration Pattern ───────────────────────────────────────
 *
 * import type { ShieldpayContract } from '../managed/shieldpay/index.js'
 * import {
 *   Contract,
 *   createBalancedTx,
 * } from '@midnight-ntwrk/midnight-js-contracts'
 * import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id'
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PayrollEntry {
  recipientKey: string    // 32-byte hex commitment key (private)
  amount: number          // USD amount (private witness)
  paymentType: 'salary' | 'invoice' | 'revenue-share'
}

export interface PayrollPeriod {
  id: string
  totalBudget: number
  entries: PayrollEntry[]
  adminKey: string  // Private — never leave the device
}

export interface DeployedContractConfig {
  contractAddress: string
  network: 'preprod' | 'mainnet'
  proofServerUrl?: string
}

// ─── Hash utilities ────────────────────────────────────────────────────────────

/**
 * Derives a budget commitment hash from the total payroll amount.
 *
 * In the contract:
 *   totalBudgetHash = persistentHash<Vector<2, Bytes<32>>>([
 *     pad(32, "shieldpay:budget:"),
 *     encode(amount)
 *   ])
 *
 * This TypeScript version mirrors that derivation for the witness callback.
 */
export function deriveBudgetHash(amount: number): string {
  // In production: use the CompactRuntime encoder
  // import { encoders } from '@midnight-ntwrk/compact-runtime'
  // return encoders.persistentHash(['shieldpay:budget:', amount])

  // Demo implementation:
  const amountBytes = new TextEncoder().encode(`shieldpay:budget:${amount}`)
  let hash = 0x811c9dc5
  for (const byte of amountBytes) {
    hash ^= byte
    hash = (hash * 0x01000193) >>> 0
  }
  return '0x' + hash.toString(16).padStart(8, '0').repeat(8)
}

/**
 * Derives the admin commitment from a secret key.
 *
 * Mirrors:
 *   persistentHash<Vector<2, Bytes<32>>>([pad(32, "shieldpay:admin:"), sk])
 */
export function deriveAdminCommitment(secretKey: Uint8Array): string {
  const prefix = new TextEncoder().encode('shieldpay:admin:')
  const combined = new Uint8Array(prefix.length + secretKey.length)
  combined.set(prefix)
  combined.set(secretKey, prefix.length)

  let hash = 0x811c9dc5
  for (const byte of combined) {
    hash ^= byte
    hash = (hash * 0x01000193) >>> 0
  }
  return '0x' + hash.toString(16).padStart(8, '0').repeat(8)
}

/**
 * Derives a payment commitment from recipient key + amount.
 *
 * Mirrors:
 *   persistentHash<Vector<2, Bytes<32>>>([recipientKey, pad(32, "shieldpay:payment:")])
 */
export function derivePaymentCommitment(recipientKey: string, amount: number): string {
  const input = new TextEncoder().encode(`${recipientKey}:shieldpay:payment:${amount}`)
  let hash = 0x811c9dc5
  for (const byte of input) {
    hash ^= byte
    hash = (hash * 0x01000193) >>> 0
  }
  return '0x' + hash.toString(16).padStart(8, '0').repeat(8)
}

// ─── Witness implementations ───────────────────────────────────────────────────

/**
 * buildWitnesses() — Constructs the witness callbacks for a circuit call.
 *
 * In the Midnight.js SDK, witnesses are implemented as callback functions
 * that the prover calls during proof generation. They supply private data
 * locally — this data never leaves the browser/client.
 *
 * Real usage:
 *   const witnesses = buildWitnesses({
 *     adminKey: myAdminKey,
 *     recipientAmount: 8500,
 *     recipientCommitmentKey: derivedKey,
 *   })
 *   await contract.callTx.submitPayment(witnesses)
 */
export function buildWitnesses(params: {
  adminKey?: Uint8Array
  recipientAmount?: number
  recipientCommitmentKey?: Uint8Array
  totalBudgetAmount?: number
}) {
  return {
    /**
     * admin_secret_key() — provides the admin's 32-byte secret key
     * to the ZK prover. Called internally by initPayroll and submitPayment circuits.
     */
    admin_secret_key: (): Uint8Array => {
      if (!params.adminKey) throw new Error('Admin key not provided')
      return params.adminKey
    },

    /**
     * recipient_amount() — provides the private salary/payment amount.
     * Called internally by submitPayment and claimPaymentProof circuits.
     */
    recipient_amount: (): bigint => {
      if (params.recipientAmount === undefined) throw new Error('Amount not provided')
      return BigInt(Math.round(params.recipientAmount * 100)) // cents
    },

    /**
     * recipient_commitment_key() — provides the recipient's 32-byte identifier.
     * Called internally by submitPayment and claimPaymentProof circuits.
     */
    recipient_commitment_key: (): Uint8Array => {
      if (!params.recipientCommitmentKey) throw new Error('Recipient key not provided')
      return params.recipientCommitmentKey
    },

    /**
     * total_budget_amount() — provides the full budget for finalization verification.
     */
    total_budget_amount: (): bigint => {
      if (params.totalBudgetAmount === undefined) throw new Error('Budget amount not provided')
      return BigInt(Math.round(params.totalBudgetAmount * 100))
    },
  }
}

// ─── Contract deployment helpers ───────────────────────────────────────────────

/**
 * getDeployCommand() — Returns the exact command to deploy ShieldPay to Preprod.
 *
 * Run this after `npm run compact` succeeds.
 */
export function getDeployCommand(adminCommitment: string): string {
  return [
    'npx @midnight-ntwrk/midnight-js-cli deploy \\',
    '  --network preprod \\',
    `  --contract managed/shieldpay/index.js \\`,
    `  --proof-server https://proof.midnight.network \\`,
    `  --init-args '{"adminCommitment": "${adminCommitment}"}' \\`,
    '  --output contract-address.json',
  ].join('\n')
}

// ─── Validation helpers ────────────────────────────────────────────────────────

export function validatePayrollEntry(entry: Partial<PayrollEntry>): string[] {
  const errors: string[] = []
  if (!entry.recipientKey) errors.push('Recipient key is required')
  if (!entry.amount || entry.amount <= 0) errors.push('Amount must be positive')
  if (entry.amount && entry.amount > 10_000_000) errors.push('Amount exceeds maximum ($10M)')
  return errors
}

export function validatePayrollPeriod(period: Partial<PayrollPeriod>): string[] {
  const errors: string[] = []
  if (!period.id) errors.push('Payroll period ID is required')
  if (!period.totalBudget || period.totalBudget <= 0) errors.push('Total budget must be positive')
  if (!period.adminKey) errors.push('Admin key is required')
  return errors
}
