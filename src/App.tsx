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
      {/* NETWORK FALLBACK BANNER */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.15)',
        border: '1px solid rgba(234, 179, 8, 0.4)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#fef08a',
        fontSize: '13px',
        lineHeight: 1.5,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{ fontSize: '18px' }}>⚠️</div>
        <div>
          <strong>Network Notice:</strong> Due to intermittent <code>wss://rpc.preprod.midnight.network</code> timeouts (1000 Closure) on the Midnight Preprod testnet, this UI is running in local ZK simulation mode to guarantee a smooth demo. 
          All ZK proving and verifying keys (<code>.vk</code>, <code>.pk</code>) have been successfully compiled and are included in the repository under <code>contracts/managed/shieldpay/keys/</code>.
        </div>
      </div>

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
