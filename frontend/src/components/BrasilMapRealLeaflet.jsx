import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../services/api'
import { formatNumber } from '../utils/formatNumber'
import 'leaflet/dist/leaflet.css'
import './BrasilMapRealLeaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const GEOJSON_CACHE_KEY = 'brasil_geojson_cache'
const GEOJSON_CACHE_EXPIRY = 24 * 60 * 60 * 1000
const geoUrl = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson'

function MapController({ bounds }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, bounds])
  
  return null
}

export function BrasilMapRealLeaflet({ internacoesCid = [] }) {
  const [estadosData, setEstadosData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedCid, setSelectedCid] = useState('')
  const [error, setError] = useState(null)
  const [geographyData, setGeographyData] = useState(null)
  const [geoLoading, setGeoLoading] = useState(true)
  const mapRef = useRef(null)
  const layersRef = useRef({})
  const estadosDataRef = useRef({})

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

        const response = await fetch(geoUrl, {
          headers: {
            'Accept': 'application/json',
          },
          cache: 'force-cache'
        })

        if (!response.ok) {
          if (response.status === 429 && cached) {
            const { data } = JSON.parse(cached)
            setGeographyData(data)
            setGeoLoading(false)
            return
          }
          throw new Error(`Erro ao carregar mapa: ${response.status}`)
        }

        const data = await response.json()
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

  const getEstadoNameFromUF = (uf) => {
    const estadosNomes = {
      'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
      'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
      'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
      'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
      'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
      'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
      'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
    }
    return estadosNomes[uf] || uf
  }

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
            
            const totalInternacoes = Number(item.total_internacoes) || 0
            
            if (!dados[uf]) {
              dados[uf] = {
                uf: uf,
                totalInternacoes: 0,
                capitulo_cod: item.capitulo_cod || null,
                capitulo_nome: item.capitulo_nome || null,
              }
            }
            dados[uf].totalInternacoes += totalInternacoes
            if (item.capitulo_cod && !dados[uf].capitulo_cod) {
              dados[uf].capitulo_cod = item.capitulo_cod
            }
            if (item.capitulo_nome && !dados[uf].capitulo_nome) {
              dados[uf].capitulo_nome = item.capitulo_nome
            }
          })
        }
        setEstadosData(dados)
        estadosDataRef.current = dados
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

  useEffect(() => {
    Object.keys(layersRef.current).forEach(uf => {
      const layer = layersRef.current[uf]
      if (layer && estadosData[uf]) {
        const dadosEstado = estadosData[uf]
        const estadoName = getEstadoNameFromUF(uf)
        const hasData = dadosEstado && dadosEstado.totalInternacoes && dadosEstado.totalInternacoes > 0
        
        let popupContent = ''
        if (hasData && dadosEstado.totalInternacoes) {
          popupContent = `
            <div style="padding: 12px; min-width: 200px;">
              <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700; border-bottom: 2px solid #14b8a6; padding-bottom: 8px;">
                ${estadoName} (${uf})
              </h3>
              <div style="margin: 8px 0;">
                <p style="margin: 6px 0; color: #64748b; font-size: 14px;">
                  <strong style="color: #1e293b;">Total de Internações:</strong>
                </p>
                <p style="margin: 4px 0; color: #14b8a6; font-size: 20px; font-weight: 700;">
                  ${formatNumber(dadosEstado.totalInternacoes)}
                </p>
              </div>
              ${dadosEstado.capitulo_cod ? `
                <div style="margin: 8px 0; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 4px 0; color: #64748b; font-size: 13px;">
                    <strong style="color: #1e293b;">CID-10:</strong>
                  </p>
                  <p style="margin: 4px 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                    ${dadosEstado.capitulo_cod} - ${dadosEstado.capitulo_nome || ''}
                  </p>
                </div>
              ` : ''}
            </div>
          `
        } else {
          popupContent = `
            <div style="padding: 12px; min-width: 200px;">
              <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">
                ${estadoName} (${uf})
              </h3>
              <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
                Nenhum dado de internação disponível para este estado.
              </p>
            </div>
          `
        }
        layer.setPopupContent(popupContent)
      }
    })
  }, [estadosData])

  const valoresComDados = Object.values(estadosData)
    .filter(d => d && d.totalInternacoes > 0)
    .map(d => d.totalInternacoes)
  const maxValue = valoresComDados.length > 0 ? Math.max(...valoresComDados, 1) : 1

  const getEstadoColor = (uf) => {
    const dados = estadosDataRef.current[uf] || estadosData[uf]
    if (!dados || !dados.totalInternacoes || dados.totalInternacoes === 0) {
      return '#e2e8f0'
    }
    
    const valoresComDadosAtuais = Object.values(estadosDataRef.current || estadosData)
      .filter(d => d && d.totalInternacoes > 0)
      .map(d => d.totalInternacoes)
    const maxValueAtual = valoresComDadosAtuais.length > 0 ? Math.max(...valoresComDadosAtuais, 1) : 1
    
    const ratio = dados.totalInternacoes / maxValueAtual
    if (ratio > 0.7) return '#0d9488'
    if (ratio > 0.5) return '#14b8a6'
    if (ratio > 0.3) return '#2dd4bf'
    if (ratio > 0.1) return '#5eead4'
    return '#99f6e4'
  }

  const getUF = (feature) => {
    const props = feature.properties || {}
    return props.uf || 
           props.sigla || 
           props.SIGLA ||
           props.UF ||
           props.uf_code ||
           props.state_code ||
           null
  }

  const getEstadoName = (feature) => {
    const props = feature.properties || {}
    return props.name || props.nome || props.NAME || getUF(feature) || 'Desconhecido'
  }

  const styleFeature = (feature) => {
    const uf = getUF(feature)
    const fillColor = getEstadoColor(uf)
    const dados = estadosDataRef.current[uf] || estadosData[uf]
    const hasData = dados && dados.totalInternacoes && dados.totalInternacoes > 0

    return {
      fillColor: fillColor,
      weight: hasData ? 2.5 : 1.5,
      opacity: 1,
      color: '#ffffff',
      dashArray: '',
      fillOpacity: hasData ? 0.85 : 0.4,
      interactive: true
    }
  }

  const onEachFeature = (feature, layer) => {
    const uf = getUF(feature)
    const estadoName = getEstadoName(feature)
    
    layersRef.current[uf] = layer
    
    const createPopupContent = (dadosAtuais) => {
      const hasData = dadosAtuais && dadosAtuais.totalInternacoes && dadosAtuais.totalInternacoes > 0

      if (hasData && dadosAtuais.totalInternacoes) {
        return `
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700; border-bottom: 2px solid #14b8a6; padding-bottom: 8px;">
              ${estadoName} (${uf})
            </h3>
            <div style="margin: 8px 0;">
              <p style="margin: 6px 0; color: #64748b; font-size: 14px;">
                <strong style="color: #1e293b;">Total de Internações:</strong>
              </p>
              <p style="margin: 4px 0; color: #14b8a6; font-size: 20px; font-weight: 700;">
                ${formatNumber(dadosAtuais.totalInternacoes)}
              </p>
            </div>
            ${dadosAtuais.capitulo_cod ? `
              <div style="margin: 8px 0; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 4px 0; color: #64748b; font-size: 13px;">
                  <strong style="color: #1e293b;">CID-10:</strong>
                </p>
                <p style="margin: 4px 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                  ${dadosAtuais.capitulo_cod} - ${dadosAtuais.capitulo_nome || ''}
                </p>
              </div>
            ` : ''}
          </div>
        `
      } else {
        return `
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">
              ${estadoName} (${uf})
            </h3>
            <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
              Nenhum dado de internação disponível para este estado.
            </p>
          </div>
        `
      }
    }
    
    layer.bindPopup(() => {
      const dadosAtuais = estadosDataRef.current[uf]
      return createPopupContent(dadosAtuais)
    }, {
      className: 'custom-popup',
      closeButton: true,
      autoPan: true,
      maxWidth: 300
    })
    
    layer.on({
      click: (e) => {
        e.originalEvent.stopPropagation()
        const clickedLayer = e.target
        const dadosAtuais = estadosDataRef.current[uf]
        const updatedContent = createPopupContent(dadosAtuais)
        clickedLayer.setPopupContent(updatedContent)
        clickedLayer.openPopup(e.latlng)
      },
      mouseover: (e) => {
        const layer = e.target
        const ufHover = getUF(feature)
        const dadosHover = estadosDataRef.current[ufHover]
        const hasDataHover = dadosHover && dadosHover.totalInternacoes && dadosHover.totalInternacoes > 0
        
        if (!layer._originalFillColor) {
          layer._originalFillColor = layer.options.fillColor || getEstadoColor(ufHover)
        }
        
        const fillColor = layer._originalFillColor || getEstadoColor(ufHover)
        
        layer.setStyle({
          fillColor: fillColor,
          weight: hasDataHover ? 4 : 3,
          fillOpacity: hasDataHover ? 0.95 : 0.6,
          color: hasDataHover ? '#0ea5e9' : '#64748b',
          opacity: 1,
          dashArray: ''
        })
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront()
        }
      },
      mouseout: (e) => {
        const layer = e.target
        const ufOut = getUF(feature)
        const fillColor = getEstadoColor(ufOut)
        const dados = estadosDataRef.current[ufOut]
        const hasData = dados && dados.totalInternacoes && dados.totalInternacoes > 0
        
        layer.setStyle({
          fillColor: fillColor,
          weight: hasData ? 2.5 : 1.5,
          opacity: 1,
          color: '#ffffff',
          dashArray: '',
          fillOpacity: hasData ? 0.85 : 0.4,
          interactive: true
        })
      }
    })
    
    layer.options.interactive = true
    layer.options.bubblingMouseEvents = false
  }

  const cidOptions = [
    { value: '', label: 'Todos os Capítulos' },
    ...(internacoesCid || []).map(item => ({
      value: item.capitulo_cod,
      label: `${item.capitulo_cod} - ${item.capitulo_nome}`
    }))
  ]

  const bounds = geographyData && geographyData.features && geographyData.features.length > 0
    ? L.geoJSON(geographyData).getBounds()
    : [[-35, -75], [6, -30]]

  return (
    <div className="brasil-map-real-container">
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
        <div className="map-wrapper-real">
          {loading && (
            <div className="map-loading-overlay">
              <div className="loading-spinner"></div>
              <p>Atualizando dados...</p>
            </div>
          )}
          
          {geographyData && (
            <MapContainer
              center={[-14, -55]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController bounds={bounds} />
              <GeoJSON
                data={geographyData}
                style={styleFeature}
                onEachFeature={onEachFeature}
                interactive={true}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation()
                  }
                }}
              />
            </MapContainer>
          )}
          
          <div className="map-legend">
            <div className="legend-title">Intensidade das Internações</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#99f6e4' }}></div>
                <span>Baixo</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#5eead4' }}></div>
                <span>Médio</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#2dd4bf' }}></div>
                <span>Alto</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#14b8a6' }}></div>
                <span>Muito Alto</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#0d9488' }}></div>
                <span>Crítico</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

