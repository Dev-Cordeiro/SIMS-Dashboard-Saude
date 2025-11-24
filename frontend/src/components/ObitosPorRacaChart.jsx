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

export function ObitosPorRacaChart({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
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
        <p>Nenhum dado disponível para exibir</p>
      </div>
    )
  }

  const dadosValidos = data.filter(d => 
    d && 
    d.raca_desc && 
    d.raca_desc.trim() !== '' &&
    (d.total_obitos !== null && d.total_obitos !== undefined)
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
    total_obitos: Number(d.total_obitos) || 0,
    raca_desc: String(d.raca_desc || '').trim()
  })).filter(d => d.raca_desc !== '' && d.total_obitos > 0)

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

  const maxValue = Math.max(...dadosComNumeros.map(d => d.total_obitos || 0), 1)
  const padding = Math.max(maxValue * 0.1, 1)

  const barColor = '#14b8a6'

  const dataCount = dadosComNumeros.length
  const baseHeight = 400
  const extraHeight = dataCount > 8 ? (dataCount - 8) * 15 : 0
  const calculatedHeight = Math.min(baseHeight + extraHeight, 700)

  try {
    return (
      <div 
        className="obitos-raca-chart-container"
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
          .obitos-raca-chart-container {
            display: block !important;
            flex: none !important;
            flex-direction: initial !important;
          }
        `}</style>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={dadosComNumeros} 
            margin={{ top: 20, right: 30, left: 60, bottom: Math.max(100, dataCount * 8) }}
            barCategoryGap={dataCount > 8 ? "10%" : "15%"}
            className="chart-barchart-mobile"
          >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            dataKey="raca_desc" 
            stroke="#64748b"
            angle={dataCount > 6 ? -45 : -35}
            textAnchor="end"
            height={Math.max(80, dataCount * 8)}
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
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
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '2px solid #14b8a6',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(20, 184, 166, 0.2)',
              padding: '12px 16px',
            }}
            formatter={formatTooltipValue}
            labelStyle={{ fontWeight: 700, marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}
            itemStyle={{ color: '#14b8a6', fontWeight: 700, fontSize: '14px' }}
            cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }}
          />
          <Bar 
            dataKey="total_obitos" 
            name="Óbitos"
            radius={[10, 10, 0, 0]}
            animationDuration={600}
          >
            {dadosComNumeros.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={barColor} 
              />
            ))}
            <LabelList 
              dataKey="total_obitos" 
              position="top" 
              formatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
                return value.toString()
              }}
              style={{ fontSize: '11px', fill: '#1e293b', fontWeight: 700 }}
              offset={5}
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
