import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { toast } from 'react-toastify'
import './Login.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      setLoading(false)
      return
    }

    try {
      const result = await login(email, password)
      
      if (!result.success) {
        // Exibir mensagem de erro específica via toast
        const errorMessage = result.error || 'Email ou senha incorretos'
        toast.error(errorMessage, { 
          autoClose: 5000,
          position: "top-right"
        })
      } else {
        toast.success('Login realizado com sucesso!')
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro inesperado. Tente novamente.'
      toast.error(errorMessage, { 
        autoClose: 5000,
        position: "top-right"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-branding">
          <div className="logo-wrapper">
            <img 
              src="/logo.png" 
              alt="SIMS" 
              style={{ width: '200px', height: '200px', objectFit: 'contain' }}
            />
            <h1 className="brand-title">SIMS</h1>
          </div>
          <p className="brand-subtitle">
            Sistema Integrado de Monitoramento em Saúde
          </p>
        </div>
        <div className="login-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>Bem-vindo!</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
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

            <button 
              type="submit" 
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Entrando...
                </>
              ) : (
                'Login'
              )}
            </button>

            <div className="login-footer">
              <a href="/forgot-password" className="forgot-password">Esqueceu a senha?</a>
              <p>Não tem uma conta? <a href="/signup">Cadastre-se</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
