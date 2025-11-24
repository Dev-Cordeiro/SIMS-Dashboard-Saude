import { useRef, useState, useEffect } from 'react'
import { ObitosPorRacaChart } from '../components/ObitosPorRacaChart'
import { exportChartAsPNG, exportChartAsPDF, exportDataAsCSV } from '../utils/exportChart'
import { getChartDescription } from '../utils/chartDescriptions'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'

export function ObitosRacaPage({
  obitosRaca: initialObitosRaca,
  loading: initialLoading,
  periodoDados = null
}) {
  const chartRef = useRef(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [obitosRaca, setObitosRaca] = useState(initialObitosRaca || [])
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
      const res = await api.get('/api/obitos/raca')
      const dados = res.data || []
      setDadosCompletos(dados)
      setObitosRaca(dados)
    } catch (error) {
      setDadosCompletos([])
      setObitosRaca([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialObitosRaca && initialObitosRaca.length > 0) {
      setDadosCompletos(initialObitosRaca)
      setObitosRaca(initialObitosRaca)
    }
  }, [initialObitosRaca])

  useEffect(() => {
    if (dadosCompletos.length === 0 && obitosRaca.length === 0) {
      const timer = setTimeout(() => {
        carregarDadosCompletos()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const aplicarFiltros = async () => {
    setLoading(true)
    // Limpar resultados anteriores antes de aplicar novos filtros
    setObitosRaca([])
    try {
      if (selectedMunicipio !== 'all') {
        const params = { params: { id_localidade: selectedMunicipio } }
        const res = await api.get('/api/obitos/raca', params)
        setObitosRaca(res.data || [])
      } else {
        setObitosRaca(dadosCompletos)
      }
    } catch (error) {
      setObitosRaca([])
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
    const description = getChartDescription('obitos-raca')
    exportChartAsPNG(chartRef, 'obitos-raca', filtrosInfo, description)
  }

  const handleExportPDF = () => {
    const filtrosInfo = []
    if (selectedMunicipio !== 'all') {
      const municipio = localidades.find(l => l.id_localidade === selectedMunicipio)
      if (municipio) {
        filtrosInfo.push(`Município: ${municipio.municipio} - ${municipio.uf}`)
      }
    }
    const description = getChartDescription('obitos-raca')
    exportChartAsPDF(chartRef, 'obitos-raca', filtrosInfo, description)
  }

  const handleExportCSV = () => {
    const description = getChartDescription('obitos-raca')
    exportDataAsCSV(obitosRaca, 'obitos-raca', description)
  }

  const totalObitos = obitosRaca.reduce((sum, item) => sum + (item.total_obitos || 0), 0)
  const maiorGrupo = obitosRaca.length > 0 ? obitosRaca.reduce((max, item) => 
    (item.total_obitos || 0) > (max.total_obitos || 0) ? item : max
  ) : null
  const percentualMaiorGrupo = maiorGrupo && totalObitos > 0 
    ? ((maiorGrupo.total_obitos / totalObitos) * 100).toFixed(1) 
    : 0

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Óbitos por Raça/Cor</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Óbitos por Raça/Cor</h2>
          <p className="page-subtitle">
            Distribuição dos óbitos segundo a raça/cor declarada. 
            Analise as diferenças e proporções entre os grupos étnico-raciais.
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
          maxAvailableYear={periodoDados?.ano_fim || null}
        />

        {/* Cards de Estatísticas Resumidas */}
        {!loading && obitosRaca.length > 0 && (
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
              <div className="page-stat-value">{obitosRaca.length}</div>
            </div>
            {maiorGrupo && (
              <div className="page-stat-card">
                <div className="page-stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="page-stat-label">Maior Grupo</div>
                <div className="page-stat-value" style={{ fontSize: '18px' }}>
                  {maiorGrupo.raca_desc}
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
                Este gráfico mostra a distribuição dos óbitos por raça/cor. Clique nas barras para ver detalhes. 
                Os dados refletem a classificação étnico-racial declarada nos registros.
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
                <h3 className="chart-title">Distribuição por Raça/Cor</h3>
                <span className="chart-badge">Análise comparativa</span>
              </div>
              <div className="chart-actions">
                <button className="export-button" onClick={handleExportPNG} title="Exportar como PNG">
                  <i className="fas fa-download"></i>
                  <span>PNG</span>
                </button>
                <button className="export-button" onClick={handleExportPDF} title="Exportar como PDF">
                  <i className="fas fa-file-pdf"></i>
                  <span>PDF</span>
                </button>
                <button className="export-button" onClick={handleExportCSV} title="Exportar dados como CSV">
                  <i className="fas fa-file-csv"></i>
                  <span>CSV</span>
                </button>
              </div>
            </div>
            <ObitosPorRacaChart data={obitosRaca} />
          </div>
        )}
      </div>
    </>
  )
}

