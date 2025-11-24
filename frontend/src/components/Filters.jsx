import { useEffect, useState, useRef } from 'react'
import './Filters.css'

export function Filters({
  localidades,
  selectedLocalidade,
  setSelectedLocalidade,
  anoInicio,
  setAnoInicio,
  anoFim,
  setAnoFim,
  onRefresh,
  compact = false,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!selectedLocalidade && localidades.length > 0) {
      setSelectedLocalidade('all')
    }
  }, [localidades, selectedLocalidade, setSelectedLocalidade])

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
    if (selectedLocalidade === 'all') {
      return 'Todas as Cidades'
    }
    const selected = localidades.find((loc) => loc && loc.id_localidade === selectedLocalidade)
    if (!selected) return 'Selecione uma cidade'
    const municipio = selected.municipio || ''
    const uf = selected.uf || ''
    return `${municipio} - ${uf}`.trim() || 'Selecione uma cidade'
  }

  const handleSelect = (value) => {
    setSelectedLocalidade(value === 'all' ? 'all' : Number(value))
    setIsDropdownOpen(false)
    setSearchTerm('')
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

  if (compact) {
    return (
      <div className="filters-container-compact">
        <div className="filters-grid-compact">
          <div className="filter-group-compact">
            <label htmlFor={`localidade-compact-${Math.random()}`}>Município</label>
            <div className="searchable-select-container" ref={dropdownRef}>
              <div className="searchable-select-input-wrapper">
                <i className="fas fa-search search-icon"></i>
                <input
                  ref={inputRef}
                  id={`localidade-compact-${Math.random()}`}
                  type="text"
                  value={isDropdownOpen ? searchTerm : getSelectedText()}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onClick={handleInputClick}
                  placeholder="Buscar cidade..."
                  className="filter-select searchable-select-input"
                />
                <i
                  className={`fas fa-chevron-down dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                ></i>
              </div>
              {isDropdownOpen && (
                <div className="searchable-select-dropdown">
                  <div
                    className={`searchable-select-option ${selectedLocalidade === 'all' ? 'selected' : ''}`}
                    onClick={() => handleSelect('all')}
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
                          className={`searchable-select-option ${selectedLocalidade === loc.id_localidade ? 'selected' : ''}`}
                          onClick={() => handleSelect(loc.id_localidade)}
                        >
                          <span>
                            <strong>{municipio}</strong> - {uf}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="searchable-select-option no-results">
                      <span>Nenhuma cidade encontrada</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group-compact">
            <label htmlFor={`anoInicio-compact-${Math.random()}`}>Ano Início</label>
            <input
              id={`anoInicio-compact-${Math.random()}`}
              type="number"
              value={anoInicio}
              onChange={(e) => setAnoInicio(Number(e.target.value))}
              className="filter-input"
              min="1990"
              max="2030"
            />
          </div>

          <div className="filter-group-compact">
            <label htmlFor={`anoFim-compact-${Math.random()}`}>Ano Fim</label>
            <input
              id={`anoFim-compact-${Math.random()}`}
              type="number"
              value={anoFim}
              onChange={(e) => setAnoFim(Number(e.target.value))}
              className="filter-input"
              min="1990"
              max="2030"
            />
          </div>

          <div className="filter-group-compact">
            <button onClick={onRefresh} className="filter-refresh-button-compact">
              <i className="fas fa-sync-alt"></i> Atualizar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="filters-container">
      <div className="filters-card">
        <div className="filters-header">
          <h3 className="filters-title">Filtros de Análise</h3>
          <button onClick={onRefresh} className="filter-refresh-button">
            <i className="fas fa-sync-alt"></i> Atualizar
          </button>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="localidade">Município</label>
            <div className="searchable-select-container" ref={dropdownRef}>
              <div className="searchable-select-input-wrapper">
                <i className="fas fa-search search-icon"></i>
                <input
                  ref={inputRef}
                  id="localidade"
                  type="text"
                  value={isDropdownOpen ? searchTerm : getSelectedText()}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onClick={handleInputClick}
                  placeholder="Buscar cidade..."
                  className="filter-select searchable-select-input"
                />
                <i
                  className={`fas fa-chevron-down dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                ></i>
              </div>
              {isDropdownOpen && (
                <div className="searchable-select-dropdown">
                  <div
                    className={`searchable-select-option ${selectedLocalidade === 'all' ? 'selected' : ''}`}
                    onClick={() => handleSelect('all')}
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
                          className={`searchable-select-option ${selectedLocalidade === loc.id_localidade ? 'selected' : ''}`}
                          onClick={() => handleSelect(loc.id_localidade)}
                        >
                          <span>
                            <strong>{municipio}</strong> - {uf}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="searchable-select-option no-results">
                      <span>Nenhuma cidade encontrada</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="anoInicio">Ano Início</label>
            <input
              id="anoInicio"
              type="number"
              value={anoInicio}
              onChange={(e) => setAnoInicio(Number(e.target.value))}
              className="filter-input"
              min="1990"
              max="2030"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="anoFim">Ano Fim</label>
            <input
              id="anoFim"
              type="number"
              value={anoFim}
              onChange={(e) => setAnoFim(Number(e.target.value))}
              className="filter-input"
              min="1990"
              max="2030"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
