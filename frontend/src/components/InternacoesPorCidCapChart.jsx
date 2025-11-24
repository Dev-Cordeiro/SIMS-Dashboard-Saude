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

export function InternacoesPorCidCapChart({ data, onBarClick }) {
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
    (d.total_internacoes !== null && d.total_internacoes !== undefined)
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
    total_internacoes: Number(d.total_internacoes) || 0,
    capitulo_cod: String(d.capitulo_cod || '').trim(),
    capitulo_nome: String(d.capitulo_nome || '').trim()
  })).filter(d => d.capitulo_cod !== '' && d.total_internacoes > 0)

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
  const baseHeight = 400
  const extraHeight = dataCount > 8 ? (dataCount - 8) * 15 : 0
  const calculatedHeight = Math.min(baseHeight + extraHeight, 700)

  try {
    return (
      <div 
        className="internacoes-cid-cap-chart-container"
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
          .internacoes-cid-cap-chart-container {
            display: block !important;
            flex: none !important;
            flex-direction: initial !important;
            overflow: visible !important;
          }
        `}</style>
      {onBarClick && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          fontSize: '11px',
          color: '#64748b',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '6px 10px',
          borderRadius: '8px',
          zIndex: 10,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500
        }}>
          <i className="fas fa-mouse-pointer" style={{ color: '#14b8a6', fontSize: '12px' }}></i>
          <span>Clique nas barras para detalhar</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 50, bottom: 90 }}
          onClick={handleBarClick}
          barCategoryGap="12%"
          className="chart-barchart-mobile"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            dataKey="capitulo_cod"
            stroke="#64748b"
            angle={-35}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            interval={0}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
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
            formatter={(value) => formatTooltipValue(value, 'Internações')}
            labelFormatter={(label, payload) => {
              const item = payload && payload[0] && payload[0].payload
              return item ? `${item.capitulo_cod} - ${item.capitulo_nome}` : label
            }}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '2px solid #14b8a6',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(20, 184, 166, 0.2)',
              padding: '12px 16px',
            }}
            labelStyle={{ 
              fontWeight: 700, 
              marginBottom: '8px',
              color: '#1e293b',
              fontSize: '14px'
            }}
            itemStyle={{ 
              color: '#14b8a6',
              fontWeight: 700,
              fontSize: '14px'
            }}
            cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
          />
              <Bar
                dataKey="total_internacoes"
                name="Internações"
                radius={[10, 10, 0, 0]}
                animationDuration={600}
                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              >
                {chartData.map((entry, index) => {
                  const barColor = '#14b8a6'
                  
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
                  dataKey="total_internacoes" 
                  position="top" 
                  formatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
                    return value.toString()
                  }}
                  style={{ 
                    fontSize: '10px', 
                    fill: '#1e293b', 
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                  }}
                  offset={5}
                />
              </Bar>
          <defs>
            <linearGradient id="colorGradientCidInt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#10b981" />
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
