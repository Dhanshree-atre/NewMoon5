import { useState } from 'react'
import { useShieldPay } from '../hooks/useMidnight'

interface PayrollDashboardProps {
  walletAddress: string
  activeTab: 'admin' | 'recipient'
}

// ─── Reusable UI primitives ───────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(99, 179, 237, 0.12)',
      borderRadius: '16px',
      padding: '24px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: '16px',
      fontWeight: 700,
      color: '#e2e8f0',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      {children}
    </h3>
  )
}

function PrivacyNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(139, 92, 246, 0.1)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
      color: '#a78bfa',
      marginBottom: '16px',
    }}>
      🔒 <strong>Privacy:</strong> {children}
    </div>
  )
}

function TxStatus({
  status,
  txHash,
  error,
}: {
  status: 'idle' | 'generating-proof' | 'submitting' | 'success' | 'error'
  txHash?: string
  error?: string
}) {
  if (status === 'idle') return null

  const config = {
    'generating-proof': {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      color: '#fbbf24',
      icon: '⚡',
      text: 'Generating zero-knowledge proof locally... (salary stays private)',
    },
    submitting: {
      bg: 'rgba(99, 179, 237, 0.1)',
      border: 'rgba(99, 179, 237, 0.3)',
      color: '#63b3ed',
      icon: '📡',
      text: 'Submitting proof to Midnight network...',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      color: '#34d399',
      icon: '✓',
      text: txHash ? `Transaction confirmed: ${txHash.slice(0, 16)}...` : 'Transaction confirmed!',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      color: '#f87171',
      icon: '✗',
      text: error || 'Transaction failed',
    },
  }[status]

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: '8px',
      padding: '12px 16px',
      color: config.color,
      fontSize: '13px',
      marginTop: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{ fontSize: '16px' }}>{config.icon}</span>
      {config.text}
    </div>
  )
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel() {
  const { ledgerState, initPayroll, submitPayment, finalizePayroll } = useShieldPay()

  // Init form
  const [payrollId, setPayrollId] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [initStatus, setInitStatus] = useState<'idle' | 'generating-proof' | 'submitting' | 'success' | 'error'>('idle')
  const [initError, setInitError] = useState('')

  // Payment form
  const [recipientKey, setRecipientKey] = useState('')
  const [amount, setAmount] = useState('')
  const [payStatus, setPayStatus] = useState<'idle' | 'generating-proof' | 'submitting' | 'success' | 'error'>('idle')
  const [payError, setPayError] = useState('')

  // Finalize
  const [finalStatus, setFinalStatus] = useState<'idle' | 'generating-proof' | 'submitting' | 'success' | 'error'>('idle')
  const [finalError, setFinalError] = useState('')

  const handleInitPayroll = async () => {
    if (!payrollId || !budgetAmount) return
    setInitStatus('generating-proof')
    setInitError('')
    try {
      await initPayroll(payrollId, parseFloat(budgetAmount))
      setInitStatus('success')
    } catch (err) {
      setInitStatus('error')
      setInitError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleSubmitPayment = async () => {
    if (!recipientKey || !amount) return
    setPayStatus('generating-proof')
    setPayError('')
    try {
      await submitPayment(recipientKey, parseFloat(amount))
      setPayStatus('success')
      setRecipientKey('')
      setAmount('')
    } catch (err) {
      setPayStatus('error')
      setPayError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleFinalize = async () => {
    setFinalStatus('generating-proof')
    setFinalError('')
    try {
      await finalizePayroll()
      setFinalStatus('success')
    } catch (err) {
      setFinalStatus('error')
      setFinalError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Current ledger state */}
      <Card>
        <SectionTitle>📊 On-Chain Payroll State (Public)</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          {[
            { label: 'Payroll ID', value: ledgerState.payrollId || '—', public: true },
            { label: 'Admin Commitment', value: ledgerState.adminCommitment ? `${ledgerState.adminCommitment.slice(0, 14)}...` : '—', public: true },
            { label: 'Budget Hash', value: ledgerState.totalBudgetHash ? `${ledgerState.totalBudgetHash.slice(0, 14)}...` : '—', public: true },
            { label: 'Payments Recorded', value: String(ledgerState.paymentCount ?? 0), public: true },
            { label: 'Status', value: ledgerState.isFinalized ? 'Finalized ✓' : 'Open', public: true },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '10px',
              padding: '12px',
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                {item.label}
                <span style={{ marginLeft: '6px', color: '#34d399', fontSize: '10px' }}>
                  PUBLIC
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: item.label.includes('Commitment') || item.label.includes('Hash') ? 'monospace' : 'inherit' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#a78bfa',
        }}>
          🔒 <strong>Individual salaries are NEVER stored above.</strong> Only hash commitments appear on-chain.
        </div>
      </Card>

      {/* Step 1: Initialise payroll */}
      <Card>
        <SectionTitle>1️⃣ Initialise Pay Period</SectionTitle>
        <PrivacyNote>
          You commit to a total budget via a hash. The actual amount only proves against this hash — it never hits the chain directly.
        </PrivacyNote>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Payroll Period ID (e.g., "2025-Q1-AUGUST")
              <span className="badge badge-public" style={{ marginLeft: '8px', fontSize: '10px' }}>PUBLIC</span>
            </label>
            <input
              type="text"
              placeholder="2025-Q1-AUGUST"
              value={payrollId}
              onChange={(e) => setPayrollId(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Total Budget (USD) — used to generate budget commitment hash
              <span className="badge badge-private" style={{ marginLeft: '8px', fontSize: '10px' }}>PRIVATE INPUT</span>
            </label>
            <input
              type="number"
              placeholder="150000"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              ⚡ Only a hash of this amount is stored on-chain
            </div>
          </div>
          <button
            onClick={handleInitPayroll}
            disabled={initStatus === 'generating-proof' || initStatus === 'submitting' || !payrollId || !budgetAmount}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              opacity: (!payrollId || !budgetAmount) ? 0.5 : 1,
            }}
          >
            🚀 Initialise Payroll (Generate ZK Proof)
          </button>
          <TxStatus status={initStatus} error={initError} />
        </div>
      </Card>

      {/* Step 2: Submit payments */}
      <Card>
        <SectionTitle>2️⃣ Add Shielded Payment</SectionTitle>
        <PrivacyNote>
          The recipient identifier and amount are processed as a ZK witness. A hash commitment is accumulated on-chain — nobody can reverse-engineer the salary from the commitment.
        </PrivacyNote>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Recipient Identifier (wallet address or employee ID)
              <span className="badge badge-private" style={{ marginLeft: '8px', fontSize: '10px' }}>PRIVATE INPUT</span>
            </label>
            <input
              type="text"
              placeholder="mn1qxy2kgdygjrsqtzq2n0yrf..."
              value={recipientKey}
              onChange={(e) => setRecipientKey(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Payment Amount (USD)
              <span className="badge badge-private" style={{ marginLeft: '8px', fontSize: '10px' }}>PRIVATE INPUT</span>
            </label>
            <input
              type="number"
              placeholder="8500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              ⚡ This amount goes into a ZK witness — coworkers cannot see it
            </div>
          </div>
          <button
            onClick={handleSubmitPayment}
            disabled={payStatus === 'generating-proof' || payStatus === 'submitting' || !recipientKey || !amount}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #059669, #2563eb)',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              opacity: (!recipientKey || !amount) ? 0.5 : 1,
            }}
          >
            💳 Submit Shielded Payment
          </button>
          <TxStatus status={payStatus} error={payError} />
        </div>
      </Card>

      {/* Step 3: Finalize */}
      <Card>
        <SectionTitle>3️⃣ Finalize Pay Period</SectionTitle>
        <PrivacyNote>
          Finalizing proves that the pay period is complete and no further payments can be added. Recipients can now claim their payment proofs.
        </PrivacyNote>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
          Payments recorded: <strong style={{ color: '#e2e8f0' }}>{ledgerState.paymentCount ?? 0}</strong>
          {ledgerState.isFinalized && (
            <span style={{ color: '#34d399', marginLeft: '12px' }}>✓ Already finalized</span>
          )}
        </p>
        <button
          onClick={handleFinalize}
          disabled={finalStatus === 'generating-proof' || finalStatus === 'submitting' || !!ledgerState.isFinalized}
          style={{
            padding: '12px 24px',
            background: ledgerState.isFinalized
              ? 'rgba(16, 185, 129, 0.2)'
              : 'linear-gradient(135deg, #d97706, #dc2626)',
            borderRadius: '10px',
            color: ledgerState.isFinalized ? '#34d399' : '#fff',
            fontWeight: 700,
            fontSize: '14px',
            opacity: ledgerState.isFinalized ? 0.7 : 1,
          }}
        >
          {ledgerState.isFinalized ? '✓ Payroll Finalized' : '🔒 Finalize Payroll Period'}
        </button>
        <TxStatus status={finalStatus} error={finalError} />
      </Card>
    </div>
  )
}

// ─── Recipient Panel ──────────────────────────────────────────────────────────

function RecipientPanel() {
  const { ledgerState, claimPaymentProof } = useShieldPay()
  const [recipientKey, setRecipientKey] = useState('')
  const [amount, setAmount] = useState('')
  const [claimStatus, setClaimStatus] = useState<'idle' | 'generating-proof' | 'submitting' | 'success' | 'error'>('idle')
  const [claimError, setClaimError] = useState('')
  const [proofHash, setProofHash] = useState('')

  const handleClaim = async () => {
    if (!recipientKey || !amount) return
    setClaimStatus('generating-proof')
    setClaimError('')
    try {
      const hash = await claimPaymentProof(recipientKey, parseFloat(amount))
      setProofHash(hash)
      setClaimStatus('success')
    } catch (err) {
      setClaimStatus('error')
      setClaimError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Payroll status */}
      <Card>
        <SectionTitle>📋 Current Payroll Period</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Period ID</div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{ledgerState.payrollId || '—'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Status</div>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: ledgerState.isFinalized ? '#34d399' : '#fbbf24',
            }}>
              {ledgerState.isFinalized ? '✓ Finalized — Claims Open' : '⏳ Awaiting Finalization'}
            </div>
          </div>
        </div>
      </Card>

      {/* Claim payment proof */}
      <Card>
        <SectionTitle>🎫 Claim Your Payment Proof</SectionTitle>

        <div style={{
          background: 'rgba(99, 179, 237, 0.08)',
          border: '1px solid rgba(99, 179, 237, 0.2)',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#63b3ed', marginBottom: '8px' }}>
            🛡 How Selective Disclosure Works
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
            Enter your private recipient key and salary. The ZK circuit will generate a{' '}
            <strong style={{ color: '#e2e8f0' }}>cryptographic proof</strong> that you received this amount
            — without revealing the amount to the blockchain or anyone else.
            You can then share this proof with a bank, tax authority, or employer reference
            without disclosing more than needed.
          </div>
        </div>

        <PrivacyNote>
          Your salary amount is a private witness — it never appears on the Midnight ledger. Only you can generate this proof.
        </PrivacyNote>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Your Recipient Key (from employer)
              <span className="badge badge-private" style={{ marginLeft: '8px', fontSize: '10px' }}>PRIVATE</span>
            </label>
            <input
              type="text"
              placeholder="Your private recipient identifier..."
              value={recipientKey}
              onChange={(e) => setRecipientKey(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Your Salary / Payment Amount
              <span className="badge badge-private" style={{ marginLeft: '8px', fontSize: '10px' }}>PRIVATE</span>
            </label>
            <input
              type="number"
              placeholder="8500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button
            onClick={handleClaim}
            disabled={claimStatus === 'generating-proof' || claimStatus === 'submitting' || !recipientKey || !amount || !ledgerState.isFinalized}
            style={{
              padding: '12px 24px',
              background: !ledgerState.isFinalized
                ? 'rgba(99, 179, 237, 0.2)'
                : 'linear-gradient(135deg, #7c3aed, #2563eb)',
              borderRadius: '10px',
              color: !ledgerState.isFinalized ? '#64748b' : '#fff',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            {!ledgerState.isFinalized
              ? '⏳ Waiting for admin to finalize payroll...'
              : '🔐 Generate My Payment Proof (ZK)'
            }
          </button>

          <TxStatus status={claimStatus} error={claimError} />

          {claimStatus === 'success' && proofHash && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '16px',
              marginTop: '4px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                ✓ Payment Proof Generated
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                Your proof hash (safe to share — reveals nothing about the amount):
              </div>
              <code style={{
                display: 'block',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '12px',
                color: '#63b3ed',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}>
                {proofHash}
              </code>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                📋 Share this with your bank or tax office. They can verify it against the on-chain commitment without seeing your salary.
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PayrollDashboard({ activeTab }: PayrollDashboardProps) {
  return (
    <div>
      {activeTab === 'admin' ? <AdminPanel /> : <RecipientPanel />}
    </div>
  )
}
