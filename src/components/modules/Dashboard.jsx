import { useEffect, useMemo, useState } from 'react'
import {
  CajaIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  MesasIcon,
  PedidosIcon,
  ReportesIcon,
  UserIcon
} from '../Icons'
import { supabase } from '../../supabase'
import '../../styles/Dashboard.css'

const parseMonto = (value) => Number(String(value ?? '0').replace(/[$,]/g, '')) || 0

const formatMoney = (value) => `$${(Number(value) || 0).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`

const formatNumber = (value) => (Number(value) || 0).toLocaleString('es-MX')

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

const estaEnRango = (value, start, end) => {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date >= start && date <= end
}

const formatFechaDashboard = (date) => date.toLocaleDateString('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

const formatHora = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const calcularCambio = (actual, anterior) => {
  if (!actual && !anterior) return 0
  if (!anterior) return actual > 0 ? 100 : 0
  return ((actual - anterior) / anterior) * 100
}

const comandaLabel = (id) => `Comanda #${String(id || '').padStart(3, '0')}`

export const DashboardModule = ({ comandas = [], onModuleChange }) => {
  const [pagos, setPagos] = useState([])
  const [detalles, setDetalles] = useState([])
  const [mesas, setMesas] = useState([])
  const [cortes, setCortes] = useState([])
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date())
  const [metricaHora, setMetricaHora] = useState('ventas')

  const hoyInicio = useMemo(() => startOfDay(new Date()), [])
  const hoyFin = useMemo(() => endOfDay(new Date()), [])
  const ayerInicio = useMemo(() => {
    const date = startOfDay(new Date())
    date.setDate(date.getDate() - 1)
    return date
  }, [])
  const ayerFin = useMemo(() => {
    const date = endOfDay(new Date())
    date.setDate(date.getDate() - 1)
    return date
  }, [])

  const cargarDashboard = async () => {
    setLoading(true)

    const [{ data: pagosData }, { data: mesasData }, { data: cortesData }] = await Promise.all([
      supabase
        .from('pagos')
        .select('id, id_comanda, id_usuario, metodo_pago, monto, propina, total_venta, total_cobrado, estado_pago, fecha_pago, usuarios(nombre), comandas(id, id_mesa, nombre_mesa, estado, total, created_at, usuarios(nombre), mesas(numero))')
        .order('fecha_pago', { ascending: false })
        .limit(200),
      supabase
        .from('mesas')
        .select('id, numero, estado, ubicacion')
        .order('numero', { ascending: true }),
      supabase
        .from('cortes_caja')
        .select('id, fecha, created_at, total_ventas, pagos_efectivo, descuentos')
        .order('fecha', { ascending: false })
        .limit(8)
    ])

    const idsComandas = [...new Set((pagosData || []).map(pago => pago.id_comanda).filter(Boolean))]
    const { data: detallesData } = idsComandas.length > 0
      ? await supabase
        .from('detalles_comanda')
        .select('id_comanda, nombre_producto, cantidad, subtotal, precio_unitario')
        .in('id_comanda', idsComandas)
      : { data: [] }

    setPagos(pagosData || [])
    setMesas(mesasData || [])
    setCortes(cortesData || [])
    setDetalles(detallesData || [])
    setUltimaActualizacion(new Date())
    setLoading(false)
  }

  useEffect(() => {
    cargarDashboard()
    window.addEventListener('caja:changed', cargarDashboard)
    window.addEventListener('comandas:changed', cargarDashboard)
    window.addEventListener('mesas:changed', cargarDashboard)
    return () => {
      window.removeEventListener('caja:changed', cargarDashboard)
      window.removeEventListener('comandas:changed', cargarDashboard)
      window.removeEventListener('mesas:changed', cargarDashboard)
    }
  }, [])

  const pagosCompletados = useMemo(
    () => pagos.filter(pago => normalizar(pago.estado_pago || 'completado') === 'completado'),
    [pagos]
  )

  const pagosHoy = useMemo(
    () => pagosCompletados.filter(pago => estaEnRango(pago.fecha_pago, hoyInicio, hoyFin)),
    [hoyFin, hoyInicio, pagosCompletados]
  )

  const pagosAyer = useMemo(
    () => pagosCompletados.filter(pago => estaEnRango(pago.fecha_pago, ayerInicio, ayerFin)),
    [ayerFin, ayerInicio, pagosCompletados]
  )

  const comandasActivas = useMemo(() => comandas.filter(comanda => {
    const estado = normalizar(comanda.estado)
    return !['pagado', 'pagada', 'cancelado'].includes(estado)
  }), [comandas])

  const comandasAyer = useMemo(() => comandas.filter(comanda =>
    estaEnRango(comanda.fecha || comanda.created_at, ayerInicio, ayerFin)
  ), [ayerFin, ayerInicio, comandas])

  const ventasHoy = pagosHoy.reduce((sum, pago) => sum + parseMonto(pago.total_venta ?? pago.monto), 0)
  const ventasAyer = pagosAyer.reduce((sum, pago) => sum + parseMonto(pago.total_venta ?? pago.monto), 0)
  const propinasHoy = pagosHoy.reduce((sum, pago) => sum + parseMonto(pago.propina), 0)
  const propinasAyer = pagosAyer.reduce((sum, pago) => sum + parseMonto(pago.propina), 0)
  const promedioTicket = pagosHoy.length > 0 ? ventasHoy / pagosHoy.length : 0
  const propinaPromedio = pagosHoy.length > 0 ? propinasHoy / pagosHoy.length : 0

  const mesasOcupadas = mesas.filter(mesa => normalizar(mesa.estado).includes('ocup')).length
  const mesasReservadas = mesas.filter(mesa => normalizar(mesa.estado).includes('reserv')).length
  const mesasDisponibles = mesas.filter(mesa => !normalizar(mesa.estado).includes('ocup') && !normalizar(mesa.estado).includes('reserv')).length

  const serieHoras = useMemo(() => {
    const horas = Array.from({ length: 15 }, (_, index) => {
      const hour = index + 8
      return { hour, label: `${String(hour).padStart(2, '0')}:00`, ventas: 0, tickets: 0, propinas: 0 }
    })

    pagosHoy.forEach(pago => {
      const date = new Date(pago.fecha_pago)
      const item = horas.find(hora => hora.hour === date.getHours())
      if (!item) return
      item.ventas += parseMonto(pago.total_venta ?? pago.monto)
      item.tickets += 1
      item.propinas += parseMonto(pago.propina)
    })

    return horas
  }, [pagosHoy])

  const productosHoy = useMemo(() => {
    const idsHoy = new Set(pagosHoy.map(pago => pago.id_comanda).filter(Boolean))
    const agrupados = {}
    detalles
      .filter(detalle => idsHoy.has(detalle.id_comanda))
      .forEach(detalle => {
        const producto = detalle.nombre_producto || 'Producto'
        if (!agrupados[producto]) agrupados[producto] = { producto, unidades: 0, ventas: 0 }
        agrupados[producto].unidades += Number(detalle.cantidad) || 0
        agrupados[producto].ventas += parseMonto(detalle.subtotal) || ((Number(detalle.cantidad) || 0) * parseMonto(detalle.precio_unitario))
      })
    return Object.values(agrupados).sort((a, b) => b.ventas - a.ventas)
  }, [detalles, pagosHoy])

  const rendimientoUsuarios = useMemo(() => {
    const agrupados = {}
    pagosHoy.forEach(pago => {
      const nombre = pago.usuarios?.nombre || pago.comandas?.usuarios?.nombre || 'Sin usuario'
      if (!agrupados[nombre]) agrupados[nombre] = { nombre, ventas: 0, tickets: 0, propinas: 0 }
      agrupados[nombre].ventas += parseMonto(pago.total_venta ?? pago.monto)
      agrupados[nombre].tickets += 1
      agrupados[nombre].propinas += parseMonto(pago.propina)
    })
    return Object.values(agrupados).sort((a, b) => b.ventas - a.ventas)
  }, [pagosHoy])

  const maxHora = Math.max(...serieHoras.map(item => item[metricaHora]), 1)
  const maxProducto = Math.max(...productosHoy.map(item => item.ventas), 1)

  const kpis = [
    {
      label: 'TOTAL VENTAS',
      value: formatMoney(ventasHoy),
      note: 'Hoy',
      change: calcularCambio(ventasHoy, ventasAyer),
      tone: 'orange',
      icon: DollarSignIcon,
      serie: serieHoras.map(item => item.ventas)
    },
    {
      label: 'COMANDAS ACTIVAS',
      value: formatNumber(comandasActivas.length),
      note: 'Órdenes en proceso',
      change: calcularCambio(comandasActivas.length, comandasAyer.length),
      tone: 'green',
      icon: PedidosIcon,
      serie: serieHoras.map(item => item.tickets)
    },
    {
      label: 'MESAS OCUPADAS',
      value: formatNumber(mesasOcupadas),
      note: `${mesasOcupadas} de ${mesas.length || 0} ocupadas`,
      change: mesas.length > 0 ? (mesasOcupadas / mesas.length) * 100 : 0,
      tone: 'blue',
      icon: MesasIcon,
      serie: mesas.map((mesa, index) => normalizar(mesa.estado).includes('ocup') ? index + 1 : 0)
    },
    {
      label: 'PROPINA DEL DÍA',
      value: formatMoney(propinasHoy),
      note: 'Hoy',
      change: calcularCambio(propinasHoy, propinasAyer),
      tone: 'purple',
      icon: CajaIcon,
      serie: serieHoras.map(item => item.propinas)
    }
  ]

  const comandasRecientes = comandas.slice(0, 5)

  return (
    <section className="dash-page">
      <header className="dash-header">
        <div>
          <h1>Dashboard / Resumen del Día</h1>
          <p>Vista general de la operación del restaurante en tiempo real.</p>
        </div>
        <div className="dash-date"><ClockIcon size={15} /> {formatFechaDashboard(new Date())}</div>
      </header>

      <section className="dash-kpis">
        {kpis.map(kpi => (
          <article className={`dash-kpi ${kpi.tone}`} key={kpi.label}>
            <div className="dash-kpi-icon"><kpi.icon size={27} /></div>
            <div className="dash-kpi-body">
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.note}</small>
              <em className={kpi.change >= 0 ? 'up' : 'down'}>{kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}% vs. ayer</em>
            </div>
            <Sparkline data={kpi.serie} />
          </article>
        ))}
      </section>

      <section className="dash-operational-grid">
        <article className="dash-panel dash-activity">
          <PanelHeader title="Resumen de Actividad" />
          <div className="dash-activity-metrics">
            <MiniMetric icon={<DollarSignIcon size={20} />} label="Ventas del día" value={formatMoney(ventasHoy)} tone="orange" />
            <MiniMetric icon={<ReportesIcon size={20} />} label="Tickets emitidos" value={formatNumber(pagosHoy.length)} tone="purple" />
            <MiniMetric icon={<CheckCircleIcon size={20} />} label="Promedio por ticket" value={formatMoney(promedioTicket)} tone="green" />
            <MiniMetric icon={<CajaIcon size={20} />} label="Propina promedio" value={formatMoney(propinaPromedio)} tone="orange" />
          </div>
        </article>

        <article className="dash-panel dash-hourly">
          <PanelHeader title="Ventas por Hora (Hoy)">
            <select value={metricaHora} onChange={event => setMetricaHora(event.target.value)}>
              <option value="ventas">Ventas ($)</option>
              <option value="tickets">Tickets</option>
              <option value="propinas">Propinas ($)</option>
            </select>
          </PanelHeader>
          <div className="dash-bars">
            {serieHoras.map(item => (
              <div className="dash-bar-item" key={item.label} title={`${item.label}: ${metricaHora === 'tickets' ? item[metricaHora] : formatMoney(item[metricaHora])}`}>
                <div><span style={{ height: `${Math.max((item[metricaHora] / maxHora) * 100, item[metricaHora] > 0 ? 6 : 0)}%` }} /></div>
                <small>{item.label.replace(':00', '')}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="dash-panel dash-map-panel">
          <PanelHeader title="Mapa de Mesas">
            <div className="dash-map-legend">
              <span><i className="available" />Disponible ({mesasDisponibles})</span>
              <span><i className="occupied" />Ocupada ({mesasOcupadas})</span>
              <span><i className="reserved" />Reservada ({mesasReservadas})</span>
            </div>
          </PanelHeader>
          <RestaurantMap mesas={mesas} />
        </article>
      </section>

      <section className="dash-mid-grid">
        <article className="dash-panel dash-recent">
          <PanelHeader title="Últimas Comandas">
            <button onClick={() => onModuleChange?.('comandas')} type="button">Ver todas</button>
          </PanelHeader>
          {comandasRecientes.length === 0 ? (
            <EmptyState text="Sin comandas" />
          ) : (
            <div className="dash-command-list">
              {comandasRecientes.map(comanda => (
                <div className="dash-command-row" key={comanda.id}>
                  <span className="dash-command-icon"><PedidosIcon size={17} /></span>
                  <div>
                    <strong>{comandaLabel(comanda.id)}</strong>
                    <small>{comanda.mesa || 'Sin mesa'} • {comanda.mesero || 'Sin mesero'}</small>
                  </div>
                  <b>{formatMoney(parseMonto(comanda.rawTotal ?? comanda.total))}</b>
                  <em className={normalizar(comanda.estado).includes('pag') ? 'ready' : 'active'}>{comanda.estado || 'En preparación'}</em>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dash-bottom-grid">
        <article className="dash-panel">
          <PanelHeader title="Productos Más Vendidos (Hoy)">
            <button onClick={() => onModuleChange?.('reportes')} type="button">Ver reporte completo</button>
          </PanelHeader>
          <table className="dash-table">
            <thead><tr><th>#</th><th>Producto</th><th>Unidades</th><th>Ventas</th></tr></thead>
            <tbody>
              {productosHoy.length === 0 ? (
                <tr><td colSpan="4"><EmptyState text="Sin productos vendidos" /></td></tr>
              ) : productosHoy.slice(0, 5).map((producto, index) => (
                <tr key={producto.producto}>
                  <td>{index + 1}</td>
                  <td><strong>{producto.producto}</strong><span className="dash-row-bar"><i style={{ width: `${(producto.ventas / maxProducto) * 100}%` }} /></span></td>
                  <td>{formatNumber(producto.unidades)}</td>
                  <td>{formatMoney(producto.ventas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="dash-panel">
          <PanelHeader title="Rendimiento por Usuario (Hoy)">
            <button onClick={() => onModuleChange?.('reportes')} type="button">Ver reporte completo</button>
          </PanelHeader>
          <table className="dash-table">
            <thead><tr><th>Usuario</th><th>Ventas Totales</th><th>Tickets</th><th>Propinas</th></tr></thead>
            <tbody>
              {rendimientoUsuarios.length === 0 ? (
                <tr><td colSpan="4"><EmptyState text="Sin datos" /></td></tr>
              ) : rendimientoUsuarios.slice(0, 5).map(usuario => (
                <tr key={usuario.nombre}>
                  <td><strong>{usuario.nombre}</strong></td>
                  <td>{formatMoney(usuario.ventas)}</td>
                  <td>{formatNumber(usuario.tickets)}</td>
                  <td className="green">{formatMoney(usuario.propinas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="dash-panel">
          <PanelHeader title="Cortes Recientes">
            <button onClick={() => onModuleChange?.('caja')} type="button">Ver todos</button>
          </PanelHeader>
          <table className="dash-table">
            <thead><tr><th>Fecha</th><th>Efectivo</th><th>Diferencia</th><th>Estado</th></tr></thead>
            <tbody>
              {cortes.length === 0 ? (
                <tr><td colSpan="4"><EmptyState text="Sin cortes" /></td></tr>
              ) : cortes.slice(0, 5).map(corte => (
                <tr key={corte.id}>
                  <td>{formatFechaDashboard(new Date(corte.fecha || corte.created_at))}</td>
                  <td>{formatMoney(corte.pagos_efectivo ?? corte.total_ventas)}</td>
                  <td className={parseMonto(corte.descuentos) < 0 ? 'red' : ''}>{formatMoney(corte.descuentos)}</td>
                  <td><span className="dash-badge">Cerrado</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      <footer className="dash-info">
        <span>i</span>
        Los datos mostrados se actualizan en tiempo real. Última actualización: {formatHora(ultimaActualizacion)} hrs.
        {loading ? ' Actualizando...' : ''}
      </footer>
    </section>
  )
}

const PanelHeader = ({ title, children }) => (
  <div className="dash-panel-header">
    <h2>{title}</h2>
    {children}
  </div>
)

const MiniMetric = ({ icon, label, value, tone }) => (
  <div className="dash-mini">
    <span className={tone}>{icon}</span>
    <small>{label}</small>
    <strong>{value}</strong>
  </div>
)

const Sparkline = ({ data }) => {
  const max = Math.max(...data, 1)
  const points = data.length > 1
    ? data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 40 - ((value / max) * 30)
      return `${x},${y}`
    }).join(' ')
    : '0,40 100,40'

  return (
    <svg className="dash-spark" viewBox="0 0 100 46" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const RestaurantMap = ({ mesas }) => {
  const mesasPorNumero = Object.fromEntries(mesas.map(mesa => [String(mesa.numero), mesa]))
  const layout = {
    principal: ['101', '102', '103', '201', '202', '203', '301', '302', '303'],
    terraza: ['401', '402', '403', '404', '405']
  }

  return (
    <div className="dash-map">
      <div className="dash-zone kitchen">COCINA</div>
      <div className="dash-zone bar">BARRA</div>
      <div className="dash-zone entrance">ENTRADA</div>
      <div className="dash-zone principal">
        <strong>ÁREA PRINCIPAL</strong>
        <div className="dash-table-grid">
          {layout.principal.map(numero => <TableSlot key={numero} mesa={mesasPorNumero[numero]} fallback={numero} />)}
        </div>
      </div>
      <div className="dash-zone terrace">
        <strong>TERRAZA</strong>
        <div className="dash-table-grid terrace-grid">
          {layout.terraza.map(numero => <TableSlot key={numero} mesa={mesasPorNumero[numero]} fallback={numero} />)}
        </div>
      </div>
    </div>
  )
}

const TableSlot = ({ mesa, fallback }) => {
  const estado = normalizar(mesa?.estado)
  const status = estado.includes('ocup') ? 'occupied' : estado.includes('reserv') ? 'reserved' : 'available'
  const label = mesa?.numero || fallback
  const statusText = status === 'occupied' ? 'Ocupada' : status === 'reserved' ? 'Reservada' : 'Disponible'

  return (
    <button className={`dash-table-slot ${status}`} type="button" title={`Mesa ${label} - ${statusText}`}>
      <i />
      <strong>Mesa {label}</strong>
      <span>{statusText}</span>
    </button>
  )
}

const EmptyState = ({ text }) => <div className="dash-empty">{text}</div>
