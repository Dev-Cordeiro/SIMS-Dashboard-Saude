import { useMemo } from 'react'
import './Logo.css'

export function Logo({ size = 120, className = '' }) {
  const gradientId = useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, [])
  
  return (
    <div className={`logo-container ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* CÍRCULO DE FUNDO */}
        <circle cx="60" cy="60" r="56" fill="white" className="outer-circle" />
        
        {/* CRUZ MÉDICA - CENTRAL */}
        <g className="medical-cross">
          {/* Barra vertical */}
          <rect x="54" y="30" width="12" height="60" rx="2" fill={`url(#${gradientId})`} className="cross-vertical" />
          {/* Barra horizontal */}
          <rect x="30" y="54" width="60" height="12" rx="2" fill={`url(#${gradientId})`} className="cross-horizontal" />
        </g>
        
      </svg>
    </div>
  )
}
