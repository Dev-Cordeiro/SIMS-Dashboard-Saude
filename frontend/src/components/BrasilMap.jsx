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

export function BrasilMap() {
  const [estadosData, setEstadosData] = useState({})
  const [loading, setLoading] = useState(true)
  const [hoveredEstado, setHoveredEstado] = useState(null)

  useEffect(() => {
    async function carregarDadosEstados() {
      setLoading(true)
      try {
        const res = await api.get('/api/dados/por-estado')
        
        const dados = {}
        res.data.forEach(item => {
          dados[item.uf] = {
            uf: item.uf,
            totalInternacoes: item.total_internacoes || 0,
            totalObitos: item.total_obitos || 0,
            totalGeral: (item.total_internacoes || 0) + (item.total_obitos || 0),
          }
        })
        setEstadosData(dados)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    carregarDadosEstados()
  }, [])

  const valoresComDados = Object.values(estadosData)
    .filter(d => d && d.totalGeral > 0)
    .map(d => d.totalGeral)
  const maxValue = valoresComDados.length > 0 ? Math.max(...valoresComDados, 1) : 1

  const getEstadoColor = (uf) => {
    const dados = estadosData[uf]
    if (!dados || dados.totalGeral === 0) {
      return '#cbd5e1'
    }
    
    const ratio = dados.totalGeral / maxValue
    if (ratio > 0.7) return '#059669'
    if (ratio > 0.5) return '#10b981'
    if (ratio > 0.3) return '#14b8a6'
    if (ratio > 0.1) return '#5eead4'
    return '#ccfbf1'
  }

  const getEstadoOpacity = (uf) => {
    if (hoveredEstado && hoveredEstado !== uf) return 0.5
    return 1
  }

  return (
  <div className="brasil-map-container">
    <div className="map-header">
      <h3 className="map-title">Distribuição Geográfica</h3>
      <span className="map-badge">Dados por Estado</span>
    </div>
    
    {loading ? (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Carregando mapa...</p>
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
            const hasData = dados && dados.totalGeral > 0
            
            const x = coords.x * 10
            const y = coords.y * 10
            
            let radius = 12
            if (hasData) {
              radius = Math.max(15, Math.min(35, (dados.totalGeral / maxValue) * 25 + 15))
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
                  style={{ cursor: 'default' }}
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
              {estadosData[hoveredEstado] && estadosData[hoveredEstado].totalGeral > 0 ? (
                <>
                  <div className="tooltip-item">
                    <span className="tooltip-label">Internações:</span>
                    <span className="tooltip-value">{formatNumber(estadosData[hoveredEstado].totalInternacoes)}</span>
                  </div>
                  <div className="tooltip-item">
                    <span className="tooltip-label">Óbitos:</span>
                    <span className="tooltip-value">{formatNumber(estadosData[hoveredEstado].totalObitos)}</span>
                  </div>
                  <div className="tooltip-item">
                    <span className="tooltip-label">Total:</span>
                    <span className="tooltip-value">{formatNumber(estadosData[hoveredEstado].totalGeral)}</span>
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
          <div className="legend-title">Intensidade dos Dados</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ccfbf1' }}></div>
              <span>Baixo</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#5eead4' }}></div>
              <span>Médio</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#14b8a6' }}></div>
              <span>Alto</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
              <span>Muito Alto</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#059669' }}></div>
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

