import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { Modal } from './Modal'
import { toast } from 'react-toastify'
import './Header.css'

export function Header({ onMenuClick, onRefresh, isRefreshing }) {
  const { user, logout } = useAuth()
  const [searchValue, setSearchValue] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    toast.success('Logout realizado com sucesso!')
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-button" onClick={onMenuClick}>
          ☰
        </button>
        <div className="header-logo-container">
          <Logo size={32} />
          <div className="header-title-container">
            <h1 className="header-title">SIMS</h1>
            <p className="header-subtitle">Sistema Integrado de Monitoramento em Saúde</p>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-search">
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="header-actions">
          {onRefresh && (
            <button 
              className={`header-icon-button refresh-button ${isRefreshing ? 'refreshing' : ''}`}
              onClick={onRefresh}
              title="Atualizar dados"
              disabled={isRefreshing}
            >
              {isRefreshing ? '⟳' : '🔄'}
            </button>
          )}
          <button className="header-icon-button" title="Notificações">
            🔔
          </button>
          <button className="header-icon-button" title="Configurações">
            ⚙️
          </button>
        </div>

        <div className="user-menu">
          <div className="user-menu-info">
            <span className="user-menu-name">{user?.name || 'Usuário'}</span>
            <span className="user-menu-email">{user?.email || ''}</span>
          </div>
          <button className="logout-button" onClick={handleLogout} title="Sair">
            🚪
          </button>
        </div>
      </div>

      {/* Modal de confirmação de logout */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirmar Saída"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ marginBottom: '24px', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
            Tem certeza que deseja sair da sua conta?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowLogoutModal(false)}
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: '#475569',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e2e8f0'
                e.target.style.borderColor = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f1f5f9'
                e.target.style.borderColor = '#e2e8f0'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmLogout}
              style={{
                padding: '10px 20px',
                background: '#14b8a6',
                border: '2px solid #14b8a6',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#0d9488'
                e.target.style.borderColor = '#0d9488'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#14b8a6'
                e.target.style.borderColor = '#14b8a6'
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </Modal>
    </header>
  )
}
