import { useEffect, useState } from 'react'
import { useInventario, usePersonal } from '../../hooks/useSupabase'
import '../../styles/Inventario.css'

const crearFechaLocal = (fecha) => {
  if (!fecha) return new Date()
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [year, month, day] = fecha.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(fecha)
}

const fechaClaveLocal = (fecha) => {
  const date = crearFechaLocal(fecha)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatoHora = (fecha) => {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return ''
  const date = crearFechaLocal(fecha)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const normalizar = (texto) => String(texto || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

export const InventarioModule = () => {
  const {
    ingredientes,
    movimientos,
    registrarMovimiento: registrarMovimientoBd,
    actualizarLimitesStock
  } = useInventario()
  const { personal } = usePersonal()

  const [mostrarMovimiento, setMostrarMovimiento] = useState(false)
  const [mostrarLimites, setMostrarLimites] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [mostrarHistorialCompleto, setMostrarHistorialCompleto] = useState(false)
  const [proveedoresAbiertos, setProveedoresAbiertos] = useState({})
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [busquedaMovimiento, setBusquedaMovimiento] = useState('')
  const [busquedaLimites, setBusquedaLimites] = useState('')
  const [movData, setMovData] = useState({
    ingredienteId: '',
    cantidad: '',
    persona: '',
    motivo: 'Uso en cocina'
  })
  const [limiteData, setLimiteData] = useState({
    ingredienteId: '',
    minimo: '',
    maximo: ''
  })

  const obtenerEstadoInventario = (item) => {
    const cantidad = Number(item.cantidad) || 0
    const minimo = Number(item.minimo) || 0
    if (cantidad <= 0) return 'agotado'
    if (item.estado === 'bajo' || (minimo > 0 && cantidad <= minimo * 2)) return 'bajo'
    return 'normal'
  }

  const proveedores = [...new Set(ingredientes.map(item => item.proveedor || 'Sin proveedor'))].sort()
  const proveedorColores = ['#EF4444', '#F97316', '#22C55E', '#3B82F6', '#8B5CF6']
  const obtenerUltimoMovimientoIngrediente = (item) => {
    const movimiento = movimientos
      .filter(mov => normalizar(mov.ingrediente) === normalizar(item.nombre))
      .sort((a, b) => crearFechaLocal(b.fecha).getTime() - crearFechaLocal(a.fecha).getTime())[0]

    return movimiento ? crearFechaLocal(movimiento.fecha).getTime() : 0
  }

  const alertasInventario = ingredientes
    .filter(item => ['agotado', 'bajo'].includes(obtenerEstadoInventario(item)))
    .sort((a, b) => {
      const fechaB = obtenerUltimoMovimientoIngrediente(b)
      const fechaA = obtenerUltimoMovimientoIngrediente(a)
      if (fechaB !== fechaA) return fechaB - fechaA

      const prioridad = { agotado: 0, bajo: 1, normal: 2 }
      const estadoA = obtenerEstadoInventario(a)
      const estadoB = obtenerEstadoInventario(b)
      if (prioridad[estadoA] !== prioridad[estadoB]) return prioridad[estadoA] - prioridad[estadoB]
      return (Number(a.cantidad) || 0) - (Number(b.cantidad) || 0)
    })
  const personalActivo = personal.filter(persona => persona.estado !== 'inactivo')
  const ingredienteSeleccionado = ingredientes.find(item => String(item.id) === String(movData.ingredienteId))
  const ingredienteLimite = ingredientes.find(item => String(item.id) === String(limiteData.ingredienteId))

  const ingredientesFiltrados = ingredientes.filter(item => {
    const coincideBusqueda = normalizar(item.nombre).includes(normalizar(busqueda))
    const coincideProveedor = filtroProveedor === 'todos' || item.proveedor === filtroProveedor
    const estado = obtenerEstadoInventario(item)
    const coincideEstado = filtroEstado === 'todos' || estado === filtroEstado
    return coincideBusqueda && coincideProveedor && coincideEstado
  })

  const ingredientesFiltradosModal = ingredientes.filter(item =>
    normalizar(item.nombre).includes(normalizar(busquedaMovimiento))
  )

  const ingredientesFiltradosLimites = ingredientes.filter(item =>
    normalizar(item.nombre).includes(normalizar(busquedaLimites))
  )

  const gruposInventario = proveedores
    .map(proveedor => ({
      proveedor,
      items: ingredientesFiltrados.filter(item => (item.proveedor || 'Sin proveedor') === proveedor)
    }))
    .filter(grupo => grupo.items.length > 0)

  useEffect(() => {
    if (movimientos.length === 0) return
    const hoy = fechaClaveLocal()
    const compras = movimientos.filter(m =>
      m.tipo === 'entrada' && String(m.motivo || '').toLowerCase().includes('compra realizada')
    )
    const nuevas = compras.filter(m => fechaClaveLocal(m.fecha) === hoy)
    let vistas = []
    try { vistas = JSON.parse(localStorage.getItem('notifs_vistas') || '[]') } catch {}
    const sinVer = nuevas.filter(m => !vistas.includes(m.id))
    if (sinVer.length > 0) {
      setToastMsg(`${sinVer.length} compra(s) nueva(s) hoy - ${sinVer[0].ingrediente} +${sinVer[0].cantidad}`)
      setShowToast(true)
      localStorage.setItem('notifs_vistas', JSON.stringify([...vistas, ...sinVer.map(m => m.id)]))
      setTimeout(() => setShowToast(false), 4000)
    }
  }, [movimientos])

  const abrirMovimiento = () => {
    setMovData({ ingredienteId: '', cantidad: '', persona: '', motivo: 'Uso en cocina' })
    setBusquedaMovimiento('')
    setMostrarMovimiento(true)
  }

  const abrirLimites = () => {
    setLimiteData({ ingredienteId: '', minimo: '', maximo: '' })
    setBusquedaLimites('')
    setMostrarLimites(true)
  }

  const registrarMovimiento = async () => {
    if (!movData.ingredienteId || !movData.cantidad || !movData.persona || !movData.motivo) {
      alert('Completa ingrediente, cantidad, persona y motivo')
      return
    }
    await registrarMovimientoBd({ ...movData, tipo: 'salida' })
    setMovData({ ingredienteId: '', cantidad: '', persona: '', motivo: 'Uso en cocina' })
    setMostrarMovimiento(false)
  }

  const guardarLimites = async () => {
    if (!limiteData.ingredienteId || limiteData.minimo === '') {
      alert('Selecciona un producto y captura el stock minimo')
      return
    }
    await actualizarLimitesStock(limiteData.ingredienteId, {
      minimo: limiteData.minimo,
      maximo: limiteData.maximo
    })
    setLimiteData({ ingredienteId: '', minimo: '', maximo: '' })
    setMostrarLimites(false)
  }

  const toggleProveedor = (proveedor) => {
    setProveedoresAbiertos(prev => ({
      ...prev,
      [proveedor]: !(prev[proveedor] ?? proveedor === gruposInventario[0]?.proveedor)
    }))
  }

  const obtenerUnidad = (item) => item?.unidad || 'kg'

  const formatearCantidad = (cantidad, unidad = 'kg') => `${Number(cantidad || 0).toFixed(2)} ${unidad}`

  const textoEstado = (estado) => {
    if (estado === 'agotado') return 'Agotado'
    if (estado === 'bajo') return 'Stock bajo'
    return 'Stock normal'
  }

  const obtenerProveedorMovimiento = (mov) => (
    ingredientes.find(item => String(item.nombre) === String(mov.ingrediente))?.proveedor || 'Sin proveedor'
  )

  const obtenerUnidadMovimiento = (mov) => (
    ingredientes.find(item => String(item.nombre) === String(mov.ingrediente))?.unidad || 'kg'
  )

  const obtenerEmpleadoMovimiento = (mov) => {
    const retiro = String(mov.motivo || '').match(/Retiro:\s*([^|]+)/i)
    if (retiro?.[1]) return retiro[1].trim()
    return mov.usuario || mov.empleado || 'Hector Paul'
  }

  const fechaMovimiento = (mov) => {
    const hoy = fechaClaveLocal()
    const fecha = fechaClaveLocal(mov.fecha)
    if (fecha === hoy) return `Hoy, ${formatoHora(mov.fecha) || '09:30 AM'}`
    return `${fecha || 'Ayer'}, ${formatoHora(mov.fecha)}`
  }

  const alertasVisibles = alertasInventario
  const movimientosVisibles = mostrarHistorialCompleto ? movimientos : movimientos.slice(0, 5)

  return (
    <div className="inventory-page">
      {showToast && <div className="inventory-toast">{toastMsg}</div>}

      <div className="inventory-top-actions">
        <button className="inventory-action inventory-action--edit" onClick={abrirLimites}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Editar stock
        </button>
        <button className="inventory-action inventory-action--move" onClick={abrirMovimiento}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Registrar entrada / salida
        </button>
      </div>

      <div className="inventory-layout">
        <section className="inventory-main-panel">
          <div className="inventory-filters">
            <label className="inventory-search">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar ingrediente..." />
            </label>
            <select className="inventory-select" value={filtroProveedor} onChange={(event) => setFiltroProveedor(event.target.value)}>
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(proveedor => <option key={proveedor} value={proveedor}>{proveedor}</option>)}
            </select>
            <select className="inventory-select" value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="normal">Stock normal</option>
              <option value="bajo">Stock bajo</option>
              <option value="agotado">Agotado</option>
            </select>
          </div>

          <div className="inventory-providers">
            {gruposInventario.map((grupo, index) => {
              const abierto = proveedoresAbiertos[grupo.proveedor] ?? index === 0
              return (
                <article className="inventory-provider" key={grupo.proveedor} style={{'--provider-color': proveedorColores[index % proveedorColores.length]}}>
                  <button className="inventory-provider-header" onClick={() => toggleProveedor(grupo.proveedor)}>
                    <span>{grupo.proveedor}</span>
                    <small>{grupo.items.length} productos</small>
                    <strong>{abierto ? '^' : '⌄'}</strong>
                  </button>
                  {abierto && (
                    <div className="inventory-table-wrap">
                      <table className="inventory-table">
                        <thead>
                          <tr>
                            <th>Ingrediente</th>
                            <th>Disponible</th>
                            <th>Mínimo</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.items.map(item => {
                            const estado = obtenerEstadoInventario(item)
                            return (
                              <tr key={item.id}>
                                <td>{item.nombre}</td>
                                <td className={estado === 'agotado' ? 'inventory-danger-text' : ''}>{formatearCantidad(item.cantidad, obtenerUnidad(item))}</td>
                                <td>{Number(item.minimo || 0)} {obtenerUnidad(item)}</td>
                                <td><span className={`inventory-status inventory-status--${estado}`}>{textoEstado(estado)}</span></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <aside className="inventory-side-panel">
          <section className="inventory-side-card">
            <h3>
              <span className="inventory-title-alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 22 20H2L12 3Z" />
                  <path d="M12 9v5" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              Alertas de inventario
            </h3>
            <div className="inventory-alert-list">
              {alertasVisibles.length === 0 && (
                <div className="inventory-empty-alerts">
                  No hay productos agotados ni con stock bajo.
                </div>
              )}
              {alertasVisibles.map(item => {
                const estado = obtenerEstadoInventario(item)
                return (
                  <div className="inventory-alert" key={item.id}>
                    <span className="inventory-alert-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3 22 20H2L12 3Z" />
                        <path d="M12 9v5" />
                        <path d="M12 17h.01" />
                      </svg>
                    </span>
                    <div>
                      <strong>{item.nombre}</strong>
                      <small>{item.proveedor || 'Sin proveedor'}</small>
                    </div>
                    <em className={`inventory-alert-state inventory-alert-state--${estado}`}>
                      {estado === 'agotado' ? 'Agotado' : `Stock bajo (${formatearCantidad(item.cantidad, obtenerUnidad(item))})`}
                    </em>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="inventory-side-card">
            <h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D76FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
                <path d="M12 7v5l3 2" />
              </svg>
              Últimos movimientos
            </h3>
            <div className="inventory-movement-list">
              {movimientosVisibles.map(mov => {
                const unidad = obtenerUnidadMovimiento(mov)
                const esEntrada = mov.tipo === 'entrada'
                return (
                  <div className="inventory-movement" key={mov.id}>
                    <span className={`inventory-movement-icon ${esEntrada ? 'is-entry' : 'is-exit'}`}>
                      {esEntrada ? (
                        <svg width="30" height="22" viewBox="0 0 44 28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 14h24" />
                          <path d="M17 5 28 14 17 23" />
                          <path d="M31 4h9v20h-9" />
                        </svg>
                      ) : (
                        <svg width="30" height="22" viewBox="0 0 44 28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M40 14H16" />
                          <path d="M27 5 16 14l11 9" />
                          <path d="M13 4H4v20h9" />
                        </svg>
                      )}
                    </span>
                    <div className="inventory-movement-main">
                      <strong>{mov.ingrediente}</strong>
                      <span>{obtenerProveedorMovimiento(mov)} <b>•</b> {obtenerEmpleadoMovimiento(mov)}</span>
                      <small>{fechaMovimiento(mov)}</small>
                    </div>
                    <div className="inventory-movement-side">
                      <span className={`inventory-movement-badge ${esEntrada ? 'is-entry' : 'is-exit'}`}>{esEntrada ? 'Entrada' : 'Salida'}</span>
                      <strong className={esEntrada ? 'is-entry' : 'is-exit'}>{esEntrada ? '+' : '-'}{Number(mov.cantidad || 0).toFixed(2)} {unidad}</strong>
                    </div>
                  </div>
                )
              })}
            </div>

          </section>
        </aside>
      </div>

      {mostrarLimites && (
        <InventarioLimitesModal
          ingredientes={ingredientesFiltradosLimites}
          ingredienteLimite={ingredienteLimite}
          limiteData={limiteData}
          setLimiteData={setLimiteData}
          busquedaLimites={busquedaLimites}
          setBusquedaLimites={setBusquedaLimites}
          guardarLimites={guardarLimites}
          cerrar={() => setMostrarLimites(false)}
        />
      )}

      {mostrarMovimiento && (
        <InventarioMovimientoModal
          ingredientes={ingredientesFiltradosModal}
          ingredienteSeleccionado={ingredienteSeleccionado}
          movData={movData}
          setMovData={setMovData}
          busquedaMovimiento={busquedaMovimiento}
          setBusquedaMovimiento={setBusquedaMovimiento}
          personalActivo={personalActivo}
          registrarMovimiento={registrarMovimiento}
          cerrar={() => setMostrarMovimiento(false)}
        />
      )}
    </div>
  )
}

const InventarioLimitesModal = ({
  ingredientes,
  ingredienteLimite,
  limiteData,
  setLimiteData,
  busquedaLimites,
  setBusquedaLimites,
  guardarLimites,
  cerrar
}) => (
  <div className="inventory-modal-overlay">
    <div className="inventory-modal">
      <h2>Editar stock mínimo y máximo</h2>
      <label>Buscar producto</label>
      <input value={busquedaLimites} onChange={(event) => setBusquedaLimites(event.target.value)} placeholder="Escribe para filtrar..." />
      <div className="inventory-modal-grid">
        {ingredientes.map(item => {
          const activo = String(limiteData.ingredienteId) === String(item.id)
          return (
            <button
              key={item.id}
              type="button"
              className={activo ? 'is-active' : ''}
              onClick={() => setLimiteData({ ingredienteId: item.id, minimo: item.minimo ?? '', maximo: item.maximo ?? '' })}
            >
              {item.nombre}
            </button>
          )
        })}
      </div>
      {ingredienteLimite && <div className="inventory-modal-note">Disponible: {ingredienteLimite.cantidad} {ingredienteLimite.unidad}</div>}
      <div className="inventory-modal-fields">
        <label>Stock mínimo<input type="text" value={limiteData.minimo} onChange={(event) => setLimiteData({...limiteData, minimo: event.target.value})} /></label>
        <label>Stock máximo<input type="text" value={limiteData.maximo} onChange={(event) => setLimiteData({...limiteData, maximo: event.target.value})} /></label>
      </div>
      <div className="inventory-modal-actions">
        <button onClick={cerrar}>Cancelar</button>
        <button onClick={guardarLimites}>Guardar límites</button>
      </div>
    </div>
  </div>
)

const InventarioMovimientoModal = ({
  ingredientes,
  ingredienteSeleccionado,
  movData,
  setMovData,
  busquedaMovimiento,
  setBusquedaMovimiento,
  personalActivo,
  registrarMovimiento,
  cerrar
}) => (
  <div className="inventory-modal-overlay">
    <div className="inventory-modal">
      <h2>Registrar salida de inventario</h2>
      <label>Buscar ingrediente</label>
      <input value={busquedaMovimiento} onChange={(event) => setBusquedaMovimiento(event.target.value)} placeholder="Escribe para filtrar..." />
      <div className="inventory-modal-grid">
        {ingredientes.map(item => {
          const activo = String(movData.ingredienteId) === String(item.id)
          return (
            <button key={item.id} type="button" className={activo ? 'is-active' : ''} onClick={() => setMovData(prev => ({ ...prev, ingredienteId: item.id }))}>
              {item.nombre}
            </button>
          )
        })}
      </div>
      {ingredienteSeleccionado && <div className="inventory-modal-note">Disponible: {ingredienteSeleccionado.cantidad} {ingredienteSeleccionado.unidad}</div>}
      <div className="inventory-modal-fields">
        <label>Cantidad que salió<input type="text" value={movData.cantidad} onChange={(event) => setMovData({...movData, cantidad: event.target.value})} /></label>
        <label>Persona que lo sacó
          <select value={movData.persona} onChange={(event) => setMovData({...movData, persona: event.target.value})}>
            <option value="">Selecciona...</option>
            {personalActivo.map(persona => <option key={persona.id} value={persona.nombre}>{persona.nombre}</option>)}
          </select>
        </label>
      </div>
      <div className="inventory-modal-actions">
        <button onClick={cerrar}>Cancelar</button>
        <button onClick={registrarMovimiento}>Guardar Cambios</button>
      </div>
    </div>
  </div>
)
