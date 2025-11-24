import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { formatNumber } from '../utils/formatNumber'
import './BrasilMap.css'

const estadosCoords = {
  'AC': { x: 20, y: 60, name: 'Acre' },
  'AL': { x: 85, y: 50, name: 'Alagoas' },
  'AP': { x: 55, y: 15, name: 'Amapá' },
  'AM': { x: 25, y: 35, name: 'Amazonas' },
  'BA': { x: 75, y: 45, name: 'Bahia' },
  'CE': { x: 80, y: 30, name: 'Ceará' },
  'DF': { x: 70, y: 55, name: 'Distrito Federal' },
  'ES': { x: 80, y: 65, name: 'Espírito Santo' },
  'GO': { x: 65, y: 55, name: 'Goiás' },
  'MA': { x: 70, y: 25, name: 'Maranhão' },
  'MT': { x: 50, y: 50, name: 'Mato Grosso' },
  'MS': { x: 55, y: 65, name: 'Mato Grosso do Sul' },
  'MG': { x: 75, y: 60, name: 'Minas Gerais' },
  'PA': { x: 50, y: 25, name: 'Pará' },
  'PB': { x: 85, y: 35, name: 'Paraíba' },
  'PR': { x: 60, y: 75, name: 'Paraná' },
  'PE': { x: 82, y: 40, name: 'Pernambuco' },
  'PI': { x: 75, y: 35, name: 'Piauí' },
  'RJ': { x: 78, y: 68, name: 'Rio de Janeiro' },
  'RN': { x: 83, y: 30, name: 'Rio Grande do Norte' },
  'RS': { x: 55, y: 85, name: 'Rio Grande do Sul' },
  'RO': { x: 30, y: 50, name: 'Rondônia' },
  'RR': { x: 30, y: 20, name: 'Roraima' },
  'SC': { x: 60, y: 80, name: 'Santa Catarina' },
  'SP': { x: 68, y: 70, name: 'São Paulo' },
  'SE': { x: 82, y: 45, name: 'Sergipe' },
  'TO': { x: 65, y: 40, name: 'Tocantins' },
}

export function BrasilMapCid10({ internacoesCid = [] }) {
  const [estadosData, setEstadosData] = useState({})
  const [loading, setLoading] = useState(true)
  const [hoveredEstado, setHoveredEstado] = useState(null)
  const [selectedCid, setSelectedCid] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!internacoesCid || internacoesCid.length === 0) {
      return
    }

    async function carregarDadosEstados() {
      setLoading(true)
      setError(null)
      try {
        const url = selectedCid 
          ? `/internacoes/cid-por-estado?capitulo_cod=${encodeURIComponent(selectedCid)}`
          : '/internacoes/cid-por-estado'
        
        const res = await api.get(url, {
          timeout: 60000
        })
        
        const dados = {}
        res.data.forEach(item => {
          const uf = item.uf
          if (!dados[uf]) {
            dados[uf] = {
              uf: uf,
              totalInternacoes: 0,
              capitulo_cod: item.capitulo_cod || null,
              capitulo_nome: item.capitulo_nome || null,
            }
          }
          dados[uf].totalInternacoes += item.total_internacoes || 0
          if (item.capitulo_cod && !dados[uf].capitulo_cod) {
            dados[uf].capitulo_cod = item.capitulo_cod
          }
          if (item.capitulo_nome && !dados[uf].capitulo_nome) {
            dados[uf].capitulo_nome = item.capitulo_nome
          }
        })
        setEstadosData(dados)
        setError(null)
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          setError('A requisição demorou muito para responder. Tente novamente ou selecione um CID-10 específico.')
        } else {
          setError('Erro ao carregar dados do mapa. Tente novamente.')
        }
      } finally {
        setLoading(false)
      }
    }

    carregarDadosEstados()
  }, [selectedCid, internacoesCid])

  const valoresComDados = Object.values(estadosData)
    .filter(d => d && d.totalInternacoes > 0)
    .map(d => d.totalInternacoes)
  const maxValue = valoresComDados.length > 0 ? Math.max(...valoresComDados, 1) : 1

  const getEstadoColor = (uf) => {
    const dados = estadosData[uf]
    if (!dados || dados.totalInternacoes === 0) {
      return '#cbd5e1'
    }
    
    const ratio = dados.totalInternacoes / maxValue
    if (ratio > 0.7) return '#dc2626'
    if (ratio > 0.5) return '#ef4444'
    if (ratio > 0.3) return '#f87171'
    if (ratio > 0.1) return '#fca5a5'
    return '#fecaca'
  }

  const getEstadoOpacity = (uf) => {
    if (hoveredEstado && hoveredEstado !== uf) return 0.5
    return 1
  }

  const cidOptions = [
    { value: '', label: 'Todos os Capítulos' },
    ...(internacoesCid || []).map(item => ({
      value: item.capitulo_cod,
      label: `${item.capitulo_cod} - ${item.capitulo_nome}`
    }))
  ]

  return (
    <div className="brasil-map-container brasil-map-embedded">
      <div className="map-header">
        <h3 className="map-title">Mapa Demográfico - Internações por CID-10</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={selectedCid}
            onChange={(e) => setSelectedCid(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              color: '#1a202c',
              cursor: 'pointer',
              minWidth: '250px',
            }}
          >
            {cidOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="map-badge">
            {selectedCid ? `CID-10: ${selectedCid}` : 'Todos os Capítulos'}
          </span>
        </div>
      </div>
      
      {(!internacoesCid || internacoesCid.length === 0) ? (
        <div className="map-loading">
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Aguardando dados de CID-10...
          </p>
        </div>
      ) : error ? (
        <div className="map-loading">
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            color: '#dc2626'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>{error}</p>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                const currentCid = selectedCid
                setSelectedCid('')
                setTimeout(() => setSelectedCid(currentCid), 100)
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#14b8a6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '8px'
              }}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Carregando mapa...</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
            Isso pode levar alguns segundos...
          </p>
        </div>
      ) : (
        <div className="map-wrapper">
          <svg
            viewBox="0 0 1000 1000"
            className="brasil-map-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Estados simplificados - usando círculos maiores para melhor visualização */}
            {Object.entries(estadosCoords).map(([uf, coords]) => {
              const dados = estadosData[uf]
              const hasData = dados && dados.totalInternacoes > 0
              
              const x = coords.x * 10
              const y = coords.y * 10
              
              let radius = 12
              if (hasData) {
                radius = Math.max(15, Math.min(35, (dados.totalInternacoes / maxValue) * 25 + 15))
              }
              
              return (
                <g key={uf}>
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={getEstadoColor(uf)}
                    stroke="#ffffff"
                    strokeWidth={hasData ? "2" : "1.5"}
                    opacity={getEstadoOpacity(uf)}
                    className="estado-circle"
                    onMouseEnter={() => {
                      if (hasData) {
                        setHoveredEstado(uf)
                      }
                    }}
                    onMouseLeave={() => setHoveredEstado(null)}
                    style={{ cursor: hasData ? 'pointer' : 'default' }}
                  />
                  <text
                    x={x}
                    y={y + 5}
                    fontSize="24"
                    fill={hasData ? "#1a202c" : "#94a3b8"}
                    textAnchor="middle"
                    fontWeight="700"
                    className="estado-label"
                    opacity={getEstadoOpacity(uf)}
                    style={{ pointerEvents: 'none' }}
                  >
                    {uf}
                  </text>
                </g>
              )
            })}
          </svg>
          
          {/* Tooltip */}
          {hoveredEstado && (
            <div 
              className="map-tooltip"
              style={{
                left: `${estadosCoords[hoveredEstado].x}%`,
                top: `${estadosCoords[hoveredEstado].y - 8}%`,
              }}
            >
              <div className="tooltip-header">
                <strong>{estadosCoords[hoveredEstado].name} ({hoveredEstado})</strong>
              </div>
              <div className="tooltip-content">
                {estadosData[hoveredEstado] && estadosData[hoveredEstado].totalInternacoes > 0 ? (
                  <>
                    {estadosData[hoveredEstado].capitulo_cod && (
                      <div className="tooltip-item">
                        <span className="tooltip-label">CID-10:</span>
                        <span className="tooltip-value">
                          {estadosData[hoveredEstado].capitulo_cod} - {estadosData[hoveredEstado].capitulo_nome}
                        </span>
                      </div>
                    )}
                    <div className="tooltip-item">
                      <span className="tooltip-label">Internações:</span>
                      <span className="tooltip-value">
                        {formatNumber(estadosData[hoveredEstado].totalInternacoes)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="tooltip-item">
                    <span className="tooltip-label" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                      Sem dados disponíveis
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Legenda */}
          <div className="map-legend">
            <div className="legend-title">Intensidade das Internações</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#fecaca' }}></div>
                <span>Baixo</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#fca5a5' }}></div>
                <span>Médio</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#f87171' }}></div>
                <span>Alto</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
                <span>Muito Alto</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#dc2626' }}></div>
                <span>Máximo</span>
              </div>
              <div className="legend-item" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <div className="legend-color" style={{ backgroundColor: '#cbd5e1' }}></div>
                <span>Sem dados</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

