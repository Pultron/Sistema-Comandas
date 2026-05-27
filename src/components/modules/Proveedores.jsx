import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { useProveedores } from '../../hooks/useSupabase'

export const ProveedoresModule = () => {
  const {
    proveedores,
    historialCompras,
    guardarProveedor: guardarProveedorBd,
    eliminarProveedor: eliminarProveedorBd,
    activarProveedor: activarProveedorBd,
    registrarCompra: registrarCompraBd,
    actualizarPreciosProveedor: actualizarPreciosProveedorBd
  } = useProveedores()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarCompra, setMostrarCompra] = useState(false)
  const [mostrarPrecios, setMostrarPrecios] = useState(false)
  const [editando, setEditando] = useState(null)
  const [proveedorEliminar, setProveedorEliminar] = useState(null)
  const [proveedorPrecios, setProveedorPrecios] = useState(null)
  const [preciosForm, setPreciosForm] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    productos: ''
  })
  const [productosForm, setProductosForm] = useState([])

  const [compraData, setCompraData] = useState({
    proveedor: '',
    items: []
  })
  const [itemCompra, setItemCompra] = useState({
    productoId: '',
    producto: '',
    cantidad: '',
    unidad: '',
    precioUnitario: ''
  })
  const [editandoItemId, setEditandoItemId] = useState(null)

  const proveedoresActivos = proveedores.filter(prov => prov.estado !== 'inactivo')
  const proveedorSeleccionado = proveedoresActivos.find(p => p.nombre === compraData.proveedor)
  const productosCompra = proveedorSeleccionado?.productosProveedor || []
  const productoSeleccionado = productosCompra.find(producto => String(producto.id) === String(itemCompra.productoId))
  const totalCompra = compraData.items.reduce((total, item) => total + item.subtotal, 0)
  const subtotalPreview = parseFloat(itemCompra.cantidad || 0) * parseFloat(itemCompra.precioUnitario || 0)
  const [toast, setToast] = useState(null)

  const mostrarToast = (mensaje, tipo = 'error') => {
   setToast({ mensaje, tipo })
   setTimeout(() => setToast(null), 3000)
  }

  const unidadesDisponibles = ['kilos', 'litros', 'piezas', 'cajas']

  const crearProductoProveedor = (producto = {}) => ({
    id: producto.id || `nuevo-${Date.now()}-${Math.random()}`,
    nombre: producto.nombre || '',
    unidadesPermitidas: producto.unidadesPermitidas?.length ? producto.unidadesPermitidas : ['kilos'],
    preciosPorUnidad: { ...(producto.preciosPorUnidad || {}) }
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
      setProductosForm([crearProductoProveedor()])
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const abrirPrecios = (prov) => {
    setProveedorPrecios(prov)
    setPreciosForm(
      (prov.productosProveedor?.length ? prov.productosProveedor : prov.productos.map(nombre => ({ nombre })))
        .map(crearProductoProveedor)
    )
    setMostrarPrecios(true)
  }

  const cambiarPrecioProveedor = (productoId, unidad, valor) => {
    const precio = valor.replace(',', '.').replace(/[^0-9.]/g, '')
    setPreciosForm(prev => prev.map(producto => (
      producto.id === productoId
        ? {
            ...producto,
            preciosPorUnidad: {
              ...producto.preciosPorUnidad,
              [unidad]: precio
            }
          }
        : producto
    )))
  }

  const cambiarProductoPrecio = (productoId, campo, valor) => {
    setPreciosForm(prev => prev.map(producto =>
      producto.id === productoId ? { ...producto, [campo]: valor } : producto
    ))
  }

  const cambiarUnidadProductoPrecio = (productoId, unidad, activo) => {
    setPreciosForm(prev => prev.map(producto => {
      if (producto.id !== productoId) return producto

      const unidadesPermitidas = activo
        ? [...new Set([...producto.unidadesPermitidas, unidad])]
        : producto.unidadesPermitidas.filter(item => item !== unidad)
      const preciosPorUnidad = { ...producto.preciosPorUnidad }
      if (!activo) delete preciosPorUnidad[unidad]

      return { ...producto, unidadesPermitidas, preciosPorUnidad }
    }))
  }

  const cambiarPrecioProductoPrecio = (productoId, unidad, valor) => {
    const precio = valor.replace(',', '.').replace(/[^0-9.]/g, '')
    setPreciosForm(prev => prev.map(producto =>
      producto.id === productoId
        ? { ...producto, preciosPorUnidad: { ...producto.preciosPorUnidad, [unidad]: precio } }
        : producto
    ))
  }

  const agregarProductoPrecio = () => {
    setPreciosForm(prev => [crearProductoProveedor(), ...prev])
  }

  const quitarProductoPrecio = (productoId) => {
    setPreciosForm(prev => prev.filter(producto => producto.id !== productoId))
  }

  const cambiarProductoForm = (productoId, campo, valor) => {
    setProductosForm(prev => prev.map(producto =>
      producto.id === productoId ? { ...producto, [campo]: valor } : producto
    ))
  }

  const cambiarUnidadProductoForm = (productoId, unidad, activo) => {
    setProductosForm(prev => prev.map(producto => {
      if (producto.id !== productoId) return producto

      const unidadesPermitidas = activo
        ? [...new Set([...producto.unidadesPermitidas, unidad])]
        : producto.unidadesPermitidas.filter(item => item !== unidad)
      const preciosPorUnidad = { ...producto.preciosPorUnidad }
      if (!activo) delete preciosPorUnidad[unidad]

      return { ...producto, unidadesPermitidas, preciosPorUnidad }
    }))
  }

  const cambiarPrecioProductoForm = (productoId, unidad, valor) => {
    const precio = valor.replace(',', '.').replace(/[^0-9.]/g, '')
    setProductosForm(prev => prev.map(producto =>
      producto.id === productoId
        ? { ...producto, preciosPorUnidad: { ...producto.preciosPorUnidad, [unidad]: precio } }
        : producto
    ))
  }

  const agregarProductoForm = () => {
    setProductosForm(prev => [crearProductoProveedor(), ...prev])
  }

  const quitarProductoForm = (productoId) => {
    setProductosForm(prev => prev.filter(producto => producto.id !== productoId))
  }

  const guardarProveedor = async () => {
    if (!formData.nombre || !formData.contacto || !formData.telefono || !formData.email) {
      mostrarToast('Completa todos los campos')
      return
    }

    const productosValidos = productosForm
      .map(producto => ({
        ...producto,
        nombre: producto.nombre.trim(),
        unidadesPermitidas: producto.unidadesPermitidas.filter(Boolean),
        preciosPorUnidad: producto.preciosPorUnidad || {}
      }))
      .filter(producto => producto.nombre)

    if (!editando && productosValidos.length === 0) {
      mostrarToast('Agrega al menos un producto del proveedor')
      return
    }

    const productoIncompleto = productosValidos.find(producto =>
      producto.unidadesPermitidas.length === 0 ||
      producto.unidadesPermitidas.some(unidad => !parseFloat(producto.preciosPorUnidad?.[unidad]))
    )

    if (!editando && productoIncompleto) {
      mostrarToast('Cada producto necesita unidad y precio mayor a cero')
      return
    }

    try {
      const esEdicion = !!editando
      const resultado = await guardarProveedorBd({
        ...formData,
        productos: esEdicion ? formData.productos : productosValidos.map(producto => producto.nombre).join(', '),
        productosProveedor: esEdicion ? [] : productosValidos
      }, editando)
      setMostrarFormulario(false)
      if (resultado?.sincronizacionProductos?.ok === false) {
        mostrarToast('Proveedor guardado. Falta permiso para guardar productos_proveedor.')
      } else {
        mostrarToast(esEdicion ? 'Proveedor editado correctamente' : 'Proveedor registrado correctamente', 'success')
      }
    } catch (error) {
      mostrarToast(`No se pudo guardar el proveedor: ${error.message}`)
    }
  }

  const guardarPreciosProveedor = async () => {
    const productosValidos = preciosForm
      .map(producto => ({
        ...producto,
        nombre: producto.nombre.trim(),
        unidadesPermitidas: producto.unidadesPermitidas.filter(Boolean),
        preciosPorUnidad: producto.preciosPorUnidad || {}
      }))
      .filter(producto => producto.nombre)

    if (productosValidos.length === 0) {
      mostrarToast('Agrega al menos un producto')
      return
    }

    const tienePrecioInvalido = productosValidos.some(producto =>
      producto.unidadesPermitidas.length === 0 ||
      producto.unidadesPermitidas.some(unidad => {
        const precio = parseFloat(producto.preciosPorUnidad?.[unidad])
        return !precio || precio <= 0
      })
    )

    if (tienePrecioInvalido) {
      mostrarToast('Cada producto necesita unidad y precio mayor a cero')
      return
    }

    try {
      await actualizarPreciosProveedorBd(productosValidos, proveedorPrecios?.id)
      setMostrarPrecios(false)
      setProveedorPrecios(null)
      setPreciosForm([])
      mostrarToast('Precios/productos actualizados', 'success')
    } catch (error) {
      mostrarToast(`No se pudieron actualizar los precios: ${error.message}`)
    }
  }

  const seleccionarProveedorCompra = (nombreProveedor) => {
    setCompraData({ proveedor: nombreProveedor, items: [] })
    setItemCompra({ productoId: '', producto: '', cantidad: '', unidad: '', precioUnitario: '' })
    setEditandoItemId(null)
  }

  const seleccionarProductoCompra = (producto) => {
    const primeraUnidad = producto.unidadesPermitidas?.[0] || ''
    const precioPrimera = primeraUnidad ? (producto.preciosPorUnidad?.[primeraUnidad] ?? '') : ''
    setItemCompra(prev => ({
      ...prev,
      productoId: producto.id,
      producto: producto.nombre,
      unidad: primeraUnidad,
      precioUnitario: precioPrimera,
      cantidad: '1'
    }))
  }

  const cambiarUnidadCompra = (unidad) => {
    const precioUnitario = productoSeleccionado?.preciosPorUnidad?.[unidad] ?? ''
    setItemCompra(prev => ({ ...prev, unidad, precioUnitario }))
  }

  const agregarItemCompra = () => {
    const cantidad = parseFloat(itemCompra.cantidad)
    const precioUnitario = parseFloat(itemCompra.precioUnitario)

    if (!itemCompra.producto || !itemCompra.unidad || !cantidad || !precioUnitario) {
      mostrarToast('Selecciona un producto, cantidad y precio')
      return
    }

    const nuevoItem = {
      id: editandoItemId || Date.now(),
      producto: itemCompra.producto,
      cantidad,
      unidad: itemCompra.unidad,
      precioUnitario,
      subtotal: cantidad * precioUnitario
    }

    setCompraData(prev => ({ ...prev, items: [...prev.items, nuevoItem] }))
    setItemCompra({ productoId: '', producto: '', cantidad: '', unidad: '', precioUnitario: '' })
    setEditandoItemId(null)
  }

  const quitarItemCompra = (id) => {
    setCompraData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }))
  }

  const editarItemCompra = (item) => {
    setEditandoItemId(item.id)
    const producto = productosCompra.find(p => p.nombre === item.producto)
    setItemCompra({
      productoId: producto?.id || '',
      producto: item.producto,
      cantidad: String(item.cantidad),
      unidad: item.unidad,
      precioUnitario: item.precioUnitario
    })
    setCompraData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }))
  }

  const registrarCompra = () => {
    if (!compraData.proveedor || compraData.items.length === 0) {
      mostrarToast('Selecciona un proveedor y agrega al menos un producto')
      return
    }
    registrarCompraBd({ ...compraData, total: totalCompra })
    setCompraData({ proveedor: '', items: [] })
    setItemCompra({ productoId: '', producto: '', cantidad: '', unidad: '', precioUnitario: '' })
    setEditandoItemId(null)
    setMostrarCompra(false)
  }

  const confirmarEliminarProveedor = async () => {
    if (!proveedorEliminar) return
    await eliminarProveedorBd(proveedorEliminar.id)
    setProveedorEliminar(null)
    mostrarToast('Proveedor desactivado correctamente', 'success')
  }

  const activarProveedor = async (prov) => {
    await activarProveedorBd(prov.id)
    mostrarToast('Proveedor activado correctamente', 'success')
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        
        <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto'}}>
          <button onClick={() => setMostrarCompra(true)} style={{...appStyles.btnPrimary, background: '#4CAF50'}}>
            + Registrar Compra
          </button>
          <button onClick={() => abrirFormulario()} style={{...appStyles.btnPrimary}}>
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Tarjetas de Proveedores */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'}}>
        {proveedores.map(prov => {
          const inactivo = prov.estado === 'inactivo'
          return (
          <div key={prov.id} style={{background: inactivo ? '#F8FAFC' : 'white', borderRadius: '12px', padding: '1.5rem', border: `2px solid ${inactivo ? '#CBD5E1' : '#e0e0e0'}`, boxShadow: inactivo ? 'none' : '0 2px 8px rgba(0,0,0,0.1)', opacity: inactivo ? 0.82 : 1}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
              <div>
                <h3 style={{color: '#333', margin: 0, fontSize: '18px', fontWeight: 700}}>{prov.nombre}</h3>
              </div>
              {inactivo && (
                <span style={{background: '#E2E8F0', color: '#475569', padding: '0.35rem 0.6rem', borderRadius: '999px', fontSize: '11px', fontWeight: 800}}>INACTIVO</span>
              )}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem', fontSize: '13px', color: '#666'}}>
              <div><strong>Nombre Proveedor:</strong> {prov.contacto}</div>
              <div><strong>Teléfono:</strong> {prov.telefono}</div>
              <div><strong>Email:</strong> {prov.email}</div>
              <div style={{marginTop: '0.5rem'}}>
                <strong>Productos:</strong>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem'}}>
                  {prov.productos.map((prod, idx) => (
                    <span key={idx} style={{background: '#FFE0CC', color: '#D32F2F', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '11px'}}>{prod}</span>
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
              {inactivo ? (
                <button onClick={() => activarProveedor(prov)} style={{gridColumn: '1 / -1', padding: '0.7rem', background: '#22C55E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'}}>Activar proveedor</button>
              ) : (
                <>
                  <button onClick={() => abrirFormulario(prov)} style={{padding: '0.7rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px'}}>Editar</button>
                  <button onClick={() => setProveedorEliminar(prov)} style={{padding: '0.7rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px'}}>Desactivar</button>
                  <button onClick={() => abrirPrecios(prov)} style={{gridColumn: '1 / -1', padding: '0.7rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px'}}>Actualizar precios/productos</button>
                </>
              )}
            </div>
          </div>
        )})}
      </div>

      {/* Historial de Compras */}
      <div style={{background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
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
                  <td style={{padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#FF6F00'}}>${compra.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Proveedor */}
      {mostrarFormulario && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: editando ? '500px' : '860px', width: editando ? '90%' : '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>
              {editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Empresa</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Nombre proveedor</label>
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
              {!editando && (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.7rem'}}>
                    <label style={{display: 'block', fontWeight: 700, color: '#333'}}>Productos que vende</label>
                    <button type="button" onClick={agregarProductoForm} style={{padding: '0.55rem 0.8rem', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'}}>Agregar producto</button>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {productosForm.map((producto, index) => (
                      <div key={producto.id} style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '1rem', background: '#fafafa'}}>
                        <div style={{display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto', gap: '0.8rem', alignItems: 'end', marginBottom: '0.9rem'}}>
                          <div>
                            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#333', fontSize: '13px'}}>Producto</label>
                            <input
                              type="text"
                              value={producto.nombre}
                              onChange={(e) => cambiarProductoForm(producto.id, 'nombre', e.target.value)}
                              placeholder={`Producto ${index + 1}`}
                              style={{width: '100%', padding: '0.7rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}
                            />
                          </div>
                          <button type="button" onClick={() => quitarProductoForm(producto.id)} disabled={productosForm.length === 1} style={{height: '40px', padding: '0 0.75rem', background: productosForm.length === 1 ? '#bdbdbd' : '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: productosForm.length === 1 ? 'not-allowed' : 'pointer'}}>Eliminar</button>
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.7rem'}}>
                          {unidadesDisponibles.map(unidad => {
                            const activa = producto.unidadesPermitidas.includes(unidad)
                            return (
                              <div key={unidad} style={{padding: '0.75rem', background: activa ? '#F0FDF4' : '#fff', border: `1px solid ${activa ? '#86EFAC' : '#e5e5e5'}`, borderRadius: '6px'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#333', fontSize: '13px', marginBottom: '0.55rem'}}>
                                  <input
                                    type="checkbox"
                                    checked={activa}
                                    onChange={(e) => cambiarUnidadProductoForm(producto.id, unidad, e.target.checked)}
                                  />
                                  {formatUnidad(unidad)}
                                </label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  disabled={!activa}
                                  value={producto.preciosPorUnidad?.[unidad] ?? ''}
                                  onChange={(e) => cambiarPrecioProductoForm(producto.id, unidad, e.target.value)}
                                  placeholder="$0.00"
                                  style={{width: '100%', padding: '0.6rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', background: activa ? '#fff' : '#f1f1f1'}}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => setMostrarFormulario(false)} style={{padding: '0.8rem', background: '#ff0000', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={guardarProveedor} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Precios */}
      {mostrarPrecios && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '860px', width: '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 0.4rem 0', fontSize: '20px', fontWeight: 700}}>Actualizar precios/productos</h2>
            <div style={{color: '#666', fontSize: '13px', marginBottom: '1.5rem'}}>{proveedorPrecios?.nombre}</div>

            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.7rem'}}>
                <label style={{display: 'block', fontWeight: 700, color: '#333'}}>Productos que vende</label>
                <button type="button" onClick={agregarProductoPrecio} style={{padding: '0.55rem 0.8rem', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'}}>Agregar producto</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {preciosForm.length === 0 && (
                  <div style={{padding: '1rem', background: '#FFF3E0', color: '#8A4B00', borderRadius: '6px', fontSize: '13px'}}>
                    Agrega productos para este proveedor.
                  </div>
                )}
                {preciosForm.map((producto, index) => (
                  <div key={producto.id} style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '1rem', background: '#fafafa'}}>
                    <div style={{display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto', gap: '0.8rem', alignItems: 'end', marginBottom: '0.9rem'}}>
                      <div>
                        <label style={{display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#333', fontSize: '13px'}}>Producto</label>
                        <input
                          type="text"
                          value={producto.nombre}
                          onChange={(e) => cambiarProductoPrecio(producto.id, 'nombre', e.target.value)}
                          placeholder={`Producto ${index + 1}`}
                          style={{width: '100%', padding: '0.7rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}
                        />
                      </div>
                      <button type="button" onClick={() => quitarProductoPrecio(producto.id)} style={{height: '40px', padding: '0 0.75rem', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'}}>Eliminar</button>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.7rem'}}>
                      {unidadesDisponibles.map(unidad => {
                        const activa = producto.unidadesPermitidas.includes(unidad)
                        return (
                          <div key={unidad} style={{padding: '0.75rem', background: activa ? '#F0FDF4' : '#fff', border: `1px solid ${activa ? '#86EFAC' : '#e5e5e5'}`, borderRadius: '6px'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#333', fontSize: '13px', marginBottom: '0.55rem'}}>
                              <input
                                type="checkbox"
                                checked={activa}
                                onChange={(e) => cambiarUnidadProductoPrecio(producto.id, unidad, e.target.checked)}
                              />
                              {formatUnidad(unidad)}
                            </label>
                          <input
                            type="text"
                            inputMode="decimal"
                              disabled={!activa}
                            value={producto.preciosPorUnidad?.[unidad] ?? ''}
                              onChange={(e) => cambiarPrecioProductoPrecio(producto.id, unidad, e.target.value)}
                              placeholder="$0.00"
                              style={{width: '100%', padding: '0.6rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', background: activa ? '#fff' : '#f1f1f1'}}
                          />
                        </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem'}}>
              <button onClick={() => setMostrarPrecios(false)} style={{padding: '0.8rem', background: '#ff0808', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
              <button onClick={guardarPreciosProveedor} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Guardar precios/productos</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Compra */}
      {mostrarCompra && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '820px', width: '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>Registrar Compra</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Proveedor</label>
                <select value={compraData.proveedor} onChange={(e) => seleccionarProveedorCompra(e.target.value)} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}>
                  <option value="">Selecciona...</option>
                  {proveedoresActivos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>

              {proveedorSeleccionado && (
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Items</label>
                  {productosCompra.length > 0 ? (
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                      {productosCompra.map(producto => (
                        <button
                          key={producto.id}
                          type="button"
                          onClick={() => seleccionarProductoCompra(producto)}
                          style={{
                            padding: '0.45rem 0.7rem',
                            background: itemCompra.productoId === producto.id ? '#FF6F00' : '#FFE0CC',
                            color: itemCompra.productoId === producto.id ? 'white' : '#D32F2F',
                            border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {producto.nombre}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{padding: '0.8rem', background: '#FFF3E0', color: '#8A4B00', borderRadius: '6px', fontSize: '13px'}}>
                      No se pudieron cargar los productos configurados para este proveedor.
                    </div>
                  )}
                </div>
              )}

              {/* Fila de campos */}
              <div style={{display: 'grid', gridTemplateColumns: '1.2fr 0.7fr 0.7fr 0.7fr 0.8fr auto', gap: '0.8rem', alignItems: 'end'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Producto</label>
                  <input type="text" value={itemCompra.producto} readOnly placeholder="Selecciona un item" style={{width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', background: '#f8f8f8'}} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Cantidad</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={itemCompra.cantidad}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '')
                      setItemCompra(prev => ({ ...prev, cantidad: val }))
                    }}
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Unidad</label>
                  <select
                    value={itemCompra.unidad}
                    disabled={!productoSeleccionado}
                    onChange={(e) => cambiarUnidadCompra(e.target.value)}
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', background: productoSeleccionado ? 'white' : '#f8f8f8'}}
                  >
                    {productoSeleccionado?.unidadesPermitidas.map(unidad => (
                      <option key={unidad} value={unidad}>{formatUnidad(unidad)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Precio</label>
                  <input type="text" value={itemCompra.precioUnitario} readOnly placeholder="—" style={{width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', background: '#f8f8f8'}} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Subtotal</label>
                  <input
                    type="text"
                    value={subtotalPreview > 0 ? `$${subtotalPreview.toFixed(2)}` : ''}
                    readOnly
                    placeholder="$0.00"
                    style={{width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', background: '#f0fff0', color: '#2E7D32', fontWeight: 700}}
                  />
                </div>
                <button
                  type="button"
                  onClick={agregarItemCompra}
                  style={{height: '44px', padding: '0 1rem', background: editandoItemId ? '#FF6F00' : '#2196F3', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'}}
                >
                  {editandoItemId ? 'Actualizar' : 'Agregar'}
                </button>
              </div>

              {/* Tabla de items */}
              <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.8fr 0.8fr 80px', gap: '0.5rem', padding: '0.75rem 1rem', background: '#f5f5f5', color: '#666', fontSize: '12px', fontWeight: 700}}>
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Precio</span>
                  <span>Subtotal</span>
                  <span></span>
                </div>
                {compraData.items.length === 0 ? (
                  <div style={{padding: '1rem', color: '#777', fontSize: '13px'}}>Agrega productos a la compra.</div>
                ) : (
                  compraData.items.map(item => (
                    <div key={item.id} style={{display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.8fr 0.8fr 80px', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid #eee', fontSize: '13px'}}>
                      <strong>{item.producto}</strong>
                      <span>{item.cantidad} {item.unidad}</span>
                      <span>${item.precioUnitario.toFixed(2)}</span>
                      <strong>${item.subtotal.toFixed(2)}</strong>
                      <div style={{display: 'flex', gap: '0.4rem'}}>
                        <button type="button" onClick={() => editarItemCompra(item)} style={{padding: '0.35rem 0.55rem', background: '#FF6F00', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 700}}>✎</button>
                        <button type="button" onClick={() => quitarItemCompra(item.id)} style={{padding: '0.35rem 0.55rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 700}}>X</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f5f5f5', borderRadius: '8px'}}>
                <span style={{fontWeight: 700, color: '#333'}}>Total de la compra</span>
                <span style={{fontWeight: 800, color: '#FF6F00', fontSize: '22px'}}>${totalCompra.toFixed(2)}</span>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => setMostrarCompra(false)} style={{padding: '0.8rem', background: '#ff0000', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={registrarCompra} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Realizar Compra</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {proveedorEliminar && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: '1rem'}}>
          <div style={{background: '#fff', borderRadius: '12px', width: 'min(92vw, 420px)', boxShadow: '0 18px 50px rgba(0,0,0,0.35)', overflow: 'hidden'}}>
            <div style={{padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #F1F5F9'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
                <div style={{width: '42px', height: '42px', borderRadius: '50%', background: '#FEE2E2', color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '22px'}}>!</div>
                <div>
                  <h2 style={{margin: 0, color: '#1F2937', fontSize: '20px', fontWeight: 800}}>Desactivar proveedor</h2>
                  <div style={{marginTop: '0.25rem', color: '#6B7280', fontSize: '13px'}}>{proveedorEliminar.nombre}</div>
                </div>
              </div>
            </div>
            <div style={{padding: '1.2rem 1.5rem', color: '#374151', fontSize: '14px', lineHeight: 1.5}}>
              Esta acción ocultará el proveedor y sus productos de la lista activa. El historial se conserva para no afectar compras anteriores.
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', padding: '0 1.5rem 1.5rem'}}>
              <button onClick={() => setProveedorEliminar(null)} style={{padding: '0.85rem', background: '#E5E7EB', color: '#111827', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'}}>Cancelar</button>
              <button onClick={confirmarEliminarProveedor} style={{padding: '0.85rem', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer'}}>Desactivar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: '5.5rem', left: '50%', transform: 'translateX(-50%)',
          background: toast.tipo === 'error' ? '#EF4444' : '#4CAF50',
          color: 'white', padding: '1rem 2rem', borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontWeight: 600,
          fontSize: '14px', zIndex: 9999
        }}>
          {toast.mensaje}
        </div>
      )}
    </div>
  )
}
function formatUnidad(unidad) {
  const labels = { kilos: 'Kilos', piezas: 'Piezas', litros: 'Litros', cajas: 'Cajas' }
  return labels[unidad] || unidad
}
