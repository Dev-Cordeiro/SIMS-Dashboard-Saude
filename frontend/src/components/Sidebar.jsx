import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { Modal } from './Modal'
import { toast } from 'react-toastify'
import './Sidebar.css'

export function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed, currentPage, setCurrentPage, canNavigate = true }) {
  const { user, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    toast.success('Logout realizado com sucesso!')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
    { id: 'serie-mensal', label: 'Série Mensal', icon: 'fa-chart-line' },
    { id: 'internacoes-cid', label: 'Internações por CID-10', icon: 'fa-book-medical' },
    { id: 'internacoes-sexo', label: 'Internações por Sexo', icon: 'fa-users' },
    { id: 'internacoes-faixa', label: 'Internações por Faixa Etária', icon: 'fa-chart-bar' },
    { id: 'obitos-cid', label: 'Óbitos por CID-10', icon: 'fa-file-medical' },
    { id: 'obitos-raca', label: 'Óbitos por Raça', icon: 'fa-chart-bar' },
    { id: 'obitos-estado-civil', label: 'Óbitos por Estado Civil', icon: 'fa-user-friends' },
    { id: 'obitos-local', label: 'Óbitos por Local de Ocorrência', icon: 'fa-map-marker-alt' },
  ]

  const handleNavClick = (pageId) => {
    if (!canNavigate && pageId !== 'dashboard') {
      toast.info('Por favor, sincronize os dados primeiro clicando no ícone de sincronizar')
      return
    }
    setCurrentPage(pageId)
    setIsOpen(false)
  }


  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} data-collapsed={collapsed}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            {!collapsed && <Logo size={collapsed ? 32 : 32} />}
            {!collapsed && (
              <div className="sidebar-title-container">
                <h2>SIMS</h2>
                <p className="sidebar-subtitle">Sistema Integrado de Monitoramento em Saúde</p>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle" 
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
          {isOpen && (
            <button className="sidebar-close" onClick={() => setIsOpen(false)}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>


        {/* Menu Principal */}
        <nav className="sidebar-nav">
          {!collapsed && <div className="nav-section-title">MENU PRINCIPAL</div>}
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(item.id)
              }}
              title={collapsed ? item.label : ''}
            >
              <i className={`fas ${item.icon} nav-icon`}></i>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Usuário, Perfil e Logout */}
        {!collapsed && (
          <div className="sidebar-bottom-section">
            <a
              href="#perfil"
              className="sidebar-user"
              onClick={(e) => {
                e.preventDefault()
                handleNavClick('perfil')
              }}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name || user?.email?.split('@')[0] || 'Usuário'}</div>
                <div className="user-email">{user?.email || ''}</div>
              </div>
            </a>
            <button className="sidebar-logout-button" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Sair</span>
            </button>
          </div>
        )}

        {collapsed && (
          <div className="sidebar-bottom-section-collapsed">
            <a
              href="#perfil"
              className="sidebar-user-collapsed"
              onClick={(e) => {
                e.preventDefault()
                handleNavClick('perfil')
              }}
              title="Perfil"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </a>
            <button className="sidebar-logout-button-collapsed" onClick={handleLogout} title="Sair">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        )}

        <div className="sidebar-footer">
          {!collapsed && <p>Versão 1.0.0</p>}
        </div>
      </aside>

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
    </>
  )
}
