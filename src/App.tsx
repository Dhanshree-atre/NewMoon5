import { useState } from 'react'
import Layout from './components/Layout'
import WalletConnect from './components/WalletConnect'
import PayrollDashboard from './components/PayrollDashboard'
import { useMidnight } from './hooks/useMidnight'

function App() {
  const { walletState, connectWallet, disconnectWallet } = useMidnight()
  const [activeTab, setActiveTab] = useState<'admin' | 'recipient'>('admin')

  return (
    <Layout>
      <WalletConnect
        walletState={walletState}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />
      {walletState.isConnected && (
        <div style={{ marginTop: '24px' }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '6px',
          }}>
            {(['admin', 'recipient'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                    : 'transparent',
                  color: activeTab === tab ? '#fff' : '#94a3b8',
                }}
              >
                {tab === 'admin' ? '🏢 Admin / Employer' : '👤 Recipient / Employee'}
              </button>
            ))}
          </div>

          <PayrollDashboard
            walletAddress={walletState.address || ''}
            activeTab={activeTab}
          />
        </div>
      )}
    </Layout>
  )
}

export default App
