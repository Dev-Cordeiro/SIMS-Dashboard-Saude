import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { formatNumber } from '../utils/formatNumber'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './BrasilMapReal.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export function BrasilMapReal({ internacoesCid = [] }) {
  const [estadosData, setEstadosData] = useState({})
  const [loading, setLoading] = useState(true)
  const [hoveredEstado, setHoveredEstado] = useState(null)
  const [selectedCid, setSelectedCid] = useState('')
  const [error, setError] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const geoJsonLayerRef = useRef(null)

  const geoJsonFallback = {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { name: "Acre", uf: "AC" }, geometry: { type: "Polygon", coordinates: [[[-70, -10], [-68, -10], [-68, -8], [-70, -8], [-70, -10]]] } },
      { type: "Feature", properties: { name: "Alagoas", uf: "AL" }, geometry: { type: "Polygon", coordinates: [[[-37, -10], [-35, -10], [-35, -9], [-37, -9], [-37, -10]]] } },
      { type: "Feature", properties: { name: "Amapá", uf: "AP" }, geometry: { type: "Polygon", coordinates: [[[-52, 2], [-50, 2], [-50, 4], [-52, 4], [-52, 2]]] } },
      { type: "Feature", properties: { name: "Amazonas", uf: "AM" }, geometry: { type: "Polygon", coordinates: [[[-70, -5], [-60, -5], [-60, 2], [-70, 2], [-70, -5]]] } },
      { type: "Feature", properties: { name: "Bahia", uf: "BA" }, geometry: { type: "Polygon", coordinates: [[[-42, -18], [-38, -18], [-38, -10], [-42, -10], [-42, -18]]] } },
      { type: "Feature", properties: { name: "Ceará", uf: "CE" }, geometry: { type: "Polygon", coordinates: [[[-41, -7], [-38, -7], [-38, -4], [-41, -4], [-41, -7]]] } },
      { type: "Feature", properties: { name: "Distrito Federal", uf: "DF" }, geometry: { type: "Polygon", coordinates: [[[-48, -16], [-47, -16], [-47, -15], [-48, -15], [-48, -16]]] } },
      { type: "Feature", properties: { name: "Espírito Santo", uf: "ES" }, geometry: { type: "Polygon", coordinates: [[[-41, -21], [-39, -21], [-39, -18], [-41, -18], [-41, -21]]] } },
      { type: "Feature", properties: { name: "Goiás", uf: "GO" }, geometry: { type: "Polygon", coordinates: [[[-52, -18], [-48, -18], [-48, -14], [-52, -14], [-52, -18]]] } },
      { type: "Feature", properties: { name: "Maranhão", uf: "MA" }, geometry: { type: "Polygon", coordinates: [[[-46, -7], [-42, -7], [-42, -2], [-46, -2], [-46, -7]]] } },
      { type: "Feature", properties: { name: "Mato Grosso", uf: "MT" }, geometry: { type: "Polygon", coordinates: [[[-60, -16], [-52, -16], [-52, -8], [-60, -8], [-60, -16]]] } },
      { type: "Feature", properties: { name: "Mato Grosso do Sul", uf: "MS" }, geometry: { type: "Polygon", coordinates: [[[-58, -24], [-52, -24], [-52, -18], [-58, -18], [-58, -24]]] } },
      { type: "Feature", properties: { name: "Minas Gerais", uf: "MG" }, geometry: { type: "Polygon", coordinates: [[[-51, -23], [-40, -23], [-40, -14], [-51, -14], [-51, -23]]] } },
      { type: "Feature", properties: { name: "Pará", uf: "PA" }, geometry: { type: "Polygon", coordinates: [[[-56, -2], [-46, -2], [-46, 2], [-56, 2], [-56, -2]]] } },
      { type: "Feature", properties: { name: "Paraíba", uf: "PB" }, geometry: { type: "Polygon", coordinates: [[[-38, -8], [-36, -8], [-36, -6], [-38, -6], [-38, -8]]] } },
      { type: "Feature", properties: { name: "Paraná", uf: "PR" }, geometry: { type: "Polygon", coordinates: [[[-54, -27], [-48, -27], [-48, -22], [-54, -22], [-54, -27]]] } },
      { type: "Feature", properties: { name: "Pernambuco", uf: "PE" }, geometry: { type: "Polygon", coordinates: [[[-41, -10], [-35, -10], [-35, -7], [-41, -7], [-41, -10]]] } },
      { type: "Feature", properties: { name: "Piauí", uf: "PI" }, geometry: { type: "Polygon", coordinates: [[[-45, -11], [-40, -11], [-40, -5], [-45, -5], [-45, -11]]] } },
      { type: "Feature", properties: { name: "Rio de Janeiro", uf: "RJ" }, geometry: { type: "Polygon", coordinates: [[[-45, -23], [-41, -23], [-41, -20], [-45, -20], [-45, -23]]] } },
      { type: "Feature", properties: { name: "Rio Grande do Norte", uf: "RN" }, geometry: { type: "Polygon", coordinates: [[[-38, -6], [-35, -6], [-35, -4], [-38, -4], [-38, -6]]] } },
      { type: "Feature", properties: { name: "Rio Grande do Sul", uf: "RS" }, geometry: { type: "Polygon", coordinates: [[[-57, -34], [-49, -34], [-49, -27], [-57, -27], [-57, -34]]] } },
      { type: "Feature", properties: { name: "Rondônia", uf: "RO" }, geometry: { type: "Polygon", coordinates: [[[-66, -13], [-60, -13], [-60, -8], [-66, -8], [-66, -13]]] } },
      { type: "Feature", properties: { name: "Roraima", uf: "RR" }, geometry: { type: "Polygon", coordinates: [[[-64, 1], [-59, 1], [-59, 5], [-64, 5], [-64, 1]]] } },
      { type: "Feature", properties: { name: "Santa Catarina", uf: "SC" }, geometry: { type: "Polygon", coordinates: [[[-53, -29], [-48, -29], [-48, -25], [-53, -25], [-53, -29]]] } },
      { type: "Feature", properties: { name: "São Paulo", uf: "SP" }, geometry: { type: "Polygon", coordinates: [[[-53, -25], [-44, -25], [-44, -19], [-53, -19], [-53, -25]]] } },
      { type: "Feature", properties: { name: "Sergipe", uf: "SE" }, geometry: { type: "Polygon", coordinates: [[[-38, -11], [-36, -11], [-36, -9], [-38, -9], [-38, -11]]] } },
      { type: "Feature", properties: { name: "Tocantins", uf: "TO" }, geometry: { type: "Polygon", coordinates: [[[-50, -13], [-45, -13], [-45, -5], [-50, -5], [-50, -13]]] } },
    ]
  }

  const [geoJsonData, setGeoJsonData] = useState(geoJsonFallback)

  useEffect(() => {
    async function carregarGeoJSON() {
      const cacheKey = 'brasil_geojson_cache'
      const cacheTimestampKey = 'brasil_geojson_cache_timestamp'
      const cacheExpiry = 30 * 24 * 60 * 60 * 1000

      const cachedData = localStorage.getItem(cacheKey)
      const cachedTimestamp = localStorage.getItem(cacheTimestampKey)
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          if (parsed && parsed.type === 'FeatureCollection' && parsed.features && parsed.features.length > 0) {
            const firstFeature = parsed.features[0]
            const hasUF = firstFeature?.properties?.uf || firstFeature?.properties?.sigla || firstFeature?.properties?.UF
            
            if (hasUF) {
              if (cachedTimestamp) {
                const cacheAge = Date.now() - parseInt(cachedTimestamp, 10)
                if (cacheAge < cacheExpiry) {
                  setGeoJsonData(parsed)
                  return
                }
              } else {
                setGeoJsonData(parsed)
                return
              }
            }
          }
        } catch (e) {
          localStorage.removeItem(cacheKey)
          localStorage.removeItem(cacheTimestampKey)
        }
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson', {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.type === 'FeatureCollection' && data.features && data.features.length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify(data))
            localStorage.setItem(cacheTimestampKey, Date.now().toString())
            setGeoJsonData(data)
            return
          }
        }
        throw new Error(`HTTP ${response.status}`)
      } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('429')) {
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData)
              if (parsed && parsed.type === 'FeatureCollection') {
                setGeoJsonData(parsed)
                return
              }
            } catch (e) {
            }
          }
        }
        setGeoJsonData(geoJsonFallback)
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
        if (error.code === 'ECONNABORTED') {
          setError('A requisição demorou muito para responder. Tente novamente.')
        } else {
          setError('Erro ao carregar dados do mapa. Tente novamente.')
        }
        setEstadosData({})
      } finally {
        setLoading(false)
      }
    }

    carregarDadosEstados()
  }, [selectedCid])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const timer = setTimeout(() => {
      if (!mapRef.current) return

      const rect = mapRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(() => {
          if (mapRef.current && !mapInstanceRef.current) {
            initializeMap()
          }
        }, 500)
        return
      }

      initializeMap()
    }, 300)

    function initializeMap() {
      if (!mapRef.current || mapInstanceRef.current) return

      const rect = mapRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      try {
        const map = L.map(mapRef.current, {
          center: [-14, -55],
          zoom: 4,
          zoomControl: true,
          scrollWheelZoom: true,
          maxBounds: [[-35, -75], [5, -30]],
          maxBoundsViscosity: 1.0
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 10,
          minZoom: 3
        }).addTo(map)

        mapInstanceRef.current = map

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 100)
      } catch (error) {
      }
    }

    return () => {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      return
    }

    if (geoJsonLayerRef.current) {
      mapInstanceRef.current.removeLayer(geoJsonLayerRef.current)
      geoJsonLayerRef.current = null
    }

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
      // Cores mais vibrantes e visíveis
      if (ratio > 0.7) return '#dc2626'  // Vermelho escuro
      if (ratio > 0.5) return '#ef4444'  // Vermelho
      if (ratio > 0.3) return '#f87171'   // Vermelho claro
      if (ratio > 0.1) return '#fca5a5'  // Rosa
      return '#fecaca'  // Rosa claro
    }

    const getUF = (feature) => {
      const props = feature.properties || {}
      // Tentar diferentes formatos de UF
      let uf = props.uf || 
               props.sigla || 
               props.SIGLA ||
               props.UF ||
               props.uf_code ||
               props.state_code
      
      // Se não encontrou, tentar extrair do nome
      if (!uf) {
        const name = props.name || props.nome || ''
        // Mapear nomes de estados para UF
        const estadoToUF = {
          'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
          'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
          'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
          'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
          'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
          'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
          'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
        }
        uf = estadoToUF[name] || name?.substring(0, 2)?.toUpperCase()
      }
      
      return uf ? uf.toUpperCase().trim() : null
    }

    const getStyle = (feature) => {
      const uf = getUF(feature)
      if (!uf) {
        return { 
          fillColor: '#cbd5e1', 
          fillOpacity: 0.5, 
          color: '#ffffff', 
          weight: 1.5, 
          opacity: 1
        }
      }
      
      const dados = estadosData[uf]
      const hasData = dados && dados.totalInternacoes > 0
      const fillColor = getEstadoColor(uf)
      
      return {
        fillColor: fillColor,
        fillOpacity: hasData ? 0.85 : 0.4,
        color: '#ffffff',
        weight: hasData ? 2.5 : 1.5,
        opacity: 1
      }
    }

    const onEachFeature = (feature, layer) => {
      const uf = getUF(feature)
      if (!uf) return
      
      const dados = estadosData[uf]
      const hasData = dados && dados.totalInternacoes > 0
      
      // Aplicar estilo inicial diretamente
      const initialStyle = getStyle(feature)
      layer.setStyle(initialStyle)
      
      // Quando o path for criado, aplicar estilo diretamente no SVG
      const applyPathStyle = () => {
        if (layer._path) {
          const style = getStyle(feature)
          const path = layer._path
          
          // Aplicar via setProperty com !important
          path.style.setProperty('fill', style.fillColor, 'important')
          path.style.setProperty('fill-opacity', String(style.fillOpacity), 'important')
          path.style.setProperty('stroke', style.color, 'important')
          path.style.setProperty('stroke-width', String(style.weight) + 'px', 'important')
          path.style.setProperty('stroke-opacity', String(style.opacity), 'important')
          
          // Também via setAttribute como fallback
          path.setAttribute('fill', style.fillColor)
          path.setAttribute('fill-opacity', String(style.fillOpacity))
          path.setAttribute('stroke', style.color)
          path.setAttribute('stroke-width', String(style.weight))
        }
      }
      
      // Tentar aplicar quando o layer for adicionado
      layer.on('add', () => {
        setTimeout(applyPathStyle, 10)
        setTimeout(applyPathStyle, 50)
        setTimeout(applyPathStyle, 100)
      })
      
      // Se o path já existe, aplicar imediatamente
      if (layer._path) {
        applyPathStyle()
      }
      
      layer.on({
        mouseover: (e) => {
          if (hasData) {
            setHoveredEstado(uf)
            const layer = e.target
            layer.setStyle({
              weight: 4,
              fillOpacity: 0.9,
            })
          }
        },
        mouseout: (e) => {
          setHoveredEstado(null)
          const layer = e.target
          layer.setStyle(getStyle(feature))
        },
      })

      const estadoName = feature.properties.name || feature.properties.nome || uf
      if (hasData) {
        const popupContent = `
          <div style="padding: 8px;">
            <strong>${estadoName} (${uf})</strong><br/>
            ${dados.capitulo_cod ? `<span style="color: #64748b;">CID-10: ${dados.capitulo_cod} - ${dados.capitulo_nome}</span><br/>` : ''}
            <span style="color: #14b8a6; font-weight: 700;">Internações: ${formatNumber(dados.totalInternacoes)}</span>
          </div>
        `
        layer.bindPopup(popupContent)
      }
    }

    try {
      const geoJsonLayer = L.geoJSON(geoJsonData, {
        style: getStyle,
        onEachFeature: onEachFeature,
      })

      geoJsonLayer.addTo(mapInstanceRef.current)
      geoJsonLayerRef.current = geoJsonLayer

      // Aplicar estilos a todos os layers após renderização
      const applyStyles = () => {
        if (!geoJsonLayerRef.current) return
        
        try {
          geoJsonLayer.eachLayer((layer) => {
            const feature = layer.feature
            const uf = getUF(feature)
            
            if (uf) {
              const style = getStyle(feature)
              
              // Aplicar via Leaflet
              layer.setStyle(style)
              
              // Se o path existe, aplicar diretamente no SVG
              if (layer._path) {
                const path = layer._path
                path.setAttribute('fill', style.fillColor)
                path.setAttribute('fill-opacity', String(style.fillOpacity))
                path.setAttribute('stroke', style.color)
                path.setAttribute('stroke-width', String(style.weight))
              }
            }
          })
        } catch (error) {
          console.error('Erro ao aplicar estilos:', error)
        }
      }
      
      // Aplicar estilos após renderização
      setTimeout(applyStyles, 200)
      setTimeout(applyStyles, 500)
      
      // Forçar redraw
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
          applyStyles()
        }
      }, 1000)

      const bounds = geoJsonLayer.getBounds()
      if (bounds && bounds.isValid()) {
        setTimeout(() => {
          if (mapInstanceRef.current && geoJsonLayerRef.current) {
            mapInstanceRef.current.fitBounds(bounds, {
              padding: [40, 40],
              maxZoom: 5,
              animate: false
            })
            mapInstanceRef.current.invalidateSize()
          }
        }, 300)
      }
    } catch (error) {
    }

    return () => {
      if (geoJsonLayerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(geoJsonLayerRef.current)
        } catch (e) {
        }
        geoJsonLayerRef.current = null
      }
    }
  }, [geoJsonData, estadosData])

  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 100)
      }
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current = null
      }
    }
  }, [])

  const cidOptions = [
    { value: '', label: 'Todos os Capítulos' },
    ...(internacoesCid || []).map(item => ({
      value: item.capitulo_cod,
      label: `${item.capitulo_cod} - ${item.capitulo_nome}`
    }))
  ]

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
              style={{ position: 'relative', zIndex: 1000 }}
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
          {loading && mapInstanceRef.current && (
            <div className="map-loading-overlay">
              <div className="loading-spinner"></div>
              <p>Atualizando dados...</p>
            </div>
          )}
          <div 
            ref={mapRef} 
            id="brasil-map-container"
            style={{ 
              height: '100%', 
              width: '100%',
              minHeight: '450px',
              position: 'relative',
              flex: 1,
              display: 'block'
            }}
          >
            {!mapInstanceRef.current && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#64748b',
                fontSize: '14px',
                zIndex: 1000,
                pointerEvents: 'none'
              }}>
                Inicializando mapa...
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
