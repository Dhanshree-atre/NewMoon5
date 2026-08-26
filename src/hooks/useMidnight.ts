/**
 * useMidnight.ts
 *
 * Custom React hooks for Midnight network interaction.
 *
 * Architecture:
 * - useMidnight()       → wallet connection state + connect/disconnect
 * - useShieldPay()      → contract interaction (circuits + ledger state)
 *
 * In a full production build, the Midnight.js SDK (@midnight-ntwrk/midnight-js-*)
 * would be imported here to handle:
 *   1. Proof generation (local, private)
 *   2. Transaction submission (on-chain, public commitment only)
 *   3. Ledger state subscription (real-time updates)
 *
 * For Level 4 (pre-deploy), interactions are simulated with realistic delays
 * to demonstrate UX flow. The contract helpers in utils/contract.ts show the
 * real SDK integration pattern.
 */

import { useState, useCallback, useRef } from 'react'

// ─── Wallet types ──────────────────────────────────────────────────────────────

export interface WalletState {
  isConnected: boolean
  address: string | null
  network: string | null
  isConnecting: boolean
  error: string | null
}

// ─── Ledger state (on-chain public data from ShieldPay contract) ──────────────

export interface ShieldPayLedgerState {
  payrollId: string | null
  adminCommitment: string | null
  totalBudgetHash: string | null
  paymentCount: number
  paymentAccumulator: string | null
  isFinalized: boolean
}

// ─── Wallet hook ──────────────────────────────────────────────────────────────

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    network: null,
    isConnecting: false,
    error: null,
  })

  const connectWallet = useCallback(async () => {
    setWalletState((s) => ({ ...s, isConnecting: true, error: null }))

    try {
      /**
       * Real Midnight.js integration would be:
       *
       * import { WalletProvider } from '@midnight-ntwrk/midnight-js-contracts'
       * const provider = await WalletProvider.connect({ network: 'preprod' })
       * const address = await provider.getAddress()
       *
       * For Level 4 demo (before deploy), we simulate the connection flow.
       */
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check if Lace wallet is available in browser
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lace = (window as any).midnight?.lace

      if (lace) {
        const { address } = await lace.enable()
        setWalletState({
          isConnected: true,
          address,
          network: 'Preprod',
          isConnecting: false,
          error: null,
        })
      } else {
        // Demo mode: simulate connection with a mock address
        const mockAddress = 'mn1q' + Math.random().toString(36).substring(2, 18) + 'shieldpay'
        setWalletState({
          isConnected: true,
          address: mockAddress,
          network: 'Preprod (Demo)',
          isConnecting: false,
          error: null,
        })
      }
    } catch (err) {
      setWalletState((s) => ({
        ...s,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      }))
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      network: null,
      isConnecting: false,
      error: null,
    })
  }, [])

  return { walletState, connectWallet, disconnectWallet }
}

// ─── ShieldPay contract hook ──────────────────────────────────────────────────

/**
 * Simulated hash function for demo mode.
 * In production, persistentHash from the Compact runtime handles this.
 */
function mockHash(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return '0x' + hash.toString(16).padStart(8, '0').repeat(8)
}

export function useShieldPay() {
  const [ledgerState, setLedgerState] = useState<ShieldPayLedgerState>({
    payrollId: null,
    adminCommitment: null,
    totalBudgetHash: null,
    paymentCount: 0,
    paymentAccumulator: null,
    isFinalized: false,
  })

  // Track admin secret key for this session (private, never persisted)
  const adminKeyRef = useRef<string>('shieldpay:admin:' + Math.random().toString(36))

  /**
   * initPayroll — Calls the contract's initPayroll circuit.
   *
   * Real SDK integration:
   *   const contract = await deployedContract.getContract()
   *   await contract.callTx.initPayroll(payrollId, budgetHash)
   *   // This triggers local ZK proof generation, then submits proof tx
   */
  const initPayroll = useCallback(async (payrollId: string, budgetAmount: number) => {
    // Simulate ZK proof generation delay (0.8s)
    await new Promise((r) => setTimeout(r, 800))

    // Simulate transaction submission delay (1.2s)
    await new Promise((r) => setTimeout(r, 1200))

    const adminCommitment = mockHash('shieldpay:admin:' + adminKeyRef.current)
    const totalBudgetHash = mockHash('shieldpay:budget:' + budgetAmount)
    const initAccumulator = mockHash('shieldpay:init:')

    setLedgerState({
      payrollId,
      adminCommitment,
      totalBudgetHash,
      paymentCount: 0,
      paymentAccumulator: initAccumulator,
      isFinalized: false,
    })
  }, [])

  /**
   * submitPayment — Calls the contract's submitPayment circuit.
   *
   * Private witnesses supplied:
   *   - admin_secret_key: adminKeyRef.current
   *   - recipient_amount: amount
   *   - recipient_commitment_key: recipientKey
   *
   * Only the updated paymentAccumulator hash appears on-chain.
   */
  const submitPayment = useCallback(async (recipientKey: string, amount: number) => {
    // Simulate ZK proof generation
    await new Promise((r) => setTimeout(r, 900))

    // Simulate tx submission
    await new Promise((r) => setTimeout(r, 1100))

    setLedgerState((prev) => {
      if (prev.isFinalized) throw new Error('Payroll already finalized')

      const payCommit = mockHash('shieldpay:payment:' + recipientKey)
      const newAccumulator = mockHash(
        (prev.paymentAccumulator || '') + payCommit
      )

      return {
        ...prev,
        paymentCount: prev.paymentCount + 1,
        paymentAccumulator: newAccumulator,
      }
    })
  }, [])

  /**
   * finalizePayroll — Calls the contract's finalizePayroll circuit.
   *
   * Proves: (1) admin auth, (2) paymentCount > 0, (3) sets isFinalized = true.
   */
  const finalizePayroll = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 700))
    await new Promise((r) => setTimeout(r, 1000))

    setLedgerState((prev) => {
      if (prev.isFinalized) throw new Error('Already finalized')
      if (prev.paymentCount === 0) throw new Error('No payments recorded')
      return { ...prev, isFinalized: true }
    })
  }, [])

  /**
   * claimPaymentProof — Calls the contract's claimPaymentProof circuit.
   *
   * The ZK circuit proves: I know (recipientKey, amount) such that
   * compute_payment_commitment(recipientKey, amount) is in the accumulator chain.
   *
   * Returns: a proof hash the recipient can share selectively.
   */
  const claimPaymentProof = useCallback(async (recipientKey: string, amount: number): Promise<string> => {
    await new Promise((r) => setTimeout(r, 1200))

    if (!ledgerState.isFinalized) throw new Error('Payroll not finalized')

    // Generate the payment commitment (same derivation as the contract)
    const payCommit = mockHash('shieldpay:payment:' + recipientKey)
    const proofHash = mockHash(payCommit + ':amount:' + amount + ':proof')

    await new Promise((r) => setTimeout(r, 800))

    return proofHash
  }, [ledgerState.isFinalized])

  return { ledgerState, initPayroll, submitPayment, finalizePayroll, claimPaymentProof }
}
