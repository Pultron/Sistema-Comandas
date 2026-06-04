import { useEffect, useMemo, useState } from 'react'
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  PagosIcon,
  PrintIcon,
  SearchIcon,
  XIcon
} from '../Icons'
import { supabase } from '../../supabase'
import { useComandas } from '../../hooks/useSupabase'
import '../../styles/Pagos.css'

const metodosPago = ['Efectivo', 'Tarjeta']

const parseMonto = (value) => Number(String(value ?? '0').replace(/[$,]/g, '')) || 0

const formatMoney = (value) => `$${(Number(value) || 0).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`

const formatComandaId = (id) => `#${String(id ?? '').padStart(4, '0')}`

const formatFechaHora = (fecha) => {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return fecha || '-'

  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const formatHora = (fecha) => {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const esPagada = (comanda) => String(comanda?.estado || '').toLowerCase() === 'pagado'
const esCancelada = (comanda) => String(comanda?.estado || '').toLowerCase() === 'cancelado'

const obtenerMesaBase = (comanda) => {
  const mesa = String(comanda?.mesa || '').trim()
  const match = mesa.match(/Mesa\s*\d+/i)
  if (match) return match[0]
  return mesa || 'Sin mesa'
}

const obtenerMesaVisible = (comanda) => {
  const mesaBase = obtenerMesaBase(comanda)
  const nombreCuenta = String(comanda?.nombreCuenta || '').trim()
  if (comanda?.cuentaSeparada && nombreCuenta) return `${mesaBase} - ${nombreCuenta}`
  return mesaBase
}

const obtenerNombreReservacion = (comanda) => {
  const directo = String(comanda?.nombreReservacion || '').trim()
  if (directo) return directo

  const partes = String(comanda?.mesa || '').split('-').map(parte => parte.trim()).filter(Boolean)
  if (/^Reservaci[oó]n/i.test(partes[0] || '') && partes.length >= 3) {
    return partes[2]
  }

  return ''
}

export const Pagos = ({ comandas: comandasProp, currentUser }) => {
  const {
    comandas: comandasBd,
    loading,
    actualizarEstadoComanda,
    refetch
  } = useComandas()

  const comandas = comandasProp || comandasBd
  const [busqueda, setBusqueda] = useState('')
  const [filtroMesa, setFiltroMesa] = useState('Todas')
  const [filtroMesero, setFiltroMesero] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Pendientes')
  const [comandaSeleccionadaId, setComandaSeleccionadaId] = useState(null)
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [propina, setPropina] = useState('')
  const [porcentajePropinaTarjeta, setPorcentajePropinaTarjeta] = useState('10')
  const [dejarCambioComoPropina, setDejarCambioComoPropina] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState('')
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [pagosRegistrados, setPagosRegistrados] = useState([])
  const [modalPago, setModalPago] = useState({ abierto: false, etapa: 'propina', paso: 0, listo: false })
  const [ticketImpresoComandaId, setTicketImpresoComandaId] = useState(null)

  const comandasPendientes = useMemo(
    () => comandas.filter(comanda => !esPagada(comanda) && !esCancelada(comanda)),
    [comandas]
  )

  const comandasPagadas = useMemo(
    () => comandas.filter(esPagada).sort((a, b) => new Date(b.fechaPago || b.fecha) - new Date(a.fechaPago || a.fecha)),
    [comandas]
  )

  const mesas = useMemo(
    () => [...new Set(comandasPendientes.map(obtenerMesaVisible).filter(Boolean))].sort(),
    [comandasPendientes]
  )

  const meseros = useMemo(
    () => [...new Set(comandasPendientes.map(comanda => comanda.mesero).filter(Boolean))].sort(),
    [comandasPendientes]
  )

  const cuentasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return comandasPendientes.filter(comanda => {
      const coincideBusqueda = !texto || [
        formatComandaId(comanda.id),
        comanda.id,
        comanda.mesa,
        obtenerMesaVisible(comanda),
        comanda.nombreCuenta,
        obtenerNombreReservacion(comanda),
        comanda.mesero
      ].some(value => String(value || '').toLowerCase().includes(texto))
      const coincideMesa = filtroMesa === 'Todas' || obtenerMesaVisible(comanda) === filtroMesa
      const coincideMesero = filtroMesero === 'Todos' || comanda.mesero === filtroMesero
      const coincideEstado = filtroEstado === 'Pendientes' || comanda.estado === filtroEstado
      return coincideBusqueda && coincideMesa && coincideMesero && coincideEstado
    })
  }, [busqueda, comandasPendientes, filtroEstado, filtroMesa, filtroMesero])

  const comandaSeleccionada = useMemo(() => (
    comandas.find(comanda => comanda.id === comandaSeleccionadaId) || cuentasFiltradas[0] || null
  ), [comandaSeleccionadaId, comandas, cuentasFiltradas])

  const subtotal = parseMonto(comandaSeleccionada?.subtotal) || comandaSeleccionada?.items?.reduce((sum, item) => sum + parseMonto(item.subtotal), 0) || 0
  const descuento = parseMonto(comandaSeleccionada?.descuento)
  const impuesto = parseMonto(comandaSeleccionada?.impuesto)
  const totalVenta = Math.max(subtotal - descuento + impuesto, 0)
  const propinaManual = parseMonto(propina)
  const recibidoNumero = parseMonto(montoRecibido)
  const esEfectivo = metodoPago === 'Efectivo'
  const propinaNumero = esEfectivo && dejarCambioComoPropina
    ? Math.max(recibidoNumero - totalVenta, 0)
    : propinaManual
  const totalConPropina = totalVenta + propinaNumero
  const totalCobrado = esEfectivo
    ? (dejarCambioComoPropina ? recibidoNumero : totalConPropina)
    : totalConPropina
  const montoRecibidoFinal = esEfectivo ? recibidoNumero : totalCobrado
  const cambio = esEfectivo && !dejarCambioComoPropina ? Math.max(recibidoNumero - totalConPropina, 0) : 0
  const ticketImpreso = !!comandaSeleccionada && ticketImpresoComandaId === comandaSeleccionada.id
  const alertaEsError = mensajeAlerta.includes('No se pudo') ||
    mensajeAlerta.includes('no cubre') ||
    mensajeAlerta.includes('Primero imprime')

  const resumen = [
    {
      title: 'Cuentas pendientes',
      value: comandasPendientes.length,
      note: 'Listas para cobrar',
      tone: 'orange',
      icon: PagosIcon
    },
    {
      title: 'Total por cobrar',
      value: formatMoney(comandasPendientes.reduce((sum, comanda) => sum + parseMonto(comanda.rawTotal ?? comanda.total), 0)),
      note: 'De todas las cuentas pendientes',
      tone: 'orange',
      icon: DollarSignIcon
    },
    {
      title: 'Pagos del día',
      value: formatMoney(pagosRegistrados.reduce((sum, pago) => sum + parseMonto(pago.monto), 0)),
      note: 'Registrados hoy en Caja',
      tone: 'green',
      icon: CheckCircleIcon
    },
    {
      title: 'Propinas generadas',
      value: formatMoney(pagosRegistrados.reduce((sum, pago) => {
        const totalComanda = parseMonto(pago.comandas?.total)
        return sum + Math.max(parseMonto(pago.monto) - totalComanda, 0)
      }, 0)),
      note: 'De los pagos del día',
      tone: 'purple',
      icon: BellIcon
    }
  ]

  useEffect(() => {
    if (!comandaSeleccionadaId && cuentasFiltradas[0]) {
      setComandaSeleccionadaId(cuentasFiltradas[0].id)
    }
  }, [comandaSeleccionadaId, cuentasFiltradas])

  useEffect(() => {
    if (!comandaSeleccionada) return
    const venta = Math.max(
      (parseMonto(comandaSeleccionada.subtotal) || comandaSeleccionada.items?.reduce((sum, item) => sum + parseMonto(item.subtotal), 0) || 0) -
      parseMonto(comandaSeleccionada.descuento) +
      parseMonto(comandaSeleccionada.impuesto),
      0
    )
    setPropina('0')
    setPorcentajePropinaTarjeta('10')
    setMontoRecibido(String(venta.toFixed(2)))
    setMetodoPago('Efectivo')
    setDejarCambioComoPropina(false)
    setTicketImpresoComandaId(null)
  }, [comandaSeleccionada?.id])

  useEffect(() => {
    if (!comandaSeleccionada) return
    if (!esEfectivo) {
      setDejarCambioComoPropina(false)
      setMontoRecibido(String(totalConPropina.toFixed(2)))
    } else if (!dejarCambioComoPropina) {
      setPropina('0')
    }
  }, [comandaSeleccionada, esEfectivo, dejarCambioComoPropina, totalConPropina])

  const cargarPagosRegistrados = async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select('id, id_comanda, id_usuario, metodo_pago, monto, subtotal, descuento, impuesto, propina, total_venta, total_cobrado, monto_recibido, cambio_entregado, dejar_cambio_como_propina, estado_pago, fecha_pago, comandas(id, total, created_at, usuarios(nombre), mesas(numero))')
      .order('fecha_pago', { ascending: false })
      .limit(8)

    if (!error) {
      setPagosRegistrados(data || [])
    }
  }

  useEffect(() => {
    cargarPagosRegistrados()
  }, [])

  const cobrarComanda = (comanda) => {
    setComandaSeleccionadaId(comanda.id)
    document.querySelector('.payment-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const seleccionarMetodoPago = (metodo) => {
    setMetodoPago(metodo)
    setPropina('0')
    setPorcentajePropinaTarjeta('10')
    setDejarCambioComoPropina(false)
    if (metodo !== 'Efectivo') {
      setMontoRecibido(String(totalVenta.toFixed(2)))
    }
  }

  useEffect(() => {
    if (metodoPago !== 'Tarjeta') return
    const porcentaje = Math.max(parseMonto(porcentajePropinaTarjeta), 0)
    const propinaCalculada = totalVenta * (porcentaje / 100)
    setPropina(propinaCalculada.toFixed(2))
  }, [metodoPago, porcentajePropinaTarjeta, totalVenta])

  const validarPago = () => {
    if (!comandaSeleccionada) return false
    if (propinaManual < 0 || recibidoNumero < 0) {
      setMensajeAlerta('No se permiten montos negativos.')
      setTimeout(() => setMensajeAlerta(''), 3000)
      return false
    }
    if (esEfectivo && recibidoNumero < totalConPropina) {
      setMensajeAlerta('El monto recibido no cubre el total a pagar.')
      setTimeout(() => setMensajeAlerta(''), 3000)
      return false
    }
    return true
  }

  const abrirSimulacionPago = () => {
    if (!ticketImpreso) {
      setMensajeAlerta('Primero imprime el ticket antes de confirmar el pago.')
      setTimeout(() => setMensajeAlerta(''), 3000)
      return
    }
    if (!validarPago() || procesandoPago) return
    setModalPago({ abierto: true, etapa: 'propina', paso: 0, listo: false })
  }

  const iniciarAnimacionPago = () => {
    if (!validarPago()) return
    setModalPago({ abierto: true, etapa: 'procesando', paso: 0, listo: false })
  }

  const finalizarYRegistrarCaja = async () => {
    if (!validarPago() || procesandoPago) return

    setProcesandoPago(true)
    try {
      const pagoPayload = {
        id_comanda: comandaSeleccionada.id,
        id_usuario: currentUser?.id || null,
        monto: totalCobrado,
        metodo_pago: metodoPago,
        subtotal,
        descuento,
        impuesto,
        propina: propinaNumero,
        total_venta: totalVenta,
        total_cobrado: totalCobrado,
        monto_recibido: montoRecibidoFinal,
        cambio_entregado: cambio,
        dejar_cambio_como_propina: esEfectivo ? dejarCambioComoPropina : false,
        estado_pago: 'completado',
        fecha_pago: new Date().toISOString()
      }

      const { data: pagoGuardado, error: pagoError } = await supabase
        .from('pagos')
        .insert(pagoPayload)
        .select('id')
        .single()
      if (pagoError) throw pagoError

      const numeroComanda = formatComandaId(comandaSeleccionada.id)
      const { error: movimientoError } = await supabase.from('movimientos_caja').insert({
        pago_id: pagoGuardado?.id,
        comanda_id: comandaSeleccionada.id,
        usuario_id: currentUser?.id || null,
        tipo: 'pago',
        metodo_pago: metodoPago,
        concepto: `Pago de comanda ${numeroComanda}`,
        monto: totalVenta,
        propina: propinaNumero,
        monto_recibido: montoRecibidoFinal,
        cambio_entregado: cambio,
        estado: 'completado',
        fecha_movimiento: new Date().toISOString()
      })
      if (movimientoError) throw movimientoError

      await actualizarEstadoComanda(comandaSeleccionada.id, 'pagado')
      await refetch?.()
      await cargarPagosRegistrados()
      window.dispatchEvent(new Event('caja:changed'))
      setMensajeAlerta(`Pago confirmado para ${formatComandaId(comandaSeleccionada.id)}. Movimiento disponible en Caja y reportes.`)
      setComandaSeleccionadaId(null)
      setModalPago({ abierto: false, etapa: 'propina', paso: 0, listo: false })
      setTicketImpresoComandaId(null)
    } catch (error) {
      setMensajeAlerta(`No se pudo confirmar el pago: ${error.message}`)
    } finally {
      setProcesandoPago(false)
      setTimeout(() => setMensajeAlerta(''), 3600)
    }
  }

  const imprimirTicket = () => {
    if (!comandaSeleccionada) return
    setTicketImpresoComandaId(comandaSeleccionada.id)
    setMensajeAlerta('Ticket impreso. Ya puedes confirmar el pago.')
    setTimeout(() => setMensajeAlerta(''), 2400)
  }

  const pasosModal = (() => {
    if (metodoPago === 'Efectivo') return ['Recibiendo efectivo...', 'Calculando cambio...', 'Pago confirmado']
    return ['Insertando tarjeta...', 'Procesando pago...', 'Pago aprobado']
  })()

  useEffect(() => {
    if (!modalPago.abierto || modalPago.etapa !== 'procesando' || modalPago.listo) return
    const timer = setTimeout(() => {
      setModalPago(prev => {
        if (prev.paso >= pasosModal.length - 1) return { ...prev, listo: true }
        return { ...prev, paso: prev.paso + 1 }
      })
    }, 850)
    return () => clearTimeout(timer)
  }, [modalPago.abierto, modalPago.etapa, modalPago.paso, modalPago.listo, pasosModal.length])

  return (
    <section className="pagos-page">
      <div className="pagos-header">
        <div>
          <span className="pagos-kicker">Módulo operativo</span>
          <h1>Pagos / Cobro de cuentas</h1>
          <p>Gestión de cuentas pendientes, métodos de pago y registro automático a caja</p>
        </div>

        <div className="pagos-filters" aria-label="Filtros de pagos">
          <button className="filter-chip" type="button">
            <ClockIcon size={15} />
            Hoy
          </button>
          <label className="search-field">
            <SearchIcon size={16} />
            <input
              type="search"
              placeholder="Buscar comanda, mesa o mesero..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </label>
          <select aria-label="Mesa" value={filtroMesa} onChange={(event) => setFiltroMesa(event.target.value)}>
            <option>Todas</option>
            {mesas.map(mesa => <option key={mesa}>{mesa}</option>)}
          </select>
          <select aria-label="Mesero" value={filtroMesero} onChange={(event) => setFiltroMesero(event.target.value)}>
            <option>Todos</option>
            {meseros.map(mesero => <option key={mesero}>{mesero}</option>)}
          </select>
          <select aria-label="Estado" value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
            <option>Pendientes</option>
            <option>Pendiente</option>
          </select>
          <button className="filter-icon-btn" type="button" onClick={() => refetch?.()} aria-label="Actualizar filtros">↻</button>
        </div>
      </div>

      <div className="summary-grid">
        {resumen.map(({ title, value, note, tone, icon: Icon }) => (
          <article className="summary-card" key={title}>
            <div className={`summary-icon ${tone}`}>
              <Icon size={22} />
            </div>
            <div>
              <span>{title}</span>
              <strong>{value}</strong>
              <small className={tone}>{note}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="pagos-main-grid">
        <section className="panel accounts-panel">
          <div className="panel-header">
            <div>
              <h2>Cuentas pendientes</h2>
              <p>Información conectada al módulo de comandas.</p>
            </div>
            <span className="panel-count">{cuentasFiltradas.length} pendientes</span>
          </div>

          <div className="table-wrap">
            <table className="pagos-table">
              <thead>
                <tr>
                  <th>Comanda</th>
                  <th>Mesa</th>
                  <th>Mesero</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="empty-cell">Cargando comandas...</td></tr>
                ) : cuentasFiltradas.length === 0 ? (
                  <tr><td colSpan="7" className="empty-cell">No hay cuentas pendientes con los filtros actuales.</td></tr>
                ) : cuentasFiltradas.map((cuenta) => (
                  <tr className={comandaSeleccionada?.id === cuenta.id ? 'selected-row' : ''} key={cuenta.id}>
                    <td><strong>{formatComandaId(cuenta.id)}</strong></td>
                    <td>
                      <div className="account-cell">
                        <strong>{obtenerMesaVisible(cuenta)}</strong>
                        {cuenta.cuentaSeparada && (
                          <span>Cuenta separada: {cuenta.nombreCuenta || 'Sin nombre'}</span>
                        )}
                        {obtenerNombreReservacion(cuenta) && (
                          <span>Reservación - {obtenerNombreReservacion(cuenta)}</span>
                        )}
                      </div>
                    </td>
                    <td>{cuenta.mesero}</td>
                    <td>{cuenta.productos} producto{Number(cuenta.productos) === 1 ? '' : 's'}</td>
                    <td><strong>{formatMoney(parseMonto(cuenta.rawTotal ?? cuenta.total))}</strong></td>
                    <td><span className="status-badge">Lista para cobrar</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-orange" onClick={() => cobrarComanda(cuenta)} type="button">Cobrar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="panel-footer">
            <span>Mostrando {cuentasFiltradas.length === 0 ? 0 : 1} a {cuentasFiltradas.length} de {cuentasFiltradas.length} cuentas</span>
            <div className="pagination">
              <button type="button">‹</button>
              <button className="active" type="button">1</button>
              <button type="button">›</button>
            </div>
            <button className="link-button" onClick={() => {
              setBusqueda('')
              setFiltroMesa('Todas')
              setFiltroMesero('Todos')
              setFiltroEstado('Pendientes')
            }} type="button">Ver todas las cuentas →</button>
          </footer>
        </section>

        <section className="payment-column">
          <div className="panel payment-panel">
            <div className="panel-header">
              <div>
                <h2>Detalle de pago</h2>
                <p>{comandaSeleccionada ? 'Cuenta seleccionada para confirmar cobro.' : 'Selecciona una comanda pendiente para cobrar.'}</p>
              </div>
            </div>

            {!comandaSeleccionada ? (
              <div className="empty-detail">No hay una cuenta pendiente seleccionada.</div>
            ) : (
              <>
                <div className="detail-top">
                  <h3>Comanda {formatComandaId(comandaSeleccionada.id)}</h3>
                  <span>{obtenerMesaVisible(comandaSeleccionada)}</span>
                  {comandaSeleccionada.cuentaSeparada && (
                    <span>Cuenta separada: {comandaSeleccionada.nombreCuenta || 'Sin nombre'}</span>
                  )}
                  {obtenerNombreReservacion(comandaSeleccionada) && (
                    <span>Reservación - {obtenerNombreReservacion(comandaSeleccionada)}</span>
                  )}
                  <span>Mesero: {comandaSeleccionada.mesero}</span>
                  <span>{formatFechaHora(comandaSeleccionada.fecha)}</span>
                </div>

                <div className="detail-layout detail-layout--simple">
                  <div className="detail-content">
                    <div className="mini-table-wrap">
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comandaSeleccionada.items?.length > 0 ? comandaSeleccionada.items.map((item) => (
                            <tr key={item.id || item.nombre}>
                              <td>{item.nombre}</td>
                              <td>{item.cantidad}</td>
                              <td>{item.precio}</td>
                              <td>{formatMoney(parseMonto(item.subtotal))}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" className="empty-cell">Sin productos registrados.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="payment-methods payment-methods--only">
                        <h4>Método de pago</h4>
                        <div className="method-grid">
                          {metodosPago.map((metodo) => (
                            <button
                              className={metodoPago === metodo ? 'active' : ''}
                              key={metodo}
                              onClick={() => seleccionarMetodoPago(metodo)}
                              type="button"
                            >
                            {metodo}
                          </button>
                        ))}
                        </div>
                    </div>

                    <div className="extra-actions">
                      <h4>Acciones adicionales</h4>
                      <div>
                        <button className={`btn-soft ${ticketImpreso ? 'ticket-printed' : ''}`} onClick={imprimirTicket} type="button">
                          <PrintIcon size={15} />
                          {ticketImpreso ? 'Ticket impreso' : 'Imprimir ticket'}
                        </button>
                      </div>
                    </div>

                    <div className="info-box">
                      <span>i</span>
                      <p>Primero imprime el ticket y entrégalo al cliente. Después selecciona el método de pago indicado por el cliente; al confirmar, se simula el cobro y se registra el movimiento para Caja.</p>
                    </div>

                    <div className="final-actions">
                      <button className="btn-soft" onClick={() => setComandaSeleccionadaId(null)} type="button">Cancelar</button>
                      <button className="btn-confirm" disabled={procesandoPago} onClick={abrirSimulacionPago} type="button">
                        {procesandoPago ? 'Confirmando...' : 'Confirmar pago y registrar en Caja'}
                      </button>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-header">
          <div>
            <h2>Últimos pagos registrados</h2>
            <p>Movimientos registrados en la tabla de pagos.</p>
          </div>
          <button className="link-button" onClick={() => refetch?.()} type="button">Ver historial completo →</button>
        </div>

        <div className="table-wrap">
          <table className="pagos-table recent-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Comanda</th>
                <th>Método</th>
                <th>Total</th>
                <th>Propina</th>
                <th>Usuario</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagosRegistrados.length === 0 ? (
                <tr><td colSpan="7" className="empty-cell">Aún no hay pagos registrados.</td></tr>
              ) : pagosRegistrados.map((pago) => {
                const propinaPago = parseMonto(pago.propina)
                return (
                <tr key={`pago-${pago.id}`}>
                  <td>{formatHora(pago.fecha_pago || pago.comandas?.created_at)}</td>
                  <td><strong>{formatComandaId(pago.id_comanda)}</strong></td>
                  <td>{pago.metodo_pago || 'No especificado'}</td>
                  <td><strong>{formatMoney(parseMonto(pago.total_cobrado ?? pago.monto))}</strong></td>
                  <td>{formatMoney(propinaPago)}</td>
                  <td>{currentUser?.nombre || pago.comandas?.usuarios?.nombre || 'Usuario'}</td>
                  <td><span className="status-badge">Completado</span></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>

      {mensajeAlerta && (
        <div className={`payment-toast ${alertaEsError ? 'error' : ''}`}>
          {alertaEsError ? <XIcon size={18} /> : <CheckCircleIcon size={18} />}
          {mensajeAlerta}
        </div>
      )}

      {modalPago.abierto && (
        <div className="payment-modal-backdrop">
          <div className={`payment-modal ${modalPago.etapa === 'propina' ? 'payment-modal--wide' : ''}`}>
            <div className="payment-modal-header">
              <div>
                <h2>{modalPago.etapa === 'propina' ? 'Confirmar pago' : 'Procesando pago'}</h2>
                <p>Simulación del cobro del cliente</p>
              </div>
              <span>{metodoPago}</span>
            </div>

            {modalPago.etapa === 'propina' ? (
              <div className="tip-confirm-content">
                <div className="ticket-paper modal-ticket">
                  <div className="ticket-center">
                    <strong>GASTROSOFT RESTAURANTE</strong>
                    <span>Ticket impreso</span>
                  </div>
                  <div className="ticket-separator" />
                  <p>Comanda: <strong>{formatComandaId(comandaSeleccionada?.id)}</strong></p>
                  <p>Mesa: <strong>{obtenerMesaVisible(comandaSeleccionada)}</strong></p>
                  {comandaSeleccionada?.cuentaSeparada && (
                    <p>Cuenta separada: <strong>{comandaSeleccionada.nombreCuenta || 'Sin nombre'}</strong></p>
                  )}
                  {obtenerNombreReservacion(comandaSeleccionada) && (
                    <p>Reservación: <strong>{obtenerNombreReservacion(comandaSeleccionada)}</strong></p>
                  )}
                  <div className="ticket-separator" />
                  {comandaSeleccionada?.items?.map(item => (
                    <div key={`modal-ticket-${item.id || item.nombre}`}>
                      <span>{item.nombre} x{item.cantidad}</span>
                      <strong>{formatMoney(parseMonto(item.subtotal))}</strong>
                    </div>
                  ))}
                  <div className="ticket-separator" />
                  <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
                  <div><span>Descuento</span><strong>{formatMoney(descuento)}</strong></div>
                  <div><span>IVA</span><strong>{formatMoney(impuesto)}</strong></div>
                  <div><span>Propina</span><strong>{formatMoney(propinaNumero)}</strong></div>
                  <div className="ticket-total"><span>TOTAL</span><strong>{formatMoney(totalConPropina)}</strong></div>
                </div>

                <div className="tip-confirm-panel">
                  <h3>{esEfectivo ? 'Pago en efectivo' : 'Confirmación del cobro'}</h3>
                  {esEfectivo && (
                    <label className="switch-field">
                      <div className="cash-pay-field">
                        <span>¿Con cuánto pagará?</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={montoRecibido}
                          onChange={(event) => setMontoRecibido(event.target.value)}
                        />
                      </div>
                      <input
                        type="checkbox"
                        checked={dejarCambioComoPropina}
                        onChange={(event) => {
                          setDejarCambioComoPropina(event.target.checked)
                          if (!event.target.checked) {
                            setPropina('0')
                          }
                        }}
                      />
                      <span>Dejar cambio como propina</span>
                    </label>
                  )}
                  {metodoPago === 'Tarjeta' && (
                    <div className="card-tip-box">
                      <label className="tip-field">
                        <span>Porcentaje de propina:</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={porcentajePropinaTarjeta}
                          onChange={(event) => setPorcentajePropinaTarjeta(event.target.value)}
                        />
                      </label>
                      <div className="card-tip-presets">
                        {['0', '10', '15', '20'].map(porcentaje => (
                          <button
                            className={porcentajePropinaTarjeta === porcentaje ? 'active' : ''}
                            key={porcentaje}
                            onClick={() => setPorcentajePropinaTarjeta(porcentaje)}
                            type="button"
                          >
                            {porcentaje === '0' ? 'Sin propina' : `${porcentaje}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {!esEfectivo && (
                    <div className="cashless-note">
                      El cliente pagará con {metodoPago.toLowerCase()}. La propina y otros ajustes se controlarán en Caja.
                    </div>
                  )}
                  <div className="payment-modal-summary tip-confirm-summary">
                    <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
                    <div><span>Total</span><strong>{formatMoney(totalCobrado)}</strong></div>
                    <div><span>Propina</span><strong>{formatMoney(propinaNumero)}</strong></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
            <div className="payment-steps">
              {pasosModal.map((paso, index) => (
                <div className={index <= modalPago.paso ? 'done' : ''} key={paso}>
                  <span>{index + 1}</span>
                  <strong>{paso}</strong>
                </div>
              ))}
            </div>

            <div className="payment-modal-summary">
              <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
              <div><span>Propina</span><strong>{formatMoney(propinaNumero)}</strong></div>
              <div><span>Total cobrado</span><strong>{formatMoney(totalCobrado)}</strong></div>
            </div>

              </>
            )}

            <div className="payment-modal-actions">
              <button className="btn-soft" disabled={procesandoPago} onClick={() => setModalPago({ abierto: false, etapa: 'propina', paso: 0, listo: false })} type="button">
                Cancelar
              </button>
              {modalPago.etapa === 'propina' ? (
                <button className="btn-confirm" disabled={procesandoPago} onClick={iniciarAnimacionPago} type="button">
                  Confirmar pago
                </button>
              ) : (
                <button className="btn-confirm" disabled={!modalPago.listo || procesandoPago} onClick={finalizarYRegistrarCaja} type="button">
                  {procesandoPago ? 'Registrando...' : 'Finalizar y registrar en Caja'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


