import { useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" /></>,
    chart: <><path d="M4 19.5h16" /><path d="M6.5 16v-4m5 4V6m5 10v-7" /><path d="m5 9 5-4 4 3 5-4" /></>,
    receipt: <><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" /><path d="M9 8h6m-6 4h6m-6 4h3" /></>,
    ticket: <><path d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A2.5 2.5 0 0 0 20 7.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 0-2.5 2.5h-11A2.5 2.5 0 0 0 4 16.5v-2a2.5 2.5 0 0 0 0-5z" /><path d="M12 8v1m0 2v1m0 2v1" /></>,
    coins: <><circle cx="8.5" cy="8.5" r="5" /><path d="M12 12a5 5 0 1 0 4-8" /><path d="M8.5 6.5v4m-1.5-3h2a1 1 0 0 1 0 2h-2m10 3.5v4m-1.5-3h2a1 1 0 0 1 0 2h-2" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M7.5 3.5v3m9-3v3M3.5 9.5h17" /></>,
    file: <><path d="M13.5 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z" /><path d="M13.5 3.5V9h6m-11 4h7m-7 3h5" /></>,
    spark: <><path d="m12 3 1.35 5.65L19 10l-5.65 1.35L12 17l-1.35-5.65L5 10l5.65-1.35z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6z" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  }

  return <svg {...common}>{paths[name] ?? null}</svg>
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const ANALYZE_URL = import.meta.env.DEV
  ? '/api/sales/analyze'
  : `${API_BASE_URL}/api/sales/analyze`
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 2,
})
const compactCurrencyFormatter = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatMonth(value) {
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value
  return new Intl.DateTimeFormat('es-CO', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
}

function isAnalysisResponse(value) {
  return Boolean(
    value
    && value.kpis
    && Number.isFinite(value.kpis.ventas_totales)
    && Number.isFinite(value.kpis.numero_ventas)
    && Number.isFinite(value.kpis.ticket_promedio)
    && Array.isArray(value.ventas_por_mes)
    && value.ventas_por_mes.every((item) => typeof item?.mes === 'string' && Number.isFinite(item.ventas))
    && Array.isArray(value.top_productos)
    && value.top_productos.every((item) => typeof item?.producto === 'string' && Number.isFinite(item.ventas))
    && Array.isArray(value.filas_descartadas)
    && value.filas_descartadas.every((item) => Number.isInteger(item?.fila) && typeof item.motivo === 'string'),
  )
}

const metrics = [
  { label: 'Ventas totales', icon: 'coins', tone: 'mint', helper: 'Valor acumulado de ventas' },
  { label: 'Número de ventas', icon: 'receipt', tone: 'lavender', helper: 'Registros válidos' },
  { label: 'Ticket promedio', icon: 'ticket', tone: 'peach', helper: 'Promedio por venta' },
]

function MetricCard({ metric, value, hasAnalysis }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${metric.tone}`}><Icon name={metric.icon} size={20} /></div>
      <p className="metric-label">{metric.label}</p>
      <p className="metric-value">{value}</p>
      <div className="metric-footer"><span className="metric-dot" />{hasAnalysis ? metric.helper : 'Carga un archivo para consultar'}</div>
    </article>
  )
}

function EmptyChart({ kind, hasAnalysis }) {
  return (
    <div className={`chart-empty ${kind}`}>
      <div className="empty-illustration" aria-hidden="true">
        {kind === 'monthly' ? (
          <svg viewBox="0 0 200 95" fill="none">
            <path d="M8 78.5H192M8 53.5H192M8 28.5H192" stroke="currentColor" strokeDasharray="3 5" />
            <path d="M18 66c22-2 23-19 43-17s22 22 42 7 22-22 42-16 20 4 37-19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 6" />
            <circle cx="145" cy="40" r="4" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 200 95" fill="none">
            <path d="M21 15.5v65h166" stroke="currentColor" strokeDasharray="3 5" />
            <path d="M40 66h29m10-18h29m10-16h29" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray="6 7" />
            <circle cx="164" cy="32" r="4" fill="currentColor" />
          </svg>
        )}
      </div>
      <span className="empty-title">{hasAnalysis ? 'Sin ventas válidas' : 'Aún no hay datos'}</span>
      <span className="empty-copy">{hasAnalysis ? 'No hay resultados para esta gráfica' : 'Carga un archivo para ver tus resultados'}</span>
    </div>
  )
}

function App() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  function selectFile(file) {
    if (!file) return
    setSelectedFile(file)
    setAnalysis(null)
    setError('')
  }

  function handleDrop(event) {
    event.preventDefault()
    if (isLoading) return
    selectFile(event.dataTransfer.files?.[0])
  }

  async function handleAnalyze(event) {
    event.preventDefault()
    if (!selectedFile || isLoading) return

    setIsLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch(ANALYZE_URL, { method: 'POST', body: formData })
      let payload
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
        let message = typeof payload?.error === 'string'
          ? payload.error
          : `El servidor respondió con el código ${response.status}.`
        if (response.status === 415 && /\.xlsx$/i.test(selectedFile.name)) {
          message += ' El backend actual solo puede analizar archivos CSV.'
        }
        throw new Error(message)
      }

      if (!isAnalysisResponse(payload)) {
        throw new Error('El servidor devolvió una respuesta que no tiene el formato esperado.')
      }
      setAnalysis(payload)
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError('No se pudo conectar con el servidor. Comprueba que el backend esté ejecutándose e inténtalo de nuevo.')
      } else {
        setError(requestError.message || 'No se pudo analizar el archivo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const statusLabel = isLoading
    ? 'Analizando archivo'
    : analysis
      ? 'Análisis completado'
      : selectedFile
        ? 'Archivo listo'
        : 'Esperando archivo'
  const hasAnalysis = Boolean(analysis)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="Ventas, inicio">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-copy"><strong>norte</strong><small>VENTAS & INSIGHTS</small></span>
        </a>

        <div className="side-section-label">ESPACIO DE TRABAJO</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <a className="nav-item active" href="#dashboard" aria-current="page">
            <Icon name="overview" size={18} /><span>Resumen</span>
          </a>
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="note-icon"><Icon name="spark" size={18} /></div>
          <p>Una mirada clara a tus ventas.</p>
          <span>Sube tus datos para comenzar</span>
        </div>
        <div className="side-footer"><span className="online-dot" />Panel de análisis</div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb"><span>Ventas</span><span className="crumb-slash">/</span><strong>Resumen</strong></div>
          <div className="topbar-right"><span className="privacy-indicator"><span />Sesión de análisis</span><span className="topbar-divider" /><span className="topbar-date"><Icon name="calendar" size={16} />Vista general</span></div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />PANEL DE CONTROL</div>
              <h1>Dashboard de ventas</h1>
              <p className="page-subtitle">Entiende el rendimiento de tu negocio, de un vistazo.</p>
            </div>
            <div className={`heading-status${isLoading ? ' is-loading' : ''}`}><span className="status-pulse" />{statusLabel}</div>
          </section>

          <form
            className={`upload-card${selectedFile ? ' has-file' : ''}${isLoading ? ' is-loading' : ''}`}
            aria-label="Carga de archivo de ventas"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onSubmit={handleAnalyze}
          >
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept=".csv,.xlsx"
              disabled={isLoading}
              aria-label="Seleccionar archivo CSV o Excel"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <div className="upload-symbol"><Icon name={selectedFile ? 'file' : 'upload'} size={22} /></div>
            <div className="upload-copy">
              <h2>{selectedFile ? 'Archivo seleccionado' : 'Comienza con tus datos de ventas'}</h2>
              <p>{selectedFile?.name || 'Carga un archivo para visualizar tus indicadores y tendencias.'}</p>
            </div>
            <div className="upload-action">
              <button className={`primary-button${selectedFile ? ' secondary-button' : ''}`} type="button" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
                {selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo'}<Icon name="arrow" size={16} />
              </button>
              {selectedFile && <button className="primary-button analyze-button" type="submit" disabled={isLoading}>
                {isLoading ? <><span className="loading-spinner" />Analizando…</> : <>Analizar archivo<Icon name="arrow" size={16} /></>}
              </button>}
              <span>CSV o Excel <i /> Máximo 5 MB</span>
            </div>
            <div className="upload-glow" aria-hidden="true" />
          </form>

          {error && <div className="error-message" role="alert"><span className="error-mark">!</span><div><strong>No se pudo completar el análisis</strong><p>{error}</p></div></div>}
          {isLoading && <div className="loading-message" role="status">Procesando el archivo…</div>}

          <section className="metrics-section" aria-labelledby="metrics-title">
            <div className="section-heading">
              <div><span className="section-kicker">TUS INDICADORES</span><h2 id="metrics-title">Resumen general</h2></div>
              <span className="section-caption">Se mostrarán al cargar un archivo</span>
            </div>
            <div className="metrics-grid">
              {metrics.map((metric) => {
                let value = '—'
                if (analysis) {
                  if (metric.label === 'Ventas totales') value = currencyFormatter.format(analysis.kpis.ventas_totales)
                  else if (metric.label === 'Número de ventas') value = new Intl.NumberFormat('es-CO').format(analysis.kpis.numero_ventas)
                  else value = currencyFormatter.format(analysis.kpis.ticket_promedio)
                }
                return <MetricCard key={metric.label} metric={metric} value={value} hasAnalysis={hasAnalysis} />
              })}
            </div>
          </section>

          <section className="insights-section" aria-labelledby="insights-title">
            <div className="section-heading insight-heading">
              <div><span className="section-kicker">EXPLORA EL DETALLE</span><h2 id="insights-title">Tendencias y productos</h2></div>
              <span className="chart-period"><Icon name="calendar" size={15} />Por periodo</span>
            </div>
            <div className="charts-grid">
              <article className="chart-card monthly-card">
                <div className="chart-card-header">
                  <div><h3>Ventas por mes</h3><p>Comportamiento de tus ventas a lo largo del tiempo</p></div>
                  <span className="chart-icon mint"><Icon name="chart" size={18} /></span>
                </div>
                <div className="chart-area">
                  {analysis?.ventas_por_mes.length ? <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.ventas_por_mes} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}>
                      <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#42aa8a" stopOpacity={0.2} /><stop offset="95%" stopColor="#42aa8a" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid stroke="#edf1f4" strokeDasharray="3 5" vertical={false} />
                      <XAxis dataKey="mes" tickFormatter={formatMonth} axisLine={false} tickLine={false} tick={{ fill: '#98a3aa', fontSize: 10 }} />
                      <YAxis tickFormatter={(value) => compactCurrencyFormatter.format(value)} axisLine={false} tickLine={false} tick={{ fill: '#98a3aa', fontSize: 9 }} />
                      <Tooltip labelFormatter={formatMonth} formatter={(value) => [currencyFormatter.format(Number(value)), 'Ventas']} />
                      <Area type="monotone" dataKey="ventas" stroke="#42aa8a" strokeWidth={2.5} fill="url(#salesFill)" />
                    </AreaChart>
                  </ResponsiveContainer> : <EmptyChart kind="monthly" hasAnalysis={hasAnalysis} />}
                </div>
                <div className="chart-footer"><span className="legend-dot" />Ventas totales</div>
              </article>

              <article className="chart-card products-card">
                <div className="chart-card-header">
                  <div><h3>Top 5 productos</h3><p>Productos con mayor valor de ventas</p></div>
                  <span className="chart-icon lavender"><Icon name="receipt" size={18} /></span>
                </div>
                <div className="chart-area products-chart-area">
                  {analysis?.top_productos.length ? <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.top_productos} layout="vertical" margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#edf1f4" strokeDasharray="3 5" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => compactCurrencyFormatter.format(value)} axisLine={false} tickLine={false} tick={{ fill: '#98a3aa', fontSize: 9 }} />
                      <YAxis type="category" dataKey="producto" width={104} interval={0} axisLine={false} tickLine={false} tick={{ fill: '#71808b', fontSize: 9 }} />
                      <Tooltip formatter={(value) => [currencyFormatter.format(Number(value)), 'Ventas']} />
                      <Bar dataKey="ventas" fill="#8879cf" radius={[0, 5, 5, 0]} barSize={13} />
                    </BarChart>
                  </ResponsiveContainer> : <EmptyChart kind="products" hasAnalysis={hasAnalysis} />}
                </div>
                <div className="chart-footer product-footer"><span className="legend-dot lavender-dot" />Ventas por producto</div>
              </article>
            </div>
          </section>

          {analysis?.filas_descartadas.length > 0 && <section className="discarded-section" aria-labelledby="discarded-title">
            <div className="discarded-heading"><div><span className="section-kicker">VALIDACIÓN DEL ARCHIVO</span><h2 id="discarded-title">Filas descartadas</h2></div><span className="discarded-count">{analysis.filas_descartadas.length}</span></div>
            <ul className="discarded-list">
              {analysis.filas_descartadas.map((row, index) => <li key={`${row.fila}-${index}`}><span className="discarded-row">Fila {row.fila}</span><span>{row.motivo}</span></li>)}
            </ul>
          </section>}

          <footer className="page-footer"><span>Dashboard de ventas</span><span>{hasAnalysis ? 'Resultados del archivo analizado.' : 'Los resultados aparecerán después de cargar tus datos.'}</span></footer>
        </div>
      </main>
    </div>
  )
}

export default App
