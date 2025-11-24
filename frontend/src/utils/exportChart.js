export async function exportChartAsPNG(chartRef, filename = 'grafico', filtrosInfo = []) {
  if (!chartRef || !chartRef.current) {
    return
  }

  // Garantir que estamos capturando o container completo com título
  const container = chartRef.current
  
  // Verificar se html2canvas está disponível (pode ser carregado via CDN)
  const html2canvas = window.html2canvas || (window.html2canvas = null)
  
  // Tentar carregar html2canvas se não estiver disponível
  if (!html2canvas && typeof window !== 'undefined') {
    try {
      // Tentar usar a API nativa do navegador ou fallback
      await loadHtml2Canvas()
    } catch (error) {
    }
  }
  
  if (window.html2canvas) {
    try {
      // Esconder botões de exportação e badge temporariamente
      const chartActions = container.querySelector('.chart-actions')
      const chartBadge = container.querySelector('.chart-badge')
      let originalDisplayActions = null
      let originalDisplayBadge = null
      
      if (chartActions) {
        originalDisplayActions = chartActions.style.display
        chartActions.style.display = 'none'
      }
      
      if (chartBadge) {
        originalDisplayBadge = chartBadge.style.display
        chartBadge.style.display = 'none'
      }
      
      // Esconder o componente Brush (zoom) dentro do SVG
      const svgElementForBrush = container.querySelector('svg')
      const hiddenElements = []
      
      if (svgElementForBrush) {
        // Encontrar e esconder elementos do Brush do Recharts
        // O Brush geralmente está em um grupo <g> com classe específica ou com clipPath
        const allGroups = svgElementForBrush.querySelectorAll('g')
        allGroups.forEach((group) => {
          const className = group.getAttribute('class') || ''
          const clipPath = group.getAttribute('clip-path') || ''
          
          // Verificar se é um grupo do Brush
          if (className.includes('brush') || className.includes('Brush') || 
              clipPath.includes('brush') || clipPath.includes('Brush')) {
            if (group.style.display !== 'none') {
              hiddenElements.push({ element: group, display: group.style.display })
              group.style.display = 'none'
            }
          }
        })
        
        // Também esconder retângulos que podem ser parte do Brush
        // O Brush do Recharts geralmente tem retângulos com fill específico
        const allRects = svgElementForBrush.querySelectorAll('rect')
        allRects.forEach((rect) => {
          const fill = rect.getAttribute('fill')
          const stroke = rect.getAttribute('stroke')
          const parent = rect.parentElement
          const parentClass = parent?.getAttribute('class') || ''
          
          // Verificar se é um retângulo do Brush
          if (parentClass.includes('brush') || parentClass.includes('Brush')) {
            if (rect.style.display !== 'none') {
              hiddenElements.push({ element: rect, display: rect.style.display })
              rect.style.display = 'none'
            }
          } else if ((fill === '#fafafa' || fill === '#fff' || fill === '#ffffff' || fill === '#f5f5f5') && 
                     (stroke === '#ccc' || stroke === '#e0e0e0' || stroke === '#d0d0d0' || stroke === '#999')) {
            // Pode ser um elemento do Brush, esconder se estiver na parte inferior do gráfico
            const y = parseFloat(rect.getAttribute('y') || '0')
            const height = parseFloat(rect.getAttribute('height') || '0')
            const svgHeight = parseFloat(svgElementForBrush.getAttribute('height') || '600')
            // Se estiver na parte inferior (últimos 100px), provavelmente é o Brush
            if (y + height > svgHeight - 100) {
              if (rect.style.display !== 'none') {
                hiddenElements.push({ element: rect, display: rect.style.display })
                rect.style.display = 'none'
              }
            }
          }
        })
        
        // Armazenar referências para restaurar depois
        window._hiddenBrushElements = hiddenElements
      }
      
      // Se houver filtros, adicionar uma div temporária com os filtros antes de capturar
      let filtrosDiv = null
      if (filtrosInfo.length > 0) {
        filtrosDiv = document.createElement('div')
        filtrosDiv.style.cssText = `
          position: absolute;
          top: -1000px;
          left: -1000px;
          padding: 20px;
          background: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `
        filtrosDiv.innerHTML = `
          <div style="color: #475569; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
            Filtros Aplicados:
          </div>
          ${filtrosInfo.map(f => `<div style="color: #64748b; font-size: 13px; margin-left: 10px; margin-bottom: 5px;">• ${f}</div>`).join('')}
        `
        container.insertBefore(filtrosDiv, container.firstChild)
      }
      
      const canvas = await window.html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        width: container.offsetWidth || container.scrollWidth,
        height: container.offsetHeight || container.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      })
      
      // Restaurar botões de exportação e badge
      if (chartActions) {
        chartActions.style.display = originalDisplayActions || ''
      }
      
      if (chartBadge) {
        chartBadge.style.display = originalDisplayBadge || ''
      }
      
      // Restaurar elementos do Brush
      const svgElementForRestore = container.querySelector('svg')
      if (window._hiddenBrushElements && svgElementForRestore) {
        window._hiddenBrushElements.forEach(({ element, display }) => {
          element.style.display = display || ''
        })
        window._hiddenBrushElements = null
      }
      
      // Remover div temporária se foi criada
      if (filtrosDiv) {
        container.removeChild(filtrosDiv)
      }
      
      // Extrair título do header (sem badge e sem botões)
      const chartHeader = container.querySelector('.chart-header')
      const titleText = chartHeader?.querySelector('.chart-title')?.textContent || ''
      
      // Encontrar o elemento SVG do gráfico
      const svgElement = container.querySelector('svg')
      if (!svgElement) {
        return
      }
      
      // Obter dimensões reais do SVG
      const svgRect = svgElement.getBoundingClientRect()
      const svgHeight = svgRect.height || svgElement.clientHeight || 600
      const svgWidth = svgRect.width || svgElement.clientWidth || 800
      
      // Criar canvas final com título, filtros e gráfico (sem botões e sem badge)
      const finalCanvas = document.createElement('canvas')
      const titleHeight = titleText ? 60 : 0
      const filtrosBoxHeight = filtrosInfo.length > 0 ? (filtrosInfo.length * 30) + 70 : 0
      const padding = 50
      
      finalCanvas.width = Math.max(svgWidth, 800)
      finalCanvas.height = titleHeight + filtrosBoxHeight + svgHeight + padding + 50
      const finalCtx = finalCanvas.getContext('2d')
      
      // Fundo branco
      finalCtx.fillStyle = '#ffffff'
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
      
      let yPos = padding
      
      // Desenhar título (sempre mostrar, mesmo que vazio)
      finalCtx.fillStyle = '#1e293b'
      finalCtx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      finalCtx.textAlign = 'left'
      finalCtx.textBaseline = 'top'
      if (titleText) {
        finalCtx.fillText(titleText, padding, yPos)
      }
      yPos += 70
      
      // Desenhar filtros aplicados em uma caixa destacada (bonita e maior)
      if (filtrosInfo.length > 0) {
        yPos += 10
        
        // Caixa de fundo para os filtros com sombra sutil
        const boxHeight = (filtrosInfo.length * 32) + 60
        const boxX = padding
        const boxY = yPos - 15
        const boxWidth = finalCanvas.width - (padding * 2)
        
        // Sombra sutil
        finalCtx.fillStyle = 'rgba(0, 0, 0, 0.03)'
        finalCtx.fillRect(boxX + 2, boxY + 2, boxWidth, boxHeight)
        
        // Caixa principal
        finalCtx.fillStyle = '#f8fafc'
        finalCtx.fillRect(boxX, boxY, boxWidth, boxHeight)
        
        // Borda muito sutil
        finalCtx.strokeStyle = '#e2e8f0'
        finalCtx.lineWidth = 1
        finalCtx.strokeRect(boxX, boxY, boxWidth, boxHeight)
        
        yPos += 35
        finalCtx.fillStyle = '#1e293b'
        finalCtx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        finalCtx.fillText('Filtros Aplicados:', padding + 25, yPos)
        yPos += 45
        
        finalCtx.fillStyle = '#475569'
        finalCtx.font = '19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        filtrosInfo.forEach((filtro) => {
          finalCtx.fillText(`• ${filtro}`, padding + 35, yPos)
          yPos += 32
        })
        yPos += 25
      }
      
      // Usar o canvas original já capturado, mas extrair apenas a parte do gráfico
      // Encontrar onde começa o gráfico no canvas original (após header)
      const headerHeight = chartHeader ? chartHeader.offsetHeight : 0
      const chartStartY = headerHeight
      
      // Calcular altura real do gráfico no canvas original
      // O canvas original tem tudo, então precisamos calcular a altura do gráfico
      const originalChartHeight = canvas.height - chartStartY
      
      // Ajustar altura do canvas final se necessário
      const neededHeight = titleHeight + filtrosBoxHeight + originalChartHeight + padding + 50
      if (finalCanvas.height < neededHeight) {
        finalCanvas.height = neededHeight
        // Redesenhar fundo branco
        finalCtx.fillStyle = '#ffffff'
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
        
        // Redesenhar título e filtros
        yPos = padding
        finalCtx.fillStyle = '#1e293b'
        finalCtx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        finalCtx.textAlign = 'left'
        finalCtx.textBaseline = 'top'
        if (titleText) {
          finalCtx.fillText(titleText, padding, yPos)
        }
        yPos += 70
        
        if (filtrosInfo.length > 0) {
          yPos += 10
          const boxHeight = (filtrosInfo.length * 32) + 60
          const boxX = padding
          const boxY = yPos - 15
          const boxWidth = finalCanvas.width - (padding * 2)
          
          // Sombra sutil
          finalCtx.fillStyle = 'rgba(0, 0, 0, 0.03)'
          finalCtx.fillRect(boxX + 2, boxY + 2, boxWidth, boxHeight)
          
          // Caixa principal
          finalCtx.fillStyle = '#f8fafc'
          finalCtx.fillRect(boxX, boxY, boxWidth, boxHeight)
          
          // Borda muito sutil
          finalCtx.strokeStyle = '#e2e8f0'
          finalCtx.lineWidth = 1
          finalCtx.strokeRect(boxX, boxY, boxWidth, boxHeight)
          
          yPos += 35
          finalCtx.fillStyle = '#1e293b'
          finalCtx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          finalCtx.fillText('Filtros Aplicados:', padding + 25, yPos)
          yPos += 45
          
          finalCtx.fillStyle = '#475569'
          finalCtx.font = '19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          filtrosInfo.forEach((filtro) => {
            finalCtx.fillText(`• ${filtro}`, padding + 35, yPos)
            yPos += 32
          })
          yPos += 25
        }
      }
      
      // Desenhar a parte do gráfico do canvas original (sem header)
      finalCtx.drawImage(
        canvas,
        0, chartStartY, // origem: x, y (começa após o header)
        canvas.width, originalChartHeight, // tamanho da origem (largura completa, altura do gráfico)
        padding, yPos, // destino: x, y
        finalCanvas.width - (padding * 2), originalChartHeight // tamanho do destino (mantém proporção)
      )
      
      const link = document.createElement('a')
      link.download = `${filename}-${new Date().getTime()}.png`
      link.href = finalCanvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      // Fallback para método SVG
      exportAsSVG(container, filename, filtrosInfo)
    }
  } else {
    // Fallback: método SVG
    exportAsSVG(container, filename, filtrosInfo)
  }
}

function exportAsSVG(container, filename, filtrosInfo = []) {
  const chartHeader = container.querySelector('.chart-header')
  const svgElement = container.querySelector('svg')
  
  if (!svgElement) {
    alert('Não foi possível exportar o gráfico. Elemento SVG não encontrado.')
    return
  }

  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  
  // Calcular dimensões incluindo o header e filtros se existirem
  // Não incluir altura dos botões de ação
  const headerHeight = chartHeader ? 60 : 0 // Altura fixa para título
  const filtrosHeight = filtrosInfo.length > 0 ? (filtrosInfo.length * 30) + 70 : 0
  const padding = 50
  // Obter dimensões reais do SVG
  const svgRect = svgElement.getBoundingClientRect()
  const svgHeight = svgRect.height || svgElement.clientHeight || 600
  const svgWidth = svgRect.width || svgElement.clientWidth || 800
  canvas.width = Math.max(svgWidth, 800)
  canvas.height = svgHeight + headerHeight + filtrosHeight + padding + 50
  
  img.onload = () => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    let currentY = padding
    
    // Desenhar título (sempre mostrar)
    let titleText = ''
    if (chartHeader) {
      const titleElement = chartHeader.querySelector('.chart-title')
      if (titleElement) {
        titleText = titleElement.textContent || titleElement.innerText
      }
    }
    
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    if (titleText) {
      ctx.fillText(titleText, padding, currentY)
    }
    currentY += 70
    
    // Desenhar filtros aplicados em uma caixa destacada (bonita)
    if (filtrosInfo.length > 0) {
      currentY += 10
      
      // Caixa de fundo para os filtros com sombra sutil
      const filtrosBoxHeight = (filtrosInfo.length * 32) + 60
      const boxX = padding
      const boxY = currentY - 15
      const boxWidth = canvas.width - (padding * 2)
      
      // Sombra sutil
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
      ctx.fillRect(boxX + 2, boxY + 2, boxWidth, filtrosBoxHeight)
      
      // Caixa principal
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(boxX, boxY, boxWidth, filtrosBoxHeight)
      
      // Borda muito sutil
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      ctx.strokeRect(boxX, boxY, boxWidth, filtrosBoxHeight)
      
      // Título dos filtros
      currentY += 35
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('Filtros Aplicados:', padding + 25, currentY)
      currentY += 45
      
      // Lista de filtros
      ctx.fillStyle = '#475569'
      ctx.font = '19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      filtrosInfo.forEach((filtro) => {
        ctx.fillText(`• ${filtro}`, padding + 35, currentY)
        currentY += 32
      })
      currentY += 25
    }
    
    // Desenhar o SVG abaixo do título e filtros
    const svgY = currentY
    ctx.drawImage(img, 0, svgY, canvas.width, svgElement.clientHeight || 600)
    
    const link = document.createElement('a')
    link.download = `${filename}-${new Date().getTime()}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  img.onerror = () => {
    alert('Erro ao exportar gráfico. Não foi possível processar a imagem.')
  }
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}

function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar html2canvas'))
    document.head.appendChild(script)
  })
}

export function exportDataAsCSV(data, filename = 'dados') {
  if (!data || data.length === 0) {
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header] || ''
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    }).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}-${new Date().getTime()}.csv`
  link.click()
}


