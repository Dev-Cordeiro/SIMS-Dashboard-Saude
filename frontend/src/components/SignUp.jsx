import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { toast } from 'react-toastify'
import './SignUp.css'

export function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const result = await signUp(email, password, name)
    
    if (!result.success) {
      toast.error(result.error || 'Erro ao criar conta')
      setLoading(false)
    } else {
      if (result.needsEmailConfirmation) {
        setUserEmail(email)
        setShowSuccessMessage(true)
        toast.info(
          <div>
            <strong>Conta criada com sucesso!</strong><br />
            Verifique seu email e confirme sua conta antes de fazer login.
          </div>,
          {
            autoClose: 8000,
            hideProgressBar: false,
          }
        )
      } else {
        toast.success('Conta criada com sucesso! Redirecionando...')
        setTimeout(() => {
          window.location.pathname = '/'
        }, 1500)
      }
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className="signup-branding">
          <div className="logo-wrapper">
            <Logo size={100} />
          </div>
          <h1 className="brand-title">SIMS</h1>
          <p className="brand-subtitle">
            Sistema Integrado de Monitoramento em Saúde
          </p>
        </div>
        <div className="signup-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
        </div>
      </div>

      <div className="signup-right">
        <div className="signup-card">
          {showSuccessMessage ? (
            <div className="signup-success-message">
              <div className="success-icon">
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h2>Conta criada com sucesso!</h2>
              <p className="success-text">
                Enviamos um email de confirmação para <strong>{userEmail}</strong>
              </p>
              <div className="success-instructions">
                <p>Por favor:</p>
                <ol>
                  <li>Verifique sua caixa de entrada</li>
                  <li>Clique no link de confirmação no email</li>
                  <li>Volte aqui e faça login</li>
                </ol>
              </div>
              <div className="success-actions">
                <a href="/" className="success-button">
                  Ir para Login
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="signup-header">
                <h2>Criar Conta</h2>
                <p>Preencha os dados para se cadastrar</p>
              </div>
              
              <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  disabled={loading}
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar senha"
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`signup-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>

            <div className="signup-footer">
              <p>Já tem uma conta? <a href="/">Fazer login</a></p>
            </div>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

