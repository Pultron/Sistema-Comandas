import { useState } from 'react'
import { supabase } from '../../supabase'
import { useClientes, useComandas, useMesas } from '../../hooks/useSupabase'
import '../../styles/Reservaciones.css'

const IconShell = ({ children, size = 22, className = '' }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

const CalendarIcon = (props) => (
  <IconShell {...props}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M3 10h18" />
  </IconShell>
)

const UsersIcon = (props) => (
  <IconShell {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconShell>
)

const UserIcon = (props) => (
  <IconShell {...props}>
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="7" r="4" />
  </IconShell>
)

const CheckIcon = (props) => (
  <IconShell {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m8.5 12.5 2.3 2.3 4.8-5.1" />
  </IconShell>
)

const XCircleIcon = (props) => (
  <IconShell {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </IconShell>
)

const SearchIcon = (props) => (
  <IconShell {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </IconShell>
)

const ClockIcon = (props) => (
  <IconShell {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </IconShell>
)

const TableIcon = (props) => (
  <IconShell {...props}>
    <path d="M4 10h16" />
    <path d="M6 10l-2 9" />
    <path d="M18 10l2 9" />
    <path d="M8 10l1 9" />
    <path d="M16 10l-1 9" />
    <path d="M7 6h10" />
  </IconShell>
)

const PhoneIcon = (props) => (
  <IconShell {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.6 2.62a2 2 0 0 1-.45 2.11L8 9.7a16 16 0 0 0 6.3 6.3l1.25-1.25a2 2 0 0 1 2.11-.45c.84.28 1.72.48 2.62.6A2 2 0 0 1 22 16.92Z" />
  </IconShell>
)

const EditIcon = (props) => (
  <IconShell {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </IconShell>
)

const TrashIcon = (props) => (
  <IconShell {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </IconShell>
)

const normalizar = (texto) => String(texto || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const fechaClaveLocal = (fecha = new Date()) => {
  const date = fecha instanceof Date ? fecha : new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatearFecha = (fecha) => {
  if (!fecha) return '-'
  const date = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(date.getTime())) return fecha
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${String(date.getDate()).padStart(2, '0')} ${meses[date.getMonth()]} ${date.getFullYear()}`
}

const obtenerDia = (fecha) => {
  if (!fecha) return '-'
  const hoy = fechaClaveLocal()
  if (fecha === hoy) return 'Hoy'
  const date = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
  return dias[date.getDay()]
}

const formatearHora = (hora) => {
  if (!hora) return { hora: '-', periodo: '' }
  const [hh = '0', mm = '00'] = String(hora).split(':')
  const numeroHora = Number(hh)
  const hora12 = numeroHora % 12 || 12
  return {
    hora: `${String(hora12).padStart(2, '0')}:${mm}`,
    periodo: numeroHora >= 12 ? 'PM' : 'AM'
  }
}

const estadoVisual = (estado, esHistorial = false) => {
  const valor = normalizar(estado)
  if (valor.includes('cancel')) return { label: 'Cancelada', tone: 'danger' }
  if (valor.includes('termin') || valor.includes('final')) return { label: 'Finalizada', tone: 'success' }
  if (valor.includes('pend')) return { label: 'Pendiente', tone: 'warning' }
  return esHistorial
    ? { label: 'Finalizada', tone: 'success' }
    : { label: 'Confirmada', tone: 'success' }
}

export const ClientesModule = () => {
  const {
    reservaciones,
    guardarReservacion: guardarReservacionBd,
    refetchReservaciones
  } = useClientes()
  const { mesas, refetch: refetchMesas } = useMesas()
  const { comandas } = useComandas()

  const [mostrarReservacion, setMostrarReservacion] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroFecha, setFiltroFecha] = useState('hoy')
  const [reservaData, setReservaData] = useState({
    cliente: '',
    fecha: '',
    hora: '',
    personas: '',
    mesa: '',
    telefono: ''
  })

  const mesasPorId = mesas.reduce((acc, mesa) => {
    acc[mesa.id] = mesa
    return acc
  }, {})

  const obtenerComandaActiva = (mesa) => {
    return comandas.find(c => {
      const mismaMesa = c.mesa === `Mesa ${mesa.numero}` || c.mesa?.startsWith(`Mesa ${mesa.numero} `)
      return mismaMesa && c.estado !== 'Pagado' && c.estado !== 'Cancelado'
    })
  }

  const mesasDisponibles = mesas
    .filter(mesa => {
      const esMesaActual = String(mesa.id) === String(reservaData.mesa)
      const estadoMesa = String(mesa.estado || '').trim().toLowerCase()
      const estadoDisponible = !['ocupada', 'reservada'].includes(estadoMesa) || esMesaActual
      return !obtenerComandaActiva(mesa) && estadoDisponible
    })
    .sort((a, b) => Number(a.numero) - Number(b.numero))

  const avisarCambioComandas = () => {
    window.dispatchEvent(new Event('comandas:changed'))
    window.dispatchEvent(new Event('mesas:changed'))
    window.dispatchEvent(new Event('reservaciones:changed'))
  }

  const sincronizarComandaReservacion = async (idReservacion, reserva) => {
    const idMesa = parseInt(reserva.mesa)
    const personas = parseInt(reserva.personas)
    const cliente = reserva.cliente.trim()

    const { data: mesaData } = await supabase
      .from('mesas')
      .select('numero')
      .eq('id', idMesa)
      .single()

    const nombreMesa = `Reservacion - Mesa ${mesaData?.numero || idMesa} - ${cliente}`

    const { data: comandaExistente } = await supabase
      .from('comandas')
      .select('id')
      .eq('id_reservacion', idReservacion)
      .maybeSingle()

    if (comandaExistente?.id) {
      const { error } = await supabase
        .from('comandas')
        .update({
          id_mesa: idMesa,
          nombre_mesa: nombreMesa,
          limite_cuentas: personas,
          updated_at: new Date().toISOString()
        })
        .eq('id', comandaExistente.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from('comandas').insert({
        numero_comanda: `RES-${Date.now()}`,
        id_mesa: idMesa,
        nombre_mesa: nombreMesa,
        id_mesero: 1,
        estado: 'pendiente',
        subtotal: 0,
        descuento: 0,
        impuesto: 0,
        total: 0,
        id_reservacion: idReservacion,
        limite_cuentas: personas
      })

      if (error) throw error
    }

    avisarCambioComandas()
  }

  const abrirReservacion = (reserva = null) => {
    if (reserva) {
      setEditando(reserva)
      setReservaData({
        cliente: reserva.cliente,
        fecha: reserva.fecha,
        hora: reserva.hora,
        personas: reserva.personas,
        mesa: reserva.idMesa || reserva.id_mesa || '',
        telefono: reserva.telefono
      })
    } else {
      setReservaData({
        cliente: '',
        fecha: '',
        hora: '',
        personas: '',
        mesa: '',
        telefono: ''
      })
      setEditando(null)
    }
    setMostrarReservacion(true)
  }

  const guardarReservacion = async () => {
    if (!reservaData.cliente || !reservaData.fecha || !reservaData.hora || !reservaData.personas || !reservaData.mesa) {
      alert('Completa todos los campos')
      return
    }

    try {
      if (editando) {
        const mesaAnterior = editando.idMesa || editando.id_mesa

        if (mesaAnterior && String(mesaAnterior) !== String(reservaData.mesa)) {
          const { error: liberarError } = await supabase
            .from('mesas')
            .update({ estado: 'disponible' })
            .eq('id', mesaAnterior)

          if (liberarError) throw liberarError
        }

        const { error: reservaError } = await supabase.from('reservaciones').update({
          cliente: reservaData.cliente.trim(),
          fecha: reservaData.fecha,
          hora: reservaData.hora,
          personas: parseInt(reservaData.personas),
          id_mesa: parseInt(reservaData.mesa),
          telefono: reservaData.telefono
        }).eq('id', editando.id)

        if (reservaError) throw reservaError

        const { error: mesaError } = await supabase
          .from('mesas')
          .update({ estado: 'reservada' })
          .eq('id', parseInt(reservaData.mesa))

        if (mesaError) throw mesaError
        await sincronizarComandaReservacion(editando.id, reservaData)
      } else {
        await guardarReservacionBd(reservaData)
      }

      await refetchReservaciones()
      await refetchMesas()
      setMostrarReservacion(false)
    } catch (error) {
      alert(`No se pudo guardar la reservacion: ${error.message}`)
    }
  }

  const cancelarReservacion = async (reserva) => {
    if (confirm('¿Cancelar esta reservación?')) {
      const { data: comandasReserva } = await supabase
        .from('comandas')
        .select('id')
        .eq('id_reservacion', reserva.id)

      const idsComandas = (comandasReserva || []).map(comanda => comanda.id)
      if (idsComandas.length > 0) {
        await supabase.from('detalles_comanda').delete().in('id_comanda', idsComandas)
        await supabase.from('comandas').delete().in('id', idsComandas)
      }

      await supabase.from('reservaciones').delete().eq('id', reserva.id)
      if (reserva.idMesa || reserva.id_mesa) {
        await supabase
          .from('mesas')
          .update({ estado: 'disponible' })
          .eq('id', reserva.idMesa || reserva.id_mesa)
      }
      await refetchReservaciones()
      await refetchMesas()
      avisarCambioComandas()
    }
  }

  const hoy = fechaClaveLocal()
  const esHistorial = (reserva) => {
    const estado = normalizar(reserva.estado)
    return estado.includes('termin') || estado.includes('final') || estado.includes('cancel')
  }

  const pasaFiltros = (reserva) => {
    const texto = normalizar(`${reserva.cliente} ${reserva.telefono} ${reserva.mesa}`)
    const estado = normalizar(reserva.estado)
    const coincideBusqueda = !busqueda || texto.includes(normalizar(busqueda))
    const coincideEstado =
      filtroEstado === 'todas' ||
      (filtroEstado === 'finalizadas' && (estado.includes('termin') || estado.includes('final'))) ||
      estado.includes(filtroEstado)
    const coincideFecha = filtroFecha === 'todas-fechas' || reserva.fecha === hoy
    return coincideBusqueda && coincideEstado && coincideFecha
  }

  const reservacionesFiltradas = reservaciones.filter(pasaFiltros)
  const reservacionesActivas = reservacionesFiltradas.filter(reserva => !esHistorial(reserva))
  const historialReservaciones = reservacionesFiltradas.filter(esHistorial)
  const finalizadas = reservaciones.filter(reserva => {
    const estado = normalizar(reserva.estado)
    return estado.includes('termin') || estado.includes('final')
  })
  const canceladas = reservaciones.filter(reserva => normalizar(reserva.estado).includes('cancel'))
  const mesActual = hoy.slice(0, 7)
  const canceladasEsteMes = canceladas.filter(reserva => String(reserva.fecha || '').startsWith(mesActual))
  const reservacionesHoy = reservaciones.filter(reserva => reserva.fecha === hoy)

  const renderReserva = (reserva, historial = false) => {
    const estado = estadoVisual(reserva.estado, historial)
    const hora = formatearHora(reserva.hora)
    const mesa = mesasPorId[reserva.idMesa || reserva.id_mesa]
    const ubicacion = mesa?.ubicacion || reserva.ubicacion || 'Interior'

    return (
      <article className={`reserva-row ${estado.tone}`} key={reserva.id}>
        <div className={`reserva-avatar ${estado.tone}`}>
          <UserIcon size={34} />
        </div>

        <div className="reserva-client">
          <div className="reserva-client-name">{reserva.cliente || 'Cliente sin nombre'}</div>
          <span className={`reserva-status ${estado.tone}`}>{estado.label}</span>
        </div>

        <div className="reserva-detail-grid">
          <div className="reserva-info-item">
            <CalendarIcon className="reserva-info-icon" />
            <div>
              <span>Fecha</span>
              <strong>{formatearFecha(reserva.fecha)}</strong>
              <small>{obtenerDia(reserva.fecha)}</small>
            </div>
          </div>

          <div className="reserva-info-item">
            <ClockIcon className="reserva-info-icon" />
            <div>
              <span>Hora</span>
              <strong>{hora.hora}</strong>
              <small>{hora.periodo}</small>
            </div>
          </div>

          <div className="reserva-info-item">
            <UsersIcon className="reserva-info-icon" />
            <div>
              <span>Personas</span>
              <strong>{reserva.personas || 0}</strong>
              <small>Adultos</small>
            </div>
          </div>

          <div className="reserva-info-item">
            <TableIcon className="reserva-info-icon" />
            <div>
              <span>Mesa</span>
              <strong className="reserva-table-number">#{reserva.mesa || '-'}</strong>
              <small>{ubicacion}</small>
            </div>
          </div>

          <div className="reserva-info-item">
            <PhoneIcon className="reserva-info-icon" />
            <div>
              <span>Telefono</span>
              <strong>{reserva.telefono || '-'}</strong>
            </div>
          </div>
        </div>

        <div className="reserva-actions">
          <button className="reserva-btn edit" onClick={() => abrirReservacion(reserva)}>
            <EditIcon size={18} />
            Editar
          </button>
          <button className="reserva-btn cancel" onClick={() => cancelarReservacion(reserva)}>
            <TrashIcon size={18} />
            Cancelar
          </button>
        </div>
      </article>
    )
  }

  return (
    <div className="reservaciones-page">
      <div className="reservaciones-top-actions">
        <button className="nueva-reserva-btn" onClick={() => abrirReservacion()}>
          <span>+</span>
          Nueva Reservación
        </button>
      </div>

      <section className="reservas-kpis">
        <div className="reserva-kpi-card">
          <div className="kpi-icon orange"><CalendarIcon /></div>
          <div>
            <span>Reservaciones hoy</span>
            <strong>{reservacionesHoy.length}</strong>
            <small>{formatearFecha(hoy)}</small>
          </div>
        </div>

        <div className="reserva-kpi-card">
          <div className="kpi-icon orange"><UsersIcon /></div>
          <div>
            <span>Activas</span>
            <strong>{reservaciones.filter(reserva => !esHistorial(reserva)).length}</strong>
            <small>En proceso</small>
          </div>
        </div>

        <div className="reserva-kpi-card">
          <div className="kpi-icon green"><CheckIcon /></div>
          <div>
            <span>Finalizadas</span>
            <strong>{finalizadas.length}</strong>
            <small>Completadas</small>
          </div>
        </div>

        <div className="reserva-kpi-card">
          <div className="kpi-icon red"><XCircleIcon /></div>
          <div>
            <span>Canceladas</span>
            <strong>{canceladasEsteMes.length}</strong>
            <small>Este mes</small>
          </div>
        </div>
      </section>

      <section className="reservas-filters">
        <label className="reserva-search">
          <SearchIcon size={21} />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar cliente, teléfono o mesa..."
          />
        </label>

        <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
          <option value="todas">Todas las reservas</option>
          <option value="activa">Confirmadas</option>
          <option value="pend">Pendientes</option>
          <option value="finalizadas">Finalizadas</option>
          <option value="cancel">Canceladas</option>
        </select>

        <select value={filtroFecha} onChange={(event) => setFiltroFecha(event.target.value)}>
          <option value="hoy">Hoy</option>
          <option value="todas-fechas">Todas las fechas</option>
        </select>
      </section>

      <section className="reservas-section">
        <div className="reservas-section-header">
          <h2>Reservaciones activas</h2>
          <span className="section-badge orange">{reservacionesActivas.length}</span>
        </div>
        <div className="reservas-list">
          {reservacionesActivas.map(reserva => renderReserva(reserva))}
          {reservacionesActivas.length === 0 && (
            <div className="reservas-empty">No hay reservaciones activas con los filtros actuales.</div>
          )}
        </div>
      </section>

      <section className="reservas-section history">
        <div className="reservas-section-header">
          <h2>Historial de reservaciones</h2>
          <span className="section-badge gray">{historialReservaciones.length}</span>
        </div>
        <div className="reservas-list">
          {historialReservaciones.map(reserva => renderReserva(reserva, true))}
          {historialReservaciones.length === 0 && (
            <div className="reservas-empty">No hay reservaciones en el historial con los filtros actuales.</div>
          )}
        </div>
      </section>

      {mostrarReservacion && (
        <div className="reserva-modal-overlay">
          <div className="reserva-modal">
            <div className="reserva-modal-header">
              <h2>{editando ? 'Editar Reservación' : 'Nueva Reservación'}</h2>
              <button onClick={() => setMostrarReservacion(false)} aria-label="Cerrar">×</button>
            </div>

            <div className="reserva-form">
              <label>
                <span>Cliente</span>
                <input
                  type="text"
                  value={reservaData.cliente}
                  onChange={(event) => setReservaData({ ...reservaData, cliente: event.target.value })}
                  placeholder="Nombre del cliente"
                />
              </label>

              <div className="reserva-form-grid">
                <label>
                  <span>Fecha</span>
                  <input
                    type="date"
                    value={reservaData.fecha}
                    onChange={(event) => setReservaData({ ...reservaData, fecha: event.target.value })}
                  />
                </label>
                <label>
                  <span>Hora</span>
                  <input
                    type="time"
                    value={reservaData.hora}
                    onChange={(event) => setReservaData({ ...reservaData, hora: event.target.value })}
                  />
                </label>
              </div>

              <div className="reserva-form-grid">
                <label>
                  <span>Personas</span>
                  <input
                    type="number"
                    value={reservaData.personas}
                    onChange={(event) => setReservaData({ ...reservaData, personas: event.target.value })}
                    min="1"
                  />
                </label>
                <label>
                  <span>Mesa</span>
                  <select
                    value={reservaData.mesa}
                    onChange={(event) => setReservaData({ ...reservaData, mesa: event.target.value })}
                    disabled={mesasDisponibles.length === 0}
                  >
                    <option value="">Selecciona una mesa</option>
                    {mesasDisponibles.map(mesa => (
                      <option key={mesa.id} value={mesa.id}>
                        Mesa {mesa.numero} - {mesa.ubicacion || 'Interior'}
                      </option>
                    ))}
                  </select>
                  {mesasDisponibles.length === 0 && (
                    <small className="reserva-form-warning">No hay mesas disponibles en este momento.</small>
                  )}
                </label>
              </div>

              <label>
                <span>Telefono</span>
                <input
                  type="text"
                  value={reservaData.telefono}
                  onChange={(event) => setReservaData({ ...reservaData, telefono: event.target.value })}
                  placeholder="Numero telefonico"
                />
              </label>

              <div className="reserva-form-actions">
                <button className="secondary" onClick={() => setMostrarReservacion(false)}>
                  Cancelar
                </button>
                <button className="primary" onClick={guardarReservacion}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
