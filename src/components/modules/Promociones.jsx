import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { useMenu, usePromociones } from '../../hooks/useSupabase'

export const PromocionesModule = () => {
  const {
    promociones,
    guardarPromocion: guardarPromocionBd,
    eliminarPromocion: eliminarPromocionBd,
    cambiarEstadoPromocion: cambiarEstadoPromocionBd
  } = usePromociones()
  const { menu } = useMenu()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [busquedaPromocion, setBusquedaPromocion] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [mensajeAlerta, setMensajeAlerta] = useState('')
  const [tipoAlerta, setTipoAlerta] = useState('error')
  const [guardando, setGuardando] = useState(false)
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

  const aplicablesSeleccionados = String(formData.aplicableTo || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const normalizarTexto = (texto) => String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const categoriasMenu = Object.entries(menu).map(([key, categoria]) => ({
    key,
    nombre: String(categoria.nombre || key.replace(/_/g, ' ')).replace(/^[\p{Emoji}]+\s*/u, '').trim(),
    productos: categoria.platillos || []
  }))

  const categoriaSeleccionada = categoriasMenu.find(categoria => categoria.key === categoriaActiva) || categoriasMenu[0]

  const productosMenu = categoriasMenu
    .flatMap(categoria => categoria.productos.map(producto => ({
      ...producto,
      categoriaKey: categoria.key,
      categoriaLabel: categoria.nombre || ''
    })))
    .filter((producto, index, arr) => arr.findIndex(item => item.nombre === producto.nombre) === index)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const productosCategoria = (categoriaSeleccionada?.productos || []).map(producto => ({
    ...producto,
    categoriaKey: categoriaSeleccionada.key,
    categoriaLabel: categoriaSeleccionada.nombre
  }))

  const productosFiltrados = productosCategoria.filter(producto =>
    normalizarTexto(producto.nombre).includes(normalizarTexto(busquedaProducto))
  )

  const actualizarAplicables = (valores) => {
    setFormData(prev => ({ ...prev, aplicableTo: valores.join(', ') }))
  }

  const alternarAplicable = (valor) => {
    const existe = aplicablesSeleccionados.some(item => item.toLowerCase() === valor.toLowerCase())
    actualizarAplicables(
      existe
        ? aplicablesSeleccionados.filter(item => item.toLowerCase() !== valor.toLowerCase())
        : [...aplicablesSeleccionados, valor]
    )
  }

  const categoriaEstaSeleccionada = (categoria) => (
    aplicablesSeleccionados.some(item => normalizarTexto(item) === normalizarTexto(categoria?.nombre))
  )

  const quitarAplicable = (valor) => {
    actualizarAplicables(aplicablesSeleccionados.filter(item => item !== valor))
  }

  const productosSeleccionados = productosMenu.filter(producto =>
    aplicablesSeleccionados.some(item => item.toLowerCase() === producto.nombre.toLowerCase())
  )

  const obtenerPrecioProducto = (producto) => parseFloat(String(producto?.precio || '0').replace('$', '')) || 0

  const obtenerReglaDescripcion = () => {
    const descripcion = normalizarTexto(formData.descripcion)
    const nxm = descripcion.match(/(\d+)\s*x\s*(\d+)/)
    const porcentaje = descripcion.match(/(\d+(?:\.\d+)?)\s*%/)
    const precioEspecial = descripcion.match(/(?:por|a|x)\s*\$?\s*(\d+(?:\.\d+)?)/) || descripcion.match(/\$\s*(\d+(?:\.\d+)?)/)

    return {
      texto: descripcion,
      nxm: nxm ? { compra: Number(nxm[1]), paga: Number(nxm[2]) } : null,
      gratis: descripcion.includes('gratis'),
      gratisTodo: descripcion.includes('todo gratis') || descripcion.includes('todos gratis') || descripcion.includes('productos gratis') || descripcion.trim() === 'gratis',
      porcentaje: porcentaje ? Number(porcentaje[1]) : descripcion.includes('mitad de precio') ? 50 : null,
      precioEspecial: precioEspecial ? Number(precioEspecial[1]) : null
    }
  }

  const productoEsGratis = (producto) => {
    const regla = reglaDescripcion
    const descripcion = regla.texto
    if (!regla.gratis) return false
    if (regla.gratisTodo) return true

    const nombre = normalizarTexto(producto.nombre)
    const categoria = normalizarTexto(producto.categoriaLabel)
    const antesGratis = descripcion.split('gratis')[0] || ''
    const objetivoGratis = antesGratis.includes('+')
      ? antesGratis.split('+').pop().trim()
      : antesGratis.trim()
    const esBebida = categoria.includes('bebida') ||
      ['refresco', 'bebida', 'gaseosa', 'limonada', 'jugo', 'te', 'cafe'].some(palabra => nombre.includes(palabra))

    if (objetivoGratis.includes(nombre) || nombre.includes(objetivoGratis)) return true
    if (objetivoGratis.includes(categoria) || categoria.includes(objetivoGratis)) return true
    if ((objetivoGratis.includes('bebida') || objetivoGratis.includes('refresco')) && esBebida) return true

    return false
  }

  const reglaDescripcion = obtenerReglaDescripcion()
  const tieneReglaAutomatica = reglaDescripcion.nxm || reglaDescripcion.gratis || reglaDescripcion.porcentaje || reglaDescripcion.precioEspecial
  const mostrarPrecioManual = formData.tipo === 'menu' && !tieneReglaAutomatica

  const calcularPrecioPromo = (precio) => {
    const descuento = parseFloat(formData.descuento) || 0
    const precioEspecial = parseFloat(formData.precio) || 0

    if (formData.tipo === 'porcentaje' || formData.tipo === 'horario') {
      return Math.max(precio - (precio * descuento / 100), 0)
    }

    if (formData.tipo === 'menu' && precioEspecial > 0) {
      return precioEspecial
    }

    return precio
  }

  const abrirFormulario = (promo = null) => {
    if (promo) {
      setEditando(promo)
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
        tipo: 'menu',
        descripcion: '',
        descuento: '',
        precio: '',
        fechaInicio: '',
        fechaFin: '',
        aplicableTo: ''
      })
      setEditando(null)
    }
    setBusquedaProducto('')
    setCategoriaActiva('')
    setMostrarFormulario(true)
  }

  const mostrarMensaje = (mensaje, tipo = 'error') => {
    setMensajeAlerta(mensaje)
    setTipoAlerta(tipo)
    setTimeout(() => setMensajeAlerta(''), 3500)
  }

  const guardarPromocion = async () => {
    if (!formData.nombre || !formData.descripcion || !formData.fechaInicio || !formData.fechaFin) {
      mostrarMensaje('Completa todos los campos')
      return
    }

    try {
      setGuardando(true)
      await guardarPromocionBd({
        ...formData,
        precio: reglaDescripcion.precioEspecial || formData.precio
      }, editando)

      setMostrarFormulario(false)
      mostrarMensaje(editando ? 'Promocion editada correctamente' : 'Promocion guardada correctamente', 'success')
      setBusquedaPromocion('')
    } catch (error) {
      mostrarMensaje(`No se pudo guardar la promocion: ${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarPromocion = (id) => {
    if (confirm('¿Eliminar esta promoción?')) {
      eliminarPromocionBd(id)
    }
  }

  const activarDesactivar = (id) => {
    const promo = promociones.find(p => p.id === id)
    if (!promo) return
    cambiarEstadoPromocionBd(id, promo.estado === 'activa' ? 'inactiva' : 'activa')
  }

  const activas = promociones.filter(p => p.estado === 'activa').length
  const inactivas = promociones.filter(p => p.estado === 'inactiva').length
  
  const promocionesFiltradas = promociones.filter(promo =>
    normalizarTexto(promo.nombre).includes(normalizarTexto(busquedaPromocion)) ||
    normalizarTexto(promo.descripcion).includes(normalizarTexto(busquedaPromocion))
  )

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}> Promociones y Descuentos</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            onClick={() => { abrirFormulario(); setBusquedaPromocion('') }}
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
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #666 0%, #999 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600}}>PAUSADAS</div>
          <div style={{fontSize: '28px', fontWeight: 700, color: 'white', margin: '0.5rem 0'}}>{inactivas}</div>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)'}}>En pausa</div>
        </div>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600}}>TOTAL DE PROMOCIONES</div>
          <div style={{fontSize: '28px', fontWeight: 700, color: 'white', margin: '0.5rem 0'}}>{promociones.length}</div>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)'}}>Registradas</div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div style={{background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <input 
          type="text" 
          value={busquedaPromocion} 
          onChange={(e) => setBusquedaPromocion(e.target.value)}
          placeholder="Buscar promoción por nombre o descripción..."
          style={{width: '100%', padding: '1rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box'}}
          onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      {/* Promociones */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem'}}>
        {promocionesFiltradas.length > 0 ? (
          promocionesFiltradas.map(promo => (
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
                {promo.tipo === '2x1' ? '' : promo.tipo === 'horario' ? '' : ''}
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
                {promo.estado === 'activa' ? '⏸ Pausar' : '▶ Activar'}
              </button>
              <button
                onClick={() => { abrirFormulario(promo); setBusquedaPromocion('') }}
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
                Editar
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
               Eliminar
            </button>
          </div>
          ))
        ) : (
          <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 2rem', background: 'white', borderRadius: '12px'}}>
            <div style={{color: '#999', fontSize: '48px', marginBottom: '1rem'}}>🎯</div>
            <p style={{color: '#999', fontSize: '16px', fontWeight: 600}}>No se encontraron promociones</p>
            <p style={{color: '#bbb', fontSize: '14px'}}>Intenta con otro término de búsqueda</p>
          </div>
        )}
      </div>

      {/* Modal Nueva Promoción */}
      {mostrarFormulario && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '760px', width: '92%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>
              {editando ? 'Editar Promoción' : 'Nueva Promoción'}
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Nombre</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{display: editando ? 'block' : 'none'}}>
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
              {(formData.tipo === 'porcentaje' || formData.tipo === 'horario') && (
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Descuento (%)</label>
                  <input type="number" value={formData.descuento} onChange={(e) => setFormData({...formData, descuento: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              )}
              {formData.tipo === '2x1' && (
                <div style={{padding: '1rem', background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: '8px', color: '#9A3412', fontSize: '13px', fontWeight: 700}}>
                  Esta promocion cobra 1 producto por cada 2 iguales agregados en la comanda.
                </div>
              )}
              {mostrarPrecioManual && (
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>{editando ? 'Precio especial del menu ($)' : 'Precio de la promocion ($)'}</label>
                  <input type="number" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              )}
              {formData.tipo === 'menu' && reglaDescripcion.nxm && (
                <div style={{padding: '1rem', background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: '8px', color: '#9A3412', fontSize: '13px', fontWeight: 700}}>
                  Regla detectada: {reglaDescripcion.nxm.compra}x{reglaDescripcion.nxm.paga}. Se calculara por cantidad en comanda.
                </div>
              )}
              {formData.tipo === 'menu' && reglaDescripcion.gratis && (
                <div style={{padding: '1rem', background: '#ECFDF5', border: '1px solid #86EFAC', borderRadius: '8px', color: '#166534', fontSize: '13px', fontWeight: 700}}>
                  Regla detectada: producto gratis. No se necesita precio manual.
                </div>
              )}
              {formData.tipo === 'menu' && reglaDescripcion.porcentaje && (
                <div style={{padding: '1rem', background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: '8px', color: '#1D4ED8', fontSize: '13px', fontWeight: 700}}>
                  Regla detectada: {reglaDescripcion.porcentaje}% de descuento escrito en la descripcion.
                </div>
              )}
              {formData.tipo === 'menu' && reglaDescripcion.precioEspecial && (
                <div style={{padding: '1rem', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', color: '#166534', fontSize: '13px', fontWeight: 700}}>
                  Regla detectada: paquete por ${reglaDescripcion.precioEspecial.toFixed(2)} escrito en la descripcion.
                </div>
              )}
              <div style={{border: '1px solid #e5e5e5', borderRadius: '8px', padding: '1rem', background: '#FAFAFA'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem', flexWrap: 'wrap'}}>
                  <label style={{display: 'block', fontWeight: 700, color: '#333'}}>Aplicar promocion a</label>
                </div>

                {aplicablesSeleccionados.length > 0 && (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem'}}>
                    {aplicablesSeleccionados.map(item => (
                      <button key={item} type="button" onClick={() => quitarAplicable(item)} style={{padding: '0.35rem 0.65rem', background: '#FFF3E0', color: '#9A3412', border: '1px solid #FDBA74', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'}}>
                        {item} x
                      </button>
                    ))}
                  </div>
                )}

                <div style={{display: 'grid', gap: '0.8rem'}}>
                  <div style={{display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem'}}>
                    {categoriasMenu.map(categoria => {
                      const activa = (categoriaSeleccionada?.key || '') === categoria.key
                      return (
                        <button
                          key={categoria.key}
                          type="button"
                          onClick={() => {
                            setCategoriaActiva(categoria.key)
                            setBusquedaProducto('')
                          }}
                          style={{padding: '0.55rem 0.8rem', background: activa ? '#2563EB' : '#EFF6FF', color: activa ? '#fff' : '#1E3A8A', border: `2px solid ${activa ? '#1D4ED8' : '#BFDBFE'}`, borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'}}
                        >
                          {categoria.nombre}
                        </button>
                      )
                    })}
                  </div>

                  {categoriaSeleccionada && (
                    <button
                      type="button"
                      onClick={() => alternarAplicable(categoriaSeleccionada.nombre)}
                      style={{padding: '0.65rem 0.75rem', background: categoriaEstaSeleccionada(categoriaSeleccionada) ? '#DCFCE7' : '#F8FAFC', color: categoriaEstaSeleccionada(categoriaSeleccionada) ? '#166534' : '#334155', border: `2px solid ${categoriaEstaSeleccionada(categoriaSeleccionada) ? '#22C55E' : '#CBD5E1'}`, borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', textAlign: 'left'}}
                    >
                      {categoriaEstaSeleccionada(categoriaSeleccionada) ? 'Categoria seleccionada: ' : 'Aplicar a toda la categoria: '}
                      {categoriaSeleccionada.nombre}
                    </button>
                  )}

                  <input type="text" value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} placeholder={`Buscar en ${categoriaSeleccionada?.nombre || 'categoria'}...`} style={{width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} />

                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '0.6rem', maxHeight: '210px', overflowY: 'auto'}}>
                    {productosFiltrados.length === 0 ? (
                      <div style={{fontSize: '13px', color: '#64748B', padding: '0.6rem'}}>No hay productos en esta categoria.</div>
                    ) : productosFiltrados.map(producto => {
                      const activo = aplicablesSeleccionados.some(item => item.toLowerCase() === producto.nombre.toLowerCase())
                      return (
                        <button key={producto.id} type="button" onClick={() => alternarAplicable(producto.nombre)} style={{padding: '0.65rem', background: activo ? '#DCFCE7' : '#fff', color: activo ? '#166534' : '#333', border: `2px solid ${activo ? '#22C55E' : '#e0e0e0'}`, borderRadius: '6px', fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontSize: '13px'}}>
                          {producto.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              {productosSeleccionados.length > 0 && (
                <div style={{border: '1px solid #BBF7D0', background: '#F0FDF4', borderRadius: '8px', padding: '1rem'}}>
                  <div style={{fontWeight: 800, color: '#166534', marginBottom: '0.8rem'}}>Vista previa de precios</div>
                  <div style={{display: 'grid', gap: '0.55rem'}}>
                    {reglaDescripcion.nxm ? (
                      productosSeleccionados.map(producto => {
                        const precio = obtenerPrecioProducto(producto)
                        const totalNormal = precio * reglaDescripcion.nxm.compra
                        const totalPromo = precio * reglaDescripcion.nxm.paga
                        return (
                          <div key={producto.id} style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.6rem', background: '#fff', borderRadius: '6px', border: '1px solid #DCFCE7'}}>
                            <span style={{fontWeight: 700, color: '#333'}}>{producto.nombre}</span>
                            <span style={{fontWeight: 800, color: '#166534'}}>
                              {reglaDescripcion.nxm.compra} x ${precio.toFixed(2)} = ${totalNormal.toFixed(2)} a ${totalPromo.toFixed(2)}
                            </span>
                          </div>
                        )
                      })
                    ) : reglaDescripcion.gratis ? (
                      <>
                        {productosSeleccionados.map(producto => {
                          const precio = obtenerPrecioProducto(producto)
                          const gratis = productoEsGratis(producto)
                          return (
                            <div key={producto.id} style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.6rem', background: '#fff', borderRadius: '6px', border: '1px solid #DCFCE7'}}>
                              <span style={{fontWeight: 700, color: '#333'}}>{producto.nombre}</span>
                              <span style={{fontWeight: 800, color: gratis ? '#166534' : '#333'}}>
                                {gratis ? `$${precio.toFixed(2)} a Gratis` : `$${precio.toFixed(2)}`}
                              </span>
                            </div>
                          )
                        })}
                        <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.7rem', background: '#DCFCE7', borderRadius: '6px', color: '#14532D', fontWeight: 900}}>
                          <span>Total con promocion</span>
                          <span>
                            ${productosSeleccionados.reduce((total, producto) => total + obtenerPrecioProducto(producto), 0).toFixed(2)} a ${productosSeleccionados.reduce((total, producto) => total + (productoEsGratis(producto) ? 0 : obtenerPrecioProducto(producto)), 0).toFixed(2)}
                          </span>
                        </div>
                      </>
                    ) : reglaDescripcion.precioEspecial ? (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.6rem', background: '#fff', borderRadius: '6px', border: '1px solid #DCFCE7'}}>
                        <span style={{fontWeight: 700, color: '#333'}}>
                          {productosSeleccionados.map(producto => producto.nombre).join(' + ')}
                        </span>
                        <span style={{fontWeight: 800, color: '#166534'}}>
                          ${productosSeleccionados.reduce((total, producto) => total + obtenerPrecioProducto(producto), 0).toFixed(2)} a ${reglaDescripcion.precioEspecial.toFixed(2)}
                        </span>
                      </div>
                    ) : reglaDescripcion.porcentaje ? (
                      productosSeleccionados.map(producto => {
                        const precio = obtenerPrecioProducto(producto)
                        const precioPromo = Math.max(precio - (precio * reglaDescripcion.porcentaje / 100), 0)
                        return (
                          <div key={producto.id} style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.6rem', background: '#fff', borderRadius: '6px', border: '1px solid #DCFCE7'}}>
                            <span style={{fontWeight: 700, color: '#333'}}>{producto.nombre}</span>
                            <span style={{fontWeight: 800, color: '#166534'}}>
                              ${precio.toFixed(2)} a ${precioPromo.toFixed(2)}
                            </span>
                          </div>
                        )
                      })
                    ) : formData.tipo === 'menu' ? (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.6rem', background: '#fff', borderRadius: '6px', border: '1px solid #DCFCE7'}}>
                        <span style={{fontWeight: 700, color: '#333'}}>
                          {productosSeleccionados.map(producto => producto.nombre).join(' + ')}
                        </span>
                        <span style={{fontWeight: 800, color: '#166534'}}>
                          ${productosSeleccionados.reduce((total, producto) => total + obtenerPrecioProducto(producto), 0).toFixed(2)} a ${calcularPrecioPromo(0).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      productosSeleccionados.map(producto => {
                        const precio = obtenerPrecioProducto(producto)
                        const precioPromo = calcularPrecioPromo(precio)
                        return (
                          <div key={producto.id} style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.6rem', background: '#fff', borderRadius: '6px', border: '1px solid #DCFCE7'}}>
                            <span style={{fontWeight: 700, color: '#333'}}>{producto.nombre}</span>
                            {formData.tipo === '2x1' ? (
                              <span style={{fontWeight: 800, color: '#166534'}}>2 x ${precio.toFixed(2)} = ${precio.toFixed(2)}</span>
                            ) : (
                              <span style={{fontWeight: 800, color: '#166534'}}>
                                ${precio.toFixed(2)} a ${precioPromo.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => { setMostrarFormulario(false); setBusquedaPromocion('') }} style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button
                  onClick={guardarPromocion}
                  disabled={guardando}
                  style={{padding: '0.8rem', background: guardando ? '#d1d5db' : 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer'}}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mensajeAlerta && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 3000,
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          background: tipoAlerta === 'success' ? '#16A34A' : '#EF4444',
          color: '#fff',
          fontWeight: 800,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          maxWidth: '520px'
        }}>
          {mensajeAlerta}
        </div>
      )}

    </div>
  )
}
