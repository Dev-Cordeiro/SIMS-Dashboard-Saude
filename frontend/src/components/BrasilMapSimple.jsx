import { useState, useEffect } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'
import { api } from '../services/api'
import { formatNumber } from '../utils/formatNumber'
import './BrasilMapSimple.css'

const GEOJSON_CACHE_KEY = 'brasil_geojson_cache'
const GEOJSON_CACHE_EXPIRY = 24 * 60 * 60 * 1000
const geoUrl = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson'
const geoUrlAlternative = 'https://raw.githubusercontent.com/fititnt/gis-dataset-brasil/master/uf/geojson/uf.json'

export function BrasilMapSimple({ internacoesCid = [] }) {
  const [estadosData, setEstadosData] = useState({})
  const [loading, setLoading] = useState(true)
  const [hoveredEstado, setHoveredEstado] = useState(null)
  const [selectedCid, setSelectedCid] = useState('')
  const [error, setError] = useState(null)
  const [selectedEstado, setSelectedEstado] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [geographyData, setGeographyData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)

  useEffect(() => {
    async function carregarGeoJSON() {
      try {
        const cached = localStorage.getItem(GEOJSON_CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const now = Date.now()
          if (now - timestamp < GEOJSON_CACHE_EXPIRY) {
            setGeographyData(data)
            setGeoLoading(false)
            return
          }
        }

        let response = await fetch(geoUrl, {
          headers: {
            'Accept': 'application/json',
          },
          cache: 'force-cache'
        })

        if (!response.ok) {
          if (response.status === 429) {
            response = await fetch(geoUrlAlternative, {
              headers: {
                'Accept': 'application/json',
              },
              cache: 'force-cache'
            })
            if (!response.ok && cached) {
              const { data } = JSON.parse(cached)
              setGeographyData(data)
              setGeoLoading(false)
              return
            }
            if (!response.ok) {
              throw new Error('Muitas requisições. Usando cache se disponível.')
            }
          } else {
            throw new Error(`Erro ao carregar mapa: ${response.status}`)
          }
        }

        let data = await response.json()
        
        if (data.type === 'FeatureCollection' && data.features) {
          data = data
        } else if (Array.isArray(data)) {
          data = {
            type: 'FeatureCollection',
            features: data
          }
        }
        localStorage.setItem(GEOJSON_CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
        setGeographyData(data)
      } catch (error) {
        console.error('Erro ao carregar GeoJSON:', error)
        const cached = localStorage.getItem(GEOJSON_CACHE_KEY)
        if (cached) {
          try {
            const { data } = JSON.parse(cached)
            setGeographyData(data)
          } catch (e) {
            setError('Erro ao carregar mapa. Tente recarregar a página.')
          }
        } else {
          setError('Erro ao carregar mapa. Tente recarregar a página.')
        }
      } finally {
        setGeoLoading(false)
      }
    }

    carregarGeoJSON()
  }, [])

  useEffect(() => {
    async function carregarDadosEstados() {
      setError(null)
      setLoading(true)
      try {
        const url = selectedCid 
          ? `/api/internacoes/cid-por-estado?capitulo_cod=${encodeURIComponent(selectedCid)}`
          : '/api/internacoes/cid-por-estado'
        
        const res = await api.get(url, { timeout: 60000 })
        
        const dados = {}
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          res.data.forEach(item => {
            const uf = item.uf ? item.uf.toUpperCase().trim() : null
            if (!uf) return
            
            if (!dados[uf]) {
              dados[uf] = {
                uf: uf,
                totalInternacoes: 0,
                capitulo_cod: item.capitulo_cod || null,
                capitulo_nome: item.capitulo_nome || null,
              }
            }
            dados[uf].totalInternacoes += Number(item.total_internacoes) || 0
            if (item.capitulo_cod && !dados[uf].capitulo_cod) {
              dados[uf].capitulo_cod = item.capitulo_cod
            }
            if (item.capitulo_nome && !dados[uf].capitulo_nome) {
              dados[uf].capitulo_nome = item.capitulo_nome
            }
          })
        }
        setEstadosData(dados)
        setError(null)
      } catch (error) {
        if (error.response?.status === 429) {
          setError('Muitas requisições. Aguarde alguns instantes e tente novamente.')
        } else if (error.code === 'ECONNABORTED') {
          setError('A requisição demorou muito para responder. Tente novamente.')
        } else {
          setError('Erro ao carregar dados do mapa. Tente novamente.')
        }
        setEstadosData({})
      } finally {
        setLoading(false)
      }
    }

    if (!geoLoading) {
      carregarDadosEstados()
    }
  }, [selectedCid, geoLoading])

  const valoresComDados = Object.values(estadosData)
    .filter(d => d && d.totalInternacoes > 0)
    .map(d => d.totalInternacoes)
  const maxValue = valoresComDados.length > 0 ? Math.max(...valoresComDados, 1) : 1

  const getEstadoColor = (uf) => {
    const dados = estadosData[uf]
    if (!dados || dados.totalInternacoes === 0) {
      return '#e2e8f0'
    }
    
    const ratio = dados.totalInternacoes / maxValue
    if (ratio > 0.7) return '#991b1b'  // Vermelho muito escuro
    if (ratio > 0.5) return '#dc2626'  // Vermelho escuro
    if (ratio > 0.3) return '#ef4444'  // Vermelho
    if (ratio > 0.1) return '#f87171'  // Vermelho claro
    return '#fca5a5'  // Rosa
  }

  const getUF = (geography) => {
    const props = geography.properties || {}
    return props.uf || 
           props.sigla || 
           props.SIGLA ||
           props.UF ||
           props.uf_code ||
           props.state_code ||
           null
  }

  const cidOptions = [
    { value: '', label: 'Todos os Capítulos' },
    ...(internacoesCid || []).map(item => ({
      value: item.capitulo_cod,
      label: `${item.capitulo_cod} - ${item.capitulo_nome}`
    }))
  ]

  return (
    <div className="brasil-map-simple-container">
      <div className="map-header">
        <h3 className="map-title">Mapa Demográfico - Internações por CID-10</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', zIndex: 1000 }}>
            <select
              value={selectedCid}
              onChange={(e) => setSelectedCid(e.target.value)}
              className="map-select"
            >
              {cidOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label.length > 50 ? `${option.label.substring(0, 47)}...` : option.label}
                </option>
              ))}
            </select>
          </div>
          <span className="map-badge">
            {selectedCid ? `CID-10: ${selectedCid}` : 'Todos os Capítulos'}
          </span>
        </div>
      </div>
      
      {(!internacoesCid || internacoesCid.length === 0) ? (
        <div className="map-loading">
          <p>Aguardando dados de CID-10...</p>
        </div>
      ) : error ? (
        <div className="map-loading">
          <div className="map-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={() => {
              setError(null)
              const currentCid = selectedCid
              setSelectedCid('')
              setTimeout(() => setSelectedCid(currentCid), 100)
            }}>
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : (
        <div className="map-wrapper-simple">
          {loading && (
            <div className="map-loading-overlay">
              <div className="loading-spinner"></div>
              <p>Atualizando dados...</p>
            </div>
          )}
          
          <div 
            className="map-inner-container"
            style={{ 
              width: '100%', 
              height: '100%', 
              overflow: 'hidden', 
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                center: [-55, -14],
                scale: 680,
                rotate: [0, 0, 0],
                precision: 0.1
              }}
              style={{ 
                width: '100%', 
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
            <ZoomableGroup>
              {geographyData ? (
                <Geographies geography={geographyData}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                    const uf = getUF(geo)
                    const dados = estadosData[uf]
                    const hasData = dados && dados.totalInternacoes > 0
                    const fillColor = getEstadoColor(uf)
                    const estadoName = geo.properties.name || geo.properties.nome || uf || 'Desconhecido'
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fillColor}
                        stroke="#ffffff"
                        strokeWidth={hasData ? 2 : 1}
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: '#ffffff',
                            strokeWidth: hasData ? 2.5 : 1.5,
                            outline: 'none',
                            opacity: hasData ? 0.9 : 0.5,
                            filter: hasData ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' : 'none',
                            transition: 'all 0.3s ease'
                          },
                          hover: {
                            fill: hasData ? '#14b8a6' : fillColor,
                            stroke: '#ffffff',
                            strokeWidth: hasData ? 3.5 : 2,
                            outline: 'none',
                            cursor: hasData ? 'pointer' : 'default',
                            opacity: hasData ? 1 : 0.6,
                            filter: hasData ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.25))' : 'none',
                            transform: hasData ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.3s ease'
                          },
                          pressed: {
                            fill: hasData ? '#0d9488' : fillColor,
                            stroke: '#ffffff',
                            strokeWidth: hasData ? 3.5 : 2,
                            outline: 'none',
                            opacity: hasData ? 1 : 0.7,
                            filter: hasData ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' : 'none',
                            transform: hasData ? 'scale(0.98)' : 'scale(1)',
                            transition: 'all 0.2s ease'
                          }
                        }}
                        onMouseEnter={() => {
                          if (hasData) {
                            setHoveredEstado(uf)
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredEstado(null)
                        }}
                        onMouseMove={(event) => {
                          if (hasData && hoveredEstado === uf) {
                            const rect = event.currentTarget.closest('.map-wrapper-simple')?.getBoundingClientRect()
                            if (rect) {
                              setTooltipPosition({ 
                                x: event.clientX - rect.left, 
                                y: event.clientY - rect.top 
                              })
                            }
                          }
                        }}
                        onClick={() => {
                          if (hasData) {
                            setSelectedEstado({
                              uf: uf,
                              nome: estadoName,
                              dados: dados
                            })
                          }
                        }}
                      />
                    )
                  })
                }
                </Geographies>
              ) : (
                <div className="map-loading">
                  <p>Carregando mapa...</p>
                </div>
              )}
            </ZoomableGroup>
          </ComposableMap>
          
          {/* Tooltip no hover */}
          {hoveredEstado && estadosData[hoveredEstado] && tooltipPosition.x > 0 && (
            <div
              className="map-tooltip"
              style={{
                position: 'absolute',
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px',
                pointerEvents: 'none',
                zIndex: 1000
              }}
            >
              <div className="tooltip-content">
                <strong>{estadosData[hoveredEstado].uf}</strong>
                <br />
                {formatNumber(estadosData[hoveredEstado].totalInternacoes)} internações
              </div>
            </div>
          )}
          
          {/* Modal de detalhes ao clicar */}
          {selectedEstado && (
            <div className="map-modal-overlay" onClick={() => setSelectedEstado(null)}>
              <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="map-modal-header">
                  <h3>{selectedEstado.nome} ({selectedEstado.uf})</h3>
                  <button className="map-modal-close" onClick={() => setSelectedEstado(null)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="map-modal-body">
                  <div className="map-modal-stat">
                    <span className="map-modal-label">Total de Internações:</span>
                    <span className="map-modal-value">
                      {formatNumber(selectedEstado.dados.totalInternacoes)}
                    </span>
                  </div>
                  {selectedEstado.dados.capitulo_cod && (
                    <div className="map-modal-stat">
                      <span className="map-modal-label">CID-10:</span>
                      <span className="map-modal-value">
                        {selectedEstado.dados.capitulo_cod} - {selectedEstado.dados.capitulo_nome}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
          
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
                <span>Crítico</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

