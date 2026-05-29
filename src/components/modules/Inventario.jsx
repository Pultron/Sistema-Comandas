import { useState, useEffect } from 'react'
import { appStyles } from '../../styles/styles'
import { useInventario, usePersonal } from '../../hooks/useSupabase'

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

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

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
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Estados separados para búsqueda en modales (no afectan la lista principal)
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

  const proveedores = [...new Set(ingredientes.map(item => item.proveedor || 'Sin proveedor'))].sort()
  const bajos = ingredientes.filter(i => i.estado === 'bajo').length
  const personalActivo = personal.filter(persona => persona.estado !== 'inactivo')
  const ingredienteSeleccionado = ingredientes.find(item => String(item.id) === String(movData.ingredienteId))
  const ingredienteLimite = ingredientes.find(item => String(item.id) === String(limiteData.ingredienteId))

  // Filtrado para la lista principal de inventario
  const ingredientesFiltrados = ingredientes.filter(item => {
    const coincideBusqueda = normalizar(item.nombre).includes(normalizar(busqueda))
    const coincideProveedor = filtroProveedor === 'todos' || item.proveedor === filtroProveedor
    return coincideBusqueda && coincideProveedor
  })

  // Filtrado separado para el modal de movimiento
  const ingredientesFiltradosModal = ingredientes.filter(item =>
    normalizar(item.nombre).includes(normalizar(busquedaMovimiento))
  )

  // Filtrado separado para el modal de límites
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
      setToastMsg(`${sinVer.length} compra(s) nueva(s) hoy — ${sinVer[0].ingrediente} +${sinVer[0].cantidad}`)
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

  const limpiarMotivoMovimiento = (motivo) => {
    const texto = String(motivo || '')
    if (texto.toLowerCase().includes('compra realizada')) return ''
    return texto
  }

  // Agrupa movimientos y los ordena: Hoy primero, Ayer segundo, luego fechas más recientes
  const agruparPorFecha = (movs) => {
    const hoy = new Date()
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    const fmtLocal = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    const grupos = {}
    movs.slice(0, 50).forEach(m => {
      const fechaMov = String(m.fecha || '').slice(0, 10)
      let label
      if (fechaMov === fmtLocal(hoy)) label = '__hoy__'
      else if (fechaMov === fmtLocal(ayer)) label = '__ayer__'
      else label = fechaMov
      if (!grupos[label]) grupos[label] = []
      grupos[label].push(m)
    })

    // Invertir orden dentro de cada grupo para que los más recientes salgan primero
    Object.keys(grupos).forEach(label => {
      grupos[label].reverse()
    })

    // Ordenar: hoy primero, ayer segundo, luego por fecha descendente
    const ordenados = Object.entries(grupos).sort(([a], [b]) => {
      if (a === '__hoy__') return -1
      if (b === '__hoy__') return 1
      if (a === '__ayer__') return -1
      if (b === '__ayer__') return 1
      return b.localeCompare(a)
    })

    return ordenados
  }

  const getLabelVisible = (key) => {
    if (key === '__hoy__') {
      const d = new Date()
      return { texto: `Hoy — ${d.getDate()} ${d.toLocaleString('es-MX', {month:'short'})} ${d.getFullYear()}`, esHoy: true, esAyer: false }
    }
    if (key === '__ayer__') {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return { texto: `Ayer — ${d.getDate()} ${d.toLocaleString('es-MX', {month:'short'})} ${d.getFullYear()}`, esHoy: false, esAyer: true }
    }
    const d = new Date(key + 'T00:00:00')
    return { texto: `${d.getDate()} ${d.toLocaleString('es-MX', {month:'short'})} ${d.getFullYear()}`, esHoy: false, esAyer: false }
  }

  const gruposMovimientos = agruparPorFecha(movimientos)

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', width: '100%', background: '#ECEFF1', minHeight: '100%'}}>
      {showToast && (
        <div style={{
          background: '#065F46', color: '#6EE7B7', borderRadius: '8px',
          padding: '10px 16px', marginBottom: '1rem', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          {toastMsg}
        </div>
      )}

      <div style={{display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:'1.5rem'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <button onClick={abrirLimites} style={{
            border:'none', borderRadius:'6px',
            padding:'0 28px', height:'45px', fontSize:'15px',
            fontWeight:700, background:'#2196F3', color: '#000000', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'6px',
            boxShadow: '0 8px 20px rgba(33, 150, 243, 0.28)', transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            Editar stock
          </button>
          <button onClick={abrirMovimiento} style={{
            border:'none', borderRadius:'6px',
            padding:'0 28px', height:'45px', fontSize:'15px',
            fontWeight:700, background:'#4CAF50', color: '#000000', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'6px',
            boxShadow: '0 8px 20px rgba(76, 175, 80, 0.28)', transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Registrar salida
          </button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns: '1fr', gap:'1rem', marginBottom:'0'}}>
      </div>

      {/* Layout principal: productos ocupa más espacio, panel derecho más compacto */}
      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap:'1rem', alignItems:'start'}}>

        {/* Panel izquierdo: lista de ingredientes */}
        <div style={{background:'white', border:'2px solid #FFE0B2', borderRadius:'12px', padding:'1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 200px', gap: '0.8rem', marginBottom: '1rem'}}>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ingrediente..."
              style={{width: '100%', padding: '0.75rem', border: '2px solid #FFE0B2', borderRadius: '6px', boxSizing: 'border-box', background: '#FFFDF8'}}
            />
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              style={{width: '100%', padding: '0.75rem', border: '2px solid #FFE0B2', borderRadius: '6px', boxSizing: 'border-box', background: '#FFFDF8'}}
            >
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(proveedor => <option key={proveedor} value={proveedor}>{proveedor}</option>)}
            </select>
          </div>

          {gruposInventario.map(grupo => (
            <div key={grupo.proveedor} style={{marginBottom:'1.2rem'}}>
              <div style={{fontSize:'13px', fontWeight:800, color:'#000000', letterSpacing:'0.06em', marginBottom:'10px', marginTop:'1rem'}}>
                {grupo.proveedor}
              </div>
              {/* Filas de 4 columnas fijas */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'8px'}}>
                {grupo.items.map(item => {
                  const esHoy = movimientos.some(m =>
                    m.tipo === 'entrada' &&
                    String(m.ingrediente) === String(item.nombre) &&
                    fechaClaveLocal(m.fecha) === fechaClaveLocal()
                  )
                  const unidad = String(item.unidad || '').toLowerCase()
                  const esCaja = unidad.includes('caja')
                  const esKilo = unidad === 'kg' || unidad === 'kilos'
                  const esPieza = unidad === 'piezas'
                  const esLitro = unidad === 'litros'

                  let etiquetaUnidad = item.unidad
                  if (esKilo) etiquetaUnidad = 'kilos disponibles'
                  if (esPieza) etiquetaUnidad = 'piezas disponibles'
                  if (esCaja) etiquetaUnidad = 'cajas'
                  if (esLitro) etiquetaUnidad = 'litros disponibles'

                  return (
                    <div key={item.id} style={{
                      border: item.estado === 'bajo'
                        ? '2px solid #FECACA'
                        : '2px solid #E5E7EB',
                      borderRadius:'8px', padding:'0.85rem 1rem',
                      background: item.estado === 'bajo' ? '#FEE2E2' : '#ffffff',
                      boxShadow: item.estado === 'bajo' ? '0 3px 10px rgba(244, 63, 94, 0.12)' : '0 2px 6px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{fontSize:'13px', fontWeight:500, color:'#111827', marginBottom:'8px'}}>
                        {item.nombre}
                      </div>
                      <div style={{fontSize:'20px', fontWeight:500, lineHeight:1.1, color: item.estado === 'bajo' ? '#DC2626' : '#111827'}}>
                        {Number(item.cantidad).toFixed(esCaja ? 0 : 2)}
                      </div>
                      <div style={{fontSize:'12px', color: item.estado === 'bajo' ? '#EF4444' : '#6B7280'}}>
                        {etiquetaUnidad}
                      </div>
                      {esCaja && item.contenido_caja > 0 && (
                        <div style={{fontSize:'11px', color: item.estado === 'bajo' ? '#EF4444' : '#9CA3AF', marginTop:'2px'}}>
                          = {Math.round(item.cantidad * item.contenido_caja)} piezas ({item.contenido_caja} c/caja)
                        </div>
                      )}
                      <div style={{fontSize:'11px', color: item.estado === 'bajo' ? '#EF4444' : '#9CA3AF', marginTop:'6px', borderTop: item.estado === 'bajo' ? '0.5px solid #FECACA' : '0.5px solid #E5E7EB', paddingTop:'6px'}}>
                        Mínimo: {item.minimo} {item.unidad}
                        {item.maximo !== null && item.maximo !== undefined ? ` · Máximo: ${item.maximo} ${item.unidad}` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Panel derecho: stock bajo + últimos movimientos */}
        <div style={{display:'grid', gap:'1rem'}}>
          <div style={{background:'#FFF8F0', border:'2px solid #FFB300', borderRadius:'12px', padding:'1.25rem'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'12px'}}>
              <div style={{fontSize:'13px', fontWeight:800, color:'#111827'}}>Productos en stock bajo</div>
              <span style={{background:'#FFE0CC', color:'#D32F2F', borderRadius:'99px', fontSize:'11px', fontWeight:800, padding:'2px 8px'}}>
                {bajos}
              </span>
            </div>
            {bajos === 0 ? (
              <div style={{fontSize:'13px', color:'#9CA3AF'}}>No hay productos bajos</div>
            ) : (
              <div style={{display:'grid', gap:'8px'}}>
                {ingredientes.filter(item => item.estado === 'bajo').map(item => (
                  <div key={item.id} style={{background:'#fff', border:'1px solid #FDBA74', borderRadius:'8px', padding:'8px 10px'}}>
                    <div style={{fontSize:'13px', fontWeight:700, color:'#111827'}}>{item.nombre}</div>
                    <div style={{fontSize:'12px', color:'#D85A30', marginTop:'2px'}}>
                      {item.cantidad} {item.unidad} / min. {item.minimo} {item.unidad}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimos movimientos */}
          <div style={{background:'white', border:'0.5px solid #E5E7EB', borderRadius:'12px', padding:'1.25rem'}}>
            <div style={{fontSize:'13px', fontWeight:500, color:'#111827',
              marginBottom:'1.2rem', display:'flex', alignItems:'center', gap:'6px'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="12 8 12 12 14 14"/>
                <path d="M3.05 11a9 9 0 1 0 .5-4"/>
                <polyline points="3 3 3 7 7 7"/>
              </svg>
              Últimos movimientos
            </div>

            {gruposMovimientos.length === 0 ? (
              <div style={{fontSize:'13px', color:'#9CA3AF'}}>Sin movimientos</div>
            ) : (
              gruposMovimientos.map(([key, movs]) => {
                const { texto, esHoy, esAyer } = getLabelVisible(key)
                return (
                  <div key={key} style={{marginBottom:'1.2rem'}}>
                    <div style={{
                      fontSize: esHoy ? '12px' : '11px',
                      fontWeight: esHoy ? 700 : 500,
                      color: esHoy ? '#111827' : '#9CA3AF',
                      textTransform: esHoy ? 'none' : 'uppercase',
                      letterSpacing: esHoy ? 0 : '0.05em',
                      marginBottom:'8px',
                      paddingBottom:'6px',
                      borderBottom:'0.5px solid #E5E7EB'
                    }}>
                      {texto}
                    </div>
                    {movs.map(mov => {
                      const motivo = limpiarMotivoMovimiento(mov.motivo)
                      return (
                        <div key={mov.id} style={{
                          padding:'8px 0',
                          borderBottom:'0.5px solid #F3F4F6'
                        }}>
                          {/* Fila 1: nombre + badge + cantidad */}
                          <div style={{display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap'}}>
                            <span style={{fontSize:'13px', fontWeight:600, color:'#111827'}}>
                              {mov.ingrediente}
                            </span>
                            <span style={{
                              background: mov.tipo === 'entrada' ? '#EAF3DE' : '#FCEBEB',
                              color: mov.tipo === 'entrada' ? '#3B6D11' : '#A32D2D',
                              borderRadius:'99px', fontSize:'11px', fontWeight:500,
                              padding:'2px 7px', whiteSpace:'nowrap'
                            }}>
                              {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            </span>
                            <span style={{fontSize:'13px', color:'#374151', fontWeight:500}}>
                              {mov.cantidad}
                            </span>
                          </div>
                          {/* Fila 2: motivo (solo si existe) */}
                          {motivo ? (
                            <div style={{fontSize:'11px', color:'#9CA3AF', marginTop:'3px', lineHeight:'1.3'}}>
                              {motivo}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Editar límites de stock */}
      {mostrarLimites && (
        <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'}}>
          <div style={{backgroundColor: 'white', borderRadius: '10px', padding: '1.5rem', maxWidth: '640px', width: '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'}}>
            <h2 style={{margin: '0 0 1rem', color: '#111827', fontSize: '20px', fontWeight: 800}}>Editar stock mínimo y máximo</h2>
            <div style={{display: 'grid', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Buscar producto</label>
                <input
                  value={busquedaLimites}
                  onChange={(e) => setBusquedaLimites(e.target.value)}
                  placeholder="Escribe para filtrar..."
                  style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                />
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', marginTop: '0.7rem'}}>
                  {ingredientesFiltradosLimites.map(item => {
                    const activo = String(limiteData.ingredienteId) === String(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLimiteData({
                          ingredienteId: item.id,
                          minimo: item.minimo ?? '',
                          maximo: item.maximo ?? ''
                        })}
                        style={{padding: '0.65rem', border: `2px solid ${activo ? '#FF6F00' : '#E5E7EB'}`, background: activo ? '#FFF3E0' : '#fff', color: activo ? '#8A4B00' : '#111827', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontWeight: 700}}
                      >
                        {item.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>

              {ingredienteLimite && (
                <div style={{padding: '0.8rem', background: '#FFF8F0', border: '1px solid #FDBA74', borderRadius: '6px', color: '#8A4B00', fontSize: '13px', fontWeight: 700}}>
                  Disponible: {ingredienteLimite.cantidad} {ingredienteLimite.unidad}
                </div>
              )}

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Stock mínimo</label>
                  <input
                    type="number"
                    value={limiteData.minimo}
                    onChange={(e) => setLimiteData({...limiteData, minimo: e.target.value})}
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Stock máximo</label>
                  <input
                    type="number"
                    value={limiteData.maximo}
                    onChange={(e) => setLimiteData({...limiteData, maximo: e.target.value})}
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                  />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <button onClick={() => setMostrarLimites(false)} style={{padding: '0.85rem', background: '#ff0000', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={guardarLimites} style={{padding: '0.85rem', background: '#4CAF50', color: '#000000', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer'}}>Guardar límites</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar salida */}
      {mostrarMovimiento && (
        <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'}}>
          <div style={{backgroundColor: 'white', borderRadius: '10px', padding: '1.5rem', maxWidth: '620px', width: '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'}}>
            <h2 style={{margin: '0 0 1rem', color: '#111827', fontSize: '20px', fontWeight: 800}}>Registrar salida de inventario</h2>
            <div style={{display: 'grid', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Buscar ingrediente</label>
                <input
                  value={busquedaMovimiento}
                  onChange={(e) => setBusquedaMovimiento(e.target.value)}
                  placeholder="Escribe para filtrar..."
                  style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                />
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', marginTop: '0.7rem'}}>
                  {ingredientesFiltradosModal.map(item => {
                    const activo = String(movData.ingredienteId) === String(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMovData(prev => ({ ...prev, ingredienteId: item.id }))}
                        style={{padding: '0.65rem', border: `2px solid ${activo ? '#16A34A' : '#E5E7EB'}`, background: activo ? '#DCFCE7' : '#fff', color: activo ? '#166534' : '#111827', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontWeight: 700}}
                      >
                        {item.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>

              {ingredienteSeleccionado && (
                <div style={{padding: '0.8rem', background: '#F8FAFC', borderRadius: '6px', color: '#334155', fontSize: '13px'}}>
                  Disponible: <strong>{ingredienteSeleccionado.cantidad} {ingredienteSeleccionado.unidad}</strong>
                </div>
              )}

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Cantidad que salió</label>
                  <input
                    type="number"
                    value={movData.cantidad}
                    onChange={(e) => setMovData({...movData, cantidad: e.target.value})}
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Persona que lo sacó</label>
                  <select
                    value={movData.persona}
                    onChange={(e) => setMovData({...movData, persona: e.target.value})}
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                  >
                    <option value="">Selecciona...</option>
                    {personalActivo.map(persona => <option key={persona.id} value={persona.nombre}>{persona.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Motivo</label>
                <input
                  value={movData.motivo}
                  onChange={(e) => setMovData({...movData, motivo: e.target.value})}
                  style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <button onClick={() => setMostrarMovimiento(false)} style={{padding: '0.85rem', background: '#ff0000', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={registrarMovimiento} style={{padding: '0.85rem', background: '#4CAF50', color: '#000000', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer'}}>Guardar Cambios </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}