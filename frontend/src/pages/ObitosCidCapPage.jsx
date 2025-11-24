import { useState, useRef, useEffect } from 'react'
import { ObitosPorCidCapChart } from '../components/ObitosPorCidCapChart'
import { exportChartAsPNG, exportDataAsCSV } from '../utils/exportChart'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'
import { Modal } from '../components/Modal'
import './ObitosCidCapPage.css'

export function ObitosCidCapPage({
  obitosCid: initialObitosCid,
  loading: initialLoading
}) {
  const chartRef = useRef(null)
  const [drillDown, setDrillDown] = useState(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [obitosCid, setObitosCid] = useState(initialObitosCid || [])
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
      const res = await api.get('/api/obitos/cid-cap')
      const dados = res.data || []
      setDadosCompletos(dados)
      setObitosCid(dados)
    } catch (error) {
      setDadosCompletos([])
      setObitosCid([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialObitosCid && initialObitosCid.length > 0) {
      setDadosCompletos(initialObitosCid)
      setObitosCid(initialObitosCid)
    }
  }, [initialObitosCid])

  useEffect(() => {
    if (dadosCompletos.length === 0 && obitosCid.length === 0) {
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
        
        const res = await api.get('/api/obitos/cid-cap', { params })
        setObitosCid(res.data || [])
      } else {
        setObitosCid(dadosCompletos)
      }
      setDrillDown(null)
    } catch (error) {
      setObitosCid([])
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
    exportChartAsPNG(chartRef, 'obitos-cid10-capitulo', filtrosInfo)
  }

  const handleExportCSV = () => {
    exportDataAsCSV(obitosCid, 'obitos-cid10-capitulo')
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Óbitos por Capítulo CID-10</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Óbitos por Capítulo CID-10</h2>
          <p className="page-subtitle">
            Ranking dos capítulos da CID-10 mais associados aos óbitos. 
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
        {!loading && obitosCid && obitosCid.length > 0 && (
          <div className="page-stats-grid">
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-list-ol"></i>
              </div>
              <div className="page-stat-label">Capítulos Analisados</div>
              <div className="page-stat-value">{obitosCid.length}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="page-stat-label">Total de Óbitos</div>
              <div className="page-stat-value">
                {formatNumber(obitosCid.reduce((sum, item) => sum + (item.total_obitos || 0), 0))}
              </div>
            </div>
            {obitosCid.length > 0 && (
              <div className="page-stat-card">
                <div className="page-stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="page-stat-label">Capítulo Mais Frequente</div>
                <div className="page-stat-value" style={{ fontSize: '18px' }}>
                  {obitosCid[0].capitulo_cod}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {obitosCid[0].capitulo_nome}
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
                Este gráfico mostra os 10 capítulos da CID-10 com maior número de óbitos. 
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
                <h3 className="chart-title">Top 10 capítulos da CID-10 - Óbitos</h3>
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
            {!obitosCid || obitosCid.length === 0 ? (
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
                <ObitosPorCidCapChart 
                  data={obitosCid}
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
              <span className="drill-down-label">Total de Óbitos:</span>
              <span className="drill-down-value">
                {formatNumber(drillDown.total_obitos || 0)}
              </span>
            </div>
            <div className="drill-down-info">
              <p>
                <strong>Informações do Capítulo:</strong>
              </p>
              <p>
                Este capítulo da CID-10 representa <strong>{formatNumber(drillDown.total_obitos || 0)}</strong> óbitos.
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
