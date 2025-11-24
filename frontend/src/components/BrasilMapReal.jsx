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
  const [geoJsonData, setGeoJsonData] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const geoJsonLayerRef = useRef(null)

  useEffect(() => {
    async function carregarGeoJSON() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson')
        if (response.ok) {
          const data = await response.json()
          setGeoJsonData(data)
        } else {
          throw new Error('Não foi possível carregar GeoJSON')
        }
      } catch (error) {
        setGeoJsonData({
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
        })
      }
    }
    carregarGeoJSON()
  }, [])

  useEffect(() => {
    if (loading || !geoJsonData) {
      return
    }

    let attempts = 0
    const maxAttempts = 10

    const tryInitialize = () => {
      attempts++
      
      if (!mapRef.current) {
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 200)
        }
        return
      }

      if (mapInstanceRef.current) {
        return
      }

      const rect = mapRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        if (attempts < maxAttempts) {
          setTimeout(tryInitialize, 200)
        }
        return
      }

      initializeMap()
    }

    const timer = setTimeout(tryInitialize, 300)

    function initializeMap() {
      try {
        if (!mapRef.current || mapInstanceRef.current) {
          return
        }

        const rect = mapRef.current.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          setTimeout(() => {
            if (mapRef.current && !mapInstanceRef.current) {
              initializeMap()
            }
          }, 300)
          return
        }

        const map = L.map(mapRef.current, {
          center: [-14, -55],
          zoom: 4,
          zoomControl: true,
          scrollWheelZoom: true,
        })

        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 3
        })
        
        tileLayer.addTo(map)

        mapInstanceRef.current = map

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 500)

      } catch (error) {
      }
    }

    return () => {
      clearTimeout(timer)
    }
  }, [geoJsonData, loading])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!internacoesCid || internacoesCid.length === 0) {
      return
    }

    async function carregarDadosEstados() {
      if (!mapInstanceRef.current) {
        setLoading(true)
      }
      setError(null)
      try {
        const url = selectedCid 
          ? `/api/internacoes/cid-por-estado?capitulo_cod=${encodeURIComponent(selectedCid)}`
          : '/api/internacoes/cid-por-estado'
        
        const res = await api.get(url, { timeout: 60000 })
        
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
          setError('A requisição demorou muito para responder. Tente novamente.')
        } else {
          setError('Erro ao carregar dados do mapa. Tente novamente.')
        }
      } finally {
        setLoading(false)
      }
    }

    carregarDadosEstados()
  }, [selectedCid, internacoesCid])

  useEffect(() => {
    if (!mapInstanceRef.current || !geoJsonData) {
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
      if (ratio > 0.7) return '#dc2626'
      if (ratio > 0.5) return '#ef4444'
      if (ratio > 0.3) return '#f87171'
      if (ratio > 0.1) return '#fca5a5'
      return '#fecaca'
    }

    const getUF = (feature) => {
      return feature.properties.uf || 
             feature.properties.sigla || 
             feature.properties.SIGLA ||
             feature.properties.UF ||
             feature.properties.name?.substring(0, 2)?.toUpperCase()
    }

    const getStyle = (feature) => {
      const uf = getUF(feature)
      if (!uf) return { fillColor: '#cbd5e1', fillOpacity: 0.3, color: '#ffffff', weight: 1, opacity: 1 }
      
      const dados = estadosData[uf]
      const hasData = dados && dados.totalInternacoes > 0
      
      return {
        fillColor: getEstadoColor(uf),
        fillOpacity: hasData ? 0.7 : 0.3,
        color: '#ffffff',
        weight: hasData ? 2 : 1,
        opacity: 1,
      }
    }

    const onEachFeature = (feature, layer) => {
      const uf = getUF(feature)
      if (!uf) return
      
      const dados = estadosData[uf]
      const hasData = dados && dados.totalInternacoes > 0
      
      layer.on({
        mouseover: (e) => {
          if (hasData) {
            setHoveredEstado(uf)
            const layer = e.target
            layer.setStyle({
              weight: 3,
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

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: getStyle,
      onEachFeature: onEachFeature,
    })

    geoJsonLayer.addTo(mapInstanceRef.current)
    geoJsonLayerRef.current = geoJsonLayer

    if (geoJsonLayer.getBounds().isValid()) {
      mapInstanceRef.current.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] })
    } else {
      const bounds = L.latLngBounds(
        [-35, -75],
        [5, -30]
      )
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] })
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 100)
  }, [geoJsonData, estadosData])

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
      ) : !geoJsonData ? (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Carregando mapa...</p>
        </div>
      ) : (
        <div className="map-wrapper-real">
          {/* Indicador de loading sobre o mapa (não esconde o mapa) */}
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
              position: 'relative'
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
