import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import './Sidebar.css'

export function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed, currentPage, setCurrentPage }) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      logout()
    }
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
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name || 'Usuário'}</div>
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
                {user?.name?.charAt(0).toUpperCase() || 'U'}
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
    </>
  )
}
