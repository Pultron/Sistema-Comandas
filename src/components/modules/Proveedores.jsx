import { useState } from 'react'
import { appStyles } from '../../styles/styles'

export const ProveedoresModule = () => {
  const [proveedores, setProveedores] = useState([
    {
      id: 1,
      nombre: 'GreenSupply',
      contacto: 'Carlos Flores',
      telefono: '555-0101',
      email: 'info@greensupply.mx',
      productos: ['Tomate', 'Champiñones', 'Lechuga'],
      comprasRealizadas: 12,
      ultimaCompra: '2024-05-15',
      estado: 'activo'
    },
    {
      id: 2,
      nombre: 'LácteosGourmet',
      contacto: 'María López',
      telefono: '555-0102',
      email: 'ventas@lactesgourmet.mx',
      productos: ['Queso Mozzarella', 'Ricotta', 'Crema'],
      comprasRealizadas: 8,
      ultimaCompra: '2024-05-14',
      estado: 'activo'
    },
    {
      id: 3,
      nombre: 'GranosMX',
      contacto: 'Juan Rodríguez',
      telefono: '555-0103',
      email: 'contacto@granosmx.mx',
      productos: ['Harina Premium', 'Arroz', 'Maíz'],
      comprasRealizadas: 15,
      ultimaCompra: '2024-05-13',
      estado: 'activo'
    },
  ])

  const [historialCompras, setHistorialCompras] = useState([
    { id: 1, proveedor: 'GreenSupply', fecha: '2024-05-15', total: 1500, items: 5 },
    { id: 2, proveedor: 'LácteosGourmet', fecha: '2024-05-14', total: 3200, items: 3 },
    { id: 3, proveedor: 'GranosMX', fecha: '2024-05-13', total: 2800, items: 4 },
    { id: 4, proveedor: 'GreenSupply', fecha: '2024-05-10', total: 1200, items: 3 },
  ])

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarCompra, setMostrarCompra] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    productos: ''
  })

  const [compraData, setCompraData] = useState({
    proveedor: '',
    total: '',
    items: ''
  })

  const abrirFormulario = (prov = null) => {
    if (prov) {
      setEditando(prov)
      setFormData({
        nombre: prov.nombre,
        contacto: prov.contacto,
        telefono: prov.telefono,
        email: prov.email,
        productos: prov.productos.join(', ')
      })
    } else {
      setFormData({ nombre: '', contacto: '', telefono: '', email: '', productos: '' })
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const guardarProveedor = () => {
    if (!formData.nombre || !formData.contacto || !formData.telefono || !formData.email) {
      alert('Completa todos los campos')
      return
    }

    const productos = formData.productos.split(',').map(p => p.trim()).filter(p => p)

    if (editando) {
      setProveedores(proveedores.map(p => p.id === editando.id ? {
        ...editando,
        ...formData,
        productos
      } : p))
    } else {
      const nuevoProveedor = {
        id: Math.max(...proveedores.map(p => p.id), 0) + 1,
        ...formData,
        productos,
        comprasRealizadas: 0,
        ultimaCompra: new Date().toISOString().split('T')[0],
        estado: 'activo'
      }
      setProveedores([...proveedores, nuevoProveedor])
    }

    setMostrarFormulario(false)
  }

  const registrarCompra = () => {
    if (!compraData.proveedor || !compraData.total || !compraData.items) {
      alert('Completa todos los campos')
      return
    }

    const nuevaCompra = {
      id: Math.max(...historialCompras.map(c => c.id), 0) + 1,
      proveedor: compraData.proveedor,
      fecha: new Date().toISOString().split('T')[0],
      total: parseInt(compraData.total),
      items: parseInt(compraData.items)
    }

    setHistorialCompras([nuevaCompra, ...historialCompras])

    setProveedores(proveedores.map(p => p.nombre === compraData.proveedor ? {
      ...p,
      comprasRealizadas: p.comprasRealizadas + 1,
      ultimaCompra: nuevaCompra.fecha
    } : p))

    setCompraData({ proveedor: '', total: '', items: '' })
    setMostrarCompra(false)
  }

  const eliminarProveedor = (id) => {
    if (confirm('¿Eliminar este proveedor?')) {
      setProveedores(proveedores.filter(p => p.id !== id))
    }
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>🏢 Gestión de Proveedores</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            onClick={() => setMostrarCompra(true)}
            style={{...appStyles.btnPrimary, background: '#4CAF50'}}
          >
            + Registrar Compra
          </button>
          <button
            onClick={() => abrirFormulario()}
            style={{...appStyles.btnPrimary}}
          >
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Tarjetas de Proveedores */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'}}>
        {proveedores.map(prov => (
          <div key={prov.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '2px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
              <div>
                <h3 style={{color: '#333', margin: 0, fontSize: '18px', fontWeight: 700}}>{prov.nombre}</h3>
                <span style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '0.3rem 0.8rem',
                  background: '#E0F0E0',
                  color: '#2E7D32',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  ✓ {prov.estado.toUpperCase()}
                </span>
              </div>
              <span style={{fontSize: '28px'}}>🏢</span>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem', fontSize: '13px', color: '#666'}}>
              <div><strong>Contacto:</strong> {prov.contacto}</div>
              <div><strong>Teléfono:</strong> {prov.telefono}</div>
              <div><strong>Email:</strong> {prov.email}</div>
              <div style={{marginTop: '0.5rem'}}>
                <strong>Productos:</strong>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem'}}>
                  {prov.productos.map((prod, idx) => (
                    <span key={idx} style={{
                      background: '#FFE0CC',
                      color: '#D32F2F',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px'}}>
              <div>
                <div style={{fontSize: '11px', color: '#999', fontWeight: 600}}>COMPRAS REALIZADAS</div>
                <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}>{prov.comprasRealizadas}</div>
              </div>
              <div>
                <div style={{fontSize: '11px', color: '#999', fontWeight: 600}}>ÚLTIMA COMPRA</div>
                <div style={{fontSize: '12px', fontWeight: 600, color: '#333'}}>{prov.ultimaCompra}</div>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem'}}>
              <button
                onClick={() => abrirFormulario(prov)}
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
              <button
                onClick={() => eliminarProveedor(prov.id)}
                style={{
                  padding: '0.7rem',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Historial de Compras */}
      <div style={{background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'}}>
        <h2 style={{color: '#333', marginTop: 0, fontSize: '18px', fontWeight: 700, marginBottom: '1rem'}}>Historial de Compras</h2>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Proveedor</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Fecha</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Items</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 600}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {historialCompras.map(compra => (
                <tr key={compra.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '1rem'}}>{compra.proveedor}</td>
                  <td style={{padding: '1rem'}}>{compra.fecha}</td>
                  <td style={{padding: '1rem'}}>{compra.items}</td>
                  <td style={{padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#FF6F00'}}>
                    ${compra.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Proveedor */}
      {mostrarFormulario && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>
              {editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Nombre</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Contacto</label>
                <input type="text" value={formData.contacto} onChange={(e) => setFormData({...formData, contacto: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Teléfono</label>
                  <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Productos (separados por comas)</label>
                <input type="text" value={formData.productos} onChange={(e) => setFormData({...formData, productos: e.target.value})} placeholder="Ej: Tomate, Lechuga, Queso..." style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => setMostrarFormulario(false)} style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={guardarProveedor} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Compra */}
      {mostrarCompra && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>Registrar Compra</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Proveedor</label>
                <select value={compraData.proveedor} onChange={(e) => setCompraData({...compraData, proveedor: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}>
                  <option value="">Selecciona...</option>
                  {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Items</label>
                  <input type="number" value={compraData.items} onChange={(e) => setCompraData({...compraData, items: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Total ($)</label>
                  <input type="number" value={compraData.total} onChange={(e) => setCompraData({...compraData, total: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => setMostrarCompra(false)} style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={registrarCompra} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
