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

export function InternacoesPorSexoChart({ data, onBarClick }) {
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
    d.sexo_desc && 
    d.sexo_desc.trim() !== '' &&
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
    sexo_desc: String(d.sexo_desc || '').trim()
  })).filter(d => d.sexo_desc !== '' && d.total_internacoes > 0)

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

  const handleBarClick = (data) => {
    if (onBarClick && data && data.activePayload && data.activePayload[0]) {
      onBarClick(data.activePayload[0].payload)
    }
  }

  try {
    return (
      <div 
        className="internacoes-sexo-chart-container"
        style={{ 
          width: '100%', 
          maxWidth: '100%',
          minWidth: 0,
          height: 400, 
          minHeight: 350, 
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <style>{`
          .internacoes-sexo-chart-container {
            display: block !important;
            flex: none !important;
            flex-direction: initial !important;
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
          data={dadosComNumeros} 
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
          onClick={handleBarClick}
          barCategoryGap="25%"
          className="chart-barchart-mobile"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            dataKey="sexo_desc" 
            stroke="#64748b"
            tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
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
            dataKey="total_internacoes" 
            name="Internações"
            radius={[10, 10, 0, 0]}
            animationDuration={600}
            style={{ cursor: 'pointer' }}
          >
            {dadosComNumeros.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={barColor}
                style={{ cursor: 'pointer' }}
              />
            ))}
            <LabelList 
              dataKey="total_internacoes" 
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
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#14b8a6" />
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
