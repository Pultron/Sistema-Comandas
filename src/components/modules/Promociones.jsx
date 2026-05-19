import { useState } from 'react'
import { appStyles } from '../../styles/styles'

export const PromocionesModule = () => {
  const [promociones, setPromociones] = useState([
    {
      id: 1,
      nombre: '2x1 Pizzas',
      tipo: '2x1',
      descripcion: 'Compra 1 pizza y lleva 2',
      descuento: 50,
      fechaInicio: '2024-05-01',
      fechaFin: '2024-05-31',
      estado: 'activa',
      aplicableTo: ['Pizza Margherita', 'Pizza Pepperoni']
    },
    {
      id: 2,
      nombre: 'Happy Hour',
      tipo: 'horario',
      descripcion: '30% descuento de 5pm a 7pm',
      descuento: 30,
      fechaInicio: '2024-05-01',
      fechaFin: '2024-12-31',
      estado: 'activa',
      horarioInicio: '17:00',
      horarioFin: '19:00',
      aplicableTo: ['Bebidas', 'Entradas']
    },
    {
      id: 3,
      nombre: 'Menú del Día',
      tipo: 'menu',
      descripcion: 'Menú especial de hoy por $15',
      descuento: 0,
      precio: 15,
      fechaInicio: '2024-05-18',
      fechaFin: '2024-05-18',
      estado: 'activa',
      items: ['Sopa del día', 'Plato principal', 'Bebida']
    },
  ])

  const [menuDelDia, setMenuDelDia] = useState([
    { platillo: 'Sopa de verduras', precio: 45, preparacion: 5 },
    { platillo: 'Pollo a la mantequilla', precio: 120, preparacion: 15 },
    { platillo: 'Flan casero', precio: 35, preparacion: 2 },
  ])

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarMenuDia, setMostrarMenuDia] = useState(false)
  const [tipoPromo, setTipoPromo] = useState('porcentaje')
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'porcentaje',
    descripcion: '',
    descuento: '',
    precio: '',
    fechaInicio: '',
    fechaFin: '',
    aplicableTo: ''
  })

  const [nuevoPlato, setNuevoPlato] = useState({
    platillo: '',
    precio: '',
    preparacion: ''
  })

  const abrirFormulario = (promo = null) => {
    if (promo) {
      setEditando(promo)
      setTipoPromo(promo.tipo)
      setFormData({
        nombre: promo.nombre,
        tipo: promo.tipo,
        descripcion: promo.descripcion,
        descuento: promo.descuento || '',
        precio: promo.precio || '',
        fechaInicio: promo.fechaInicio,
        fechaFin: promo.fechaFin,
        aplicableTo: Array.isArray(promo.aplicableTo) ? promo.aplicableTo.join(', ') : ''
      })
    } else {
      setFormData({
        nombre: '',
        tipo: 'porcentaje',
        descripcion: '',
        descuento: '',
        precio: '',
        fechaInicio: '',
        fechaFin: '',
        aplicableTo: ''
      })
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const guardarPromocion = () => {
    if (!formData.nombre || !formData.descripcion || !formData.fechaInicio || !formData.fechaFin) {
      alert('Completa todos los campos')
      return
    }

    const aplicable = formData.aplicableTo.split(',').map(a => a.trim()).filter(a => a)

    if (editando) {
      setPromociones(promociones.map(p => p.id === editando.id ? {
        ...editando,
        ...formData,
        descuento: formData.descuento ? parseInt(formData.descuento) : 0,
        precio: formData.precio ? parseInt(formData.precio) : 0,
        aplicableTo: aplicable
      } : p))
    } else {
      const nuevoPromo = {
        id: Math.max(...promociones.map(p => p.id), 0) + 1,
        ...formData,
        descuento: formData.descuento ? parseInt(formData.descuento) : 0,
        precio: formData.precio ? parseInt(formData.precio) : 0,
        estado: 'activa',
        aplicableTo: aplicable
      }
      setPromociones([...promociones, nuevoPromo])
    }

    setMostrarFormulario(false)
  }

  const agregarPlato = () => {
    if (!nuevoPlato.platillo || !nuevoPlato.precio) {
      alert('Completa el platillo y precio')
      return
    }

    const plato = {
      platillo: nuevoPlato.platillo,
      precio: parseInt(nuevoPlato.precio),
      preparacion: parseInt(nuevoPlato.preparacion) || 5
    }

    setMenuDelDia([...menuDelDia, plato])
    setNuevoPlato({ platillo: '', precio: '', preparacion: '' })
  }

  const eliminarPlato = (idx) => {
    setMenuDelDia(menuDelDia.filter((_, i) => i !== idx))
  }

  const eliminarPromocion = (id) => {
    if (confirm('¿Eliminar esta promoción?')) {
      setPromociones(promociones.filter(p => p.id !== id))
    }
  }

  const activarDesactivar = (id) => {
    setPromociones(promociones.map(p => p.id === id ? {
      ...p,
      estado: p.estado === 'activa' ? 'inactiva' : 'activa'
    } : p))
  }

  const activas = promociones.filter(p => p.estado === 'activa').length

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>🎯 Promociones y Descuentos</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            onClick={() => setMostrarMenuDia(true)}
            style={{...appStyles.btnPrimary, background: '#9C27B0'}}
          >
            📅 Menú del Día
          </button>
          <button
            onClick={() => abrirFormulario()}
            style={{...appStyles.btnPrimary}}
          >
            + Nueva Promoción
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #FF6F00 0%, #FFB300 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)', fontWeight: 600}}>PROMOCIONES ACTIVAS</div>
          <div style={{fontSize: '28px', fontWeight: 700, color: '#000', margin: '0.5rem 0'}}>{activas}</div>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)'}}>Disponibles ahora</div>
        </div>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600}}>TOTAL DE PROMOCIONES</div>
          <div style={{fontSize: '28px', fontWeight: 700, color: 'white', margin: '0.5rem 0'}}>{promociones.length}</div>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)'}}>Registradas</div>
        </div>
      </div>

      {/* Promociones */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem'}}>
        {promociones.map(promo => (
          <div key={promo.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: `2px solid ${promo.estado === 'activa' ? '#4CAF50' : '#ddd'}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
              <div>
                <h3 style={{color: '#333', margin: 0, fontSize: '17px', fontWeight: 700}}>{promo.nombre}</h3>
                <span style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '0.3rem 0.8rem',
                  background: promo.estado === 'activa' ? '#E0F0E0' : '#FFE0E0',
                  color: promo.estado === 'activa' ? '#2E7D32' : '#D32F2F',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {promo.estado === 'activa' ? '✓ ACTIVA' : '✗ INACTIVA'}
                </span>
              </div>
              <span style={{fontSize: '26px'}}>
                {promo.tipo === '2x1' ? '🎁' : promo.tipo === 'horario' ? '⏰' : '📅'}
              </span>
            </div>

            <p style={{color: '#666', fontSize: '13px', margin: '0.8rem 0'}}>{promo.descripcion}</p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '13px', color: '#666'}}>
              <div><strong>Tipo:</strong> {promo.tipo}</div>
              {promo.descuento > 0 && <div><strong>Descuento:</strong> {promo.descuento}%</div>}
              {promo.precio > 0 && <div><strong>Precio:</strong> ${promo.precio}</div>}
              <div><strong>Vigencia:</strong> {promo.fechaInicio} a {promo.fechaFin}</div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem'}}>
              <button
                onClick={() => activarDesactivar(promo.id)}
                style={{
                  padding: '0.7rem',
                  background: promo.estado === 'activa' ? '#FFB300' : '#4CAF50',
                  color: promo.estado === 'activa' ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {promo.estado === 'activa' ? '⏸️ Pausar' : '▶️ Activar'}
              </button>
              <button
                onClick={() => abrirFormulario(promo)}
                style={{
                  padding: '0.7rem',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ✏️ Editar
              </button>
            </div>

            <button
              onClick={() => eliminarPromocion(promo.id)}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                marginTop: '0.8rem'
              }}
            >
              🗑️ Eliminar
            </button>
          </div>
        ))}
      </div>

      {/* Modal Nueva Promoción */}
      {mostrarFormulario && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>
              {editando ? 'Editar Promoción' : 'Nueva Promoción'}
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Nombre</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Tipo de Promoción</label>
                <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}>
                  <option value="porcentaje">Descuento %</option>
                  <option value="2x1">2x1</option>
                  <option value="horario">Happy Hour</option>
                  <option value="menu">Menú del Día</option>
                </select>
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Descripción</label>
                <input type="text" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} placeholder="Describe la promoción..." style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              {formData.tipo !== 'menu' && (
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Descuento (%)</label>
                    <input type="number" value={formData.descuento} onChange={(e) => setFormData({...formData, descuento: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                  </div>
                  <div>
                    <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Precio Especial ($)</label>
                    <input type="number" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                  </div>
                </div>
              )}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Fecha Inicio</label>
                  <input type="date" value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Fecha Fin</label>
                  <input type="date" value={formData.fechaFin} onChange={(e) => setFormData({...formData, fechaFin: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Aplicable a (separado por comas)</label>
                <input type="text" value={formData.aplicableTo} onChange={(e) => setFormData({...formData, aplicableTo: e.target.value})} placeholder="Ej: Pizza, Bebidas, Postres..." style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => setMostrarFormulario(false)} style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={guardarPromocion} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Menú del Día */}
      {mostrarMenuDia && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>📅 Menú del Día</h2>
            
            <div style={{background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
              <p style={{color: '#666', fontSize: '13px', margin: 0}}>Configura los platillos especiales de hoy</p>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Platillo</label>
                <input type="text" value={nuevoPlato.platillo} onChange={(e) => setNuevoPlato({...nuevoPlato, platillo: e.target.value})} placeholder="Ej: Sopa de verduras..." style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Precio ($)</label>
                  <input type="number" value={nuevoPlato.precio} onChange={(e) => setNuevoPlato({...nuevoPlato, precio: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Prep (min)</label>
                  <input type="number" value={nuevoPlato.preparacion} onChange={(e) => setNuevoPlato({...nuevoPlato, preparacion: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <button onClick={agregarPlato} style={{padding: '0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>+ Agregar Platillo</button>
            </div>

            <h3 style={{color: '#333', fontSize: '16px', fontWeight: 700, marginBottom: '1rem'}}>Platillos del Día</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem'}}>
              {menuDelDia.map((plato, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{fontWeight: 600, color: '#333'}}>{plato.platillo}</div>
                    <div style={{fontSize: '12px', color: '#666'}}>Prep: {plato.preparacion} min</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{fontWeight: 700, color: '#FF6F00', fontSize: '16px'}}>${plato.precio}</div>
                    <button
                      onClick={() => eliminarPlato(idx)}
                      style={{padding: '0.5rem 0.8rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <button onClick={() => setMostrarMenuDia(false)} style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cerrar</button>
              <button onClick={() => setMostrarMenuDia(false)} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #9C27B0 0%, #BA68C8 100%)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
