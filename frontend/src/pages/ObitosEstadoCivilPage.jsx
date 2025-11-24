import { useRef, useState, useEffect } from 'react'
import { ObitosPorEstadoCivilChart } from '../components/ObitosPorEstadoCivilChart'
import { exportChartAsPNG, exportChartAsPDF, exportDataAsCSV } from '../utils/exportChart'
import { getChartDescription } from '../utils/chartDescriptions'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'

export function ObitosEstadoCivilPage({
  obitosEstadoCivil: initialObitosEstadoCivil,
  loading: initialLoading,
  periodoDados = null
}) {
  const chartRef = useRef(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [obitosEstadoCivil, setObitosEstadoCivil] = useState(initialObitosEstadoCivil || [])
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
      const res = await api.get('/api/obitos/estado-civil')
      const dados = res.data || []
      setDadosCompletos(dados)
      setObitosEstadoCivil(dados)
    } catch (error) {
      setDadosCompletos([])
      setObitosEstadoCivil([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialObitosEstadoCivil && initialObitosEstadoCivil.length > 0) {
      setDadosCompletos(initialObitosEstadoCivil)
      setObitosEstadoCivil(initialObitosEstadoCivil)
    }
  }, [initialObitosEstadoCivil])

  useEffect(() => {
    if (dadosCompletos.length === 0 && obitosEstadoCivil.length === 0) {
      const timer = setTimeout(() => {
        carregarDadosCompletos()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const aplicarFiltros = async (municipioId = null) => {
    setLoading(true)
    setObitosEstadoCivil([])
    try {
      const municipioToUse = municipioId !== null && municipioId !== undefined ? municipioId : selectedMunicipio
      
      if (municipioToUse !== 'all' && municipioToUse !== null && municipioToUse !== undefined) {
        const params = { params: { id_localidade: municipioToUse } }
        const res = await api.get('/api/obitos/estado-civil', params)
        setObitosEstadoCivil(res.data || [])
      } else {
        setObitosEstadoCivil(dadosCompletos)
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error)
      setObitosEstadoCivil([])
    } finally {
      setLoading(false)
    }
  }

  const handleExportPNG = () => {
    const filtrosInfo = []
    if (selectedMunicipio !== 'all') {
      const municipio = localidades.find(l => l.id_localidade === selectedMunicipio)
      if (municipio) {
        filtrosInfo.push(`Município: ${municipio.municipio} - ${municipio.uf}`)
      }
    }
    const description = getChartDescription('obitos-estado-civil')
    exportChartAsPNG(chartRef, 'obitos-estado-civil', filtrosInfo, description)
  }

  const handleExportPDF = () => {
    const filtrosInfo = []
    if (selectedMunicipio !== 'all') {
      const municipio = localidades.find(l => l.id_localidade === selectedMunicipio)
      if (municipio) {
        filtrosInfo.push(`Município: ${municipio.municipio} - ${municipio.uf}`)
      }
    }
    const description = getChartDescription('obitos-estado-civil')
    exportChartAsPDF(chartRef, 'obitos-estado-civil', filtrosInfo, description)
  }

  const handleExportCSV = () => {
    const description = getChartDescription('obitos-estado-civil')
    exportDataAsCSV(obitosEstadoCivil, 'obitos-estado-civil', description)
  }

  const totalObitos = obitosEstadoCivil?.reduce((sum, item) => sum + (item.total_obitos || 0), 0) || 0
  const maiorGrupo = obitosEstadoCivil && obitosEstadoCivil.length > 0 
    ? obitosEstadoCivil.reduce((max, item) => 
        (item.total_obitos || 0) > (max.total_obitos || 0) ? item : max
      ) 
    : null
  const percentualMaiorGrupo = maiorGrupo && totalObitos > 0 
    ? ((maiorGrupo.total_obitos / totalObitos) * 100).toFixed(1) 
    : 0

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Óbitos por Estado Civil</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Óbitos por Estado Civil</h2>
          <p className="page-subtitle">
            Distribuição dos óbitos segundo o estado civil declarado. 
            Analise as diferenças e proporções entre os grupos.
          </p>
        </div>

        {/* Informação do Período dos Dados */}
        {periodoDados && periodoDados.ano_inicio && periodoDados.ano_fim && (
          <div className="page-periodo-info">
            <i className="fas fa-calendar-alt"></i>
            <span>Dados referentes ao período: <strong>{periodoDados.ano_inicio} a {periodoDados.ano_fim}</strong></span>
          </div>
        )}

        {/* Filtros */}
        <ChartFilters 
          onApplyFilters={(filters) => {
            // Sempre atualizar o estado
            if (filters.municipio !== undefined) {
              setSelectedMunicipio(filters.municipio)
            }
            // Aplicar filtros imediatamente com o valor do filtro ou o estado atual
            aplicarFiltros(filters.municipio !== undefined ? filters.municipio : null)
          }}
          showPeriod={false}
          showYearRange={false}
          showMunicipio={true}
          localidades={localidades}
          initialMunicipio={selectedMunicipio}
          maxAvailableYear={periodoDados?.ano_fim || null}
        />

        {/* Cards de Estatísticas Resumidas */}
        {!loading && obitosEstadoCivil && obitosEstadoCivil.length > 0 && (
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
                <i className="fas fa-users"></i>
              </div>
              <div className="page-stat-label">Grupos Analisados</div>
              <div className="page-stat-value">{obitosEstadoCivil.length}</div>
            </div>
            {maiorGrupo && (
              <div className="page-stat-card">
                <div className="page-stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="page-stat-label">Maior Grupo</div>
                <div className="page-stat-value" style={{ fontSize: '18px' }}>
                  {maiorGrupo.estado_civil_desc}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {percentualMaiorGrupo}% do total
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
                Este gráfico mostra a distribuição dos óbitos por estado civil. Clique nas barras para ver detalhes. 
                Os dados refletem a classificação de estado civil declarada nos registros.
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
                <h3 className="chart-title">Distribuição por Estado Civil</h3>
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
                  onClick={handleExportPDF}
                  title="Exportar como PDF"
                >
                  <i className="fas fa-file-pdf"></i>
                  <span>PDF</span>
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
            <ObitosPorEstadoCivilChart data={obitosEstadoCivil} />
          </div>
        )}
      </div>
    </>
  )
}
