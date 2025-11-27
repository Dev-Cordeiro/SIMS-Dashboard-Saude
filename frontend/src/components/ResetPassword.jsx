import { useState, useEffect } from 'react'
import { Logo } from './Logo'
import { toast } from 'react-toastify'
import { createClient } from '@supabase/supabase-js'
import './ResetPassword.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [supabase] = useState(() => {
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey)
    }
    return null
  })

  useEffect(() => {
    if (!supabase) {
      toast.error('Configuração do Supabase não encontrada')
      return
    }

    // O Supabase envia o token no hash da URL
    // Quando o usuário clica no link, o Supabase redireciona com o token no hash
    // Precisamos fazer o exchange do token para uma sessão
    const hash = window.location.hash
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken) {
        // Fazer o exchange do token para uma sessão
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        }).then(({ data, error }) => {
          if (error) {
            toast.error('Link inválido ou expirado')
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
          }
          // Se sucesso, o usuário está autenticado e pode atualizar a senha
        })
      } else {
        toast.error('Link inválido ou expirado')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    } else {
      // Verificar se já existe uma sessão válida
      supabase.auth.getSession().then(({ data, error }) => {
        if (!data.session) {
          toast.error('Link inválido ou expirado')
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        }
      })
    }
  }, [supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!password || !confirmPassword) {
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

    if (!supabase) {
      toast.error('Configuração do Supabase não encontrada')
      setLoading(false)
      return
    }

    try {
      // Atualizar a senha usando o Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setSuccess(true)
        toast.success('Senha redefinida com sucesso!')
        // Fazer logout para forçar novo login
        await supabase.auth.signOut()
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        toast.error('Erro ao redefinir senha')
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro ao redefinir senha'
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        toast.error('Link inválido ou expirado. Solicite um novo link.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-left">
          <div className="reset-password-branding">
            <div className="logo-wrapper">
              <Logo size={100} />
            </div>
            <h1 className="brand-title">SIMS</h1>
            <p className="brand-subtitle">
              Sistema Integrado de Monitoramento em Saúde
            </p>
          </div>
        </div>

        <div className="reset-password-right">
          <div className="reset-password-card">
            <div className="reset-password-success">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Senha redefinida!</h2>
              <p className="success-text">
                Sua senha foi redefinida com sucesso. Redirecionando para o login...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-left">
        <div className="reset-password-branding">
          <div className="logo-wrapper">
            <Logo size={140} />
          </div>
          <h1 className="brand-title">SIMS</h1>
          <p className="brand-subtitle">
            Sistema Integrado de Monitoramento em Saúde
          </p>
        </div>
        <div className="reset-password-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
        </div>
      </div>

      <div className="reset-password-right">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h2>Redefinir Senha</h2>
            <p>Digite sua nova senha</p>
          </div>
          
          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  disabled={loading}
                  required
                  minLength={6}
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
                  placeholder="Confirmar nova senha"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`reset-password-button ${loading ? 'loading' : ''}`}
              disabled={loading || !supabase}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </button>

            <div className="reset-password-footer">
              <p>Lembrou sua senha? <a href="/">Fazer login</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

