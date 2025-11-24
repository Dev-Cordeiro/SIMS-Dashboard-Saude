import { useState, useEffect, useRef } from 'react'
import './ChartFilters.css'

export function ChartFilters({
  onFilterChange,
  onApplyFilters,
  showPeriod = true,
  showYearRange = false,
  showMonthYear = false,
  showMunicipio = true,
  localidades = [],
  initialYearStart = null,
  initialYearEnd = null,
  initialYear = null,
  initialMonth = null,
  initialMunicipio = 'all',
  availableYears = null,
  compact = false
}) {
  const currentYear = new Date().getFullYear()
  
  const years = availableYears && availableYears.length > 0
    ? availableYears
    : Array.from({ length: 20 }, (_, i) => currentYear - i)
  
  const minAvailableYear = years.length > 0 ? Math.min(...years) : currentYear - 20
  const maxAvailableYear = years.length > 0 ? Math.max(...years) : currentYear
  
  const [yearStart, setYearStart] = useState(initialYearStart || minAvailableYear)
  const [yearEnd, setYearEnd] = useState(initialYearEnd || maxAvailableYear)
  const [selectedYear, setSelectedYear] = useState(initialYear || maxAvailableYear)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || null)
  const [selectedMunicipio, setSelectedMunicipio] = useState(initialMunicipio)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredLocalidades = localidades.filter((loc) => {
    if (!loc) return false
    const searchLower = searchTerm.toLowerCase()
    const municipio = loc.municipio || ''
    const uf = loc.uf || ''
    return (
      municipio.toLowerCase().includes(searchLower) ||
      uf.toLowerCase().includes(searchLower) ||
      `${municipio} - ${uf}`.toLowerCase().includes(searchLower)
    )
  })

  const getSelectedText = () => {
    if (selectedMunicipio === 'all') {
      return 'Todas as Cidades'
    }
    const selected = localidades.find((loc) => loc && loc.id_localidade === selectedMunicipio)
    if (!selected) return 'Selecione uma cidade'
    const municipio = selected.municipio || ''
    const uf = selected.uf || ''
    return `${municipio} - ${uf}`.trim() || 'Selecione uma cidade'
  }

  const handleMunicipioSelect = (value) => {
    const newValue = value === 'all' ? 'all' : Number(value)
    setSelectedMunicipio(newValue)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  const handleYearStartChange = (e) => {
    const newStart = parseInt(e.target.value)
    setYearStart(newStart)
  }

  const handleYearEndChange = (e) => {
    const newEnd = parseInt(e.target.value)
    setYearEnd(newEnd)
  }

  const handleYearChange = (e) => {
    const value = e.target.value
    const newYear = value === '' ? null : parseInt(value)
    setSelectedYear(newYear)
  }

  const handleMonthChange = (e) => {
    const value = e.target.value
    const newMonth = value === '' ? null : parseInt(value)
    setSelectedMonth(newMonth)
  }

  const handleApplyFilters = () => {
    const filterData = { municipio: selectedMunicipio }
    if (showYearRange) {
      filterData.yearStart = yearStart
      filterData.yearEnd = yearEnd
    }
    if (showMonthYear) {
      filterData.year = selectedYear
      filterData.month = selectedMonth
    }
    if (onApplyFilters) {
      onApplyFilters(filterData)
    } else if (onFilterChange) {
      onFilterChange(filterData)
    }
  }

  const handleReset = () => {
    const defaultStart = minAvailableYear
    const defaultEnd = maxAvailableYear
    const defaultYear = maxAvailableYear
    setYearStart(defaultStart)
    setYearEnd(defaultEnd)
    setSelectedYear(defaultYear)
    setSelectedMonth(null)
    setSelectedMunicipio('all')
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setIsDropdownOpen(true)
  }

  const handleInputFocus = (e) => {
    setIsDropdownOpen(true)
    setSearchTerm('')
    e.target.select()
  }

  const handleInputClick = () => {
    setIsDropdownOpen(true)
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  if (!showPeriod && !showYearRange && !showMonthYear && !showMunicipio) {
    return null
  }

  return (
    <div className={`chart-filters ${compact ? 'chart-filters-compact' : ''}`}>
      <div className="chart-filters-header">
        <div className="chart-filters-title">
          <i className="fas fa-filter"></i>
          <span>Filtros</span>
        </div>
        <div className="chart-filters-actions">
          <button 
            className="chart-filters-apply"
            onClick={handleApplyFilters}
            title="Aplicar filtros"
          >
            <i className="fas fa-check"></i>
            <span>Aplicar</span>
          </button>
          <button 
            className="chart-filters-reset"
            onClick={handleReset}
            title="Redefinir filtros"
          >
            <i className="fas fa-redo"></i>
            <span>Redefinir</span>
          </button>
        </div>
      </div>

      <div className="chart-filters-content">
        {showMunicipio && (
          <div className="chart-filter-group">
            <label className="chart-filter-label">
              <i className="fas fa-map-marker-alt"></i>
              Município
            </label>
            <div className="chart-filter-municipio-container" ref={dropdownRef}>
              <div className="chart-filter-municipio-input-wrapper">
                <i className="fas fa-search chart-filter-search-icon"></i>
                <input
                  ref={inputRef}
                  type="text"
                  value={isDropdownOpen ? searchTerm : getSelectedText()}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onClick={handleInputClick}
                  placeholder="Buscar município..."
                  className="chart-filter-municipio-input"
                />
                <i
                  className={`fas fa-chevron-down chart-filter-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                ></i>
              </div>
              {isDropdownOpen && (
                <div className="chart-filter-municipio-dropdown">
                  <div
                    className={`chart-filter-municipio-option ${selectedMunicipio === 'all' ? 'selected' : ''}`}
                    onClick={() => handleMunicipioSelect('all')}
                  >
                    <i className="fas fa-globe"></i>
                    <span>Todas as Cidades</span>
                  </div>
                  {filteredLocalidades.length > 0 ? (
                    filteredLocalidades.map((loc) => {
                      if (!loc) return null
                      const municipio = loc.municipio || ''
                      const uf = loc.uf || ''
                      return (
                        <div
                          key={loc.id_localidade}
                          className={`chart-filter-municipio-option ${selectedMunicipio === loc.id_localidade ? 'selected' : ''}`}
                          onClick={() => handleMunicipioSelect(loc.id_localidade)}
                        >
                          <span>
                            <strong>{municipio}</strong> - {uf}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="chart-filter-municipio-option no-results">
                      <span>Nenhuma cidade encontrada</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showYearRange && (
          <div className="chart-filter-group">
            <label className="chart-filter-label">
              <i className="fas fa-calendar-alt"></i>
              Período de Anos
            </label>
            <div className="chart-filter-year-range">
              <div className="chart-filter-field">
                <label>De</label>
                <select
                  value={yearStart}
                  onChange={handleYearStartChange}
                  className="chart-filter-select"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="chart-filter-separator">
                <i className="fas fa-arrow-right"></i>
              </div>
              <div className="chart-filter-field">
                <label>Até</label>
                <select
                  value={yearEnd}
                  onChange={handleYearEndChange}
                  className="chart-filter-select"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              {showMonthYear && (
                <div className="chart-filter-field">
                  <label>Mês (opcional)</label>
                  <select
                    value={selectedMonth || ''}
                    onChange={handleMonthChange}
                    className="chart-filter-select"
                  >
                    <option value="">Todos os meses</option>
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {showMonthYear && !showYearRange && (
          <div className="chart-filter-group">
            <label className="chart-filter-label">
              <i className="fas fa-calendar"></i>
              Ano e Mês Específico
            </label>
            <div className="chart-filter-month-year">
              <div className="chart-filter-field">
                <label>Ano</label>
                <select
                  value={selectedYear || ''}
                  onChange={handleYearChange}
                  className="chart-filter-select"
                >
                  <option value="">Todos os anos</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="chart-filter-field">
                <label>Mês</label>
                <select
                  value={selectedMonth || ''}
                  onChange={handleMonthChange}
                  className="chart-filter-select"
                >
                  <option value="">Todos os meses</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {showPeriod && (
          <div className="chart-filter-group">
            <label className="chart-filter-label">
              <i className="fas fa-clock"></i>
              Visualização
            </label>
            <div className="chart-filter-options">
              <button className="chart-filter-option active">
                <i className="fas fa-chart-line"></i>
                <span>Todos os Períodos</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

