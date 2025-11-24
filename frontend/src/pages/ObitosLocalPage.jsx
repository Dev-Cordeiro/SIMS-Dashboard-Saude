import { useRef, useState, useEffect } from 'react'
import { ObitosPorLocalChart } from '../components/ObitosPorLocalChart'
import { exportChartAsPNG, exportDataAsCSV } from '../utils/exportChart'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'

export function ObitosLocalPage({
  obitosLocal: initialObitosLocal,
  loading: initialLoading
}) {
  const chartRef = useRef(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [obitosLocal, setObitosLocal] = useState(initialObitosLocal || [])
  const [loading, setLoading] = useState(initialLoading || false)
  const [selectedMunicipio, setSelectedMunicipio] = useState('all')

  useEffect(() => {
    async function carregarLocalidades() {
      try {
        const res = await api.get('/api/localidades')
        setLocalidades(res.data || [])
      } catch (error) {
      }
    }
    carregarLocalidades()
  }, [])

  const carregarDadosCompletos = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/obitos/local')
      const dados = res.data || []
      setDadosCompletos(dados)
      setObitosLocal(dados)
    } catch (error) {
      setDadosCompletos([])
      setObitosLocal([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialObitosLocal && initialObitosLocal.length > 0) {
      setDadosCompletos(initialObitosLocal)
      setObitosLocal(initialObitosLocal)
    }
  }, [initialObitosLocal])

  useEffect(() => {
    if (dadosCompletos.length === 0 && obitosLocal.length === 0) {
      const timer = setTimeout(() => {
        carregarDadosCompletos()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const aplicarFiltros = async () => {
    setLoading(true)
    try {
      if (selectedMunicipio !== 'all') {
        const params = { params: { id_localidade: selectedMunicipio } }
        const res = await api.get('/api/obitos/local', params)
        setObitosLocal(res.data || [])
      } else {
        setObitosLocal(dadosCompletos)
      }
    } catch (error) {
      setObitosLocal([])
    } finally {
      setLoading(false)
    }
  }

  const handleExportPNG = () => {
    // Preparar informações dos filtros aplicados
    const filtrosInfo = []
    if (selectedMunicipio !== 'all') {
      const municipio = localidades.find(l => l.id_localidade === selectedMunicipio)
      if (municipio) {
        filtrosInfo.push(`Município: ${municipio.municipio} - ${municipio.uf}`)
      }
    }
    exportChartAsPNG(chartRef, 'obitos-local-ocorrencia', filtrosInfo)
  }

  const handleExportCSV = () => {
    exportDataAsCSV(obitosLocal, 'obitos-local-ocorrencia')
  }

  const totalObitos = obitosLocal?.reduce((sum, item) => sum + (item.total_obitos || 0), 0) || 0
  const maiorLocal = obitosLocal && obitosLocal.length > 0 
    ? obitosLocal.reduce((max, item) => 
        (item.total_obitos || 0) > (max.total_obitos || 0) ? item : max
      ) 
    : null
  const percentualMaiorLocal = maiorLocal && totalObitos > 0 
    ? ((maiorLocal.total_obitos / totalObitos) * 100).toFixed(1) 
    : 0

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Óbitos por Local de Ocorrência</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Óbitos por Local de Ocorrência</h2>
          <p className="page-subtitle">
            Comparação dos óbitos conforme o local de ocorrência (hospital, domicílio, via pública, etc.). 
            Analise onde os óbitos ocorrem com maior frequência.
          </p>
        </div>

        {/* Filtros */}
        <ChartFilters 
          onApplyFilters={(filters) => {
            if (filters.municipio !== undefined) {
              setSelectedMunicipio(filters.municipio)
            }
            setTimeout(() => {
              aplicarFiltros()
            }, 100)
          }}
          showPeriod={true}
          showYearRange={false}
          showMunicipio={true}
          localidades={localidades}
          initialMunicipio={selectedMunicipio}
        />

        {/* Cards de Estatísticas Resumidas */}
        {!loading && obitosLocal && obitosLocal.length > 0 && (
          <div className="page-stats-grid">
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="page-stat-label">Total de Óbitos</div>
              <div className="page-stat-value">{formatNumber(totalObitos)}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="page-stat-label">Locais Analisados</div>
              <div className="page-stat-value">{obitosLocal.length}</div>
            </div>
            {maiorLocal && (
              <div className="page-stat-card">
                <div className="page-stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="page-stat-label">Local Mais Frequente</div>
                <div className="page-stat-value" style={{ fontSize: '18px' }}>
                  {maiorLocal.local_ocorrencia_desc}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {percentualMaiorLocal}% do total
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {!loading && (
          <div className="page-info-box">
            <div className="page-info-box-icon">
              <i className="fas fa-info-circle"></i>
            </div>
            <div className="page-info-box-content">
              <p className="page-info-box-title">Como interpretar este gráfico</p>
              <p className="page-info-box-text">
                Este gráfico mostra onde os óbitos ocorrem com maior frequência. Clique nas barras para ver detalhes. 
                Os dados ajudam a entender padrões de ocorrência e podem indicar necessidades de infraestrutura de saúde.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando dados...</p>
          </div>
        )}

        {!loading && (
          <div className="page-chart-container" ref={chartRef}>
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Distribuição por Local de Ocorrência</h3>
                <span className="chart-badge">Análise comparativa</span>
              </div>
              <div className="chart-actions">
                <button
                  className="export-button"
                  onClick={handleExportPNG}
                  title="Exportar como PNG"
                >
                  <i className="fas fa-download"></i>
                  <span>PNG</span>
                </button>
                <button
                  className="export-button"
                  onClick={handleExportCSV}
                  title="Exportar dados como CSV"
                >
                  <i className="fas fa-file-csv"></i>
                  <span>CSV</span>
                </button>
              </div>
            </div>
            <div style={{ 
              flex: 1, 
              minHeight: 400, 
              display: 'block',
              position: 'relative',
              width: '100%',
              height: 'auto'
            }}>
              <ObitosPorLocalChart data={obitosLocal} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
