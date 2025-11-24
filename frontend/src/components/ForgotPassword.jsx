import { useState } from 'react'
import { Logo } from './Logo'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import './ForgotPassword.css'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!email) {
      toast.error('Por favor, informe seu email')
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/api/auth/forgot-password', { email }, {
        timeout: 30000
      })
      
      if (response.data.success) {
        setEmailSent(true)
        toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.')
      } else {
        toast.error(response.data.error || 'Erro ao enviar email de recuperação')
      }
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Servidor não está rodando. Por favor, inicie o backend.')
      } else {
        const errorMessage = error.response?.data?.detail || error.message || 'Erro ao enviar email de recuperação'
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-left">
        <div className="forgot-password-branding">
          <div className="logo-wrapper">
            <Logo size={140} />
          </div>
          <h1 className="brand-title">SIMS</h1>
          <p className="brand-subtitle">
            Sistema Integrado de Monitoramento em Saúde
          </p>
        </div>
        <div className="forgot-password-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
        </div>
      </div>

      <div className="forgot-password-right">
        <div className="forgot-password-card">
          {emailSent ? (
            <div className="forgot-password-success">
              <div className="success-icon">
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h2>Email enviado!</h2>
              <p className="success-text">
                Enviamos um email de recuperação para <strong>{email}</strong>
              </p>
              <div className="success-instructions">
                <p>Por favor:</p>
                <ol>
                  <li>Verifique sua caixa de entrada</li>
                  <li>Clique no link de recuperação no email</li>
                  <li>Defina uma nova senha</li>
                </ol>
              </div>
              <div className="success-actions">
                <a href="/" className="success-button">
                  Voltar para Login
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="forgot-password-header">
                <h2>Recuperar Senha</h2>
                <p>Informe seu email para receber o link de recuperação</p>
              </div>
              
              <form onSubmit={handleSubmit} className="forgot-password-form">
                <div className="form-group">
                  <div className="input-wrapper">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`forgot-password-button ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="button-spinner"></span>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </button>

                <div className="forgot-password-footer">
                  <p>Lembrou sua senha? <a href="/">Fazer login</a></p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

