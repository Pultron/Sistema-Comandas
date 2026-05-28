import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { useInventario, usePersonal } from '../../hooks/useSupabase'

export const InventarioModule = () => {
  const {
    ingredientes,
    movimientos,
    registrarMovimiento: registrarMovimientoBd
  } = useInventario()
  const { personal } = usePersonal()

  const [mostrarMovimiento, setMostrarMovimiento] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState('todos')
  const [movData, setMovData] = useState({
    ingredienteId: '',
    cantidad: '',
    persona: '',
    motivo: 'Uso en cocina'
  })

  const proveedores = [...new Set(ingredientes.map(item => item.proveedor || 'Sin proveedor'))].sort()
  const bajos = ingredientes.filter(i => i.estado === 'bajo').length
  const valorStock = ingredientes.reduce((total, item) => total + (parseFloat(item.cantidad) || 0), 0)
  const personalActivo = personal.filter(persona => persona.estado !== 'inactivo')
  const ingredienteSeleccionado = ingredientes.find(item => String(item.id) === String(movData.ingredienteId))

  const ingredientesFiltrados = ingredientes.filter(item => {
    const coincideBusqueda = normalizar(item.nombre).includes(normalizar(busqueda))
    const coincideProveedor = filtroProveedor === 'todos' || item.proveedor === filtroProveedor
    return coincideBusqueda && coincideProveedor
  })

  const gruposInventario = proveedores
    .map(proveedor => ({
      proveedor,
      items: ingredientesFiltrados.filter(item => (item.proveedor || 'Sin proveedor') === proveedor)
    }))
    .filter(grupo => grupo.items.length > 0)

  const notificaciones = movimientos
    .filter(mov => mov.tipo === 'entrada' && String(mov.motivo || '').toLowerCase().includes('compra realizada'))
    .slice(0, 8)

  const nombreUnidadStock = (unidad, cantidad = 0) => {
    const unidadNormalizada = String(unidad || '').toLowerCase()
    if (['kg', 'kilo', 'kilos'].includes(unidadNormalizada)) return 'kilos'
    if (['unidad', 'pieza', 'piezas'].includes(unidadNormalizada)) return Number(cantidad) === 1 ? 'pieza' : 'piezas'
    return unidad || 'unidades'
  }

  const cantidadStock = (cantidad) => {
    const numero = Number(cantidad) || 0
    return Number.isInteger(numero) ? String(numero) : numero.toFixed(2)
  }

  const abrirMovimiento = () => {
    setMovData({ ingredienteId: '', cantidad: '', persona: '', motivo: 'Uso en cocina' })
    setBusqueda('')
    setMostrarMovimiento(true)
  }

  const registrarMovimiento = async () => {
    if (!movData.ingredienteId || !movData.cantidad || !movData.persona || !movData.motivo) {
      alert('Completa ingrediente, cantidad, persona y motivo')
      return
    }

    await registrarMovimientoBd({
      ...movData,
      tipo: 'salida'
    })

    setMovData({ ingredienteId: '', cantidad: '', persona: '', motivo: 'Uso en cocina' })
    setMostrarMovimiento(false)
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', width: '100%'}}>
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>Inventario</h1>
        <button onClick={abrirMovimiento} style={{...appStyles.btnPrimary, background: '#16A34A'}}>
          + Registrar Movimiento
        </button>
      </div>

      {bajos > 0 && (
        <div style={{background: '#FFF7ED', border: '2px solid #FDBA74', borderRadius: '8px', padding: '1rem', color: '#9A3412', fontWeight: 700}}>
          Alerta: {bajos} ingrediente(s) con stock bajo. Revisa compras con proveedores.
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem'}}>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 700}}>INGREDIENTES</div>
          <div style={{fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0.5rem 0'}}>{ingredientes.length}</div>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.85)'}}>Registrados por compras</div>
        </div>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #16A34A 0%, #86EFAC 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)', fontWeight: 700}}>EXISTENCIA TOTAL</div>
          <div style={{fontSize: '28px', fontWeight: 800, color: '#052E16', margin: '0.5rem 0'}}>{valorStock.toFixed(1)}</div>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)'}}>Unidades combinadas</div>
        </div>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #F59E0B 0%, #FDE68A 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)', fontWeight: 700}}>STOCK BAJO</div>
          <div style={{fontSize: '28px', fontWeight: 800, color: '#111827', margin: '0.5rem 0'}}>{bajos}</div>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)'}}>Por debajo del minimo</div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.6fr)', gap: '1rem', alignItems: 'start'}}>
        <div style={{background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 220px', gap: '0.8rem', marginBottom: '1rem'}}>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ingrediente..."
              style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
            />
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
            >
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(proveedor => <option key={proveedor} value={proveedor}>{proveedor}</option>)}
            </select>
          </div>

          {gruposInventario.length === 0 ? (
            <div style={{padding: '1rem', color: '#64748B'}}>No hay ingredientes con ese filtro.</div>
          ) : gruposInventario.map(grupo => (
            <div key={grupo.proveedor} style={{marginBottom: '1.2rem'}}>
              <h2 style={{fontSize: '16px', margin: '0 0 0.75rem', color: '#111827'}}>{grupo.proveedor}</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem'}}>
                {grupo.items.map(item => (
                  <div key={item.id} style={{border: `2px solid ${item.estado === 'bajo' ? '#FDBA74' : '#E5E7EB'}`, borderRadius: '8px', padding: '0.9rem', background: item.estado === 'bajo' ? '#FFF7ED' : '#F8FAFC'}}>
                    <div style={{fontWeight: 800, color: '#111827', marginBottom: '0.55rem'}}>{item.nombre}</div>
                    <div style={{fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase'}}>Disponible</div>
                    <div style={{fontSize: '24px', fontWeight: 900, color: item.estado === 'bajo' ? '#C2410C' : '#166534', marginTop: '0.15rem'}}>
                      {cantidadStock(item.cantidad)} {nombreUnidadStock(item.unidad, item.cantidad)}
                    </div>
                    <div style={{fontSize: '12px', color: '#64748B', marginTop: '0.35rem'}}>Minimo: {cantidadStock(item.minimo)} {nombreUnidadStock(item.unidad, item.minimo)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
          <h2 style={{fontSize: '16px', margin: '0 0 0.8rem', color: '#111827'}}>Notificaciones</h2>
          <div style={{display: 'grid', gap: '0.65rem'}}>
            {notificaciones.length === 0 ? (
              <div style={{fontSize: '13px', color: '#64748B'}}>Las compras a proveedores apareceran aqui.</div>
            ) : notificaciones.map(mov => (
              <div key={mov.id} style={{border: '1px solid #DCFCE7', background: '#F0FDF4', borderRadius: '8px', padding: '0.75rem'}}>
                <div style={{fontSize: '13px', fontWeight: 800, color: '#166534'}}>{mov.motivo}</div>
                <div style={{fontSize: '12px', color: '#475569', marginTop: '0.25rem'}}>
                  Ingreso: {mov.ingrediente} +{cantidadStock(mov.cantidad)} {String(mov.motivo || '').includes('cajas x') ? 'piezas' : ''} | {mov.fecha}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
        <h2 style={{fontSize: '16px', margin: '0 0 0.8rem', color: '#111827'}}>Ultimos Movimientos</h2>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#F8FAFC', borderBottom: '2px solid #E5E7EB'}}>
                <th style={{padding: '0.85rem', textAlign: 'left'}}>Ingrediente</th>
                <th style={{padding: '0.85rem', textAlign: 'left'}}>Tipo</th>
                <th style={{padding: '0.85rem', textAlign: 'left'}}>Cantidad</th>
                <th style={{padding: '0.85rem', textAlign: 'left'}}>Detalle</th>
                <th style={{padding: '0.85rem', textAlign: 'left'}}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.slice(0, 12).map(mov => (
                <tr key={mov.id} style={{borderBottom: '1px solid #E5E7EB'}}>
                  <td style={{padding: '0.85rem', fontWeight: 700}}>{mov.ingrediente}</td>
                  <td style={{padding: '0.85rem'}}>
                    <span style={{padding: '0.3rem 0.55rem', borderRadius: '999px', fontSize: '12px', fontWeight: 800, background: mov.tipo === 'entrada' ? '#DCFCE7' : '#FEE2E2', color: mov.tipo === 'entrada' ? '#166534' : '#B91C1C'}}>
                      {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td style={{padding: '0.85rem'}}>{mov.cantidad}</td>
                  <td style={{padding: '0.85rem'}}>{mov.motivo}</td>
                  <td style={{padding: '0.85rem', color: '#64748B'}}>{mov.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarMovimiento && (
        <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'}}>
          <div style={{backgroundColor: 'white', borderRadius: '10px', padding: '1.5rem', maxWidth: '620px', width: '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'}}>
            <h2 style={{margin: '0 0 1rem', color: '#111827', fontSize: '20px', fontWeight: 800}}>Registrar salida de inventario</h2>
            <div style={{display: 'grid', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Buscar ingrediente</label>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Escribe para filtrar..."
                  style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                />
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', marginTop: '0.7rem'}}>
                  {ingredientesFiltrados.map(item => {
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
                  <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Cantidad que salio</label>
                  <input
                    type="number"
                    value={movData.cantidad}
                    onChange={(e) => setMovData({...movData, cantidad: e.target.value})}
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '6px', boxSizing: 'border-box'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 700, marginBottom: '0.5rem', color: '#333'}}>Persona que lo saco</label>
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
                <button onClick={() => setMostrarMovimiento(false)} style={{padding: '0.85rem', background: '#E5E7EB', color: '#111827', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={registrarMovimiento} style={{padding: '0.85rem', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer'}}>Registrar salida</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
