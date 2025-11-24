import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import './Header.css'

export function Header({ onMenuClick, onRefresh, isRefreshing }) {
  const { user, logout } = useAuth()
  const [searchValue, setSearchValue] = useState('')

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      logout()
    }
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
    </header>
  )
}
