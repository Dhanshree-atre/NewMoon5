import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(10, 15, 30, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99, 179, 237, 0.15)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              🛡
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                Shield<span style={{ color: '#63b3ed' }}>Pay</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '-2px' }}>
                Confidential On-Chain Payroll
              </div>
            </div>
          </div>

          {/* Nav badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-zk">⚡ ZK Proofs</span>
            <span className="badge badge-private">🔒 Private</span>
            <a
              href="https://midnight.network"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 14px',
                background: 'rgba(99, 179, 237, 0.1)',
                border: '1px solid rgba(99, 179, 237, 0.3)',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#63b3ed',
                fontWeight: 600,
              }}
            >
              Built on Midnight
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '32px 24px',
        width: '100%',
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(99, 179, 237, 0.1)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#475569',
      }}>
        <div>
          ShieldPay — Confidential payroll on{' '}
          <a href="https://midnight.network" target="_blank" rel="noopener noreferrer">
            Midnight
          </a>
          {' '}· Individual salaries are never on-chain · Built for Midnight Builder Challenge
        </div>
      </footer>
    </div>
  )
}
