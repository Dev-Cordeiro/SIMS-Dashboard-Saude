import './StatCard.css'

export function StatCard({ title, value, percentage, trend, icon, color = 'teal', showTrend = false }) {
  const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : ''
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-content">
        <div className="stat-card-header">
          <p className="stat-card-title">{title}</p>
          <div className={`stat-card-icon stat-icon-${color}`}>
            <i className={`fas ${icon}`}></i>
          </div>
        </div>
        <div className="stat-card-body">
          <h3 className="stat-card-value">{value}</h3>
          {showTrend && percentage && (
            <div className={`stat-card-trend ${trendClass}`}>
              <span className="trend-percentage">{trendIcon} {percentage}</span>
              <span className="trend-label">que o mês anterior</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

