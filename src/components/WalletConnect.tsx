interface WalletState {
  isConnected: boolean
  address: string | null
  network: string | null
  isConnecting: boolean
  error: string | null
}

interface WalletConnectProps {
  walletState: WalletState
  onConnect: () => void
  onDisconnect Wallet ??: () => void
}

export default function WalletConnect({ walletState, onConnect, onDisconnect Wallet ?? }: WalletConnectProps) {
  if (walletState.isConnected && walletState.address) {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#34d399' }}>
              Lace Wallet Connected
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
              {walletState.address.slice(0, 20)}...{walletState.address.slice(-8)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-public">
            🌐 {walletState.network || 'Preprod'}
          </span>
          <button
            onClick={onDisconnect Wallet ??}
            style={{
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Disconnect Wallet ??
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(37, 99, 235, 0.08)',
      border: '1px solid rgba(99, 179, 237, 0.2)',
      borderRadius: '16px',
      padding: '40px',
      textAlign: 'center',
    }}>
      {/* Privacy statement */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(139, 92, 246, 0.15)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        padding: '6px 16px',
        fontSize: '13px',
        color: '#a78bfa',
        marginBottom: '24px',
      }}>
        🔒 Your salary data never leaves your device
      </div>

      <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>
        Connect Your Wallet
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '460px', margin: '0 auto 28px' }}>
        Connect your Lace wallet to start using ShieldPay.
        All payroll amounts are processed as{' '}
        <strong style={{ color: '#a78bfa' }}>zero-knowledge proofs</strong>{' '}
        — individual salaries are mathematically hidden from the blockchain.
      </p>

      {walletState.error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#f87171',
          fontSize: '14px',
          marginBottom: '20px',
          maxWidth: '480px',
          margin: '0 auto 20px',
        }}>
          ⚠️ {walletState.error}
        </div>
      )}

      <button
        onClick={onConnect}
        disabled={walletState.isConnecting}
        style={{
          padding: '14px 32px',
          background: walletState.isConnecting
            ? 'rgba(99, 179, 237, 0.3)'
            : 'linear-gradient(135deg, #2563eb, #7c3aed)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '-0.2px',
          transition: 'all 0.2s',
          boxShadow: '0 4px 24px rgba(99, 179, 237, 0.2)',
        }}
      >
        {walletState.isConnecting ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
            Connecting...
          </span>
        ) : (
          '🔗 Connect Lace Wallet'
        )}
      </button>

      {/* Privacy model summary */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '32px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { icon: '📊', label: 'Total budget', sublabel: 'PUBLIC (hashed)', color: '#34d399' },
          { icon: '💰', label: 'Individual salary', sublabel: 'PRIVATE (ZK proof)', color: '#a78bfa' },
          { icon: '📜', label: 'Payment proof', sublabel: 'SELECTIVELY disclosed', color: '#fbbf24' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px 16px',
              minWidth: '160px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{item.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: item.color }}>{item.label}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.sublabel}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
