// Descrições dos gráficos para downloads
export const chartDescriptions = {
  'internacoes-sexo': 'Distribuição das internações hospitalares segundo o sexo dos pacientes. Analise as diferenças e proporções entre os grupos.',
  'internacoes-faixa-etaria': 'Distribuição das internações hospitalares por faixa etária dos pacientes. Analise a concentração de casos por idade.',
  'internacoes-cid10-capitulo': 'Distribuição das internações hospitalares por capítulo CID-10. Analise os principais grupos de causas de internação.',
  'obitos-raca': 'Distribuição dos óbitos segundo a raça/cor dos pacientes. Analise as diferenças e proporções entre os grupos étnicos.',
  'obitos-estado-civil': 'Distribuição dos óbitos segundo o estado civil dos pacientes. Analise as diferenças entre os grupos.',
  'obitos-local-ocorrencia': 'Distribuição dos óbitos por local de ocorrência. Analise onde os óbitos estão acontecendo.',
  'obitos-cid10-capitulo': 'Distribuição dos óbitos por capítulo CID-10. Analise os principais grupos de causas de óbito.',
  'serie-mensal': 'Série temporal mensal de internações e óbitos. Analise as tendências e variações ao longo do tempo.',
  'dashboard': 'Dashboard geral com visão consolidada dos principais indicadores de saúde.'
}

// Função auxiliar para obter descrição
export function getChartDescription(chartId) {
  return chartDescriptions[chartId] || ''
}

