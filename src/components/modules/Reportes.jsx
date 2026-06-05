import { useEffect, useMemo, useState } from 'react'
import {
  CajaIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  ReportesIcon,
  UserIcon
} from '../Icons'
import { supabase } from '../../supabase'
import '../../styles/Reportes.css'

const parseMonto = (value) => Number(String(value ?? '0').replace(/[$,]/g, '')) || 0

const formatMoney = (value) => `$${(Number(value) || 0).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`

const formatNumber = (value) => (Number(value) || 0).toLocaleString('es-MX')

const formatFechaCorta = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatFechaHora = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const normalizar = (value) => String(value || '').trim().toLowerCase()

const startOfDay = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const endOfDay = (date) => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

const toDateInput = (date) => date.toISOString().slice(0, 10)

const obtenerRango = (tipo, customStart, customEnd) => {
  const now = new Date()
  if (tipo === 'dia') {
    return { start: startOfDay(now), end: endOfDay(now) }
  }
  if (tipo === 'semana') {
    const start = startOfDay(now)
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
    const end = endOfDay(new Date())
    return { start, end }
  }
  if (tipo === 'personalizado') {
    const start = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : startOfDay(now)
    const end = customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : endOfDay(now)
    return start <= end ? { start, end } : { start: end, end: start }
  }

  const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
  const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  return { start, end }
}

const estaEnRango = (value, rango) => {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date >= rango.start && date <= rango.end
}

const obtenerPeriodoAnterior = (rango) => {
  const duracion = rango.end.getTime() - rango.start.getTime()
  const end = new Date(rango.start.getTime() - 1)
  const start = new Date(end.getTime() - duracion)
  return { start, end }
}

const calcularCambio = (actual, anterior) => {
  if (!anterior && !actual) return 0
  if (!anterior) return actual > 0 ? 100 : 0
  return ((actual - anterior) / anterior) * 100
}

const crearSerieDias = (rango, pagos) => {
  const dias = []
  const cursor = startOfDay(rango.start)
  while (cursor <= rango.end) {
    dias.push({
      key: toDateInput(cursor),
      label: String(cursor.getDate()),
      ventas: 0,
      tickets: 0,
      propinas: 0
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  const porDia = Object.fromEntries(dias.map(dia => [dia.key, dia]))
  pagos.forEach(pago => {
    const key = toDateInput(new Date(pago.fecha_pago))
    if (!porDia[key]) return
    porDia[key].ventas += parseMonto(pago.total_venta ?? pago.monto)
    porDia[key].tickets += 1
    porDia[key].propinas += parseMonto(pago.propina)
  })

  return dias
}

export const ReportesModule = () => {
  const [filtroFecha, setFiltroFecha] = useState('mes')
  const [customStart, setCustomStart] = useState(toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [customEnd, setCustomEnd] = useState(toDateInput(new Date()))
  const [pagos, setPagos] = useState([])
  const [detalles, setDetalles] = useState([])
  const [cortes, setCortes] = useState([])
  const [movimientosCorte, setMovimientosCorte] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [metricaGrafica, setMetricaGrafica] = useState('ventas')
  const [limiteProductos, setLimiteProductos] = useState(5)
  const [limiteMeseros, setLimiteMeseros] = useState(5)
  const [limiteCortes, setLimiteCortes] = useState(5)

  const rango = useMemo(() => obtenerRango(filtroFecha, customStart, customEnd), [customEnd, customStart, filtroFecha])
  const rangoAnterior = useMemo(() => obtenerPeriodoAnterior(rango), [rango])

  const cargarReportes = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select('id, id_comanda, id_usuario, metodo_pago, monto, propina, total_venta, total_cobrado, estado_pago, fecha_pago, usuarios(nombre), comandas(id, id_mesa, total, created_at, usuarios(nombre), mesas(numero))')
        .order('fecha_pago', { ascending: false })

      if (pagosError) throw pagosError

      const comandaIds = [...new Set((pagosData || []).map(pago => pago.id_comanda).filter(Boolean))]
      const { data: detallesData, error: detallesError } = comandaIds.length > 0
        ? await supabase
          .from('detalles_comanda')
          .select('id_comanda, nombre_producto, cantidad, subtotal, precio_unitario')
          .in('id_comanda', comandaIds)
        : { data: [], error: null }

      if (detallesError) throw detallesError

      const { data: cortesData, error: cortesError } = await supabase
        .from('cortes_caja')
        .select('id, fecha, created_at, total_ventas, pagos_efectivo, descuentos, usuarios(nombre)')
        .order('fecha', { ascending: false })
        .limit(80)

      if (cortesError) throw cortesError

      const { data: movimientosCorteData, error: movimientosCorteError } = await supabase
        .from('movimientos_caja')
        .select('id, tipo, concepto, monto, cambio_entregado, estado, fecha_movimiento')
        .in('tipo', ['cierre', 'corte'])
        .order('fecha_movimiento', { ascending: false })
        .limit(80)

      if (movimientosCorteError) {
        console.warn('Reportes sin lectura de movimientos_caja:', movimientosCorteError.message)
      }

      setPagos(pagosData || [])
      setDetalles(detallesData || [])
      setCortes(cortesData || [])
      setMovimientosCorte(movimientosCorteError ? [] : (movimientosCorteData || []))
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarReportes()
    window.addEventListener('caja:changed', cargarReportes)
    window.addEventListener('comandas:changed', cargarReportes)
    return () => {
      window.removeEventListener('caja:changed', cargarReportes)
      window.removeEventListener('comandas:changed', cargarReportes)
    }
  }, [])

  const pagosCompletados = useMemo(
    () => pagos.filter(pago => normalizar(pago.estado_pago || 'completado') === 'completado'),
    [pagos]
  )

  const pagosPeriodo = useMemo(
    () => pagosCompletados.filter(pago => estaEnRango(pago.fecha_pago, rango)),
    [pagosCompletados, rango]
  )

  const pagosPeriodoAnterior = useMemo(
    () => pagosCompletados.filter(pago => estaEnRango(pago.fecha_pago, rangoAnterior)),
    [pagosCompletados, rangoAnterior]
  )

  const cortesPeriodo = useMemo(() => {
    const movimientos = movimientosCorte
      .filter(mov => estaEnRango(mov.fecha_movimiento, rango))
      .map(mov => ({
        id: `mov-${mov.id}`,
        fecha: mov.fecha_movimiento,
        efectivo: parseMonto(mov.monto),
        diferencia: parseMonto(mov.cambio_entregado),
        estado: normalizar(mov.estado).includes('cerrado') ? 'Cerrado' : 'Corte'
      }))

    if (movimientos.length > 0) return movimientos

    return cortes
      .filter(corte => estaEnRango(corte.fecha || corte.created_at, rango))
      .map(corte => ({
        id: `corte-${corte.id}`,
        fecha: corte.fecha || corte.created_at,
        efectivo: parseMonto(corte.pagos_efectivo ?? corte.total_ventas),
        diferencia: 0,
        estado: 'Cerrado'
      }))
  }, [cortes, movimientosCorte, rango])

  const resumen = useMemo(() => {
    const totalVentas = pagosPeriodo.reduce((sum, pago) => sum + parseMonto(pago.total_venta ?? pago.monto), 0)
    const tickets = pagosPeriodo.length
    const propinas = pagosPeriodo.reduce((sum, pago) => sum + parseMonto(pago.propina), 0)
    const promedioTicket = tickets > 0 ? totalVentas / tickets : 0

    const totalVentasAnterior = pagosPeriodoAnterior.reduce((sum, pago) => sum + parseMonto(pago.total_venta ?? pago.monto), 0)
    const ticketsAnterior = pagosPeriodoAnterior.length
    const propinasAnterior = pagosPeriodoAnterior.reduce((sum, pago) => sum + parseMonto(pago.propina), 0)
    const promedioAnterior = ticketsAnterior > 0 ? totalVentasAnterior / ticketsAnterior : 0

    return {
      totalVentas,
      tickets,
      promedioTicket,
      propinas,
      cambios: {
        ventas: calcularCambio(totalVentas, totalVentasAnterior),
        tickets: calcularCambio(tickets, ticketsAnterior),
        promedio: calcularCambio(promedioTicket, promedioAnterior),
        propinas: calcularCambio(propinas, propinasAnterior)
      }
    }
  }, [pagosPeriodo, pagosPeriodoAnterior])

  const serieDias = useMemo(() => crearSerieDias(rango, pagosPeriodo), [pagosPeriodo, rango])

  const productos = useMemo(() => {
    const idsPeriodo = new Set(pagosPeriodo.map(pago => pago.id_comanda).filter(Boolean))
    const agrupados = {}
    detalles
      .filter(detalle => idsPeriodo.has(detalle.id_comanda))
      .forEach(detalle => {
        const producto = detalle.nombre_producto || 'Producto sin nombre'
        if (!agrupados[producto]) agrupados[producto] = { producto, unidades: 0, ventas: 0 }
        agrupados[producto].unidades += Number(detalle.cantidad) || 0
        agrupados[producto].ventas += parseMonto(detalle.subtotal) || ((Number(detalle.cantidad) || 0) * parseMonto(detalle.precio_unitario))
      })

    return Object.values(agrupados).sort((a, b) => b.ventas - a.ventas)
  }, [detalles, pagosPeriodo])

  const meseros = useMemo(() => {
    const agrupados = {}
    pagosPeriodo.forEach(pago => {
      const nombre = pago.usuarios?.nombre || pago.comandas?.usuarios?.nombre || 'Sin usuario'
      if (!agrupados[nombre]) {
        agrupados[nombre] = { nombre, ventas: 0, tickets: 0, propinas: 0 }
      }
      agrupados[nombre].ventas += parseMonto(pago.total_venta ?? pago.monto)
      agrupados[nombre].tickets += 1
      agrupados[nombre].propinas += parseMonto(pago.propina)
    })

    return Object.values(agrupados)
      .map(mesero => ({ ...mesero, promedio: mesero.tickets > 0 ? mesero.ventas / mesero.tickets : 0 }))
      .sort((a, b) => b.ventas - a.ventas)
  }, [pagosPeriodo])

  const distribucion = useMemo(() => {
    const porMetodo = {}
    pagosPeriodo.forEach(pago => {
      const metodo = pago.metodo_pago || 'Sin metodo'
      porMetodo[metodo] = (porMetodo[metodo] || 0) + parseMonto(pago.total_venta ?? pago.monto)
    })
    if (resumen.propinas > 0) porMetodo.Propinas = resumen.propinas
    return Object.entries(porMetodo)
      .map(([label, monto]) => ({ label, monto, porcentaje: resumen.totalVentas + resumen.propinas > 0 ? (monto / (resumen.totalVentas + resumen.propinas)) * 100 : 0 }))
      .filter(item => item.monto > 0)
      .sort((a, b) => b.monto - a.monto)
  }, [pagosPeriodo, resumen.propinas, resumen.totalVentas])

  const resumenRapido = useMemo(() => {
    const mejorDia = serieDias.reduce((best, dia) => dia.ventas > best.ventas ? dia : best, { label: 'Sin datos', ventas: 0 })
    const diasConVentas = serieDias.filter(dia => dia.ventas > 0)
    const promedioDia = diasConVentas.length > 0
      ? diasConVentas.reduce((sum, dia) => sum + dia.ventas, 0) / diasConVentas.length
      : 0
    const mesas = new Set(pagosPeriodo.map(pago => pago.comandas?.id_mesa || pago.comandas?.mesas?.numero).filter(Boolean))

    return {
      mejorDia,
      promedioDia,
      productosVendidos: productos.reduce((sum, producto) => sum + producto.unidades, 0),
      clientesAtendidos: pagosPeriodo.length,
      mesasAtendidas: mesas.size
    }
  }, [pagosPeriodo, productos, serieDias])

  const maxGrafica = Math.max(...serieDias.map(dia => dia[metricaGrafica]), 1)
  const maxProducto = Math.max(...productos.map(producto => producto.ventas), 1)

  const kpis = [
    { label: 'TOTAL VENTAS', value: formatMoney(resumen.totalVentas), cambio: resumen.cambios.ventas, tone: 'orange', icon: DollarSignIcon, serieKey: 'ventas' },
    { label: 'TICKETS EMITIDOS', value: formatNumber(resumen.tickets), cambio: resumen.cambios.tickets, tone: 'blue', icon: ReportesIcon, serieKey: 'tickets' },
    { label: 'PROMEDIO POR TICKET', value: formatMoney(resumen.promedioTicket), cambio: resumen.cambios.promedio, tone: 'green', icon: CheckCircleIcon, serieKey: 'ventas' },
    { label: 'PROPINAS GENERADAS', value: formatMoney(resumen.propinas), cambio: resumen.cambios.propinas, tone: 'purple', icon: CajaIcon, serieKey: 'propinas' }
  ]

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div className="reports-title">
          <div className="reports-title-icon"><ReportesIcon size={28} /></div>
          <div>
            <h1>Reportes y Ventas</h1>
            <p>Análisis general del negocio, ventas, productos y rendimiento del equipo.</p>
          </div>
        </div>
        <button className="reports-refresh" onClick={cargarReportes} type="button" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      <div className="reports-toolbar">
        <div className="reports-periods">
          {[
            ['dia', 'Hoy'],
            ['semana', 'Esta Semana'],
            ['mes', 'Este Mes'],
            ['personalizado', 'Personalizado']
          ].map(([id, label]) => (
            <button className={filtroFecha === id ? 'active' : ''} key={id} onClick={() => setFiltroFecha(id)} type="button">
              {label}
            </button>
          ))}
        </div>

        <div className="reports-date-range">
          {filtroFecha === 'personalizado' && (
            <>
              <input type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} />
              <input type="date" value={customEnd} onChange={event => setCustomEnd(event.target.value)} />
            </>
          )}
          <span><ClockIcon size={15} /> {formatFechaCorta(rango.start)} - {formatFechaCorta(rango.end)}</span>
        </div>
      </div>

      {error && <div className="reports-error">{error}</div>}

      <section className="reports-kpis">
        {kpis.map(kpi => (
          <article className="reports-kpi" key={kpi.label}>
            <div className={`reports-kpi-icon ${kpi.tone}`}><kpi.icon size={25} /></div>
            <div>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small className={kpi.cambio >= 0 ? 'positive' : 'negative'}>
                {kpi.cambio >= 0 ? '↑' : '↓'} {Math.abs(kpi.cambio).toFixed(1)}% vs. periodo anterior
              </small>
            </div>
            <Sparkline data={serieDias.map(dia => dia[kpi.serieKey])} tone={kpi.tone} />
          </article>
        ))}
      </section>

      <section className="reports-main-grid">
        <article className="reports-panel reports-sales-panel">
          <PanelHeader title="Ventas del periodo">
            <select value={metricaGrafica} onChange={event => setMetricaGrafica(event.target.value)}>
              <option value="ventas">Ventas ($)</option>
              <option value="tickets">Tickets</option>
              <option value="propinas">Propinas ($)</option>
            </select>
          </PanelHeader>
          <div className="reports-bars">
            {serieDias.length === 0 ? (
              <EmptyState text="Sin ventas registradas" />
            ) : serieDias.map(dia => (
              <div className="reports-bar-item" key={dia.key} title={`${dia.label}: ${metricaGrafica === 'tickets' ? dia[metricaGrafica] : formatMoney(dia[metricaGrafica])}`}>
                <div className="reports-bar-track">
                  <span style={{ height: `${Math.max((dia[metricaGrafica] / maxGrafica) * 100, dia[metricaGrafica] > 0 ? 5 : 0)}%` }} />
                </div>
                <small>{dia.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="reports-panel">
          <PanelHeader title="Distribución de ventas" />
          {distribucion.length === 0 ? (
            <EmptyState text="Sin ventas registradas" />
          ) : (
            <div className="reports-distribution">
              <DonutChart items={distribucion} total={resumen.totalVentas + resumen.propinas} />
              <div className="reports-distribution-list">
                {distribucion.map(item => (
                  <div key={item.label}>
                    <span><i />{item.label}</span>
                    <strong>{formatMoney(item.monto)}</strong>
                    <small>{item.porcentaje.toFixed(1)}%</small>
                  </div>
                ))}
              </div>
              <div className="reports-note">
                {distribucion[0]?.label} representa el {distribucion[0]?.porcentaje.toFixed(1)}% del total registrado.
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="reports-lower-grid">
        <article className="reports-panel">
          <PanelHeader title="Productos más vendidos" />
          <table className="reports-table">
            <thead><tr><th>#</th><th>Producto</th><th>Unidades vendidas</th><th>Ventas</th><th></th></tr></thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan="5"><EmptyState text="Sin productos vendidos" /></td></tr>
              ) : productos.slice(0, limiteProductos).map((producto, index) => (
                <tr key={producto.producto}>
                  <td>{index + 1}</td>
                  <td><strong>{producto.producto}</strong></td>
                  <td>{formatNumber(producto.unidades)}</td>
                  <td>{formatMoney(producto.ventas)}</td>
                  <td><span className="reports-row-bar"><i style={{ width: `${(producto.ventas / maxProducto) * 100}%` }} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {productos.length > 5 && (
            <button className="reports-link" onClick={() => setLimiteProductos(limiteProductos === 5 ? productos.length : 5)} type="button">
              {limiteProductos === 5 ? 'Ver reporte completo →' : 'Ver menos'}
            </button>
          )}
        </article>

        <article className="reports-panel">
          <PanelHeader title="Rendimiento por usuario" />
          <table className="reports-table">
            <thead><tr><th>Usuario</th><th>Ventas Totales</th><th>Tickets</th><th>Promedio/Ticket</th><th>Propinas</th></tr></thead>
            <tbody>
              {meseros.length === 0 ? (
                <tr><td colSpan="5"><EmptyState text="Sin rendimiento registrado" /></td></tr>
              ) : meseros.slice(0, limiteMeseros).map(mesero => (
                <tr key={mesero.nombre}>
                  <td><strong>{mesero.nombre}</strong></td>
                  <td>{formatMoney(mesero.ventas)}</td>
                  <td>{formatNumber(mesero.tickets)}</td>
                  <td>{formatMoney(mesero.promedio)}</td>
                  <td>{formatMoney(mesero.propinas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {meseros.length > 5 && (
            <button className="reports-link" onClick={() => setLimiteMeseros(limiteMeseros === 5 ? meseros.length : 5)} type="button">
              {limiteMeseros === 5 ? 'Ver rendimiento completo →' : 'Ver menos'}
            </button>
          )}
        </article>

        <aside className="reports-side-stack">
          <article className="reports-panel">
            <PanelHeader title="Cortes recientes" />
            <table className="reports-table reports-cuts-table">
              <thead><tr><th>Fecha</th><th>Efectivo</th><th>Diferencia</th><th>Estado</th></tr></thead>
              <tbody>
                {cortesPeriodo.length === 0 ? (
                  <tr><td colSpan="4"><EmptyState text="Sin cortes" /></td></tr>
                ) : cortesPeriodo.slice(0, limiteCortes).map(corte => (
                  <tr key={corte.id}>
                    <td>{formatFechaHora(corte.fecha)}</td>
                    <td>{formatMoney(corte.efectivo)}</td>
                    <td>{formatMoney(corte.diferencia)}</td>
                    <td><span className="reports-badge">{corte.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cortesPeriodo.length > 5 && (
              <button className="reports-link" onClick={() => setLimiteCortes(limiteCortes === 5 ? cortesPeriodo.length : 5)} type="button">
                {limiteCortes === 5 ? 'Ver todos los cortes →' : 'Ver menos'}
              </button>
            )}
          </article>

          <article className="reports-panel">
            <PanelHeader title="Resumen rápido" />
            <div className="reports-mini-grid">
              <MiniMetric icon={<ClockIcon size={17} />} label="Día con más ventas" value={resumenRapido.mejorDia.ventas > 0 ? `${resumenRapido.mejorDia.label}` : 'Sin datos'} note={formatMoney(resumenRapido.mejorDia.ventas)} />
              <MiniMetric icon={<DollarSignIcon size={17} />} label="Día promedio" value={formatMoney(resumenRapido.promedioDia)} note="por día con ventas" />
              <MiniMetric icon={<CheckCircleIcon size={17} />} label="Productos vendidos" value={formatNumber(resumenRapido.productosVendidos)} note="unidades" />
              <MiniMetric icon={<UserIcon size={17} />} label="Clientes atendidos" value={formatNumber(resumenRapido.clientesAtendidos)} note="tickets" />
              <MiniMetric icon={<CajaIcon size={17} />} label="Mesas atendidas" value={formatNumber(resumenRapido.mesasAtendidas)} note="mesas" />
            </div>
          </article>
        </aside>
      </section>

      <footer className="reports-footer">
        <span>i</span>
        Los datos se actualizan con cada pago, comanda y corte registrado en el sistema.
      </footer>
    </section>
  )
}

const PanelHeader = ({ title, children }) => (
  <div className="reports-panel-header">
    <h2>{title}</h2>
    {children}
  </div>
)

const EmptyState = ({ text }) => <div className="reports-empty">{text}</div>

const Sparkline = ({ data, tone }) => {
  const max = Math.max(...data, 1)
  const points = data.length > 1
    ? data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 38 - ((value / max) * 32)
      return `${x},${y}`
    }).join(' ')
    : '0,38 100,38'

  return (
    <svg className={`reports-spark ${tone}`} viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const DonutChart = ({ items, total }) => {
  let acumulado = 0
  const colors = ['#ff6f00', '#9b5de5', '#2f80ed', '#16a34a', '#f59e0b']
  const gradient = items.map((item, index) => {
    const start = acumulado
    const end = acumulado + item.porcentaje
    acumulado = end
    return `${colors[index % colors.length]} ${start}% ${end}%`
  }).join(', ')

  return (
    <div className="reports-donut" style={{ background: `conic-gradient(${gradient || '#e5e7eb 0% 100%'})` }}>
      <div>
        <span>Total</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </div>
  )
}

const MiniMetric = ({ icon, label, value, note }) => (
  <div className="reports-mini">
    <span>{icon}</span>
    <small>{label}</small>
    <strong>{value}</strong>
    <em>{note}</em>
  </div>
)
