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

export function InternacoesPorFaixaChart({ data }) {
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
    d.faixa_desc && 
    d.faixa_desc.trim() !== '' &&
    (d.total_internacoes !== null && d.total_internacoes !== undefined)
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
    total_internacoes: Number(d.total_internacoes) || 0,
    faixa_desc: String(d.faixa_desc || '').trim()
  })).filter(d => d.faixa_desc !== '' && d.total_internacoes > 0)

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

  const maxValue = Math.max(...dadosComNumeros.map(d => d.total_internacoes || 0), 1)
  const padding = Math.max(maxValue * 0.1, 1)

  const barColor = '#14b8a6'

  const dataCount = dadosComNumeros.length
  const minHeight = 350
  const heightPerItem = 40
  const calculatedHeight = Math.max(minHeight, dataCount * heightPerItem + 100)
  const maxHeight = Math.min(calculatedHeight, 800)

  try {
    return (
      <div 
        className="internacoes-faixa-chart-container"
        style={{ 
          width: '100%', 
          maxWidth: '100%',
          minWidth: 0,
          height: maxHeight, 
          minHeight: minHeight,
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <style>{`
          .internacoes-faixa-chart-container {
            display: block !important;
            flex: none !important;
            flex-direction: initial !important;
          }
        `}</style>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dadosComNumeros}
            layout="vertical"
            margin={{ top: 20, right: 80, left: Math.max(120, dataCount * 2), bottom: 20 }}
            barCategoryGap={dataCount > 10 ? "10%" : "15%"}
            className="chart-barchart-mobile"
          >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            type="number" 
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
          />
          <YAxis
            type="category"
            dataKey="faixa_desc"
            stroke="#64748b"
            width={Math.max(120, dataCount * 8)}
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
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
            dataKey="total_internacoes"
            name="Internações"
            radius={[0, 10, 10, 0]}
            animationDuration={600}
          >
            {dadosComNumeros.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={barColor} 
              />
            ))}
            <LabelList 
              dataKey="total_internacoes" 
              position="right" 
              formatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
                return value.toString()
              }}
              style={{ fontSize: '11px', fill: '#1e293b', fontWeight: 700 }}
              offset={10}
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
