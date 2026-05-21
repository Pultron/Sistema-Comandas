// ============================================
// GASTROSOFT - HOOKS DE SUPABASE
// Funciones para leer y escribir datos reales
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── PRODUCTOS / MENÚ ──────────────────────────
export function useMenu() {
  const [menu, setMenu]         = useState({})
  const [categories, setCategories] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function fetchMenu() {
      // Traer categorías
      const { data: cats } = await supabase
        .from('categorias')
        .select('*')
        .order('orden')

      // Traer productos disponibles con su categoría
      const { data: prods } = await supabase
        .from('productos')
        .select('*, categorias(nombre, icono, color_hex)')
        .eq('disponible', true)

      if (!cats || !prods) {
        setLoading(false)
        return
      }

      // Armar estructura igual a menuData.js
      const menuObj = {}
      cats.forEach(cat => {
        const key = cat.nombre.toLowerCase().replace(/\s+/g, '_')
        menuObj[key] = {
          nombre: `${cat.icono} ${cat.nombre}`,
          color:  cat.color_hex,
          platillos: prods
            .filter(p => p.id_categoria === cat.id)
            .map(p => ({
              id:           p.id,
              nombre:       p.nombre,
              precio:       `$${parseFloat(p.precio).toFixed(2)}`,
              imagen:       p.imagen || '🍽️',
              ingredientes: p.ingredientes ? p.ingredientes.split(',').map(i => i.trim()) : [],
              tiempo:       p.tiempo_preparacion
            }))
        }
      })

      const catsFormatted = cats.map(cat => ({
        key:   cat.nombre.toLowerCase().replace(/\s+/g, '_'),
        label: cat.nombre,
        icon:  cat.icono
      }))

      setMenu(menuObj)
      setCategories(catsFormatted)
      setLoading(false)
    }
    fetchMenu()
  }, [])

  return { menu, categories, loading }
}

// ── COMANDAS ──────────────────────────────────
export function useComandas() {
  const [comandas, setComandas] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { fetchComandas() }, [])

  async function fetchComandas() {
    const { data } = await supabase
      .from('comandas')
      .select(`
        *,
        usuarios(nombre),
        mesas(numero),
        detalles_comanda(*, productos(nombre, precio))
      `)
      .not('estado', 'eq', 'cancelado')
      .order('created_at', { ascending: false })

    if (data) {
      const formatted = data.map(c => ({
        id:       c.id,
        id_mesa:  c.id_mesa,
        mesa:     c.nombre_mesa || `Mesa ${c.mesas?.numero || '?'}`,
        mesero:   c.usuarios?.nombre || 'Sin mesero',
        fecha:    c.created_at,
        productos: c.detalles_comanda?.length || 0,
        total:    `$${parseFloat(c.total).toFixed(2)}`,
        estado:   formatEstado(c.estado),
        items:    c.detalles_comanda?.map(d => ({
          id:         d.id,
          nombre:     d.nombre_producto,
          precio:     `$${parseFloat(d.precio_unitario).toFixed(2)}`,
          cantidad:   d.cantidad,
          subtotal:   d.subtotal,
          comentarios: d.comentarios || '',
          estado:     d.estado
        })) || [],
        subtotal:  c.subtotal,
        descuento: c.descuento,
        impuesto:  c.impuesto,
        rawTotal:  c.total,
        observaciones: c.observaciones
      }))
      setComandas(formatted)
    }
    setLoading(false)
  }

  async function agregarComanda(comanda) {
    // Generar número de comanda
    const numero = `COM-${Date.now()}`

    // Buscar id_mesa si existe
    let id_mesa = null
    if (comanda.mesa && comanda.mesa.startsWith('Mesa')) {
      const num = parseInt(comanda.mesa.replace('Mesa', '').trim())
      const { data: mesaData } = await supabase
        .from('mesas')
        .select('id')
        .eq('numero', num)
        .single()
      id_mesa = mesaData?.id || null
    }

    // Calcular totales
    const subtotal  = comanda.items.reduce((s, i) => s + i.subtotal, 0)
    const impuesto  = parseFloat((subtotal * 0.15).toFixed(2))
    const total     = parseFloat((subtotal + impuesto).toFixed(2))

    // Insertar comanda
    const { data: nuevaComanda, error } = await supabase
      .from('comandas')
      .insert({
        numero_comanda: numero,
        id_mesa,
        nombre_mesa:  comanda.mesa,
        id_mesero:    1, // Cambia esto por el ID del usuario logueado
        estado:       'pendiente',
        subtotal,
        impuesto,
        total
      })
      .select()
      .single()

    if (error || !nuevaComanda) return

    // Insertar detalles
    const detalles = comanda.items.map(item => ({
      id_comanda:      nuevaComanda.id,
      id_producto:     item.id,
      nombre_producto: item.nombre,
      cantidad:        item.cantidad,
      precio_unitario: parseFloat(item.precio.replace('$', '')),
      subtotal:        item.subtotal,
      comentarios:     item.comentarios || '',
      estado:          'pendiente'
    }))

    await supabase.from('detalles_comanda').insert(detalles)

    // Actualizar estado de mesa
    if (id_mesa) {
      await supabase
        .from('mesas')
        .update({ estado: 'ocupada' })
        .eq('id', id_mesa)
    }

    await fetchComandas()
  }

  async function actualizarEstadoComanda(id, nuevoEstado) {
    await supabase
      .from('comandas')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id)
    await fetchComandas()
  }

  async function eliminarComanda(id) {
    const { data: comanda } = await supabase
      .from('comandas')
      .select('id_mesa')
      .eq('id', id)
      .single()

    await supabase.from('detalles_comanda').delete().eq('id_comanda', id)
    await supabase.from('comandas').delete().eq('id', id)

    if (comanda?.id_mesa) {
      await supabase
        .from('mesas')
        .update({ estado: 'disponible' })
        .eq('id', comanda.id_mesa)
    }

    await fetchComandas()
  }

  return { comandas, loading, agregarComanda, actualizarEstadoComanda, eliminarComanda, refetch: fetchComandas }
}

// ── MESAS ─────────────────────────────────────
export function useMesas() {
  const [mesas, setMesas]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMesas() }, [])

  async function fetchMesas() {
    const { data } = await supabase
      .from('mesas')
      .select('*')
      .order('numero')
    if (data) setMesas(data)
    setLoading(false)
  }

  async function guardarMesa(formData, editando) {
    if (editando) {
      await supabase.from('mesas').update({
        numero:    parseInt(formData.numero),
        ubicacion: formData.ubicacion
      }).eq('id', editando.id)
    } else {
      await supabase.from('mesas').insert({
        numero:    parseInt(formData.numero),
        ubicacion: formData.ubicacion,
        estado:    'disponible'
      })
    }
    await fetchMesas()
  }

  async function eliminarMesa(id) {
    await supabase.from('mesas').delete().eq('id', id)
    await fetchMesas()
  }

  async function cambiarEstadoMesa(id, estado) {
    await supabase.from('mesas').update({ estado }).eq('id', id)
    await fetchMesas()
  }

  return { mesas, loading, guardarMesa, eliminarMesa, cambiarEstadoMesa, refetch: fetchMesas }
}

// ── PERSONAL ──────────────────────────────────
export function usePersonal() {
  const [personal, setPersonal] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { fetchPersonal() }, [])

  async function fetchPersonal() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre')

    const { data: asistenciasData, error: asistenciasError } = await supabase
      .from('asistencia')
      .select('id_usuario')

    if (asistenciasError) {
      console.error('No se pudieron cargar asistencia:', asistenciasError.message)
    }

    const asistenciasPorUsuario = (asistenciasData || []).reduce((acc, asistencia) => {
      acc[asistencia.id_usuario] = (acc[asistencia.id_usuario] || 0) + 1
      return acc
    }, {})

    if (data) {
      setPersonal(data.map(u => ({
        ...u,
        fechaIngreso: u.fecha_ingreso || u.fechaIngreso || '',
        asistencia: asistenciasPorUsuario[u.id] ?? u.asistencia ?? 0
      })))
    }
    setLoading(false)
  }

  async function guardarEmpleado(formData, editando) {
    if (editando) {
      await supabase.from('usuarios').update({
        nombre:  formData.nombre,
        usuario: formData.usuario,
        rol:     formData.rol,
        estado:  formData.estado
      }).eq('id', editando.id)
    } else {
      await supabase.from('usuarios').insert({
        nombre:       formData.nombre,
        usuario:      formData.usuario,
        correo:       formData.correo || null,
        contrasena:   formData.password,
        rol:          formData.rol,
        estado:       'activo',
        fecha_ingreso: new Date().toISOString().split('T')[0]
      })
    }
    await fetchPersonal()
  }

  async function eliminarEmpleado(id) {
    await supabase.from('usuarios').update({ estado: 'inactivo' }).eq('id', id)
    await fetchPersonal()
  }

  return { personal, loading, guardarEmpleado, eliminarEmpleado, refetch: fetchPersonal }
}

// ── CLIENTES ──────────────────────────────────
export function useClientes() {
  const [clientes, setClientes]         = useState([])
  const [reservaciones, setReservaciones] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => { fetchClientes(); fetchReservaciones() }, [])

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*, visitas_clientes(fecha_visita, total_gastado)')
      .eq('estado_activo', true)
      .order('nombre')
    if (data) {
      setClientes(data.map(cliente => {
        const visitas = Array.isArray(cliente.visitas_clientes) ? cliente.visitas_clientes : []
        const capitalUtilizado = visitas.reduce((total, visita) => total + (parseFloat(visita.total_gastado) || 0), 0)

        return {
          ...cliente,
          tipoCliente: cliente.tipo_cliente || 'regular',
          capitalConsumable: parseFloat(cliente.capital_consumable) || 0,
          capitalConsumible: parseFloat(cliente.capital_consumable) || 0,
          capitalUtilizado,
          fechasVisitas: visitas.map(visita => visita.fecha_visita).filter(Boolean),
          estadoActivo: cliente.estado_activo ?? true
        }
      }))
    }
    setLoading(false)
  }

  async function fetchReservaciones() {
    const { data } = await supabase
      .from('reservaciones')
      .select('*, clientes(nombre), mesas(numero)')
      .order('fecha', { ascending: true })
    if (data) setReservaciones(data)
  }

  async function guardarCliente(formData, editando) {
    if (editando) {
      await supabase.from('clientes').update({
        nombre:            formData.nombre,
        email:             formData.email,
        telefono:          formData.telefono,
        tipo_cliente:      formData.tipoCliente,
        capital_consumable: parseFloat(formData.capitalConsumable) || 0
      }).eq('id', editando.id)
    } else {
      await supabase.from('clientes').insert({
        nombre:       formData.nombre,
        email:        formData.email,
        telefono:     formData.telefono,
        tipo_cliente: formData.tipoCliente || 'regular',
        capital_consumable: parseFloat(formData.capitalConsumable) || 0
      })
    }
    await fetchClientes()
  }

  async function eliminarCliente(id) {
    await supabase.from('clientes').update({ estado_activo: false }).eq('id', id)
    await fetchClientes()
  }

  async function guardarReservacion(formData) {
    await supabase.from('reservaciones').insert({
      nombre_cliente: formData.cliente,
      telefono:       formData.telefono,
      fecha:          formData.fecha,
      hora:           formData.hora,
      personas:       parseInt(formData.personas),
      id_mesa:        formData.mesa ? parseInt(formData.mesa) : null,
      estado:         'pendiente'
    })
    await fetchReservaciones()
  }

  return {
    clientes,
    reservaciones,
    loading,
    guardarCliente,
    eliminarCliente,
    guardarReservacion,
    refetch: fetchClientes,
    refetchReservaciones: fetchReservaciones
  }
}

// ── INVENTARIO ────────────────────────────────
export function useInventario() {
  const [ingredientes, setIngredientes] = useState([])
  const [movimientos, setMovimientos]   = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => { fetchInventario(); fetchMovimientos() }, [])

  async function fetchInventario() {
    const { data } = await supabase
      .from('inventario')
      .select('*, proveedores(nombre)')
      .order('nombre')
    if (data) setIngredientes(data.map(i => ({
      ...i,
      minimo: i.cantidad_minima,
      proveedor: i.proveedores?.nombre || 'Sin proveedor'
    })))
    setLoading(false)
  }

  async function fetchMovimientos() {
    const { data } = await supabase
      .from('movimientos_inventario')
      .select('*, inventario(nombre)')
      .order('fecha', { ascending: false })
      .limit(50)
    if (data) setMovimientos(data.map(m => ({
      ...m,
      ingrediente: m.inventario?.nombre
    })))
  }

  async function guardarIngrediente(formData, editando) {
    const cantidad  = parseFloat(formData.cantidad)
    const minimo    = parseFloat(formData.minimo)
    const estado    = cantidad <= minimo ? 'bajo' : 'normal'

    if (editando) {
      await supabase.from('inventario').update({
        nombre:          formData.nombre,
        unidad:          formData.unidad,
        cantidad,
        cantidad_minima: minimo,
        estado,
        updated_at:      new Date().toISOString()
      }).eq('id', editando.id)
    } else {
      await supabase.from('inventario').insert({
        nombre:          formData.nombre,
        unidad:          formData.unidad,
        cantidad,
        cantidad_minima: minimo,
        estado
      })
    }
    await fetchInventario()
  }

  async function eliminarIngrediente(id) {
    await supabase.from('inventario').delete().eq('id', id)
    await fetchInventario()
  }

  async function registrarMovimiento(movData) {
    const { data: ing } = await supabase
      .from('inventario')
      .select('id, cantidad, cantidad_minima')
      .eq('nombre', movData.ingrediente)
      .single()

    if (!ing) return

    await supabase.from('movimientos_inventario').insert({
      id_ingrediente: ing.id,
      tipo:           movData.tipo,
      cantidad:       parseFloat(movData.cantidad),
      motivo:         movData.motivo,
      fecha:          new Date().toISOString().split('T')[0]
    })

    // Actualizar cantidad
    const nuevaCantidad = movData.tipo === 'entrada'
      ? ing.cantidad + parseFloat(movData.cantidad)
      : ing.cantidad - parseFloat(movData.cantidad)

    await supabase.from('inventario').update({
      cantidad:   nuevaCantidad,
      estado:     nuevaCantidad <= ing.cantidad_minima ? 'bajo' : 'normal',
      updated_at: new Date().toISOString()
    }).eq('nombre', movData.ingrediente)

    await fetchInventario()
    await fetchMovimientos()
  }

  return { ingredientes, movimientos, loading, guardarIngrediente, eliminarIngrediente, registrarMovimiento, refetch: fetchInventario }
}

// ── PROVEEDORES ───────────────────────────────
export function useProveedores() {
  const [proveedores, setProveedores]       = useState([])
  const [historialCompras, setHistorial]    = useState([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => { fetchProveedores(); fetchHistorial() }, [])

  async function fetchProveedores() {
    const { data: proveedoresData } = await supabase
      .from('proveedores')
      .select('*, compras_proveedor(fecha, total)')
      .eq('estado', 'activo')
      .order('nombre')

    const { data: productosProveedorData, error: productosProveedorError } = await supabase
      .from('productos_proveedor')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre')

    if (productosProveedorError) {
      console.error('No se pudieron cargar productos_proveedor:', productosProveedorError.message)
    }

    if (proveedoresData) setProveedores(proveedoresData.map(p => {
      const productosProveedor = (productosProveedorData || [])
        .filter(producto => String(producto.id_proveedor) === String(p.id))
        .map(formatProductoProveedor)

      const productos = productosProveedor.length > 0
        ? productosProveedor.map(producto => producto.nombre)
        : Array.isArray(p.productos)
          ? p.productos
          : String(p.productos || '').split(',').map(item => item.trim()).filter(Boolean)

      return {
        ...p,
        productos,
        productosProveedor,
        comprasRealizadas: p.compras_proveedor?.length || 0,
        ultimaCompra: p.compras_proveedor?.[0]?.fecha || ''
      }
    }))
    setLoading(false)
  }

  async function fetchHistorial() {
    const { data } = await supabase
      .from('compras_proveedor')
      .select('*, proveedores(nombre)')
      .order('fecha', { ascending: false })
      .limit(30)
    if (data) setHistorial(data.map(c => ({
      ...c,
      proveedor: c.proveedores?.nombre,
      items: formatItemsCompra(c)
    })))
  }

  async function guardarProveedor(formData, editando) {
    if (editando) {
      await supabase.from('proveedores').update({
        nombre:   formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email:    formData.email,
        productos: formData.productos
      }).eq('id', editando.id)
    } else {
      await supabase.from('proveedores').insert({
        nombre:   formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email:    formData.email,
        productos: formData.productos,
        estado:   'activo'
      })
    }
    await fetchProveedores()
  }

  async function eliminarProveedor(id) {
    await supabase.from('proveedores').update({ estado: 'inactivo' }).eq('id', id)
    await fetchProveedores()
  }

  async function registrarCompra(compraData) {
    const { data: prov } = await supabase
      .from('proveedores')
      .select('id')
      .eq('nombre', compraData.proveedor)
      .single()

    if (!prov) return

    await supabase.from('compras_proveedor').insert({
      id_proveedor: prov.id,
      fecha:        new Date().toISOString().split('T')[0],
      total:        parseFloat(compraData.total),
      num_items:    compraData.items?.length || 0,
      observaciones: JSON.stringify({ items: compraData.items || [] })
    })
    await fetchHistorial()
    await fetchProveedores()
  }

  async function actualizarPreciosProveedor(productos) {
    const updates = productos.map(producto => {
      const preciosPorUnidad = Object.fromEntries(
        Object.entries(producto.preciosPorUnidad || {}).map(([unidad, precio]) => [
          unidad,
          parseFloat(precio) || 0
        ])
      )

      return supabase
        .from('productos_proveedor')
        .update({ precio_por_unidad: preciosPorUnidad })
        .eq('id', producto.id)
    })

    const results = await Promise.all(updates)
    const error = results.find(result => result.error)?.error

    if (error) throw error

    await fetchProveedores()
  }

  return {
    proveedores,
    historialCompras,
    loading,
    guardarProveedor,
    eliminarProveedor,
    registrarCompra,
    actualizarPreciosProveedor,
    refetch: fetchProveedores
  }
}

// ── PROMOCIONES ───────────────────────────────
export function usePromociones() {
  const [promociones, setPromociones] = useState([])
  const [menuDelDia, setMenuDelDia]   = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { fetchPromociones(); fetchMenuDelDia() }, [])

  async function fetchPromociones() {
    const { data } = await supabase
      .from('promociones')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setPromociones(data.map(p => ({
        ...p,
        fechaInicio: p.fecha_inicio || p.fechaInicio || '',
        fechaFin: p.fecha_fin || p.fechaFin || '',
        aplicableTo: Array.isArray(p.aplicable_to)
          ? p.aplicable_to
          : Array.isArray(p.aplicableTo)
            ? p.aplicableTo
            : String(p.aplicable_to || p.aplicableTo || '').split(',').map(item => item.trim()).filter(Boolean)
      })))
    }
    setLoading(false)
  }

  async function fetchMenuDelDia() {
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('menu_del_dia')
      .select('*')
      .eq('fecha', hoy)
      .eq('activo', true)
    if (data) setMenuDelDia(data.map(m => ({
      platillo:    m.nombre_platillo,
      precio:      m.precio,
      preparacion: m.tiempo_prep
    })))
  }

  async function guardarPromocion(formData, editando) {
    if (editando) {
      await supabase.from('promociones').update({
        nombre:      formData.nombre,
        tipo:        formData.tipo,
        descripcion: formData.descripcion,
        descuento:   parseFloat(formData.descuento) || 0,
        fecha_inicio: formData.fechaInicio || null,
        fecha_fin:    formData.fechaFin || null,
        estado:      formData.estado || 'activa'
      }).eq('id', editando.id)
    } else {
      await supabase.from('promociones').insert({
        nombre:      formData.nombre,
        tipo:        formData.tipo,
        descripcion: formData.descripcion,
        descuento:   parseFloat(formData.descuento) || 0,
        fecha_inicio: formData.fechaInicio || null,
        fecha_fin:    formData.fechaFin || null,
        estado:      'activa'
      })
    }
    await fetchPromociones()
  }

  async function eliminarPromocion(id) {
    await supabase.from('promociones').update({ estado: 'inactiva' }).eq('id', id)
    await fetchPromociones()
  }

  async function cambiarEstadoPromocion(id, estado) {
    await supabase.from('promociones').update({ estado }).eq('id', id)
    await fetchPromociones()
  }

  return { promociones, menuDelDia, loading, guardarPromocion, eliminarPromocion, cambiarEstadoPromocion, refetch: fetchPromociones }
}

// ── CAJA ──────────────────────────────────────
export function useCaja() {
  const [historialCortes, setHistorial] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => { fetchCortes() }, [])

  async function fetchCortes() {
    const { data } = await supabase
      .from('cortes_caja')
      .select('*, usuarios(nombre)')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setHistorial(data.map(c => ({
      ...c,
      totalVentas: parseFloat(c.total_ventas) || 0,
      pagosEfectivo: parseFloat(c.pagos_efectivo) || 0,
      pagosTarjeta: parseFloat(c.pagos_tarjeta) || 0,
      cancelaciones: parseFloat(c.cancelaciones) || 0,
      descuentos: parseFloat(c.descuentos) || 0,
      usuario: c.usuarios?.nombre || 'Sin usuario'
    })))
    setLoading(false)
  }

  async function realizarCorte(formCorte) {
    const totalVentas =
      parseFloat(formCorte.pagosEfectivo || 0) +
      parseFloat(formCorte.pagosTarjeta  || 0)

    await supabase.from('cortes_caja').insert({
      id_usuario:    1, // Cambia por el ID del usuario logueado
      turno:         formCorte.turno,
      fecha:         new Date().toISOString().split('T')[0],
      total_ventas:  totalVentas,
      pagos_efectivo: parseFloat(formCorte.pagosEfectivo || 0),
      pagos_tarjeta:  parseFloat(formCorte.pagosTarjeta  || 0),
      cancelaciones:  parseFloat(formCorte.cancelaciones || 0),
      descuentos:     parseFloat(formCorte.descuentos    || 0)
    })
    await fetchCortes()
  }

  return { historialCortes, loading, realizarCorte, refetch: fetchCortes }
}

// ── REPORTES ──────────────────────────────────
export function useReportes() {
  const [ventas, setVentas]         = useState([])
  const [topProductos, setTop]      = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => { fetchReportes() }, [])

  async function fetchReportes() {
    // Ventas de los últimos 7 días
    const { data: ventasData } = await supabase
      .from('comandas')
      .select('created_at, total, estado')
      .eq('estado', 'pagado')
      .order('created_at', { ascending: false })
      .limit(100)

    // Productos más vendidos
    const { data: prodsData } = await supabase
      .from('detalles_comanda')
      .select('nombre_producto, cantidad, subtotal')
      .order('cantidad', { ascending: false })
      .limit(10)

    if (ventasData) setVentas(ventasData)
    if (prodsData)  setTop(prodsData)
    setLoading(false)
  }

  return { ventas, topProductos, loading, refetch: fetchReportes }
}

// ── HELPER ────────────────────────────────────
function formatEstado(estado) {
  const map = {
    pendiente: 'Pendiente',
    servido:   'Servido',
    pagado:    'Pagado',
    cancelado: 'Cancelado'
  }
  return map[estado] || estado
}

function formatItemsCompra(compra) {
  try {
    const detalle = JSON.parse(compra.observaciones || '{}')
    if (Array.isArray(detalle.items) && detalle.items.length > 0) {
      return detalle.items
        .map(item => `${item.cantidad} ${item.unidad} ${item.producto}`)
        .join(', ')
    }
  } catch {
    // Las compras anteriores pueden tener observaciones como texto libre.
  }

  return compra.num_items ? `${compra.num_items} items` : 'Sin detalle'
}

function formatProductoProveedor(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    unidadesPermitidas: parseArrayField(producto.unidades_permitidas),
    preciosPorUnidad: parseJsonField(producto.precio_por_unidad)
  }
}

function parseArrayField(value) {
  if (Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(value || '')
      .split(',')
      .map(item => item.replace(/[\[\]"]/g, '').trim())
      .filter(Boolean)
  }
}

function parseJsonField(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value

  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}
