import { getChartDescription } from './chartDescriptions'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function wrapText(ctx, text, maxWidth, x, y, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
  return currentY + lineHeight
}

export async function exportChartAsPNG(chartRef, filename = 'grafico', filtrosInfo = [], description = '') {
  if (!chartRef || !chartRef.current) {
    return
  }

  const container = chartRef.current
  
  try {
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
    
    const svgElementForBrush = container.querySelector('svg')
    const hiddenElements = []
    
    if (svgElementForBrush) {
      const allGroups = svgElementForBrush.querySelectorAll('g')
      allGroups.forEach((group) => {
        const className = group.getAttribute('class') || ''
        const clipPath = group.getAttribute('clip-path') || ''
        
        if (className.includes('brush') || className.includes('Brush') || 
            clipPath.includes('brush') || clipPath.includes('Brush')) {
          if (group.style.display !== 'none') {
            hiddenElements.push({ element: group, display: group.style.display })
            group.style.display = 'none'
          }
        }
      })
      
      const allRects = svgElementForBrush.querySelectorAll('rect')
      allRects.forEach((rect) => {
        const fill = rect.getAttribute('fill')
        const stroke = rect.getAttribute('stroke')
        const parent = rect.parentElement
        const parentClass = parent?.getAttribute('class') || ''
        
        if (parentClass.includes('brush') || parentClass.includes('Brush')) {
          if (rect.style.display !== 'none') {
            hiddenElements.push({ element: rect, display: rect.style.display })
            rect.style.display = 'none'
          }
        } else if ((fill === '#fafafa' || fill === '#fff' || fill === '#ffffff' || fill === '#f5f5f5') && 
                   (stroke === '#ccc' || stroke === '#e0e0e0' || stroke === '#d0d0d0' || stroke === '#999')) {
          const y = parseFloat(rect.getAttribute('y') || '0')
          const height = parseFloat(rect.getAttribute('height') || '0')
          const svgHeight = parseFloat(svgElementForBrush.getAttribute('height') || '600')
          if (y + height > svgHeight - 100) {
            if (rect.style.display !== 'none') {
              hiddenElements.push({ element: rect, display: rect.style.display })
              rect.style.display = 'none'
            }
          }
        }
      })
    }
    
    const svgElements = container.querySelectorAll('svg')
    svgElements.forEach(svg => {
      const originalOverflow = svg.style.overflow
      svg.style.overflow = 'visible'
      
      const labelGroups = svg.querySelectorAll('g.recharts-label-list, g[class*="label"]')
      labelGroups.forEach(group => {
        group.style.display = 'block'
        group.style.visibility = 'visible'
        group.style.opacity = '1'
      })
      
      svg._originalOverflow = originalOverflow
    })
    
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
      width: container.offsetWidth || container.scrollWidth,
      height: container.offsetHeight || container.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedSvgs = clonedDoc.querySelectorAll('svg')
        clonedSvgs.forEach(svg => {
          svg.style.overflow = 'visible'
          const labelGroups = svg.querySelectorAll('g.recharts-label-list, g[class*="label"], text[class*="label"]')
          labelGroups.forEach(group => {
            group.style.display = 'block'
            group.style.visibility = 'visible'
            group.style.opacity = '1'
          })
        })
      }
    })
    
    svgElements.forEach(svg => {
      if (svg._originalOverflow !== undefined) {
        svg.style.overflow = svg._originalOverflow
        delete svg._originalOverflow
      }
    })
    
    if (chartActions) {
      chartActions.style.display = originalDisplayActions || ''
    }
    if (chartBadge) {
      chartBadge.style.display = originalDisplayBadge || ''
    }
    hiddenElements.forEach(({ element, display }) => {
      element.style.display = display || ''
    })
    
    const chartHeader = container.querySelector('.chart-header')
    const titleText = chartHeader?.querySelector('.chart-title')?.textContent || ''
    
    const svgElement = container.querySelector('svg')
    if (!svgElement) {
      return
    }
    
    const svgRect = svgElement.getBoundingClientRect()
    const svgHeight = svgRect.height || svgElement.clientHeight || 600
    const svgWidth = svgRect.width || svgElement.clientWidth || 800
    
    const landscapeWidth = Math.max(svgWidth, svgHeight, 1200)
    const landscapeHeight = Math.min(svgWidth, svgHeight, 800)
    
    const finalCanvas = document.createElement('canvas')
    const padding = 50
    const titleHeight = titleText ? 60 : 0
    const descriptionHeight = description ? 80 : 0
    const filtrosBoxHeight = filtrosInfo.length > 0 ? (filtrosInfo.length * 30) + 70 : 0
    
    finalCanvas.width = landscapeWidth
    finalCanvas.height = titleHeight + descriptionHeight + filtrosBoxHeight + landscapeHeight + padding * 2
    const finalCtx = finalCanvas.getContext('2d')
    
    finalCtx.fillStyle = '#ffffff'
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
    
    let yPos = padding
    
    if (titleText) {
      finalCtx.fillStyle = '#1e293b'
      finalCtx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      finalCtx.textAlign = 'left'
      finalCtx.textBaseline = 'top'
      finalCtx.fillText(titleText, padding, yPos)
      yPos += 70
    }
    
    if (description) {
      finalCtx.fillStyle = '#64748b'
      finalCtx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      finalCtx.textAlign = 'left'
      yPos = wrapText(finalCtx, description, finalCanvas.width - (padding * 2), padding, yPos, 28)
      yPos += 20
    }
    
    if (filtrosInfo.length > 0) {
      yPos += 10
      const boxHeight = (filtrosInfo.length * 32) + 60
      const boxX = padding
      const boxY = yPos - 15
      const boxWidth = finalCanvas.width - (padding * 2)
      
      finalCtx.fillStyle = 'rgba(0, 0, 0, 0.03)'
      finalCtx.fillRect(boxX + 2, boxY + 2, boxWidth, boxHeight)
      
      finalCtx.fillStyle = '#f8fafc'
      finalCtx.fillRect(boxX, boxY, boxWidth, boxHeight)
      
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
    
    const headerHeight = chartHeader ? chartHeader.offsetHeight : 0
    const chartStartY = headerHeight
    const originalChartHeight = canvas.height - chartStartY
    
    finalCtx.drawImage(
      canvas,
      0, chartStartY,
      canvas.width, originalChartHeight,
      padding, yPos,
      finalCanvas.width - (padding * 2), landscapeHeight
    )
    
    const link = document.createElement('a')
    link.download = `${filename}-${new Date().getTime()}.png`
    link.href = finalCanvas.toDataURL('image/png', 1.0)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Erro ao exportar PNG:', error)
    alert('Erro ao exportar gráfico. Tente novamente.')
  }
}

export async function exportChartAsPDF(chartRef, filename = 'grafico', filtrosInfo = [], description = '') {
  if (!chartRef || !chartRef.current) {
    return
  }

    const container = chartRef.current
    
    try {
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
    
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
    })
    
    // Restaurar
    if (chartActions) {
      chartActions.style.display = originalDisplayActions || ''
    }
    if (chartBadge) {
      chartBadge.style.display = originalDisplayBadge || ''
    }
    
    const chartHeader = container.querySelector('.chart-header')
    const titleText = chartHeader?.querySelector('.chart-title')?.textContent || ''
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pdfWidth - (margin * 2)
    const contentHeight = pdfHeight - (margin * 2)
    
    let yPos = margin
    
    if (titleText) {
      pdf.setFontSize(20)
      pdf.setTextColor(30, 41, 59) // #1e293b
      pdf.setFont(undefined, 'bold')
      pdf.text(titleText, margin, yPos)
      yPos += 12
    }
    
    if (description) {
      pdf.setFontSize(12)
      pdf.setTextColor(100, 116, 139) // #64748b
      pdf.setFont(undefined, 'normal')
      const splitDescription = pdf.splitTextToSize(description, contentWidth)
      pdf.text(splitDescription, margin, yPos)
      yPos += splitDescription.length * 6 + 5
    }
    
    if (filtrosInfo.length > 0) {
      yPos += 5
      pdf.setFontSize(14)
      pdf.setTextColor(30, 41, 59)
      pdf.setFont(undefined, 'bold')
      pdf.text('Filtros Aplicados:', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(11)
      pdf.setTextColor(71, 85, 105) // #475569
      pdf.setFont(undefined, 'normal')
      filtrosInfo.forEach((filtro) => {
        pdf.text(`• ${filtro}`, margin + 5, yPos)
        yPos += 7
      })
      yPos += 5
    }
    
    // Adicionar imagem do gráfico
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = contentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Se a imagem for muito grande, ajustar
    const maxHeight = pdfHeight - yPos - margin
    const finalImgHeight = imgHeight > maxHeight ? maxHeight : imgHeight
    const finalImgWidth = (canvas.width * finalImgHeight) / canvas.height
    
    pdf.addImage(imgData, 'PNG', margin, yPos, finalImgWidth, finalImgHeight)
    
    pdf.save(`${filename}-${new Date().getTime()}.pdf`)
  } catch (error) {
    console.error('Erro ao exportar PDF:', error)
    alert('Erro ao exportar PDF. Tente novamente.')
  }
}

export function exportDataAsCSV(data, filename = 'dados', description = '') {
  if (!data || data.length === 0) {
    return
  }

  let csvContent = ''
  
  if (description) {
    csvContent += `# ${description}\n`
    csvContent += `# Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`
  }

  const headers = Object.keys(data[0])
  csvContent += [
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

export function normalizeText(text) {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
