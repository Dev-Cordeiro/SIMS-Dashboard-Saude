import { useState, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts'
import { formatNumber, formatTooltipValue } from '../utils/formatNumber'

export function MonthlySeriesChart({ data, onDataPointClick }) {
  const [brushStartIndex, setBrushStartIndex] = useState(0)
  const [brushEndIndex, setBrushEndIndex] = useState(null)
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 280, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '16px'
      }}>
        <p>Nenhum dado disponível para exibir</p>
      </div>
    )
  }

  const dadosValidos = data.filter(d => 
    d && 
    d.ano_mes && 
    (d.internacoes !== null && d.internacoes !== undefined || d.obitos !== null && d.obitos !== undefined)
  )

  if (dadosValidos.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 350, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '16px'
      }}>
        <p>Dados inválidos ou incompletos</p>
      </div>
    )
  }

  const dadosComNumeros = dadosValidos.map(d => ({
    ...d,
    internacoes: Number(d.internacoes) || 0,
    obitos: Number(d.obitos) || 0,
    ano_mes: String(d.ano_mes || '').trim(),
    ano: Number(d.ano) || 0,
    mes: Number(d.mes) || 0
  })).filter(d => d.ano_mes !== '')
    .sort((a, b) => {
      if (a.ano !== b.ano) {
        return a.ano - b.ano
      }
      return a.mes - b.mes
    })

  if (dadosComNumeros.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 350, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '16px'
      }}>
        <p>Nenhum dado válido para exibir</p>
      </div>
    )
  }

  const allValues = dadosComNumeros.flatMap(d => [d.internacoes || 0, d.obitos || 0])
  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(...allValues, 0)
  const padding = Math.max((maxValue - minValue) * 0.1, 1)

  const handleChartClick = (data) => {
    if (onDataPointClick && data && data.activePayload && data.activePayload[0]) {
      onDataPointClick(data.activePayload[0].payload)
    }
  }

  const dataCount = dadosComNumeros.length
  const baseHeight = 450
  const calculatedHeight = Math.max(baseHeight, Math.min(dataCount * 8 + 200, 800))

  const totalDataPoints = dadosComNumeros.length
  const shouldUseDefaultZoom = totalDataPoints > 30
  const defaultBrushEnd = shouldUseDefaultZoom ? Math.min(30, totalDataPoints - 1) : totalDataPoints - 1
  const [currentBrushStart, setCurrentBrushStart] = useState(0)
  const [currentBrushEnd, setCurrentBrushEnd] = useState(shouldUseDefaultZoom ? defaultBrushEnd : null)
  
  const handleBrushChange = (brushData) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setCurrentBrushStart(brushData.startIndex)
      setCurrentBrushEnd(brushData.endIndex)
      setBrushStartIndex(brushData.startIndex)
      setBrushEndIndex(brushData.endIndex)
    }
  }

  const handleResetZoom = () => {
    setCurrentBrushStart(0)
    setCurrentBrushEnd(shouldUseDefaultZoom ? defaultBrushEnd : null)
    setBrushStartIndex(0)
    setBrushEndIndex(shouldUseDefaultZoom ? defaultBrushEnd : null)
  }

  const handleZoomIn = () => {
    const start = currentBrushStart
    const end = currentBrushEnd !== null ? currentBrushEnd : totalDataPoints - 1
    const currentRange = end - start
    const newRange = Math.max(5, Math.floor(currentRange * 0.7))
    const center = start + (currentRange / 2)
    const newStart = Math.max(0, Math.floor(center - newRange / 2))
    const newEnd = Math.min(totalDataPoints - 1, Math.floor(center + newRange / 2))
    
    setCurrentBrushStart(newStart)
    setCurrentBrushEnd(newEnd)
    setBrushStartIndex(newStart)
    setBrushEndIndex(newEnd)
  }

  const handleZoomOut = () => {
    const start = currentBrushStart
    const end = currentBrushEnd !== null ? currentBrushEnd : totalDataPoints - 1
    const currentRange = end - start
    const newRange = Math.min(totalDataPoints, Math.floor(currentRange * 1.4))
    const center = start + (currentRange / 2)
    const newStart = Math.max(0, Math.floor(center - newRange / 2))
    const newEnd = Math.min(totalDataPoints - 1, Math.floor(center + newRange / 2))
    
    setCurrentBrushStart(newStart)
    setCurrentBrushEnd(newEnd)
    setBrushStartIndex(newStart)
    setBrushEndIndex(newEnd)
  }

  const visibleData = currentBrushEnd !== null 
    ? dadosComNumeros.slice(currentBrushStart, currentBrushEnd + 1)
    : dadosComNumeros

  try {
    return (
      <div 
        className="monthly-series-chart-container"
        style={{ 
          width: '100%', 
          maxWidth: '100%',
          minWidth: 0,
          height: calculatedHeight, 
          minHeight: baseHeight, 
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <style>{`
          .monthly-series-chart-container {
            display: block !important;
            flex: none !important;
            flex-direction: initial !important;
            overflow: visible !important;
          }
        `}</style>
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: '8px',
          zIndex: 10,
          flexDirection: 'column'
        }}>
          {onDataPointClick && (
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              <i className="fas fa-mouse-pointer" style={{ color: '#14b8a6', fontSize: '12px' }}></i>
              <span>Clique nos pontos para detalhar</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '6px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <button
              onClick={handleZoomIn}
              title="Ampliar (Zoom In)"
              style={{
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f1f5f9'
                e.target.style.borderColor = '#14b8a6'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff'
                e.target.style.borderColor = '#e2e8f0'
              }}
            >
              <i className="fas fa-search-plus" style={{ fontSize: '11px' }}></i>
            </button>
            <button
              onClick={handleZoomOut}
              title="Reduzir (Zoom Out)"
              style={{
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f1f5f9'
                e.target.style.borderColor = '#14b8a6'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff'
                e.target.style.borderColor = '#e2e8f0'
              }}
            >
              <i className="fas fa-search-minus" style={{ fontSize: '11px' }}></i>
            </button>
            {(currentBrushEnd !== null || brushEndIndex !== null) && (
              <button
                onClick={handleResetZoom}
                title="Resetar Zoom (Ver todos os dados)"
                style={{
                  padding: '6px 10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f1f5f9'
                  e.target.style.borderColor = '#14b8a6'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff'
                  e.target.style.borderColor = '#e2e8f0'
                }}
              >
                <i className="fas fa-expand" style={{ fontSize: '11px' }}></i>
              </button>
            )}
          </div>
        </div>
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <LineChart 
          data={visibleData} 
          margin={{ top: 20, right: 30, left: 60, bottom: Math.max(80, dataCount > 50 ? 100 : 80) }}
          className="chart-linechart-mobile"
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            dataKey="ano_mes" 
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
            angle={visibleData.length > 20 ? -45 : (visibleData.length > 12 ? -30 : 0)}
            textAnchor={visibleData.length > 20 ? 'end' : 'middle'}
            height={visibleData.length > 20 ? 80 : (visibleData.length > 12 ? 60 : 40)}
            interval={visibleData.length > 50 ? Math.floor(visibleData.length / 20) : (visibleData.length > 20 ? Math.floor(visibleData.length / 15) : 0)}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            className="chart-xaxis-mobile"
            tickFormatter={(value) => {
              if (visibleData.length > 20 && value && typeof value === 'string' && value.includes('-')) {
                const parts = value.split('-')
                if (parts.length === 2) {
                  return parts[0]
                }
              }
              return value
            }}
          />
          <YAxis 
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
            domain={[0, 'dataMax']}
            allowDataOverflow={false}
            tickFormatter={(value) => {
              const numValue = Number(value)
              if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`
              if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}k`
              return numValue.toString()
            }}
            width={80}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            className="chart-yaxis-mobile"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '2px solid #14b8a6',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(20, 184, 166, 0.2)',
              padding: '12px 16px',
            }}
            formatter={formatTooltipValue}
            labelStyle={{ fontWeight: 700, marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}
            itemStyle={{ fontWeight: 700, fontSize: '14px' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
            iconType="line"
            iconSize={16}
          />
          <Line 
            type="monotone" 
            dataKey="internacoes" 
            name="Internações" 
            stroke="#0ea5e9"
            strokeWidth={3}
            dot={{ fill: '#0ea5e9', r: dataCount > 50 ? 3 : 5, cursor: 'pointer' }}
            activeDot={{ r: 8, stroke: '#0ea5e9', strokeWidth: 2, cursor: 'pointer' }}
            animationDuration={600}
          />
          <Line 
            type="monotone" 
            dataKey="obitos" 
            name="Óbitos" 
            stroke="#14b8a6"
            strokeWidth={3}
            dot={{ fill: '#14b8a6', r: visibleData.length > 50 ? 3 : 5, cursor: 'pointer' }}
            activeDot={{ r: 8, stroke: '#14b8a6', strokeWidth: 2, cursor: 'pointer' }}
            animationDuration={600}
          />
          {totalDataPoints > 15 && (
            <Brush
              dataKey="ano_mes"
              height={40}
              stroke="#14b8a6"
              fill="#e0f2fe"
              startIndex={currentBrushStart}
              endIndex={currentBrushEnd !== null ? currentBrushEnd : defaultBrushEnd}
              onChange={handleBrushChange}
              tickFormatter={(value) => {
                if (value && typeof value === 'string' && value.includes('-')) {
                  const parts = value.split('-')
                  if (parts.length === 2) {
                    return `${parts[0]}/${parts[1]}`
                  }
                }
                return value
              }}
              style={{
                cursor: 'grab'
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
    )
  } catch (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: 350, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#ef4444',
        fontSize: '16px'
      }}>
        <p>Erro ao renderizar gráfico: {error.message}</p>
      </div>
    )
  }
}
