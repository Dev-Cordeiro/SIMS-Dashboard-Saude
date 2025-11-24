import { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { SignUp } from './components/SignUp'
import { ForgotPassword } from './components/ForgotPassword'
import { ResetPassword } from './components/ResetPassword'
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
import { TutorialModal } from './components/TutorialModal'
import { SyncOverlay } from './components/SyncOverlay'
import { api } from './services/api'
import { ToastContainer, toast } from 'react-toastify'
import './App.css'

function Dashboard() {
  const { user } = useAuth()
  // Restaurar página atual do localStorage ou usar 'dashboard' como padrão
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('current_page')
    return savedPage || 'dashboard'
  })
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
  const [showTutorial, setShowTutorial] = useState(false)
  const [syncOverlayStatus, setSyncOverlayStatus] = useState(null) // null, 'loading', 'success', 'error'
  const [canNavigate, setCanNavigate] = useState(false)

  useEffect(() => {
    const cacheKey = 'dashboard_data_cache'
    const hasSyncedBefore = localStorage.getItem('has_synced_before')
    const hasSeenTutorial = localStorage.getItem('has_seen_tutorial')
    
    // Mapeamento de URL para página
    const urlToPage = {
      '/': 'dashboard',
      '/serie-mensal': 'serie-mensal',
      '/internacoes-cid': 'internacoes-cid',
      '/internacoes-sexo': 'internacoes-sexo',
      '/internacoes-faixa': 'internacoes-faixa',
      '/obitos-cid': 'obitos-cid',
      '/obitos-raca': 'obitos-raca',
      '/obitos-estado-civil': 'obitos-estado-civil',
      '/obitos-local': 'obitos-local',
      '/perfil': 'perfil'
    }
    
    const currentPath = window.location.pathname
    const pageFromUrl = urlToPage[currentPath]
    
    // Se a URL tem uma página válida, usar ela (prioridade sobre localStorage)
    if (pageFromUrl) {
      setCurrentPage(pageFromUrl)
      localStorage.setItem('current_page', pageFromUrl)
    }
    
    if (hasSyncedBefore === 'true') {
      carregarDadosDoCache()
      setCanNavigate(true)
    } else if (!hasSeenTutorial) {
      // Primeira vez - mostrar tutorial
      setShowTutorial(true)
    }
  }, [])

  // Listener para botão voltar/avançar do navegador
  useEffect(() => {
    const urlToPage = {
      '/': 'dashboard',
      '/serie-mensal': 'serie-mensal',
      '/internacoes-cid': 'internacoes-cid',
      '/internacoes-sexo': 'internacoes-sexo',
      '/internacoes-faixa': 'internacoes-faixa',
      '/obitos-cid': 'obitos-cid',
      '/obitos-raca': 'obitos-raca',
      '/obitos-estado-civil': 'obitos-estado-civil',
      '/obitos-local': 'obitos-local',
      '/perfil': 'perfil'
    }

    const handlePopState = () => {
      const currentPath = window.location.pathname
      const pageFromUrl = urlToPage[currentPath]
      if (pageFromUrl) {
        setCurrentPage(pageFromUrl)
        localStorage.setItem('current_page', pageFromUrl)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
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

  async function carregarDados(forceRefresh = false, showOverlay = false) {
    if (showOverlay) {
      setSyncOverlayStatus('loading')
    } else if (forceRefresh) {
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
      let intCidRes, obCidRes, localRes, seriesRes, sexoRes, racaRes, faixaRes, estCivRes

      const carregarUmVez = async () => {
        intCidRes = await carregarComErro('/api/internacoes/cid-cap', 'Internações por CID-10', 1, 180000)
        setInternacoesCid(intCidRes)
        return intCidRes
      }
      const carregarUmVez2 = async () => {
        obCidRes = await carregarComErro('/api/obitos/cid-cap', 'Óbitos por CID-10', 1, 180000)
        setObitosCid(obCidRes)
        return obCidRes
      }
      const carregarUmVez3 = async () => {
        localRes = await carregarComErro('/api/obitos/local', 'Óbitos por Local', 1, 180000)
        setObitosLocal(localRes)
        return localRes
      }
      const carregarUmVez4 = async () => {
        seriesRes = await carregarComErro('/api/series/mensal?limit=5000', 'Série Mensal', 1, 180000)
        setSeriesMensal(seriesRes)
        return seriesRes
      }
      const carregarUmVez5 = async () => {
        sexoRes = await carregarComErro('/api/internacoes/sexo', 'Internações por Sexo', 1, 180000)
        setInternacoesSexo(sexoRes)
        return sexoRes
      }
      const carregarUmVez6 = async () => {
        racaRes = await carregarComErro('/api/obitos/raca', 'Óbitos por Raça', 1, 180000)
        setObitosRaca(racaRes)
        return racaRes
      }
      const carregarUmVez7 = async () => {
        faixaRes = await carregarComErro('/api/internacoes/faixa', 'Internações por Faixa', 1, 180000)
        setInternacoesFaixa(faixaRes)
        return faixaRes
      }
      const carregarUmVez8 = async () => {
        estCivRes = await carregarComErro('/api/obitos/estado-civil', 'Óbitos por Estado Civil', 1, 180000)
        setObitosEstadoCivil(estCivRes)
        return estCivRes
      }

      await Promise.all([
        carregarUmVez(), 
        carregarUmVez2(), 
        carregarUmVez3(), 
        carregarUmVez4(), 
        carregarUmVez5(), 
        carregarUmVez6(), 
        carregarUmVez7(), 
        carregarUmVez8()
      ])

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
      
      // Marcar que já houve uma sincronização
      localStorage.setItem('has_synced_before', 'true')
      
      if (showOverlay) {
        setSyncOverlayStatus('success')
        setCanNavigate(true)
      } else if (forceRefresh) {
        toast.success('Dados atualizados com sucesso!')
      }
    } catch (e) {
      if (showOverlay) {
        setSyncOverlayStatus('error')
      } else if (forceRefresh) {
        toast.error('Erro ao atualizar dados. Alguns dados podem não ter sido carregados.')
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    const isFirstSync = !localStorage.getItem('has_synced_before')
    carregarDados(true, isFirstSync)
  }

  const handleTutorialStartSync = () => {
    setShowTutorial(false)
    localStorage.setItem('has_seen_tutorial', 'true')
    carregarDados(false, true) // Mostrar overlay na primeira sincronização
  }

  const handleTutorialClose = () => {
    setShowTutorial(false)
    localStorage.setItem('has_seen_tutorial', 'true')
  }

  const handleSyncOverlayComplete = () => {
    setSyncOverlayStatus(null)
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
                  isRefreshing={isRefreshing}
                  onRefresh={handleRefresh}
                />
              )
      case 'serie-mensal':
        return (
          <SerieMensalPage
            seriesMensal={seriesMensal}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'internacoes-sexo':
        return (
          <InternacoesSexoPage
            internacoesSexo={internacoesSexo}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'obitos-raca':
        return (
          <ObitosRacaPage
            obitosRaca={obitosRaca}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'internacoes-faixa':
        return (
          <InternacoesFaixaPage
            internacoesFaixa={internacoesFaixa}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'obitos-estado-civil':
        return (
          <ObitosEstadoCivilPage
            obitosEstadoCivil={obitosEstadoCivil}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'obitos-local':
        return (
          <ObitosLocalPage
            obitosLocal={obitosLocal}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'internacoes-cid':
        return (
          <InternacoesCidCapPage
            internacoesCid={internacoesCid}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'obitos-cid':
        return (
          <ObitosCidCapPage
            obitosCid={obitosCid}
            loading={loading}
            periodoDados={periodoDados}
          />
        )
      case 'perfil':
        return <PerfilPage user={user} onCancel={() => setCurrentPage('dashboard')} />
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
  const handlePageChange = (page) => {
    if (!canNavigate && page !== 'dashboard') {
      return // Bloquear navegação se ainda não sincronizou
    }
    setCurrentPage(page)
    // Salvar página atual no localStorage
    localStorage.setItem('current_page', page)
    // Atualizar URL sem recarregar a página
    const pageToUrl = {
      'dashboard': '/',
      'serie-mensal': '/serie-mensal',
      'internacoes-cid': '/internacoes-cid',
      'internacoes-sexo': '/internacoes-sexo',
      'internacoes-faixa': '/internacoes-faixa',
      'obitos-cid': '/obitos-cid',
      'obitos-raca': '/obitos-raca',
      'obitos-estado-civil': '/obitos-estado-civil',
      'obitos-local': '/obitos-local',
      'perfil': '/perfil'
    }
    const url = pageToUrl[page] || '/'
    window.history.pushState({ page }, '', url)
  }

  return (
    <div className="app-container">
      <TutorialModal
        isOpen={showTutorial}
        onClose={handleTutorialClose}
        onStartSync={handleTutorialStartSync}
      />
      <SyncOverlay
        isVisible={syncOverlayStatus !== null}
        status={syncOverlayStatus}
        onComplete={handleSyncOverlayComplete}
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        canNavigate={canNavigate}
      />
      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <button 
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <i className="fas fa-bars"></i>
        </button>
        {currentPage !== 'dashboard' && (
          <div className="app-header-actions">
            <button 
              className={`refresh-data-button ${isRefreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Atualizar dados"
            >
              <i className={`fas ${isRefreshing ? 'fa-sync-alt' : 'fa-sync'}`}></i>
            </button>
          </div>
        )}
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

  if (currentRoute === '/forgot-password' || currentRoute === '/reset-password') {
    if (currentRoute === '/reset-password') {
      return (
        <>
          <ResetPassword />
          <ToastContainer position="top-right" autoClose={3000} />
        </>
      )
    }
    return (
      <>
        <ForgotPassword />
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
