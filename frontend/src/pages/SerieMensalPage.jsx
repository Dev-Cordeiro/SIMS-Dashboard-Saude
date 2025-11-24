import { useRef, useState, useEffect } from 'react'
import { MonthlySeriesChart } from '../components/MonthlySeriesChart'
import { exportChartAsPNG, exportDataAsCSV } from '../utils/exportChart'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'

export function SerieMensalPage({
  seriesMensal: initialSeriesMensal,
  loading: initialLoading
}) {
  const chartRef = useRef(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [seriesMensal, setSeriesMensal] = useState(initialSeriesMensal || [])
  const [loading, setLoading] = useState(initialLoading || false)
  const [selectedMunicipio, setSelectedMunicipio] = useState('all')
  const [yearStart, setYearStart] = useState(null)
  const [yearEnd, setYearEnd] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [availableYears, setAvailableYears] = useState([])

  // Atualizar anos disponíveis baseado nos dados completos (não filtrados)
  useEffect(() => {
    if (dadosCompletos.length > 0) {
      const years = [...new Set(dadosCompletos.map(item => item.ano).filter(Boolean))].sort((a, b) => b - a)
      setAvailableYears(years)
    } else if (seriesMensal.length > 0) {
      // Fallback: usar seriesMensal se dadosCompletos ainda não estiver carregado
      const years = [...new Set(seriesMensal.map(item => item.ano).filter(Boolean))].sort((a, b) => b - a)
      setAvailableYears(years)
    }
  }, [dadosCompletos, seriesMensal])

  const minYear = availableYears.length > 0 ? Math.min(...availableYears) : new Date().getFullYear() - 10
  const maxYear = availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear()
  
  useEffect(() => {
    if (availableYears.length > 0 && yearStart === null && yearEnd === null) {
      setYearStart(minYear)
      setYearEnd(maxYear)
    }
  }, [availableYears, minYear, maxYear])

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
      const res = await api.get('/api/series/mensal')
      const dados = res.data || []
      setDadosCompletos(dados)
      setSeriesMensal(dados)
    } catch (error) {
      setDadosCompletos([])
      setSeriesMensal([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialSeriesMensal && initialSeriesMensal.length > 0) {
      setDadosCompletos(initialSeriesMensal)
      setSeriesMensal(initialSeriesMensal)
    }
  }, [initialSeriesMensal])

  useEffect(() => {
    if (dadosCompletos.length === 0 && seriesMensal.length === 0) {
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
        const params = {}
        if (selectedMunicipio !== 'all') {
          params.id_localidade = selectedMunicipio
        }
        if (yearStart) {
          params.ano_inicio = yearStart
        }
        if (yearEnd) {
          params.ano_fim = yearEnd
        }
        if (selectedMonth) {
          params.mes = selectedMonth
        }
        
        const res = await api.get('/api/series/mensal', { params })
        setSeriesMensal(res.data || [])
      } else {
        let dadosFiltrados = [...dadosCompletos]

        if (yearStart) {
          dadosFiltrados = dadosFiltrados.filter(item => item.ano >= yearStart)
        }

        if (yearEnd) {
          dadosFiltrados = dadosFiltrados.filter(item => item.ano <= yearEnd)
        }

        if (selectedMonth) {
          dadosFiltrados = dadosFiltrados.filter(item => item.mes === selectedMonth)
        }

        setSeriesMensal(dadosFiltrados)
      }
    } catch (error) {
      setSeriesMensal([])
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
    if (yearStart && yearEnd) {
      filtrosInfo.push(`Período: ${yearStart} a ${yearEnd}`)
    }
    if (selectedMonth) {
      const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      filtrosInfo.push(`Mês: ${meses[selectedMonth]}`)
    }
    
    exportChartAsPNG(chartRef, 'serie-mensal', filtrosInfo)
  }

  const handleExportCSV = () => {
    exportDataAsCSV(seriesMensal, 'serie-mensal')
  }

  const totalInternacoes = seriesMensal.reduce((sum, item) => sum + (item.internacoes || 0), 0)
  const totalObitos = seriesMensal.reduce((sum, item) => sum + (item.obitos || 0), 0)
  const mediaInternacoes = seriesMensal.length > 0 ? Math.round(totalInternacoes / seriesMensal.length) : 0
  const mediaObitos = seriesMensal.length > 0 ? Math.round(totalObitos / seriesMensal.length) : 0

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Série Mensal</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Série Mensal - Internações x Óbitos</h2>
          <p className="page-subtitle">
            Evolução temporal das internações hospitalares e óbitos ao longo do tempo. 
            Visualize tendências, sazonalidade e correlações entre os indicadores.
          </p>
        </div>

        {/* Filtros */}
        <ChartFilters 
          onApplyFilters={(filters) => {
            if (filters.municipio !== undefined) {
              setSelectedMunicipio(filters.municipio)
            }
            if (filters.yearStart !== undefined) {
              setYearStart(filters.yearStart)
            }
            if (filters.yearEnd !== undefined) {
              setYearEnd(filters.yearEnd)
            }
            if (filters.month !== undefined) {
              setSelectedMonth(filters.month)
            }
            setTimeout(() => {
              aplicarFiltros()
            }, 100)
          }}
          showPeriod={false}
          showYearRange={true}
          showMonthYear={true}
          showMunicipio={true}
          localidades={localidades}
          initialMunicipio={selectedMunicipio}
          initialYearStart={yearStart || minYear}
          initialYearEnd={yearEnd || maxYear}
          availableYears={availableYears.length > 0 ? availableYears : null}
        />

        {/* Cards de Estatísticas Resumidas */}
        {!loading && seriesMensal.length > 0 && (
          <div className="page-stats-grid">
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="page-stat-label">Períodos Analisados</div>
              <div className="page-stat-value">{seriesMensal.length}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-hospital"></i>
              </div>
              <div className="page-stat-label">Total de Internações</div>
              <div className="page-stat-value">{formatNumber(totalInternacoes)}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="page-stat-label">Total de Óbitos</div>
              <div className="page-stat-value">{formatNumber(totalObitos)}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-calculator"></i>
              </div>
              <div className="page-stat-label">Média Mensal (Internações)</div>
              <div className="page-stat-value">{formatNumber(mediaInternacoes)}</div>
            </div>
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
                Este gráfico mostra a evolução temporal dos dados. Clique nos pontos do gráfico para ver detalhes de cada período. 
                Use os botões de exportação para salvar o gráfico ou os dados.
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
                <h3 className="chart-title">Evolução Temporal - Internações x Óbitos</h3>
                <span className="chart-badge">+{seriesMensal.length} registros mensais</span>
              </div>
              <div className="chart-actions">
                <button className="export-button" onClick={handleExportPNG} title="Exportar como PNG">
                  <i className="fas fa-download"></i>
                  <span>PNG</span>
                </button>
                <button className="export-button" onClick={handleExportCSV} title="Exportar dados como CSV">
                  <i className="fas fa-file-csv"></i>
                  <span>CSV</span>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'block' }}>
              <MonthlySeriesChart data={seriesMensal} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

