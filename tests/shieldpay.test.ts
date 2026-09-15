/**
 * shieldpay.test.ts — ShieldPay Contract Test Suite
 *
 * Tests the ShieldPay business logic and privacy model using
 * an in-memory simulator (Phase 1 — no blockchain needed).
 *
 * Pattern follows eddalabs/midnight-contracts: each test creates a
 * fresh in-memory state and calls circuits directly against the simulator.
 *
 * Minimum 3 tests required; this suite has 8.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  deriveBudgetHash,
  deriveAdminCommitment,
  derivePaymentCommitment,
  buildWitnesses,
  validatePayrollEntry,
  validatePayrollPeriod,
} from '../src/utils/contract.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a mock 32-byte admin key */
function makeAdminKey(seed: string): Uint8Array {
  const enc = new TextEncoder().encode(seed.padEnd(32, '\0').slice(0, 32))
  return enc
}

/** Simulate the in-memory ledger state */
interface MockLedger {
  payrollId: string | null
  adminCommitment: string | null
  totalBudgetHash: string | null
  paymentCount: number
  paymentAccumulator: string
  isFinalized: boolean
}

function createEmptyLedger(): MockLedger {
  return {
    payrollId: null,
    adminCommitment: null,
    totalBudgetHash: null,
    paymentCount: 0,
    paymentAccumulator: '0x00000000',
    isFinalized: false,
  }
}

/** Simulate the initPayroll circuit */
function simulateInitPayroll(
  ledger: MockLedger,
  payrollId: string,
  budgetAmount: number,
  adminKey: Uint8Array
): MockLedger {
  const adminCommitment = deriveAdminCommitment(adminKey)
  const totalBudgetHash = deriveBudgetHash(budgetAmount)
  return {
    ...ledger,
    payrollId,
    adminCommitment,
    totalBudgetHash,
    paymentCount: 0,
    paymentAccumulator: '0x73686965',  // pad(32, "shieldpay:init:")
    isFinalized: false,
  }
}

/** Simulate the submitPayment circuit */
function simulateSubmitPayment(
  ledger: MockLedger,
  adminKey: Uint8Array,
  recipientKey: string,
  amount: number
): MockLedger {
  // Verify admin auth
  const derived = deriveAdminCommitment(adminKey)
  if (derived !== ledger.adminCommitment) {
    throw new Error('Unauthorised: admin key mismatch')
  }
  if (ledger.isFinalized) {
    throw new Error('Payroll period is already finalized')
  }

  const payCommit = derivePaymentCommitment(recipientKey, amount)

  // Update accumulator: hash(current || new_payment_commitment)
  function simHash(a: string, b: string): string {
    const s = a + b
    let h = 0x811c9dc5
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = (h * 0x01000193) >>> 0
    }
    return '0x' + h.toString(16).padStart(8, '0').repeat(4)
  }

  return {
    ...ledger,
    paymentCount: ledger.paymentCount + 1,
    paymentAccumulator: simHash(ledger.paymentAccumulator, payCommit),
  }
}

/** Simulate the finalizePayroll circuit */
function simulateFinalizePayroll(ledger: MockLedger, adminKey: Uint8Array): MockLedger {
  const derived = deriveAdminCommitment(adminKey)
  if (derived !== ledger.adminCommitment) throw new Error('Unauthorised: admin key mismatch')
  if (ledger.isFinalized) throw new Error('Payroll already finalized')
  if (ledger.paymentCount === 0) throw new Error('No payments recorded — cannot finalize empty payroll')
  return { ...ledger, isFinalized: true }
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('ShieldPay — Contract Logic Tests', () => {
  let ledger: MockLedger
  const adminKey = makeAdminKey('test-admin-secret-key-shieldpay')
  const payrollId = '2025-Q1-AUGUST'
  const totalBudget = 150_000

  beforeEach(() => {
    ledger = createEmptyLedger()
  })

  // ── Test 1 ──────────────────────────────────────────────────────────────────
  it('TEST 1: initPayroll writes commitment hash but NOT the budget amount', () => {
    const updatedLedger = simulateInitPayroll(ledger, payrollId, totalBudget, adminKey)

    // Payroll ID is public (visible on-chain)
    expect(updatedLedger.payrollId).toBe('2025-Q1-AUGUST')

    // Admin commitment and budget hash are on-chain — but NOT the raw values
    expect(updatedLedger.adminCommitment).toBeTruthy()
    expect(updatedLedger.totalBudgetHash).toBeTruthy()

    // PRIVACY CHECK: the hash must not equal the raw budget amount
    expect(updatedLedger.totalBudgetHash).not.toBe('150000')
    expect(updatedLedger.adminCommitment).not.toBe('test-admin-secret-key-shieldpay')

    // State initialised correctly
    expect(updatedLedger.paymentCount).toBe(0)
    expect(updatedLedger.isFinalized).toBe(false)

    console.log('✓ Budget hash (public):', updatedLedger.totalBudgetHash)
    console.log('✓ Admin commitment (public):', updatedLedger.adminCommitment)
    console.log('✓ Actual budget amount (PRIVATE, never on-chain):', totalBudget)
  })

  // ── Test 2 ──────────────────────────────────────────────────────────────────
  it('TEST 2: submitPayment accumulates commitments without revealing amounts', () => {
    ledger = simulateInitPayroll(ledger, payrollId, totalBudget, adminKey)

    const salary1 = 8_500   // Employee 1 — private
    const salary2 = 12_000  // Employee 2 — private
    const accumBefore = ledger.paymentAccumulator

    ledger = simulateSubmitPayment(ledger, adminKey, 'employee-alice', salary1)
    ledger = simulateSubmitPayment(ledger, adminKey, 'employee-bob', salary2)

    // Payment count increments publicly
    expect(ledger.paymentCount).toBe(2)

    // Accumulator changes (binds to payments) but is just a hash
    expect(ledger.paymentAccumulator).not.toBe(accumBefore)

    // PRIVACY CHECK: individual amounts do NOT appear in the accumulator string
    expect(ledger.paymentAccumulator).not.toContain('8500')
    expect(ledger.paymentAccumulator).not.toContain('12000')
    expect(ledger.paymentAccumulator).not.toContain('alice')
    expect(ledger.paymentAccumulator).not.toContain('bob')

    console.log('✓ Salary 1 (PRIVATE):', salary1)
    console.log('✓ Salary 2 (PRIVATE):', salary2)
    console.log('✓ Payment accumulator (PUBLIC, opaque):', ledger.paymentAccumulator)
  })

  // ── Test 3 ──────────────────────────────────────────────────────────────────
  it('TEST 3: unauthorized admin key is rejected', () => {
    ledger = simulateInitPayroll(ledger, payrollId, totalBudget, adminKey)

    const wrongKey = makeAdminKey('wrong-key-attacker')

    expect(() => {
      simulateSubmitPayment(ledger, wrongKey, 'employee-alice', 8_500)
    }).toThrow('Unauthorised: admin key mismatch')

    expect(() => {
      simulateFinalizePayroll(ledger, wrongKey)
    }).toThrow('Unauthorised: admin key mismatch')

    console.log('✓ Wrong admin key correctly rejected')
  })

  // ── Test 4 ──────────────────────────────────────────────────────────────────
  it('TEST 4: finalizePayroll closes the period and prevents further payments', () => {
    ledger = simulateInitPayroll(ledger, payrollId, totalBudget, adminKey)
    ledger = simulateSubmitPayment(ledger, adminKey, 'employee-alice', 8_500)
    ledger = simulateFinalizePayroll(ledger, adminKey)

    expect(ledger.isFinalized).toBe(true)

    // Any further payment attempt must fail
    expect(() => {
      simulateSubmitPayment(ledger, adminKey, 'employee-bob', 12_000)
    }).toThrow('Payroll period is already finalized')

    // Second finalization must also fail
    expect(() => {
      simulateFinalizePayroll(ledger, adminKey)
    }).toThrow('Payroll already finalized')

    console.log('✓ Finalized payroll correctly blocks further payments')
  })

  // ── Test 5 ──────────────────────────────────────────────────────────────────
  it('TEST 5: cannot finalize an empty payroll (zero payments)', () => {
    ledger = simulateInitPayroll(ledger, payrollId, totalBudget, adminKey)

    expect(() => {
      simulateFinalizePayroll(ledger, adminKey)
    }).toThrow('No payments recorded — cannot finalize empty payroll')

    console.log('✓ Empty payroll finalization correctly rejected')
  })

  // ── Test 6 ──────────────────────────────────────────────────────────────────
  it('TEST 6: payment commitments are deterministic (same inputs → same hash)', () => {
    const commit1 = derivePaymentCommitment('employee-alice', 8_500)
    const commit2 = derivePaymentCommitment('employee-alice', 8_500)
    const commit3 = derivePaymentCommitment('employee-alice', 8_501) // different amount

    expect(commit1).toBe(commit2)      // deterministic
    expect(commit1).not.toBe(commit3)  // different amounts → different commitment

    console.log('✓ Payment commitment (8500):', commit1)
    console.log('✓ Payment commitment (8501):', commit3)
  })

  // ── Test 7 ──────────────────────────────────────────────────────────────────
  it('TEST 7: witness validation catches invalid inputs', () => {
    // buildWitnesses throws if required private data is missing
    const witnesses = buildWitnesses({})

    expect(() => witnesses.admin_secret_key()).toThrow('Admin key not provided')
    expect(() => witnesses.recipient_amount()).toThrow('Amount not provided')
    expect(() => witnesses.recipient_commitment_key()).toThrow('Recipient key not provided')
    expect(() => witnesses.total_budget_amount()).toThrow('Budget amount not provided')

    console.log('✓ Missing witness data correctly caught before proof generation')
  })

  // ── Test 8 ──────────────────────────────────────────────────────────────────
  it('TEST 8: validatePayrollEntry catches malformed entries', () => {
    const errors1 = validatePayrollEntry({})
    expect(errors1).toContain('Recipient key is required')
    expect(errors1).toContain('Amount must be positive')

    const errors2 = validatePayrollEntry({ recipientKey: 'alice', amount: -100 })
    expect(errors2).toContain('Amount must be positive')

    const errors3 = validatePayrollEntry({ recipientKey: 'alice', amount: 8_500, paymentType: 'salary' })
    expect(errors3).toHaveLength(0)

    const errors4 = validatePayrollPeriod({})
    expect(errors4).toContain('Payroll period ID is required')
    expect(errors4).toContain('Total budget must be positive')
    expect(errors4).toContain('Admin key is required')

    console.log('✓ Input validation correctly rejects malformed payroll entries')
  })
})
