import { useState } from 'react'
import { StatCard } from '../components/StatCard'
import { BrasilMapRealLeaflet } from '../components/BrasilMapRealLeaflet'
import { InternacoesCid10HomeChart } from '../components/InternacoesCid10HomeChart'
import { ObitosPorCidCapChart } from '../components/ObitosPorCidCapChart'
import { formatNumber } from '../utils/formatNumber'
import { Modal } from '../components/Modal'

export function HomePage({
  seriesMensal,
  internacoesSexo,
  obitosRaca,
  internacoesCid,
  obitosCid,
  loading,
  periodoDados,
  isRefreshing,
  onRefresh
}) {
  const [drillDown, setDrillDown] = useState(null)
  
  const totalInternacoesCid = internacoesCid.reduce((sum, item) => sum + (item.total_internacoes || 0), 0)
  const totalObitosCid = obitosCid.reduce((sum, item) => sum + (item.total_obitos || 0), 0)
  const totalInternacoes = seriesMensal.reduce((sum, item) => sum + (item.internacoes || 0), 0)
  const totalObitos = seriesMensal.reduce((sum, item) => sum + (item.obitos || 0), 0)
  const totalInternacoesSexo = internacoesSexo.reduce((sum, item) => sum + (item.total_internacoes || 0), 0)
  const totalObitosRaca = obitosRaca.reduce((sum, item) => sum + (item.total_obitos || 0), 0)

  const topCapituloInternacoes = internacoesCid.length > 0 ? internacoesCid[0] : null
  const topCapituloObitos = obitosCid.length > 0 ? obitosCid[0] : null

  const formatarPeriodo = () => {
    if (!periodoDados || !periodoDados.ano_inicio || !periodoDados.ano_fim) {
      return 'Período não disponível'
    }
    
    const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const mesInicio = periodoDados.mes_inicio ? meses[periodoDados.mes_inicio] : ''
    const mesFim = periodoDados.mes_fim ? meses[periodoDados.mes_fim] : ''
    
    if (periodoDados.ano_inicio === periodoDados.ano_fim) {
      if (mesInicio && mesFim) {
        return `${mesInicio}/${periodoDados.ano_inicio} - ${mesFim}/${periodoDados.ano_fim}`
      }
      return `${periodoDados.ano_inicio}`
    }
    
    const inicio = mesInicio ? `${mesInicio}/${periodoDados.ano_inicio}` : `${periodoDados.ano_inicio}`
    const fim = mesFim ? `${mesFim}/${periodoDados.ano_fim}` : `${periodoDados.ano_fim}`
    return `${inicio} - ${fim}`
  }

  return (
    <>
      {/* Header com período dos dados */}
      <div className="home-header">
        <div className="breadcrumbs">
          <span className="breadcrumb-item">Páginas</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">Dashboard</span>
        </div>
        <div className="home-header-right">
          {periodoDados && (
            <div className="periodo-info">
              <i className="fas fa-calendar-alt"></i>
              <span className="periodo-label">Período dos dados:</span>
              <span className="periodo-value">{formatarPeriodo()}</span>
            </div>
          )}
          {onRefresh && (
            <button 
              className={`refresh-data-button ${isRefreshing ? 'refreshing' : ''}`}
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Atualizar dados"
            >
              <i className={`fas ${isRefreshing ? 'fa-sync-alt' : 'fa-sync'}`}></i>
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas - Foco em CID-10 */}
      <div className="stats-grid">
        <StatCard
          title="Internações por CID-10"
          value={formatNumber(totalInternacoesCid)}
          icon="fa-book-medical"
          color="teal"
        />
        <StatCard
          title="Óbitos por CID-10"
          value={formatNumber(totalObitosCid)}
          icon="fa-file-medical"
          color="blue"
        />
        <StatCard
          title="Top Capítulo - Internações"
          value={topCapituloInternacoes ? `${topCapituloInternacoes.capitulo_cod || 'N/A'}` : 'N/A'}
          icon="fa-trophy"
          color="green"
        />
        <StatCard
          title="Top Capítulo - Óbitos"
          value={topCapituloObitos ? `${topCapituloObitos.capitulo_cod || 'N/A'}` : 'N/A'}
          icon="fa-award"
          color="purple"
        />
      </div>


      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Seção Principal: Mapa CID-10 */}
          <div className="dashboard-main-section">
            {/* Mapa Demográfico CID-10 - Lado Esquerdo */}
            <div className="dashboard-map-section">
              <div className="chart-card">
                {periodoDados && (
                  <div className="map-periodo-info">
                    <i className="fas fa-info-circle"></i>
                    <span>Dados referentes ao período: <strong>{formatarPeriodo()}</strong></span>
                  </div>
                )}
                <BrasilMapRealLeaflet internacoesCid={internacoesCid} />
              </div>
            </div>

            {/* Gráficos CID-10 - Lado Direito */}
            <div className="dashboard-charts-section">
              {/* Gráfico de Internações por CID-10 */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Top 10 - Internações por Capítulo CID-10</h3>
                    {periodoDados && (
                      <div className="chart-periodo">
                        <i className="fas fa-calendar"></i>
                        <span>{formatarPeriodo()}</span>
                      </div>
                    )}
                  </div>
                  <span className="chart-badge">
                    {internacoesCid.length} capítulos
                  </span>
                </div>
                <InternacoesCid10HomeChart 
                  data={internacoesCid}
                  onBarClick={(data) => {
                    if (data && data.capitulo_cod) {
                      const filteredData = internacoesCid.filter(item => item.capitulo_cod === data.capitulo_cod)
                      setDrillDown({
                        type: 'cid-internacoes',
                        value: `${data.capitulo_cod} - ${data.capitulo_nome}`,
                        data: filteredData,
                        originalData: internacoesCid
                      })
                    }
                  }}
                />
              </div>

              {/* Gráfico de Óbitos por CID-10 */}
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Top 10 - Óbitos por Capítulo CID-10</h3>
                    {periodoDados && (
                      <div className="chart-periodo">
                        <i className="fas fa-calendar"></i>
                        <span>{formatarPeriodo()}</span>
                      </div>
                    )}
                  </div>
                  <span className="chart-badge">
                    {obitosCid.length} capítulos
                  </span>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: 'block' }}>
                  <ObitosPorCidCapChart 
                    data={obitosCid.slice(0, 10)}
                    isHome={true}
                    onBarClick={(data) => {
                      if (data && data.capitulo_cod) {
                        const filteredData = obitosCid.filter(item => item.capitulo_cod === data.capitulo_cod)
                        setDrillDown({
                          type: 'cid-obitos',
                          value: `${data.capitulo_cod} - ${data.capitulo_nome}`,
                          data: filteredData,
                          originalData: obitosCid
                        })
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal para detalhes do drill-down */}
      <Modal
        isOpen={drillDown !== null}
        onClose={() => setDrillDown(null)}
        title={drillDown?.type === 'cid-internacoes' 
          ? `Detalhes: ${drillDown?.value}` 
          : drillDown?.type === 'cid-obitos'
          ? `Detalhes: ${drillDown?.value}`
          : 'Detalhes'}
      >
        {drillDown && (
          <div className="drill-down-stats">
            <div className="drill-down-stat">
              <span className="drill-down-label">Capítulo:</span>
              <span className="drill-down-value">{drillDown.value}</span>
            </div>
            {drillDown.type === 'cid-internacoes' && (
              <div className="drill-down-stat">
                <span className="drill-down-label">Total de Internações:</span>
                <span className="drill-down-value">
                  {drillDown.data.reduce((sum, item) => sum + (item.total_internacoes || 0), 0).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            {drillDown.type === 'cid-obitos' && (
              <div className="drill-down-stat">
                <span className="drill-down-label">Total de Óbitos:</span>
                <span className="drill-down-value">
                  {drillDown.data.reduce((sum, item) => sum + (item.total_obitos || 0), 0).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            <div className="drill-down-info">
              <p>Detalhes do capítulo CID-10 selecionado: <strong>{drillDown.value}</strong></p>
              <p>Os dados são agregados para todo o período selecionado.</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

