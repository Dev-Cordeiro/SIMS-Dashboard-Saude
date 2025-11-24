import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/login', { email, password }, {
        timeout: 30000
      })
      const data = response.data

      if (data.success && data.user) {
        setUser(data.user)
        setToken(data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('auth_token', data.access_token)
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token)
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
        return { success: true }
      } else {
        return { success: false, error: 'Credenciais inválidas' }
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return { 
          success: false, 
          error: 'Tempo de espera esgotado. Verifique sua conexão ou tente novamente.' 
        }
      }
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return { 
          success: false, 
          error: 'Servidor não está rodando. Por favor, inicie o backend na porta 8000.' 
        }
      }
      
      // Capturar mensagens específicas do backend
      let errorMessage = 'Email ou senha incorretos'
      
      if (error.response?.status === 401) {
        // Erro de autenticação
        const detail = error.response?.data?.detail || ''
        
        if (detail.includes('Email ou senha incorretos') || 
            detail.includes('Credenciais inválidas') ||
            detail.includes('Invalid login credentials') ||
            detail.includes('invalid_credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
        } else if (detail.includes('Email não confirmado') || 
                   detail.includes('Email not confirmed') ||
                   detail.includes('email_not_confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.'
        } else if (detail) {
          errorMessage = detail
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { success: false, error: errorMessage }
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const response = await api.post('/api/signup', { email, password, name })
      const data = response.data

      if (data.success) {
        return { 
          success: true, 
          user: data.user,
          needsEmailConfirmation: data.needs_email_confirmation || false
        }
      } else {
        return { success: false, error: 'Erro ao criar conta' }
      }
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return { 
          success: false, 
          error: 'Servidor não está rodando. Por favor, inicie o backend na porta 8000.' 
        }
      }
      
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao criar conta'
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
  }

  const updateProfile = async (updates) => {
    if (!user || !token) return { success: false, error: 'Usuário não autenticado' }

    try {
      const response = await api.put('/api/user/profile', updates)
      const data = response.data

      if (data.success && data.profile) {
        setUser({
          ...user,
          ...data.profile,
        })
        localStorage.setItem('user', JSON.stringify({
          ...user,
          ...data.profile,
        }))
        return { success: true, data: data.profile }
      }

      return { success: false, error: 'Erro ao atualizar perfil' }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar perfil'
      return { success: false, error: errorMessage }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
