import { useState, useRef, useEffect } from 'react'
import { InternacoesPorCidCapChart } from '../components/InternacoesPorCidCapChart'
import { exportChartAsPNG, exportDataAsCSV } from '../utils/exportChart'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'
import { Modal } from '../components/Modal'
import './InternacoesCidCapPage.css'

export function InternacoesCidCapPage({
  internacoesCid: initialInternacoesCid,
  loading: initialLoading
}) {
  const chartRef = useRef(null)
  const [drillDown, setDrillDown] = useState(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [internacoesCid, setInternacoesCid] = useState(initialInternacoesCid || [])
  const [loading, setLoading] = useState(initialLoading || false)
  const [selectedMunicipio, setSelectedMunicipio] = useState('all')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)

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
      const res = await api.get('/api/internacoes/cid-cap')
      const dados = res.data || []
      setDadosCompletos(dados)
      setInternacoesCid(dados)
    } catch (error) {
      setDadosCompletos([])
      setInternacoesCid([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialInternacoesCid && initialInternacoesCid.length > 0) {
      setDadosCompletos(initialInternacoesCid)
      setInternacoesCid(initialInternacoesCid)
    }
  }, [initialInternacoesCid])

  useEffect(() => {
    if (dadosCompletos.length === 0 && internacoesCid.length === 0) {
      const timer = setTimeout(() => {
        carregarDadosCompletos()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const aplicarFiltros = async () => {
    setLoading(true)
    try {
      if (selectedMunicipio !== 'all' || selectedYear || selectedMonth) {
        const params = {}
        if (selectedMunicipio !== 'all') {
          params.id_localidade = selectedMunicipio
        }
        if (selectedYear) {
          params.ano = selectedYear
        }
        if (selectedMonth) {
          params.mes = selectedMonth
        }
        
        const res = await api.get('/api/internacoes/cid-cap', { params })
        setInternacoesCid(res.data || [])
      } else {
        setInternacoesCid(dadosCompletos)
      }
      setDrillDown(null)
    } catch (error) {
      setInternacoesCid([])
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
    if (selectedYear) {
      filtrosInfo.push(`Ano: ${selectedYear}`)
    }
    if (selectedMonth) {
      const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      filtrosInfo.push(`Mês: ${meses[selectedMonth]}`)
    }
    if (drillDown) {
      filtrosInfo.push(`Capítulo: ${drillDown.capitulo_cod} - ${drillDown.capitulo_nome}`)
    }
    exportChartAsPNG(chartRef, 'internacoes-cid10-capitulo', filtrosInfo)
  }

  const handleExportCSV = () => {
    exportDataAsCSV(internacoesCid, 'internacoes-cid10-capitulo')
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Internações por Capítulo CID-10</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Internações por Capítulo CID-10</h2>
          <p className="page-subtitle">
            Ranking dos capítulos da CID-10 mais frequentes nas internações hospitalares. 
            Clique nas barras para ver detalhes de cada capítulo.
          </p>
        </div>

        {/* Filtros */}
        <ChartFilters 
          onApplyFilters={(filters) => {
            if (filters.municipio !== undefined) {
              setSelectedMunicipio(filters.municipio)
            }
            if (filters.year !== undefined) {
              setSelectedYear(filters.year)
            }
            if (filters.month !== undefined) {
              setSelectedMonth(filters.month)
            }
            setTimeout(() => {
              aplicarFiltros()
            }, 100)
          }}
          showPeriod={true}
          showYearRange={false}
          showMonthYear={true}
          showMunicipio={true}
          localidades={localidades}
          initialMunicipio={selectedMunicipio}
          initialYear={selectedYear}
          initialMonth={selectedMonth}
        />

        {/* Cards de Estatísticas Resumidas */}
        {!loading && internacoesCid && internacoesCid.length > 0 && (
          <div className="page-stats-grid">
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-list-ol"></i>
              </div>
              <div className="page-stat-label">Capítulos Analisados</div>
              <div className="page-stat-value">{internacoesCid.length}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-hospital"></i>
              </div>
              <div className="page-stat-label">Total de Internações</div>
              <div className="page-stat-value">
                {formatNumber(internacoesCid.reduce((sum, item) => sum + (item.total_internacoes || 0), 0))}
              </div>
            </div>
            {internacoesCid.length > 0 && (
              <div className="page-stat-card">
                <div className="page-stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="page-stat-label">Capítulo Mais Frequente</div>
                <div className="page-stat-value" style={{ fontSize: '18px' }}>
                  {internacoesCid[0].capitulo_cod}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {internacoesCid[0].capitulo_nome}
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
                Este gráfico mostra os 10 capítulos da CID-10 com maior número de internações. 
                Clique nas barras para ver detalhes de cada capítulo. A CID-10 é a Classificação Estatística 
                Internacional de Doenças e Problemas Relacionados à Saúde.
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
                <h3 className="chart-title">Top 10 capítulos da CID-10 - Internações</h3>
                <span className="chart-badge">Período agregado</span>
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
            {!internacoesCid || internacoesCid.length === 0 ? (
              <div style={{ 
                width: '100%', 
                height: 360, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '16px',
                gap: '12px'
              }}>
                <i className="fas fa-info-circle" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
                <p>Nenhum dado disponível para exibir</p>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Verifique se há dados disponíveis
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: 'block' }}>
                <InternacoesPorCidCapChart 
                  data={internacoesCid}
                  onBarClick={(data) => {
                    if (data) {
                      setDrillDown(data)
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para detalhes do drill-down */}
      <Modal
        isOpen={drillDown !== null}
        onClose={() => setDrillDown(null)}
        title={drillDown ? `Detalhes: ${drillDown.capitulo_cod} - ${drillDown.capitulo_nome}` : 'Detalhes'}
      >
        {drillDown && (
          <div className="drill-down-stats">
            <div className="drill-down-stat">
              <span className="drill-down-label">Capítulo CID-10:</span>
              <span className="drill-down-value">
                {drillDown.capitulo_cod} - {drillDown.capitulo_nome}
              </span>
            </div>
            <div className="drill-down-stat">
              <span className="drill-down-label">Total de Internações:</span>
              <span className="drill-down-value">
                {formatNumber(drillDown.total_internacoes || 0)}
              </span>
            </div>
            <div className="drill-down-info">
              <p>
                <strong>Informações do Capítulo:</strong>
              </p>
              <p>
                Este capítulo da CID-10 representa <strong>{formatNumber(drillDown.total_internacoes || 0)}</strong> internações.
              </p>
              <p>
                Os dados são agregados para todo o período selecionado, não havendo granularidade temporal individual.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
