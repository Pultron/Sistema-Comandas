import { useEffect, useMemo, useState } from 'react'
import {
  CajaIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  SearchIcon,
  UserIcon
} from '../Icons'
import { supabase } from '../../supabase'
import '../../styles/Caja.css'

const parseMonto = (value) => Number(String(value ?? '0').replace(/[$,]/g, '')) || 0

const formatMoney = (value) => `$${(Number(value) || 0).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`

const formatHora = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const esHoy = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
}

const normalizar = (value) => String(value || '').trim().toLowerCase()
const mostrarMetodoPago = (value) => {
  const metodo = normalizar(value)
  if (metodo === 'efectivo') return 'Efectivo'
  if (metodo === 'tarjeta') return 'Tarjeta'
  return value || 'Efectivo'
}
const comandaLabel = (id) => `#${String(id || '').padStart(4, '0')}`
const DENOMINACIONES_CAJA = [
  { key: 'b1000', label: 'Billetes de 1000', valor: 1000 },
  { key: 'b500', label: 'Billetes de 500', valor: 500 },
  { key: 'b200', label: 'Billetes de 200', valor: 200 },
  { key: 'b100', label: 'Billetes de 100', valor: 100 },
  { key: 'b50', label: 'Billetes de 50', valor: 50 },
  { key: 'b20', label: 'Billetes de 20', valor: 20 },
  { key: 'monedas', label: 'Monedas', valor: 1 }
]

const conteoInicialCaja = DENOMINACIONES_CAJA.reduce((acc, item) => ({ ...acc, [item.key]: '' }), {})
const CAJA_MOVIMIENTOS_LOCALES_KEY = 'gastrosoft_movimientos_caja_locales'

const movimientoInicial = {
  tipo: 'Ajuste',
  concepto: '',
  monto: '',
  propina: '',
  monto_recibido: '',
  cambio_entregado: '',
  estado: 'completado'
}

const cargarMovimientosLocales = () => {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(CAJA_MOVIMIENTOS_LOCALES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const guardarMovimientosLocales = (movimientosLocales) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(CAJA_MOVIMIENTOS_LOCALES_KEY, JSON.stringify(movimientosLocales))
}

export const CajaModule = ({ currentUser, onModuleChange }) => {
  const [activeTab, setActiveTab] = useState('cierre')
  const [pagos, setPagos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [movimientosLocales, setMovimientosLocales] = useState(cargarMovimientosLocales)
  const [movimientosError, setMovimientosError] = useState('')
  const [busquedaMovimiento, setBusquedaMovimiento] = useState('')
  const [tipoMovimiento, setTipoMovimiento] = useState('Todos')
  const [usuarioMovimiento, setUsuarioMovimiento] = useState('Todos')
  const [movimientoSeleccionadoId, setMovimientoSeleccionadoId] = useState(null)
  const [conteoCaja, setConteoCaja] = useState(conteoInicialCaja)
  const [observacionesCierre, setObservacionesCierre] = useState('')
  const [guardandoCierre, setGuardandoCierre] = useState(false)
  const [modalMovimiento, setModalMovimiento] = useState({ abierto: false, preset: 'Ajuste' })
  const [formMovimiento, setFormMovimiento] = useState(movimientoInicial)
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false)
  const [mensajeCaja, setMensajeCaja] = useState('')
  const [notasCaja, setNotasCaja] = useState([])

  const mostrarMensaje = (mensaje) => {
    setMensajeCaja(mensaje)
    setTimeout(() => setMensajeCaja(''), 3200)
  }

  const registrarMovimientoLocal = (payload) => {
    const movimientoLocal = {
      id: `local-${Date.now()}`,
      ...payload,
      fecha_movimiento: payload.fecha_movimiento || new Date().toISOString(),
      estado: payload.estado || 'completado',
      metodo_pago: payload.metodo_pago || 'efectivo',
      local: true,
      usuario: currentUser?.nombre || 'Usuario',
      observaciones: 'Guardado localmente por permisos de Supabase'
    }
    setMovimientosLocales(prev => {
      const next = [movimientoLocal, ...prev].slice(0, 120)
      guardarMovimientosLocales(next)
      return next
    })
    return movimientoLocal
  }

  const cargarDatosCaja = async () => {
    const { data: pagosData } = await supabase
      .from('pagos')
      .select('id, id_comanda, id_usuario, metodo_pago, monto, subtotal, descuento, impuesto, propina, total_venta, total_cobrado, monto_recibido, cambio_entregado, estado_pago, fecha_pago, usuarios(nombre), comandas(id, usuarios(nombre))')
      .order('fecha_pago', { ascending: false })

    const { data: movimientosData, error: cajaError } = await supabase
      .from('movimientos_caja')
      .select('id, pago_id, comanda_id, usuario_id, tipo, metodo_pago, concepto, monto, propina, monto_recibido, cambio_entregado, estado, fecha_movimiento, usuarios(nombre)')
      .order('fecha_movimiento', { ascending: false })
      .limit(80)

    setPagos(pagosData || [])
    setMovimientos(movimientosData || [])
    setMovimientosError(cajaError?.message || '')
  }

  const abrirMovimiento = (preset = 'Ajuste', concepto = '') => {
    setFormMovimiento({
      ...movimientoInicial,
      tipo: preset,
      concepto,
      monto: '',
      propina: '',
      monto_recibido: '',
      cambio_entregado: ''
    })
    setModalMovimiento({ abierto: true, preset })
  }

  const cerrarModalMovimiento = () => {
    if (guardandoMovimiento) return
    setModalMovimiento({ abierto: false, preset: 'Ajuste' })
  }

  const guardarMovimientoManual = async (event) => {
    event.preventDefault()
    if (guardandoMovimiento) return

    const montoBase = parseMonto(formMovimiento.monto)
    if (!formMovimiento.concepto.trim()) {
      mostrarMensaje('Escribe un concepto para el movimiento.')
      return
    }
    if (montoBase <= 0) {
      mostrarMensaje('Captura un monto mayor a cero.')
      return
    }

    const tipoNormalizado = normalizar(formMovimiento.tipo)
    const esSalida = ['retiro', 'gasto'].includes(tipoNormalizado)
    const monto = esSalida ? -Math.abs(montoBase) : montoBase
    const recibido = parseMonto(formMovimiento.monto_recibido) || Math.abs(monto)
    const payloadMovimiento = {
      usuario_id: currentUser?.id || null,
      tipo: formMovimiento.tipo.toLowerCase(),
      metodo_pago: 'efectivo',
      concepto: formMovimiento.concepto.trim(),
      monto,
      propina: parseMonto(formMovimiento.propina),
      monto_recibido: recibido,
      cambio_entregado: parseMonto(formMovimiento.cambio_entregado),
      estado: formMovimiento.estado || 'completado',
      fecha_movimiento: new Date().toISOString()
    }

    setGuardandoMovimiento(true)
    try {
      const { error } = await supabase.from('movimientos_caja').insert(payloadMovimiento)
      if (error) {
        console.warn('Movimiento guardado localmente por permisos:', error.message)
        registrarMovimientoLocal(payloadMovimiento)
        mostrarMensaje('Movimiento guardado localmente. Aparecerá en Caja aunque Supabase no permita escribir movimientos.')
      } else {
        mostrarMensaje('Movimiento guardado correctamente.')
      }

      await cargarDatosCaja()
      window.dispatchEvent(new Event('caja:changed'))
      cerrarModalMovimiento()
      setActiveTab('movimientos')
    } catch (error) {
      registrarMovimientoLocal(payloadMovimiento)
      cerrarModalMovimiento()
      setActiveTab('movimientos')
      mostrarMensaje(`Movimiento guardado localmente. Supabase respondio: ${error.message}`)
    } finally {
      setGuardandoMovimiento(false)
    }
  }

  const agregarNota = () => {
    const texto = window.prompt('Nota para caja:')
    if (!texto?.trim()) return
    setNotasCaja(prev => [{
      id: Date.now(),
      texto: texto.trim(),
      usuario: currentUser?.nombre || 'Usuario',
      fecha: new Date().toISOString()
    }, ...prev])
    mostrarMensaje('Nota agregada al turno.')
  }

  const enviarPropinasNomina = (montoPropina) => {
    const monto = parseMonto(montoPropina)
    if (monto <= 0) {
      mostrarMensaje('No hay propinas pendientes para enviar a nomina.')
      return
    }
    setFormMovimiento({
      ...movimientoInicial,
      tipo: 'Retiro',
      concepto: 'Envio de propinas a nomina',
      monto: String(monto.toFixed(2)),
      propina: String(monto.toFixed(2)),
      monto_recibido: String(monto.toFixed(2)),
      cambio_entregado: '0'
    })
    setModalMovimiento({ abierto: true, preset: 'Retiro' })
  }

  useEffect(() => {
    cargarDatosCaja()
    window.addEventListener('caja:changed', cargarDatosCaja)
    return () => window.removeEventListener('caja:changed', cargarDatosCaja)
  }, [])

  const pagosHoy = useMemo(() => pagos.filter(pago => esHoy(pago.fecha_pago)), [pagos])
  const movimientosHoy = useMemo(
    () => [...movimientos, ...movimientosLocales].filter(mov => esHoy(mov.fecha_movimiento)),
    [movimientos, movimientosLocales]
  )

  const movimientosDesdePagos = useMemo(() => pagosHoy.map(pago => ({
    id: `pago-${pago.id}`,
    pago_id: pago.id,
    comanda_id: pago.id_comanda,
    tipo: 'Pago',
    concepto: `Pago de comanda ${comandaLabel(pago.id_comanda)}`,
    metodo_pago: pago.metodo_pago || 'efectivo',
    monto: parseMonto(pago.total_venta ?? pago.monto),
    propina: parseMonto(pago.propina),
    monto_recibido: parseMonto(pago.monto_recibido ?? pago.total_cobrado ?? pago.monto),
    cambio_entregado: parseMonto(pago.cambio_entregado),
    estado: pago.estado_pago || 'completado',
    fecha_movimiento: pago.fecha_pago,
    usuario: pago.usuarios?.nombre || pago.comandas?.usuarios?.nombre || currentUser?.nombre || 'Usuario',
    observaciones: 'Pago conectado desde módulo Pagos'
  })), [currentUser?.nombre, pagosHoy])

  const movimientosCombinados = useMemo(() => {
    const movimientosReales = movimientosHoy.map(mov => ({
      ...mov,
      id: `mov-${mov.id}`,
      metodo_pago: mov.metodo_pago || 'efectivo',
      usuario: mov.usuarios?.nombre || mov.usuario || currentUser?.nombre || 'Usuario',
      observaciones: ''
    }))
    const pagosRegistradosEnCaja = new Set(movimientosHoy.map(mov => String(mov.pago_id || '')).filter(Boolean))
    const pagosSinMovimiento = movimientosDesdePagos.filter(mov => !pagosRegistradosEnCaja.has(String(mov.pago_id)))
    return [...movimientosReales, ...pagosSinMovimiento]
      .sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento))
  }, [currentUser?.nombre, movimientosDesdePagos, movimientosHoy])

  const pagosCompletados = useMemo(
    () => pagosHoy.filter(pago => normalizar(pago.estado_pago || 'completado') === 'completado'),
    [pagosHoy]
  )

  const resumen = useMemo(() => {
    const pagosEfectivo = pagosCompletados.filter(pago => normalizar(pago.metodo_pago || 'efectivo') === 'efectivo')
    const totalVentas = pagosCompletados.reduce((sum, pago) => sum + parseMonto(pago.total_venta ?? pago.monto), 0)
    const efectivo = pagosEfectivo.reduce((sum, pago) => sum + parseMonto(pago.total_cobrado ?? pago.monto), 0)
    const propinas = pagosCompletados.reduce((sum, pago) => sum + parseMonto(pago.propina), 0)
    const fondoInicial = movimientosHoy
      .filter(mov => normalizar(mov.tipo).includes('apertura'))
      .reduce((sum, mov) => sum + parseMonto(mov.monto), 0)
    const retirosGastos = movimientosHoy
      .filter(mov => ['retiro', 'gasto'].some(tipo => normalizar(mov.tipo).includes(tipo)))
      .reduce((sum, mov) => sum + Math.abs(parseMonto(mov.monto)), 0)
    const ajustes = movimientosHoy
      .filter(mov => normalizar(mov.tipo).includes('ajuste'))
      .reduce((sum, mov) => sum + parseMonto(mov.monto), 0)
    const conteo = movimientosHoy.find(mov => ['conteo', 'cierre', 'corte'].some(tipo => normalizar(mov.tipo).includes(tipo)))
    const ventasEfectivo = pagosEfectivo.reduce((sum, pago) => sum + parseMonto(pago.total_venta ?? pago.monto), 0)
    const propinasEfectivo = pagosEfectivo.reduce((sum, pago) => sum + parseMonto(pago.propina), 0)
    const efectivoEsperado = fondoInicial + ventasEfectivo + propinasEfectivo - retirosGastos + ajustes
    const efectivoContado = conteo ? parseMonto(conteo.monto) : efectivoEsperado
    const diferencia = efectivoContado - efectivoEsperado
    const nomina = movimientosHoy
      .filter(mov => normalizar(mov.tipo).includes('nomina') || normalizar(mov.concepto).includes('nomina'))
      .reduce((sum, mov) => sum + parseMonto(mov.monto), 0)

    return {
      totalVentas,
      efectivo,
      propinas,
      diferencia,
      fondoInicial,
      ventasEfectivo,
      propinasEfectivo,
      retirosGastos,
      ajustes,
      efectivoEsperado,
      efectivoContado,
      cambioDisponible: efectivoEsperado,
      ultimoMovimiento: movimientosCombinados[0],
      propinaPendienteNomina: Math.max(propinas - nomina, 0)
    }
  }, [movimientosCombinados, movimientosHoy, pagosCompletados])

  const conteoFinal = useMemo(() => DENOMINACIONES_CAJA.reduce((sum, item) => {
    const cantidad = Math.max(Number(conteoCaja[item.key]) || 0, 0)
    return sum + (cantidad * item.valor)
  }, 0), [conteoCaja])

  const conteoCapturado = useMemo(
    () => Object.values(conteoCaja).some(value => String(value).trim() !== ''),
    [conteoCaja]
  )

  const cierreResumen = useMemo(() => {
    const efectivoContado = conteoCapturado ? conteoFinal : 0
    return {
      ...resumen,
      efectivoContado,
      diferencia: efectivoContado - resumen.efectivoEsperado,
      conteoCapturado
    }
  }, [conteoCapturado, conteoFinal, resumen])

  const movimientosFiltrados = useMemo(() => {
    const texto = normalizar(busquedaMovimiento)
    return movimientosCombinados.filter(mov => {
      const coincideTexto = !texto || [
        mov.concepto,
        mov.comanda_id,
        mov.tipo,
        mov.usuario
      ].some(value => normalizar(value).includes(texto))
      const coincideTipo = tipoMovimiento === 'Todos' || normalizar(mov.tipo) === normalizar(tipoMovimiento)
      const coincideUsuario = usuarioMovimiento === 'Todos' || mov.usuario === usuarioMovimiento
      return coincideTexto && coincideTipo && coincideUsuario
    })
  }, [busquedaMovimiento, movimientosCombinados, tipoMovimiento, usuarioMovimiento])

  const movimientoSeleccionado = movimientosFiltrados.find(mov => mov.id === movimientoSeleccionadoId) || movimientosFiltrados[0]
  const usuariosMovimiento = [...new Set(movimientosCombinados.map(mov => mov.usuario).filter(Boolean))].sort()

  const resumenMovimientos = useMemo(() => {
    const entradas = movimientosCombinados
      .filter(mov => !['apertura', 'retiro', 'gasto'].includes(normalizar(mov.tipo)) && parseMonto(mov.monto) >= 0)
      .reduce((sum, mov) => sum + parseMonto(mov.monto), 0)
    const salidas = movimientosCombinados
      .filter(mov => ['retiro', 'gasto'].includes(normalizar(mov.tipo)) || parseMonto(mov.monto) < 0)
      .reduce((sum, mov) => sum + Math.abs(parseMonto(mov.monto)), 0)
    const propinas = movimientosCombinados.reduce((sum, mov) => sum + parseMonto(mov.propina), 0)
    return { entradas, salidas, propinas, saldo: entradas - salidas + resumen.fondoInicial }
  }, [movimientosCombinados, resumen.fondoInicial])

  const conteosTipo = useMemo(() => {
    const tipos = { Apertura: 0, Pago: 0, Propina: 0, Retiro: 0, Gasto: 0, Ajuste: 0 }
    movimientosFiltrados.forEach(mov => {
      const tipo = Object.keys(tipos).find(item => normalizar(mov.tipo).includes(normalizar(item)))
      if (tipo) tipos[tipo] += 1
    })
    return tipos
  }, [movimientosFiltrados])

  return (
    <section className="cash-page">
      <nav className="cash-tabs" aria-label="Secciones de Caja">
        {[
          ['resumen', 'Resumen'],
          ['movimientos', 'Movimientos'],
          ['cierre', 'Cierre']
        ].map(([id, label]) => (
          <button className={activeTab === id ? 'active' : ''} key={id} onClick={() => setActiveTab(id)} type="button">
            {label}
          </button>
        ))}
      </nav>

      <div className="cash-content">
        {activeTab === 'cierre' ? (
          <CierreCajaView
            currentUser={currentUser}
            resumen={cierreResumen}
            movimientos={movimientosCombinados}
            movimientosError={movimientosError}
            conteoCaja={conteoCaja}
            setConteoCaja={setConteoCaja}
            observaciones={observacionesCierre}
            setObservaciones={setObservacionesCierre}
            guardando={guardandoCierre}
            setGuardando={setGuardandoCierre}
            irAMovimientos={() => setActiveTab('movimientos')}
            abrirMovimiento={abrirMovimiento}
            onRefresh={cargarDatosCaja}
            registrarMovimientoLocal={registrarMovimientoLocal}
          />
        ) : activeTab === 'movimientos' ? (
          <MovimientosCajaView
            currentUser={currentUser}
            movimientos={movimientosFiltrados}
            movimientoSeleccionado={movimientoSeleccionado}
            setMovimientoSeleccionadoId={setMovimientoSeleccionadoId}
            busqueda={busquedaMovimiento}
            setBusqueda={setBusquedaMovimiento}
            tipo={tipoMovimiento}
            setTipo={setTipoMovimiento}
            usuario={usuarioMovimiento}
            setUsuario={setUsuarioMovimiento}
            usuarios={usuariosMovimiento}
            conteosTipo={conteosTipo}
            resumenMovimientos={resumenMovimientos}
            movimientosError={movimientosError}
            abrirMovimiento={abrirMovimiento}
            agregarNota={agregarNota}
            notasCaja={notasCaja}
            limpiarFiltros={() => {
              setBusquedaMovimiento('')
              setTipoMovimiento('Todos')
              setUsuarioMovimiento('Todos')
            }}
          />
        ) : (
          <ResumenCajaView
            currentUser={currentUser}
            resumen={resumen}
            pagosHoy={pagosHoy}
            movimientosHoy={movimientosCombinados}
            movimientosError={movimientosError}
            irAMovimientos={() => setActiveTab('movimientos')}
            irACierre={() => setActiveTab('cierre')}
            irAPagos={() => onModuleChange?.('pagos')}
            abrirMovimiento={abrirMovimiento}
            enviarPropinasNomina={enviarPropinasNomina}
          />
        )}
      </div>

      {modalMovimiento.abierto && (
        <MovimientoCajaModal
          form={formMovimiento}
          setForm={setFormMovimiento}
          guardando={guardandoMovimiento}
          onClose={cerrarModalMovimiento}
          onSubmit={guardarMovimientoManual}
        />
      )}

      {mensajeCaja && <div className="cash-toast">{mensajeCaja}</div>}
    </section>
  )
}

const ResumenCajaView = ({
  currentUser,
  resumen,
  pagosHoy,
  movimientosHoy,
  movimientosError,
  irAMovimientos,
  irACierre,
  irAPagos,
  abrirMovimiento,
  enviarPropinasNomina
}) => {
  const statCards = [
    { label: 'Total ventas', value: resumen.totalVentas, tone: 'orange', icon: DollarSignIcon },
    { label: 'Efectivo', value: resumen.efectivo, tone: 'green', icon: CajaIcon },
    { label: 'Propinas', value: resumen.propinas, tone: 'purple', icon: CheckCircleIcon },
    { label: 'Diferencia', value: resumen.diferencia, tone: resumen.diferencia < 0 ? 'red' : 'green', icon: DollarSignIcon }
  ]

  return (
    <>
      <header className="cash-hero">
        <div className="cash-title">
          <div className="cash-title-icon"><CajaIcon size={26} /></div>
          <div>
            <h1>Caja / Resumen del turno</h1>
            <p>Vista general del dinero del día, propinas y movimientos recientes.</p>
          </div>
        </div>
        <div className="cash-actions">
          <button onClick={() => abrirMovimiento('Ajuste')} type="button">+ Movimiento</button>
          <button onClick={() => abrirMovimiento('Gasto', 'Gasto de operacion')} type="button">Registrar gasto</button>
          <button onClick={irACierre} type="button">Corte parcial</button>
          <button className="danger" onClick={irACierre} type="button">Cerrar turno</button>
        </div>
      </header>

      <section className="cash-stats">
        {statCards.map(({ label, value, tone, icon: Icon }) => (
          <article className="cash-stat" key={label}>
            <div className={`cash-stat-icon ${tone}`}><Icon size={30} /></div>
            <div>
              <span>{label}</span>
              <strong className={tone}>{formatMoney(value)}</strong>
              <small>Hoy</small>
            </div>
          </article>
        ))}
      </section>

      <section className="cash-grid">
        <article className="cash-panel cash-shift-panel">
          <PanelHeader title="Resumen del turno" />
          <AmountRow label="Fondo inicial" value={resumen.fondoInicial} />
          <AmountRow label="Ventas en efectivo" value={resumen.ventasEfectivo} />
          <AmountRow label="Propinas en efectivo" value={resumen.propinasEfectivo} />
          <AmountRow label="Retiros / Gastos" value={-resumen.retirosGastos} tone="red" />
          <div className="cash-divider" />
          <AmountRow label="Efectivo esperado" value={resumen.efectivoEsperado} strong />
          <AmountRow label="Efectivo contado" value={resumen.efectivoContado} tone="green" strong />
          <AmountRow label="Diferencia" value={resumen.diferencia} tone={resumen.diferencia < 0 ? 'red' : 'green'} highlight />
        </article>

        <article className="cash-panel">
          <PanelHeader title="Estado de caja" />
          <StatusRow icon={<CheckCircleIcon size={17} />} label="Caja abierta" value="Abierta" success />
          <StatusRow icon={<UserIcon size={17} />} label="Usuario en turno" value={currentUser?.nombre || 'Usuario'} />
          <StatusRow icon={<ClockIcon size={17} />} label="Último movimiento" value={resumen.ultimoMovimiento ? formatHora(resumen.ultimoMovimiento.fecha_movimiento) : '-'} />
          <StatusRow icon={<DollarSignIcon size={17} />} label="Cambio disponible" value={formatMoney(resumen.cambioDisponible)} money />
        </article>

        <article className="cash-panel">
          <PanelHeader title="Métodos de pago hoy" />
          <div className="cash-method-card">
            <div className="cash-method-icon"><CajaIcon size={28} /></div>
            <span>Efectivo</span>
            <strong>{formatMoney(resumen.efectivo)}</strong>
            <small>{resumen.totalVentas > 0 ? `${Math.round((resumen.ventasEfectivo / resumen.totalVentas) * 100)}% del total` : '0% del total'}</small>
          </div>
        </article>

        <article className="cash-panel">
          <PanelHeader title="Propinas del turno" purple />
          <AmountRow label="En efectivo" value={resumen.propinasEfectivo} />
          <div className="cash-divider" />
          <AmountRow label="Pendiente de envío a nómina" value={resumen.propinaPendienteNomina} />
          <button className="cash-outline-button" onClick={() => enviarPropinasNomina(resumen.propinaPendienteNomina)} type="button">Agregar a nómina</button>
        </article>

        <article className="cash-panel cash-wide">
          <PanelHeader title="Movimientos recientes" />
          <SimpleMovimientosTable movimientos={movimientosHoy} movimientosError={movimientosError} />
          <button className="cash-link" onClick={irAMovimientos} type="button">Ver todos los movimientos →</button>
        </article>

        <article className="cash-panel cash-wide">
          <PanelHeader title="Últimos pagos conectados desde Pagos" />
          <p className="cash-panel-subtitle">Estos pagos se registran automáticamente en Caja.</p>
          <table className="cash-table">
            <thead>
              <tr><th>Comanda</th><th>Método</th><th>Total</th><th>Propina</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              {pagosHoy.length === 0 ? (
                <tr><td colSpan="5" className="cash-empty">Sin pagos registrados</td></tr>
              ) : pagosHoy.slice(0, 5).map(pago => (
                <tr key={pago.id}>
                  <td>{comandaLabel(pago.id_comanda)}</td>
                  <td>{mostrarMetodoPago(pago.metodo_pago)}</td>
                  <td>{formatMoney(pago.total_cobrado ?? pago.monto)}</td>
                  <td>{formatMoney(pago.propina)}</td>
                  <td>{pago.usuarios?.nombre || pago.comandas?.usuarios?.nombre || 'Usuario'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="cash-link" onClick={irAPagos} type="button">Ver todos los pagos en módulo Pagos →</button>
        </article>
      </section>

      <div className="cash-info">
        <span>i</span>
        Los datos de esta vista se actualizan automáticamente con la información del módulo Pagos.
      </div>
    </>
  )
}

const MovimientosCajaView = ({
  currentUser,
  movimientos,
  movimientoSeleccionado,
  setMovimientoSeleccionadoId,
  busqueda,
  setBusqueda,
  tipo,
  setTipo,
  usuario,
  setUsuario,
  usuarios,
  conteosTipo,
  resumenMovimientos,
  limpiarFiltros,
  movimientosError,
  abrirMovimiento,
  agregarNota,
  notasCaja
}) => {
  const statCards = [
    { label: 'Entradas', value: resumenMovimientos.entradas, tone: 'green', icon: CheckCircleIcon },
    { label: 'Salidas', value: -resumenMovimientos.salidas, tone: 'red', icon: DollarSignIcon },
    { label: 'Propinas registradas', value: resumenMovimientos.propinas, tone: 'purple', icon: CheckCircleIcon },
    { label: 'Saldo actual en caja', value: resumenMovimientos.saldo, tone: 'green', icon: CajaIcon }
  ]

  const exportarMovimientos = () => {
    if (movimientos.length === 0) {
      alert('No hay movimientos para exportar')
      return
    }
    const headers = ['Hora', 'Tipo', 'Concepto', 'Método', 'Venta', 'Propina', 'Recibido', 'Cambio', 'Usuario', 'Estado']
    const rows = movimientos.map(mov => [
      formatHora(mov.fecha_movimiento),
      mov.tipo || 'Movimiento',
      mov.concepto || 'Movimiento de caja',
      mostrarMetodoPago(mov.metodo_pago),
      parseMonto(mov.monto).toFixed(2),
      parseMonto(mov.propina).toFixed(2),
      parseMonto(mov.monto_recibido).toFixed(2),
      parseMonto(mov.cambio_entregado).toFixed(2),
      mov.usuario || currentUser?.nombre || 'Usuario',
      mov.estado || 'Completado'
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `movimientos-caja-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <header className="cash-hero">
        <div className="cash-title">
          <div className="cash-title-icon"><CajaIcon size={26} /></div>
          <div>
            <h1>Caja / Movimientos</h1>
            <p>Registro y control de entradas, salidas y movimientos del efectivo del turno.</p>
          </div>
        </div>
        <div className="cash-actions">
          <button onClick={() => abrirMovimiento('Ajuste')} type="button">+ Nuevo movimiento</button>
          <button onClick={() => abrirMovimiento('Retiro', 'Retiro de efectivo')} type="button">Registrar retiro</button>
          <button onClick={() => abrirMovimiento('Gasto', 'Gasto de operacion')} type="button">Registrar gasto</button>
          <button className="danger" onClick={exportarMovimientos} type="button">Exportar</button>
        </div>
      </header>

      <section className="cash-stats">
        {statCards.map(({ label, value, tone, icon: Icon }) => (
          <article className="cash-stat" key={label}>
            <div className={`cash-stat-icon ${tone}`}><Icon size={30} /></div>
            <div>
              <span>{label}</span>
              <strong className={tone}>{formatMoney(value)}</strong>
              <small>Hoy</small>
            </div>
          </article>
        ))}
      </section>

      <section className="cash-movements-layout">
        <article className="cash-panel cash-movement-history">
          <PanelHeader title="Historial de movimientos" />
          <div className="cash-filters">
            <label className="cash-search">
              <SearchIcon size={16} />
              <input value={busqueda} onChange={event => setBusqueda(event.target.value)} placeholder="Buscar concepto o comanda..." />
            </label>
            <select value={tipo} onChange={event => setTipo(event.target.value)}>
              <option>Todos</option>
              <option>Apertura</option>
              <option>Pago</option>
              <option>Propina</option>
              <option>Retiro</option>
              <option>Gasto</option>
              <option>Ajuste</option>
            </select>
            <select defaultValue="Hoy" aria-label="Rango de fechas">
              <option>Hoy</option>
            </select>
            <select value={usuario} onChange={event => setUsuario(event.target.value)}>
              <option>Todos</option>
              {usuarios.map(item => <option key={item}>{item}</option>)}
            </select>
            <button onClick={limpiarFiltros} type="button">Limpiar filtros</button>
          </div>
          <table className="cash-table cash-table-wide">
            <thead>
              <tr>
                <th>Hora</th><th>Tipo</th><th>Concepto</th><th>Método</th><th>Venta</th><th>Propina</th><th>Recibido</th><th>Cambio</th><th>Usuario</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 ? (
                <tr><td colSpan="10" className="cash-empty">{movimientosError ? 'Sin movimientos disponibles' : 'Sin movimientos'}</td></tr>
              ) : movimientos.map(mov => (
                <tr className={movimientoSeleccionado?.id === mov.id ? 'selected-row' : ''} key={mov.id} onClick={() => setMovimientoSeleccionadoId(mov.id)}>
                  <td>{formatHora(mov.fecha_movimiento)}</td>
                  <td><span className={`cash-type ${normalizar(mov.tipo)}`}>{mov.tipo || 'Movimiento'}</span></td>
                  <td>{mov.concepto || 'Movimiento de caja'}</td>
                  <td>{mostrarMetodoPago(mov.metodo_pago)}</td>
                  <td className="green">{formatMoney(mov.monto)}</td>
                  <td className="purple">{formatMoney(mov.propina)}</td>
                  <td className="green">{formatMoney(mov.monto_recibido)}</td>
                  <td className={parseMonto(mov.cambio_entregado) < 0 ? 'red' : 'green'}>{formatMoney(mov.cambio_entregado)}</td>
                  <td>{mov.usuario || currentUser?.nombre || 'Usuario'}</td>
                  <td><span className="success-pill">{mov.estado || 'Completado'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="cash-panel-footer">
            <span>Mostrando {movimientos.length === 0 ? 0 : 1} a {movimientos.length} de {movimientos.length} movimientos</span>
            <div className="cash-pagination"><button disabled type="button">‹‹</button><button disabled type="button">‹</button><strong>1</strong><button disabled type="button">›</button><button disabled type="button">››</button></div>
            <button className="cash-link" onClick={limpiarFiltros} type="button">Ver todos los movimientos →</button>
          </footer>
        </article>

        <aside className="cash-side">
          <article className="cash-panel">
            <PanelHeader title="Resumen del movimiento seleccionado" />
            {movimientoSeleccionado ? (
              <div className="movement-detail">
                <span className="success-pill">Completado</span>
                <DetailRow label="Tipo" value={movimientoSeleccionado.tipo || 'Movimiento'} />
                <DetailRow label="Concepto" value={movimientoSeleccionado.concepto || 'Movimiento de caja'} />
                <DetailRow label="Hora" value={formatHora(movimientoSeleccionado.fecha_movimiento)} />
                <DetailRow label="Usuario" value={movimientoSeleccionado.usuario || currentUser?.nombre || 'Usuario'} />
                <DetailRow label="Venta" value={formatMoney(movimientoSeleccionado.monto)} tone="green" />
                <DetailRow label="Propina" value={formatMoney(movimientoSeleccionado.propina)} tone="purple" />
                <DetailRow label="Recibido" value={formatMoney(movimientoSeleccionado.monto_recibido)} tone="green" />
                <DetailRow label="Cambio entregado" value={formatMoney(movimientoSeleccionado.cambio_entregado)} tone={parseMonto(movimientoSeleccionado.cambio_entregado) < 0 ? 'red' : 'green'} />
                <DetailRow label="Observaciones" value={movimientoSeleccionado.observaciones || '-'} />
              </div>
            ) : <div className="cash-empty">Sin movimiento seleccionado</div>}
          </article>

          <article className="cash-panel">
            <PanelHeader title="Tipos de movimientos" />
            <div className="movement-type-grid">
              {Object.entries(conteosTipo).map(([label, count]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="cash-panel">
            <div className="cash-panel-header">
              <h2>Notas de caja</h2>
              <button className="cash-small-button" onClick={agregarNota} type="button">+ Agregar nota</button>
            </div>
            {notasCaja.length === 0 ? (
              <div className="cash-note-empty">Sin notas registradas</div>
            ) : (
              <div className="cash-notes-list">
                {notasCaja.map(nota => (
                  <div className="cash-note-item" key={nota.id}>
                    <strong>{nota.texto}</strong>
                    <span>{nota.usuario} - {formatHora(nota.fecha)}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </aside>
      </section>

      <div className="cash-info">
        <span>i</span>
        Los movimientos de esta vista se alimentan automáticamente desde Pagos y también incluyen registros manuales de Caja.
      </div>
    </>
  )
}

const CierreCajaView = ({
  currentUser,
  resumen,
  movimientos,
  movimientosError,
  conteoCaja,
  setConteoCaja,
  observaciones,
  setObservaciones,
  guardando,
  setGuardando,
  irAMovimientos,
  abrirMovimiento,
  onRefresh,
  registrarMovimientoLocal
}) => {
  const diferencia = resumen.diferencia
  const cierreCorrecto = resumen.conteoCapturado && Math.abs(diferencia) < 0.01
  const requiereRevision = resumen.conteoCapturado && !cierreCorrecto
  const movimientoApertura = movimientos.find(mov => normalizar(mov.tipo).includes('apertura'))
  const movimientosCierre = movimientos.filter(mov => ['apertura', 'pago', 'propina', 'retiro', 'gasto', 'ajuste'].some(tipo => normalizar(mov.tipo).includes(tipo)))
  const statCards = [
    { label: 'Efectivo esperado', value: resumen.efectivoEsperado, tone: 'green', icon: CajaIcon },
    { label: 'Efectivo contado', value: resumen.efectivoContado, tone: resumen.conteoCapturado ? 'green' : 'orange', icon: CajaIcon },
    { label: 'Diferencia', value: diferencia, tone: diferencia < 0 ? 'red' : 'green', icon: DollarSignIcon },
    { label: 'Propina del turno', value: resumen.propinasEfectivo, tone: 'purple', icon: CheckCircleIcon }
  ]

  const actualizarDenominacion = (key, value) => {
    const soloNumeros = String(value).replace(/[^\d]/g, '')
    setConteoCaja(prev => ({ ...prev, [key]: soloNumeros }))
  }

  const guardarCierre = async (cerrarTurno = false) => {
    if (!resumen.conteoCapturado) {
      alert('Primero captura el conteo final de caja.')
      return
    }
    if (guardando) return

    setGuardando(true)
    try {
      const cortePayload = {
        id_usuario: currentUser?.id || 1,
        turno: 'Actual',
        fecha: new Date().toISOString(),
        total_ventas: resumen.totalVentas,
        pagos_efectivo: resumen.ventasEfectivo + resumen.propinasEfectivo,
        pagos_tarjeta: 0,
        cancelaciones: 0,
        descuentos: resumen.retirosGastos
      }
      const { error: corteError } = await supabase.from('cortes_caja').insert(cortePayload)
      if (corteError) {
        console.warn('Corte no guardado en cortes_caja por permisos:', corteError.message)
      }

      const movimientoCierrePayload = {
        usuario_id: currentUser?.id || 1,
        tipo: cerrarTurno ? 'cierre' : 'corte',
        metodo_pago: 'efectivo',
        concepto: cerrarTurno ? 'Cierre de turno' : 'Corte parcial de caja',
        monto: resumen.efectivoContado,
        propina: resumen.propinasEfectivo,
        monto_recibido: resumen.efectivoContado,
        cambio_entregado: diferencia,
        estado: cerrarTurno ? 'cerrado' : 'completado',
        fecha_movimiento: new Date().toISOString()
      }
      const { error: movimientoError } = await supabase.from('movimientos_caja').insert(movimientoCierrePayload)
      if (movimientoError) {
        console.warn('Cierre guardado localmente por permisos:', movimientoError.message)
        registrarMovimientoLocal?.(movimientoCierrePayload)
      }

      window.dispatchEvent(new Event('caja:changed'))
      await onRefresh?.()
      const respaldo = corteError || movimientoError ? ' con respaldo local por permisos de Supabase.' : ' correctamente.'
      alert(cerrarTurno ? `Cierre de turno guardado${respaldo}` : `Corte parcial guardado${respaldo}`)
    } catch (error) {
      alert(`No se pudo guardar el cierre: ${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <header className="cash-hero">
        <div className="cash-title">
          <div className="cash-title-icon"><CajaIcon size={26} /></div>
          <div>
            <h1>Caja / Cierre de turno</h1>
            <p>Conteo final, diferencia de caja y cierre del turno actual.</p>
          </div>
        </div>
        <div className="cash-actions">
          <button onClick={() => guardarCierre(false)} type="button" disabled={guardando}>Guardar cierre</button>
          <button onClick={() => window.print()} type="button">Imprimir corte</button>
          <button onClick={() => abrirMovimiento('Retiro', 'Retiro previo a cierre')} type="button">Registrar retiro</button>
          <button className="danger" onClick={() => guardarCierre(true)} type="button" disabled={guardando}>Cerrar turno</button>
        </div>
      </header>

      <section className="cash-stats">
        {statCards.map(({ label, value, tone, icon: Icon }) => (
          <article className="cash-stat" key={label}>
            <div className={`cash-stat-icon ${tone}`}><Icon size={30} /></div>
            <div>
              <span>{label}</span>
              <strong className={tone}>{formatMoney(value)}</strong>
              <small>Hoy</small>
            </div>
          </article>
        ))}
      </section>

      <section className="cash-close-grid">
        <article className="cash-panel">
          <PanelHeader title="Resumen del cierre" />
          <AmountRow label="Fondo inicial" value={resumen.fondoInicial} />
          <AmountRow label="Ventas en efectivo" value={resumen.ventasEfectivo} tone="green" />
          <AmountRow label="Propinas en efectivo" value={resumen.propinasEfectivo} tone="purple" />
          <AmountRow label="Retiros / Gastos" value={-resumen.retirosGastos} tone="red" />
          <AmountRow label="Ajustes" value={resumen.ajustes} tone={resumen.ajustes < 0 ? 'red' : 'green'} />
          <div className="cash-divider" />
          <AmountRow label="Efectivo esperado" value={resumen.efectivoEsperado} strong />
        </article>

        <article className="cash-panel cash-count-panel">
          <div className="cash-panel-header">
            <h2>Conteo final de caja</h2>
            <span className={resumen.conteoCapturado ? 'success-pill' : 'warning-pill'}>
              {resumen.conteoCapturado ? 'Conteo completado' : 'Pendiente de conteo'}
            </span>
          </div>
          <table className="cash-table cash-count-table">
            <thead>
              <tr><th>Denominación</th><th>Cantidad</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {DENOMINACIONES_CAJA.map(item => {
                const cantidad = Number(conteoCaja[item.key]) || 0
                return (
                  <tr key={item.key}>
                    <td>{item.label}</td>
                    <td>
                      <input
                        value={conteoCaja[item.key]}
                        onChange={event => actualizarDenominacion(item.key, event.target.value)}
                        inputMode="numeric"
                        placeholder="0"
                      />
                    </td>
                    <td>{formatMoney(cantidad * item.valor)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="cash-count-total">
            <AmountRow label="Total contado" value={resumen.efectivoContado} tone={resumen.conteoCapturado ? 'green' : ''} strong />
            <AmountRow label="Diferencia vs esperado" value={diferencia} tone={diferencia < 0 ? 'red' : 'green'} strong />
          </div>
        </article>

        <article className="cash-panel">
          <PanelHeader title="Estado del cierre" />
          <StatusRow icon={<CajaIcon size={17} />} label="Caja" value="Abierta" success />
          <StatusRow icon={<UserIcon size={17} />} label="Usuario en turno" value={currentUser?.nombre || 'Usuario'} />
          <StatusRow icon={<ClockIcon size={17} />} label="Hora de apertura" value={movimientoApertura ? formatHora(movimientoApertura.fecha_movimiento) : '-'} />
          <StatusRow icon={<ClockIcon size={17} />} label="Hora de cierre estimada" value={formatHora(new Date())} />
          <StatusRow icon={<ClockIcon size={17} />} label="Último movimiento" value={resumen.ultimoMovimiento ? formatHora(resumen.ultimoMovimiento.fecha_movimiento) : '-'} />
          <label className="cash-observations">
            <span>Observaciones</span>
            <textarea value={observaciones} onChange={event => setObservaciones(event.target.value)} placeholder="Sin observaciones" />
          </label>
          <div className={`cash-close-state ${cierreCorrecto ? 'ok' : requiereRevision ? 'review' : 'pending'}`}>
            {cierreCorrecto ? 'Listo para cerrar' : requiereRevision ? 'Revisar diferencia antes de cerrar' : 'Pendiente de conteo'}
          </div>
        </article>

        <article className="cash-panel cash-close-movements">
          <PanelHeader title="Movimientos que afectan el cierre" />
          <SimpleMovimientosTable movimientos={movimientosCierre} movimientosError={movimientosError} />
          <button className="cash-link" onClick={irAMovimientos} type="button">Ver todos los movimientos →</button>
        </article>

        <article className="cash-panel cash-close-result">
          <PanelHeader title="Resultado del corte" />
          <AmountRow label="Efectivo esperado" value={resumen.efectivoEsperado} strong />
          <AmountRow label="Efectivo contado" value={resumen.efectivoContado} tone={resumen.conteoCapturado ? 'green' : ''} strong />
          <AmountRow label="Diferencia" value={diferencia} tone={diferencia < 0 ? 'red' : 'green'} />
          <AmountRow label="Propinas pendientes de nómina" value={resumen.propinaPendienteNomina} tone="purple" />
          <div className="cash-status-line">
            <span>Estado del turno</span>
            <strong className={cierreCorrecto ? 'green' : 'orange'}>{cierreCorrecto ? 'Listo para cerrar' : 'Pendiente de conteo'}</strong>
          </div>
          <div className={`cash-final-difference ${diferencia < 0 ? 'negative' : 'positive'}`}>
            <span>Diferencia final</span>
            <strong>{formatMoney(diferencia)}</strong>
          </div>
          <div className="cash-close-actions">
            <button onClick={() => guardarCierre(false)} type="button" disabled={guardando}>Guardar corte parcial</button>
            <button className="danger" onClick={() => guardarCierre(true)} type="button" disabled={guardando}>Confirmar cierre de turno</button>
          </div>
        </article>
      </section>

      <div className="cash-info">
        <span>i</span>
        El cierre utiliza la información de Pagos y Movimientos de Caja para calcular el efectivo esperado del turno.
      </div>
    </>
  )
}

const MovimientoCajaModal = ({ form, setForm, guardando, onClose, onSubmit }) => {
  const setCampo = (campo, value) => {
    setForm(prev => ({ ...prev, [campo]: value }))
  }

  const tipos = ['Apertura', 'Ajuste', 'Retiro', 'Gasto']
  const esSalida = ['retiro', 'gasto'].includes(normalizar(form.tipo))
  const montoPreview = parseMonto(form.monto) * (esSalida ? -1 : 1)

  return (
    <div className="cash-modal-backdrop" role="dialog" aria-modal="true">
      <form className="cash-modal" onSubmit={onSubmit}>
        <div className="cash-modal-header">
          <div>
            <h2>Movimiento de caja</h2>
            <p>Registra entradas, salidas, apertura o ajustes del turno.</p>
          </div>
          <button onClick={onClose} type="button" disabled={guardando}>×</button>
        </div>

        <div className="cash-modal-grid">
          <label>
            <span>Tipo</span>
            <select value={form.tipo} onChange={event => setCampo('tipo', event.target.value)}>
              {tipos.map(tipo => <option key={tipo}>{tipo}</option>)}
            </select>
          </label>

          <label>
            <span>Monto</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monto}
              onChange={event => setCampo('monto', event.target.value)}
              placeholder="0.00"
            />
          </label>

          <label className="cash-modal-wide">
            <span>Concepto</span>
            <input
              value={form.concepto}
              onChange={event => setCampo('concepto', event.target.value)}
              placeholder="Ej. compra de insumos, retiro, fondo inicial"
            />
          </label>

          <label>
            <span>Propina</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.propina}
              onChange={event => setCampo('propina', event.target.value)}
              placeholder="0.00"
            />
          </label>

          <label>
            <span>Recibido / Entregado</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monto_recibido}
              onChange={event => setCampo('monto_recibido', event.target.value)}
              placeholder="0.00"
            />
          </label>

          <label>
            <span>Cambio / Diferencia</span>
            <input
              type="number"
              step="0.01"
              value={form.cambio_entregado}
              onChange={event => setCampo('cambio_entregado', event.target.value)}
              placeholder="0.00"
            />
          </label>

          <label>
            <span>Estado</span>
            <select value={form.estado} onChange={event => setCampo('estado', event.target.value)}>
              <option value="completado">Completado</option>
              <option value="pendiente">Pendiente</option>
              <option value="revisar">Revisar</option>
            </select>
          </label>
        </div>

        <div className={`cash-modal-preview ${montoPreview < 0 ? 'negative' : 'positive'}`}>
          <span>Impacto en caja</span>
          <strong>{formatMoney(montoPreview)}</strong>
        </div>

        <div className="cash-modal-actions">
          <button onClick={onClose} type="button" disabled={guardando}>Cancelar</button>
          <button className="danger" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar movimiento'}
          </button>
        </div>
      </form>
    </div>
  )
}

const SimpleMovimientosTable = ({ movimientos, movimientosError }) => (
  <table className="cash-table">
    <thead>
      <tr><th>Hora</th><th>Tipo</th><th>Concepto</th><th>Monto</th></tr>
    </thead>
    <tbody>
      {movimientosError && movimientos.length === 0 ? (
        <tr><td colSpan="4" className="cash-empty">Sin movimientos disponibles</td></tr>
      ) : movimientos.length === 0 ? (
        <tr><td colSpan="4" className="cash-empty">Sin movimientos</td></tr>
      ) : movimientos.slice(0, 5).map(mov => (
        <tr key={mov.id}>
          <td>{formatHora(mov.fecha_movimiento)}</td>
          <td><span className={`cash-type ${normalizar(mov.tipo)}`}>{mov.tipo || 'Movimiento'}</span></td>
          <td>{mov.concepto || 'Movimiento de caja'}</td>
          <td className={parseMonto(mov.monto) < 0 ? 'red' : 'green'}>{formatMoney(mov.monto)}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

const PanelHeader = ({ title, purple = false }) => (
  <div className="cash-panel-header">
    <h2 className={purple ? 'purple' : ''}>{title}</h2>
    <span>⋮</span>
  </div>
)

const AmountRow = ({ label, value, tone = '', strong = false, highlight = false }) => (
  <div className={`cash-amount-row ${highlight ? 'highlight' : ''}`}>
    <span>{label}</span>
    <strong className={`${tone} ${strong ? 'strong' : ''}`}>{formatMoney(value)}</strong>
  </div>
)

const StatusRow = ({ icon, label, value, success = false, money = false }) => (
  <div className="cash-status-row">
    <span className="cash-status-icon">{icon}</span>
    <span>{label}</span>
    <strong className={success ? 'success-pill' : money ? 'green' : ''}>{value}</strong>
  </div>
)

const DetailRow = ({ label, value, tone = '' }) => (
  <div className="movement-detail-row">
    <span>{label}</span>
    <strong className={tone}>{value}</strong>
  </div>
)
