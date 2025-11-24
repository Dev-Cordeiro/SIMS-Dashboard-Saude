import { useRef, useState, useEffect } from 'react'
import { InternacoesPorSexoChart } from '../components/InternacoesPorSexoChart'
import { exportChartAsPNG, exportDataAsCSV } from '../utils/exportChart'
import { formatNumber } from '../utils/formatNumber'
import { ChartFilters } from '../components/ChartFilters'
import { api } from '../services/api'

export function InternacoesSexoPage({
  internacoesSexo: initialInternacoesSexo,
  loading: initialLoading
}) {
  const chartRef = useRef(null)
  const [localidades, setLocalidades] = useState([])
  const [dadosCompletos, setDadosCompletos] = useState([])
  const [internacoesSexo, setInternacoesSexo] = useState(initialInternacoesSexo || [])
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
      const res = await api.get('/api/internacoes/sexo')
      const dados = res.data || []
      setDadosCompletos(dados)
      setInternacoesSexo(dados)
    } catch (error) {
      setDadosCompletos([])
      setInternacoesSexo([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialInternacoesSexo && initialInternacoesSexo.length > 0) {
      setDadosCompletos(initialInternacoesSexo)
      setInternacoesSexo(initialInternacoesSexo)
    }
  }, [initialInternacoesSexo])

  useEffect(() => {
    if (dadosCompletos.length === 0 && internacoesSexo.length === 0) {
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
        const res = await api.get('/api/internacoes/sexo', params)
        setInternacoesSexo(res.data || [])
      } else {
        setInternacoesSexo(dadosCompletos)
      }
    } catch (error) {
      setInternacoesSexo([])
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
    exportChartAsPNG(chartRef, 'internacoes-sexo', filtrosInfo)
  }

  const handleExportCSV = () => {
    exportDataAsCSV(internacoesSexo, 'internacoes-sexo')
  }

  const totalInternacoes = internacoesSexo.reduce((sum, item) => sum + (item.total_internacoes || 0), 0)
  const internacoesMasculino = internacoesSexo.find(item => item.sexo_desc === 'Masculino')?.total_internacoes || 0
  const internacoesFeminino = internacoesSexo.find(item => item.sexo_desc === 'Feminino')?.total_internacoes || 0
  const percentualMasculino = totalInternacoes > 0 ? ((internacoesMasculino / totalInternacoes) * 100).toFixed(1) : 0
  const percentualFeminino = totalInternacoes > 0 ? ((internacoesFeminino / totalInternacoes) * 100).toFixed(1) : 0

  return (
    <>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Páginas</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">Internações por Sexo</span>
      </div>

      <div className="page-layout">
        {/* Header da Página */}
        <div className="page-header">
          <h2>Internações por Sexo</h2>
          <p className="page-subtitle">
            Distribuição das internações hospitalares segundo o sexo dos pacientes. 
            Analise as diferenças e proporções entre os grupos.
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
        {!loading && internacoesSexo.length > 0 && (
          <div className="page-stats-grid">
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="page-stat-label">Total de Internações</div>
              <div className="page-stat-value">{formatNumber(totalInternacoes)}</div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-mars"></i>
              </div>
              <div className="page-stat-label">Masculino</div>
              <div className="page-stat-value">{formatNumber(internacoesMasculino)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {percentualMasculino}% do total
              </div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-venus"></i>
              </div>
              <div className="page-stat-label">Feminino</div>
              <div className="page-stat-value">{formatNumber(internacoesFeminino)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {percentualFeminino}% do total
              </div>
            </div>
            <div className="page-stat-card">
              <div className="page-stat-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
              <div className="page-stat-label">Razão M/F</div>
              <div className="page-stat-value">
                {internacoesFeminino > 0 ? (internacoesMasculino / internacoesFeminino).toFixed(2) : 'N/A'}
              </div>
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
                Este gráfico compara as internações entre os sexos. Clique nas barras para ver detalhes. 
                A razão M/F indica quantas vezes mais internações ocorrem no sexo masculino em relação ao feminino.
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
                <h3 className="chart-title">Distribuição por Sexo</h3>
                <span className="chart-badge">Análise comparativa</span>
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
            <InternacoesPorSexoChart data={internacoesSexo} />
          </div>
        )}
      </div>
    </>
  )
}

