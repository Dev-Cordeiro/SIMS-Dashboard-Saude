import './Logo.css'

export function Logo({ size = 100, className = '', showText = false }) {
  return (
    <div className={`logo-container ${className}`}>
      <img 
        src="/logo.png" 
        alt="SIMS Logo" 
        className="logo-img"
        style={{ width: size, height: size }}
      />
      
      {showText && (
        <div className="logo-text">
          <h1 className="logo-title">SIMS</h1>
          <p className="logo-tagline">Integrated Health Monitoring System</p>
        </div>
      )}
    </div>
  )
}
