/**
 * Formata números para exibição, adicionando separadores de milhares
 * @param {number} value - Valor numérico a ser formatado
 * @returns {string} - Valor formatado
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Formata números grandes com sufixos (K, M)
 * @param {number} value - Valor numérico a ser formatado
 * @returns {string} - Valor formatado com sufixo
 */
export function formatLargeNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.', ',') + 'M'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace('.', ',') + 'K'
  }
  return formatNumber(value)
}

/**
 * Formata valores para tooltip
 * @param {number} value - Valor numérico
 * @param {string} name - Nome do campo
 * @returns {array} - [valor formatado, nome]
 */
export function formatTooltipValue(value, name) {
  return [formatNumber(value), name]
}


