import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { formatNumber, formatTooltipValue } from '../utils/formatNumber'

export function ObitosPorCidCapChart({ data, onBarClick, isHome = false }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 220, 
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
    d.capitulo_cod && 
    d.capitulo_cod.trim() !== '' &&
    (d.total_obitos !== null && d.total_obitos !== undefined)
  )

  if (dadosValidos.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 220, 
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
    total_obitos: Number(d.total_obitos) || 0,
    capitulo_cod: String(d.capitulo_cod || '').trim(),
    capitulo_nome: String(d.capitulo_nome || '').trim()
  })).filter(d => d.capitulo_cod !== '' && d.total_obitos > 0)

  if (dadosComNumeros.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 220, 
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

  const chartData = dadosComNumeros.map((item) => ({
    ...item,
    capitulo_label: `${item.capitulo_cod || ''} - ${item.capitulo_nome || ''}`,
  }))

  const handleBarClick = (clickData) => {
    if (onBarClick && clickData && clickData.activePayload && clickData.activePayload[0]) {
      onBarClick(clickData.activePayload[0].payload)
    }
  }

  const dataCount = dadosComNumeros.length
  const baseHeight = isHome ? 240 : 400
  const maxHeight = isHome ? 260 : 700
  const extraHeight = isHome ? 0 : (dataCount > 8 ? (dataCount - 8) * 15 : 0)
  const calculatedHeight = isHome ? baseHeight : Math.min(baseHeight + extraHeight, maxHeight)

  try {
    return (
      <div 
        className="obitos-cid-cap-chart-container"
        style={{ 
          width: '100%', 
          maxWidth: '100%',
          minWidth: 0,
          height: isHome ? '100%' : calculatedHeight, 
          minHeight: baseHeight,
          maxHeight: isHome ? maxHeight : undefined,
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <style>{`
          .obitos-cid-cap-chart-container {
            display: block !important;
            flex: none !important;
            flex-direction: initial !important;
            overflow: visible !important;
          }
        `}</style>
      {onBarClick && (
        <div style={{
          position: 'absolute',
          bottom: isHome ? 85 : 110,
          right: isHome ? 15 : 30,
          fontSize: '11px',
          color: '#64748b',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '4px 8px',
          borderRadius: '6px',
          zIndex: 100,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 500,
          pointerEvents: 'none'
        }}>
          <i className="fas fa-mouse-pointer" style={{ color: '#14b8a6', fontSize: '10px' }}></i>
          <span>Clique nas barras para detalhar</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ 
            top: isHome ? 15 : 20, 
            right: isHome ? 15 : 30, 
            left: isHome ? 45 : 80, 
            bottom: isHome ? 75 : Math.max(100, dataCount * 8) 
          }}
          onClick={handleBarClick}
          barCategoryGap={isHome ? "10%" : (dataCount > 8 ? "10%" : "15%")}
          className="chart-barchart-mobile"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            dataKey="capitulo_cod"
            stroke="#64748b"
            angle={isHome ? -30 : -40}
            textAnchor="end"
            height={isHome ? 70 : 90}
            tick={{ fontSize: isHome ? 10 : 12, fill: '#475569', fontWeight: 600 }}
            interval={0}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#475569', fontSize: isHome ? 10 : 12, fontWeight: 600 }}
            domain={[0, 'dataMax']}
            allowDataOverflow={false}
            tickFormatter={(value) => {
              const numValue = Number(value)
              if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`
              if (numValue >= 1000) return `${(numValue / 1000).toFixed(isHome ? 0 : 1)}k`
              return numValue.toString()
            }}
            width={isHome ? 45 : 80}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            className="chart-yaxis-mobile"
          />
          <Tooltip
            formatter={(value) => formatTooltipValue(value, 'Óbitos')}
            labelFormatter={(label, payload) => {
              const item = payload && payload[0] && payload[0].payload
              return item ? `${item.capitulo_cod} - ${item.capitulo_nome}` : label
            }}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '2px solid #14b8a6',
              borderRadius: isHome ? '10px' : '12px',
              boxShadow: '0 8px 24px rgba(20, 184, 166, 0.2)',
              padding: isHome ? '10px 12px' : '12px 16px',
            }}
            labelStyle={{ 
              fontWeight: 700, 
              marginBottom: isHome ? '6px' : '8px',
              color: '#1e293b',
              fontSize: isHome ? '12px' : '14px'
            }}
            itemStyle={{ 
              color: '#14b8a6',
              fontWeight: 700,
              fontSize: isHome ? '12px' : '14px'
            }}
            cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
          />
              <Bar
                dataKey="total_obitos"
                name="Óbitos"
                radius={[10, 10, 0, 0]}
                animationDuration={600}
                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              >
                {chartData.map((entry, index) => {
                  const totalBars = chartData.length
                  const position = index / (totalBars - 1 || 1)
                  
                  const getColor = (pos) => {
                    if (pos <= 0.2) return '#8b5cf6'
                    if (pos <= 0.4) return '#6366f1'
                    if (pos <= 0.6) return '#3b82f6'
                    if (pos <= 0.8) return '#0ea5e9'
                    return '#14b8a6'
                  }
                  
                  const barColor = getColor(position)
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={barColor} 
                      style={{ 
                        cursor: onBarClick ? 'pointer' : 'default',
                      }} 
                    />
                  )
                })}
                <LabelList 
                  dataKey="total_obitos" 
                  position="top" 
                  formatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                    if (value >= 1000) return `${(value / 1000).toFixed(isHome ? 0 : 1)}k`
                    return value.toString()
                  }}
                  style={{ 
                    fontSize: isHome ? '9px' : '11px', 
                    fill: '#1e293b', 
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                  }}
                  offset={isHome ? 3 : 5}
                />
              </Bar>
          <defs>
            <linearGradient id="colorGradientCidOb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
    )
  } catch (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: 220, 
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
