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
import { formatTooltipValue } from '../utils/formatNumber'

export function InternacoesCid10HomeChart({ data, onBarClick }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%',
        minHeight: 240,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px'
      }}>
        <p>Nenhum dado disponível para exibir</p>
      </div>
    )
  }

  // Filtrar dados inválidos e garantir que têm os campos necessários
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
        height: '100%',
        minHeight: 240,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px'
      }}>
        <p>Dados inválidos ou incompletos</p>
      </div>
    )
  }

  // Garantir que os valores são números
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
        height: '100%',
        minHeight: 240,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px'
      }}>
        <p>Nenhum dado válido para exibir</p>
      </div>
    )
  }

  const top10Data = dadosComNumeros.slice(0, 10)

  const chartData = top10Data.map((item) => ({
    ...item,
    capitulo_label: `${item.capitulo_cod || ''} - ${item.capitulo_nome || ''}`,
  }))

  const handleBarClick = (clickData) => {
    if (onBarClick && clickData && clickData.activePayload && clickData.activePayload[0]) {
      onBarClick(clickData.activePayload[0].payload)
    }
  }

  try {
    return (
      <div 
        className="internacoes-cid10-home-chart-container"
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: 240, 
          maxHeight: 260, 
          position: 'relative'
        }}
      >
        <style>{`
          .internacoes-cid10-home-chart-container {
            display: block !important;
            flex: none !important;
            flex-direction: initial !important;
            overflow: visible !important;
          }
        `}</style>
      {onBarClick && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontSize: '10px',
          color: '#64748b',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '4px 8px',
          borderRadius: '6px',
          zIndex: 10,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 500
        }}>
          <i className="fas fa-mouse-pointer" style={{ color: '#14b8a6', fontSize: '10px' }}></i>
          <span>Clique para detalhar</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 15, left: 45, bottom: 75 }}
          onClick={handleBarClick}
          barCategoryGap="10%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
          <XAxis
            dataKey="capitulo_cod"
            stroke="#64748b"
            angle={-30}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
            interval={0}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
            domain={[0, 'dataMax']}
            allowDataOverflow={false}
            tickFormatter={(value) => {
              const numValue = Number(value)
              if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`
              if (numValue >= 1000) return `${(numValue / 1000).toFixed(0)}k`
              return numValue.toString()
            }}
            width={60}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
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
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(20, 184, 166, 0.2)',
              padding: '10px 12px',
            }}
            labelStyle={{ 
              fontWeight: 700, 
              marginBottom: '6px',
              color: '#1e293b',
              fontSize: '12px'
            }}
            itemStyle={{ 
              color: '#14b8a6',
              fontWeight: 700,
              fontSize: '12px'
            }}
            cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
          />
          <Bar
            dataKey="total_internacoes"
            name="Internações"
            radius={[8, 8, 0, 0]}
            animationDuration={500}
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
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                return value.toString()
              }}
              style={{ 
                fontSize: '9px', 
                fill: '#1e293b', 
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)'
              }}
              offset={3}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    )
  } catch (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%',
        minHeight: 240,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#ef4444',
        fontSize: '14px'
      }}>
        <p>Erro ao renderizar gráfico: {error.message}</p>
      </div>
    )
  }
}

