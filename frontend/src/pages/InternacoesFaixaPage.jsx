import { useRef, useState, useEffect } from 'react'
import { InternacoesPorFaixaChart } from '../components/InternacoesPorFaixaChart'
import { exportChartAsPNG, exportChartAsPDF, exportDataAsCSV } from '../utils/exportChart'
import { getChartDescription } from '../utils/chartDescriptions'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'
import './InternacoesFaixaPage.css'

export function InternacoesFaixaPage({
  internacoesFaixa: initialInternacoesFaixa,
  loading: initialLoading,
  periodoDados = null
}) {
  const chartRef = useRef(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [internacoesFaixa, setInternacoesFaixa] = useState(initialInternacoesFaixa || [])
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
      const res = await api.get('/api/internacoes/faixa')
      const dados = res.data || []
      setDadosCompletos(dados)
      setInternacoesFaixa(dados)
    } catch (error) {
      setDadosCompletos([])
      setInternacoesFaixa([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialInternacoesFaixa && initialInternacoesFaixa.length > 0) {
      setDadosCompletos(initialInternacoesFaixa)
      setInternacoesFaixa(initialInternacoesFaixa)
    }
  }, [initialInternacoesFaixa])

  useEffect(() => {
    if (dadosCompletos.length === 0 && internacoesFaixa.length === 0) {
      const timer = setTimeout(() => {
        carregarDadosCompletos()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const aplicarFiltros = async (municipioId = null) => {
    setLoading(true)
    setInternacoesFaixa([])
    try {
      const municipioToUse = municipioId !== null && municipioId !== undefined ? municipioId : selectedMunicipio
      
      if (municipioToUse !== 'all' && municipioToUse !== null && municipioToUse !== undefined) {
        const params = { params: { id_localidade: municipioToUse } }
        const res = await api.get('/api/internacoes/faixa', params)
        setInternacoesFaixa(res.data || [])
      } else {
        setInternacoesFaixa(dadosCompletos)
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error)
      setInternacoesFaixa([])
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
    const description = getChartDescription('internacoes-faixa-etaria')
    exportChartAsPNG(chartRef, 'internacoes-faixa-etaria', filtrosInfo, description)
  }

  const handleExportPDF = () => {
    const filtrosInfo = []
    if (selectedMunicipio !== 'all') {
      const municipio = localidades.find(l => l.id_localidade === selectedMunicipio)
      if (municipio) {
        filtrosInfo.push(`Município: ${municipio.municipio} - ${municipio.uf}`)
      }
    }
    const description = getChartDescription('internacoes-faixa-etaria')
    exportChartAsPDF(chartRef, 'internacoes-faixa-etaria', filtrosInfo, description)
  }

  const handleExportCSV = () => {
    const description = getChartDescription('internacoes-faixa-etaria')
    exportDataAsCSV(internacoesFaixa, 'internacoes-faixa-etaria', description)
  }

  const totalInternacoes = internacoesFaixa?.reduce((sum, item) => sum + (item.total_internacoes || 0), 0) || 0
  const maiorFaixa = internacoesFaixa && internacoesFaixa.length > 0 
    ? internacoesFaixa.reduce((max, item) => 
        (item.total_internacoes || 0) > (max.total_internacoes || 0) ? item : max
      ) 
    : null

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Internações por Faixa Etária</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Internações por Faixa Etária</h2>
          <p className="page-subtitle">
            Distribuição das internações hospitalares segundo faixas etárias. 
            Analise quais grupos etários apresentam maior número de internações.
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
        {!loading && internacoesFaixa && internacoesFaixa.length > 0 && (
          <div className="page-stats-grid">
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-hospital"></i>
              </div>
              <div className="page-stat-label">Total de Internações</div>
              <div className="page-stat-value">{formatNumber(totalInternacoes)}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="page-stat-label">Faixas Etárias</div>
              <div className="page-stat-value">{internacoesFaixa.length}</div>
            </div>
            {maiorFaixa && (
              <div className="page-stat-card">
                <div className="page-stat-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="page-stat-label">Faixa com Mais Internações</div>
                <div className="page-stat-value" style={{ fontSize: '18px' }}>
                  {maiorFaixa.faixa_desc}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {formatNumber(maiorFaixa.total_internacoes)} internações
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
                Este gráfico mostra a distribuição das internações por faixas etárias. 
                Clique nas barras para ver detalhes. Os dados ajudam a identificar padrões 
                de saúde relacionados à idade.
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
              <h3 className="chart-title">Perfil etário das internações</h3>
              <span className="chart-badge">Período agregado</span>
            </div>
            {internacoesFaixa && internacoesFaixa.length > 0 && (
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
            )}
          </div>
          {!internacoesFaixa || internacoesFaixa.length === 0 ? (
            <div style={{ 
              width: '100%', 
              height: 350, 
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
            </div>
          ) : (
            <InternacoesPorFaixaChart data={internacoesFaixa} />
          )}
          </div>
        )}
      </div>
    </>
  )
}
