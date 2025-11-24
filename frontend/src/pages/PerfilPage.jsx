import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { Modal } from '../components/Modal'

export function PerfilPage({ user: userProp, onCancel }) {
  const { user: authUser, updateProfile, deleteAccount, logout } = useAuth()
  const user = userProp || authUser
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    bio: user?.bio || '',
  })
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile(formData)
      
      if (result.success) {
        toast.success('Perfil atualizado com sucesso!')
      } else {
        toast.error(result.error || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const result = await deleteAccount()
      
      if (result.success) {
        toast.success('Conta encerrada com sucesso')
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } else {
        toast.error(result.error || 'Erro ao encerrar conta')
        setDeleting(false)
        setShowDeleteModal(false)
      }
    } catch (error) {
      toast.error('Erro ao encerrar conta')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Editar Perfil</span>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="profile-title">Editar Perfil</h2>
            <p className="profile-subtitle">Atualize suas informações pessoais</p>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nome Completo</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Digite seu nome completo"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  defaultValue={user?.email || ''}
                  placeholder="Digite seu email"
                  className="form-input"
                  disabled
                />
                <small className="form-help">O email não pode ser alterado</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Telefone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="organization">Organização</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="Nome da organização"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Biografia</label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Conte um pouco sobre você..."
                className="form-textarea"
              ></textarea>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  if (onCancel) {
                    onCancel()
                  } else {
                    window.history.back()
                  }
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Seção de Encerrar Conta */}
          <div className="profile-danger-zone">
            <div className="danger-zone-header">
              <h3>Zona de Perigo</h3>
              <p>Esta ação não pode ser desfeita</p>
            </div>
            <button 
              type="button"
              className="btn-danger"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
            >
              <i className="fas fa-trash-alt"></i>
              Encerrar Conta
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <Modal 
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Encerrar Conta"
        showCloseButton={!deleting}
      >
        <div className="delete-account-modal">
          <div className="delete-account-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Atenção!</h3>
            <p>
              Você está prestes a encerrar sua conta permanentemente. Esta ação não pode ser desfeita.
            </p>
            <p>
              Todos os seus dados serão removidos e você não poderá mais acessar o sistema com esta conta.
            </p>
          </div>
          <div className="delete-account-actions">
            <button 
              className="btn-secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button 
              className="btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Encerrando...
                </>
              ) : (
                <>
                  <i className="fas fa-trash-alt"></i>
                  Sim, Encerrar Conta
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
