import { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { SignUp } from './components/SignUp'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './pages/HomePage'
import { SerieMensalPage } from './pages/SerieMensalPage'
import { InternacoesSexoPage } from './pages/InternacoesSexoPage'
import { ObitosRacaPage } from './pages/ObitosRacaPage'
import { PerfilPage } from './pages/PerfilPage'
import { InternacoesFaixaPage } from './pages/InternacoesFaixaPage'
import { ObitosEstadoCivilPage } from './pages/ObitosEstadoCivilPage'
import { ObitosLocalPage } from './pages/ObitosLocalPage'
import { InternacoesCidCapPage } from './pages/InternacoesCidCapPage'
import { ObitosCidCapPage } from './pages/ObitosCidCapPage'
import { api } from './services/api'
import { ToastContainer, toast } from 'react-toastify'
import './App.css'

function Dashboard() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [seriesMensal, setSeriesMensal] = useState([])
  const [internacoesSexo, setInternacoesSexo] = useState([])
  const [obitosRaca, setObitosRaca] = useState([])
  const [internacoesFaixa, setInternacoesFaixa] = useState([])
  const [obitosEstadoCivil, setObitosEstadoCivil] = useState([])
  const [obitosLocal, setObitosLocal] = useState([])
  const [internacoesCid, setInternacoesCid] = useState([])
  const [obitosCid, setObitosCid] = useState([])
  const [loading, setLoading] = useState(false)
  const [periodoDados, setPeriodoDados] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    carregarDadosDoCache()
  }, [])

  function carregarDadosDoCache() {
    try {
      const cacheKey = 'dashboard_data_cache'
      const cachedData = localStorage.getItem(cacheKey)
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData)
        const cacheTime = parsed.timestamp || 0
        const now = Date.now()
        const cacheAge = now - cacheTime
        const maxAge = 24 * 60 * 60 * 1000
        
        if (cacheAge < maxAge && parsed.data) {
          setSeriesMensal(parsed.data.seriesMensal || [])
          setInternacoesSexo(parsed.data.internacoesSexo || [])
          setObitosRaca(parsed.data.obitosRaca || [])
          setInternacoesFaixa(parsed.data.internacoesFaixa || [])
          setObitosEstadoCivil(parsed.data.obitosEstadoCivil || [])
          setObitosLocal(parsed.data.obitosLocal || [])
          setInternacoesCid(parsed.data.internacoesCid || [])
          setObitosCid(parsed.data.obitosCid || [])
          setPeriodoDados(parsed.data.periodoDados || null)
        }
      }
    } catch (error) {
    }
  }

  function salvarDadosNoCache(dados) {
    try {
      const cacheKey = 'dashboard_data_cache'
      const cacheData = {
        timestamp: Date.now(),
        data: dados
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
    }
  }

  async function carregarDados(forceRefresh = false) {
    if (forceRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    
    const carregarComErro = async (endpoint, nome, retries = 1, customTimeout = 120000) => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = attempt * 3000
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
          const res = await api.get(endpoint, { timeout: customTimeout })
          return res.data || []
        } catch (error) {
          const isLastAttempt = attempt === retries
          const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED'
          
          if (isLastAttempt) {
            if (forceRefresh) {
              toast.error(`Erro ao carregar ${nome}. Tente novamente mais tarde.`)
            }
            return []
          }
          
          if (!isNetworkError) {
            return []
          }
        }
      }
      return []
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    try {
      const intCidRes = await carregarComErro('/api/internacoes/cid-cap', 'Internações por CID-10', 1, 180000)
      setInternacoesCid(intCidRes)
      await delay(1000)
      
      const obCidRes = await carregarComErro('/api/obitos/cid-cap', 'Óbitos por CID-10', 1, 180000)
      setObitosCid(obCidRes)
      await delay(1000)
      
      const seriesRes = await carregarComErro('/api/series/mensal?limit=5000', 'Série Mensal')
      setSeriesMensal(seriesRes)
      await delay(500)
      
      const sexoRes = await carregarComErro('/api/internacoes/sexo', 'Internações por Sexo')
      setInternacoesSexo(sexoRes)
      await delay(500)
      
      const racaRes = await carregarComErro('/api/obitos/raca', 'Óbitos por Raça')
      setObitosRaca(racaRes)
      await delay(500)
      
      const faixaRes = await carregarComErro('/api/internacoes/faixa', 'Internações por Faixa')
      setInternacoesFaixa(faixaRes)
      await delay(500)
      
      const estCivRes = await carregarComErro('/api/obitos/estado-civil', 'Óbitos por Estado Civil')
      setObitosEstadoCivil(estCivRes)
      await delay(500)
      
      const localRes = await carregarComErro('/api/obitos/local', 'Óbitos por Local')
      setObitosLocal(localRes)

      let periodoRes = null
      try {
        periodoRes = await api.get('/api/periodo-dados', { timeout: 60000 })
        setPeriodoDados(periodoRes.data)
      } catch (error) {
        setPeriodoDados({ ano_inicio: null, ano_fim: null, mes_inicio: null, mes_fim: null })
      }

      const dadosParaCache = {
        seriesMensal: seriesRes,
        internacoesSexo: sexoRes,
        obitosRaca: racaRes,
        internacoesFaixa: faixaRes,
        obitosEstadoCivil: estCivRes,
        obitosLocal: localRes,
        internacoesCid: intCidRes,
        obitosCid: obCidRes,
        periodoDados: periodoRes?.data || null
      }
      
      salvarDadosNoCache(dadosParaCache)
      
      if (forceRefresh) {
        toast.success('Dados atualizados com sucesso!')
      }
    } catch (e) {
      if (forceRefresh) {
        toast.error('Erro ao atualizar dados. Alguns dados podem não ter sido carregados.')
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    carregarDados(true)
  }


  
  const renderPage = () => {
    switch (currentPage) {
            case 'dashboard':
              return (
                <HomePage
                  seriesMensal={seriesMensal}
                  internacoesSexo={internacoesSexo}
                  obitosRaca={obitosRaca}
                  internacoesCid={internacoesCid}
                  obitosCid={obitosCid}
                  loading={loading}
                  periodoDados={periodoDados}
                />
              )
      case 'serie-mensal':
        return (
          <SerieMensalPage
            seriesMensal={seriesMensal}
            loading={loading}
          />
        )
      case 'internacoes-sexo':
        return (
          <InternacoesSexoPage
            internacoesSexo={internacoesSexo}
            loading={loading}
          />
        )
      case 'obitos-raca':
        return (
          <ObitosRacaPage
            obitosRaca={obitosRaca}
            loading={loading}
          />
        )
      case 'internacoes-faixa':
        return (
          <InternacoesFaixaPage
            internacoesFaixa={internacoesFaixa}
            loading={loading}
          />
        )
      case 'obitos-estado-civil':
        return (
          <ObitosEstadoCivilPage
            obitosEstadoCivil={obitosEstadoCivil}
            loading={loading}
          />
        )
      case 'obitos-local':
        return (
          <ObitosLocalPage
            obitosLocal={obitosLocal}
            loading={loading}
          />
        )
      case 'internacoes-cid':
        return (
          <InternacoesCidCapPage
            internacoesCid={internacoesCid}
            loading={loading}
          />
        )
      case 'obitos-cid':
        return (
          <ObitosCidCapPage
            obitosCid={obitosCid}
            loading={loading}
          />
        )
      case 'perfil':
        return <PerfilPage user={user} />
      default:
        return (
          <HomePage
            seriesMensal={seriesMensal}
            internacoesSexo={internacoesSexo}
            obitosRaca={obitosRaca}
            internacoesCid={internacoesCid}
            loading={loading}
          />
        )
    }
  }
  return (
    <div className="app-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <button 
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <i className="fas fa-bars"></i>
        </button>
        <button 
          className={`refresh-data-button ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Atualizar dados"
        >
          <i className={`fas ${isRefreshing ? 'fa-sync-alt' : 'fa-sync'}`}></i>
        </button>
        <main className="app-content">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname)

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname)
    }
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a[href]')
      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault()
        const path = new URL(link.href).pathname
        window.history.pushState({}, '', path)
        setCurrentRoute(path)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (currentRoute === '/signup') {
    return (
      <>
        <SignUp />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Login />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    )
  }

  return (
    <>
      <Dashboard />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default App
