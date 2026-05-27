// ============================================
// GASTROSOFT - HOOKS DE SUPABASE
// Funciones para leer y escribir datos reales
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const avisarCambioComandas = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('comandas:changed'))
  }
}

const avisarCambioMesas = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mesas:changed'))
  }
}

const avisarCambioReservaciones = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('reservaciones:changed'))
  }
}

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

  useEffect(() => {
    fetchComandas()

    const recargarComandas = () => fetchComandas()
    window.addEventListener('comandas:changed', recargarComandas)

    return () => window.removeEventListener('comandas:changed', recargarComandas)
  }, [])

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
          productoId: d.id_producto,
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
        cuentaSeparada: c.cuenta_separada || false,
        nombreCuenta: c.nombre_cuenta || '',
        idReservacion: c.id_reservacion || null,
        limiteCuentas: c.limite_cuentas || null,
        esReservacion: !!c.id_reservacion && !c.cuenta_separada,
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
    let id_mesa = comanda.id_mesa || null
    if (!id_mesa && comanda.mesa && comanda.mesa.startsWith('Mesa')) {
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
    const descuento = parseFloat(comanda.descuento || 0)
    const baseImpuesto = Math.max(subtotal - descuento, 0)
    const impuesto  = parseFloat((baseImpuesto * 0.15).toFixed(2))
    const total     = parseFloat((baseImpuesto + impuesto).toFixed(2))

    // Insertar comanda
    const comandaPayload = {
      numero_comanda: numero,
      id_mesa,
      nombre_mesa:  comanda.mesa,
      id_mesero:    1, // Cambia esto por el ID del usuario logueado
      estado:       'pendiente',
      subtotal,
      descuento,
      impuesto,
      total,
      cuenta_separada: comanda.cuentaSeparada || false,
      nombre_cuenta: comanda.nombreCuenta || null,
      observaciones: comanda.promocionAplicada ? JSON.stringify({ promocionAplicada: comanda.promocionAplicada }) : null
    }

    if (comanda.idReservacion) {
      comandaPayload.id_reservacion = comanda.idReservacion
    }

    if (comanda.limiteCuentas) {
      comandaPayload.limite_cuentas = comanda.limiteCuentas
    }

    const { data: nuevaComanda, error } = await supabase
      .from('comandas')
      .insert(comandaPayload)
      .select()
      .single()

    if (error || !nuevaComanda) return

    // Insertar detalles
    const detalles = comanda.items.map(item => ({
      id_comanda:      nuevaComanda.id,
      id_producto:     item.productoId || item.id,
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
      avisarCambioMesas()
    }

    await fetchComandas()
    avisarCambioComandas()
  }

  async function actualizarEstadoComanda(id, nuevoEstado) {
    const { data: comanda } = await supabase
      .from('comandas')
      .select('id_mesa, id_reservacion')
      .eq('id', id)
      .single()

    await supabase
      .from('comandas')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (nuevoEstado === 'pagado' && comanda?.id_mesa) {
      await liberarMesaSiNoTieneCuentasActivas(comanda.id_mesa)
    }

    if (nuevoEstado === 'pagado' && comanda?.id_reservacion) {
      await cerrarReservacionSiNoTieneCuentasActivas(comanda.id_reservacion, comanda.id_mesa)
    }

    await fetchComandas()
    avisarCambioComandas()
  }

  async function eliminarComanda(id) {
    const { data: comanda } = await supabase
      .from('comandas')
      .select('id_mesa, id_reservacion')
      .eq('id', id)
      .single()

    await supabase.from('detalles_comanda').delete().eq('id_comanda', id)
    await supabase.from('comandas').delete().eq('id', id)

    if (comanda?.id_mesa) {
      await liberarMesaSiNoTieneCuentasActivas(comanda.id_mesa)
    }

    if (comanda?.id_reservacion) {
      await cerrarReservacionSiNoTieneCuentasActivas(comanda.id_reservacion, comanda.id_mesa)
    }

    await fetchComandas()
    avisarCambioComandas()
  }

  async function actualizarComanda(id, comanda) {
    const subtotal = comanda.items.reduce((s, i) => s + i.subtotal, 0)
    const descuento = parseFloat(comanda.descuento || 0)
    const baseImpuesto = Math.max(subtotal - descuento, 0)
    const impuesto = parseFloat((baseImpuesto * 0.15).toFixed(2))
    const total = parseFloat((baseImpuesto + impuesto).toFixed(2))

    const { error: updateError } = await supabase
      .from('comandas')
      .update({
        subtotal,
        descuento,
        impuesto,
        total,
        observaciones: comanda.promocionAplicada ? JSON.stringify({ promocionAplicada: comanda.promocionAplicada }) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) throw updateError

    const { error: deleteError } = await supabase
      .from('detalles_comanda')
      .delete()
      .eq('id_comanda', id)

    if (deleteError) throw deleteError

    const detalles = comanda.items.map(item => ({
      id_comanda:      id,
      id_producto:     item.productoId || item.id,
      nombre_producto: item.nombre,
      cantidad:        item.cantidad,
      precio_unitario: parseFloat(item.precio.replace('$', '')),
      subtotal:        item.subtotal,
      comentarios:     item.comentarios || '',
      estado:          'pendiente'
    }))

    const { error: insertError } = await supabase.from('detalles_comanda').insert(detalles)
    if (insertError) throw insertError

    await fetchComandas()
    avisarCambioComandas()
  }

  async function liberarMesaSiNoTieneCuentasActivas(id_mesa) {
    const { data: activas } = await supabase
      .from('comandas')
      .select('id')
      .eq('id_mesa', id_mesa)
      .not('estado', 'in', '(pagado,cancelado)')
      .limit(1)

    if (!activas || activas.length === 0) {
      await supabase
        .from('mesas')
        .update({ estado: 'disponible' })
        .eq('id', id_mesa)
      avisarCambioMesas()
    }
  }

  async function cerrarReservacionSiNoTieneCuentasActivas(id_reservacion, id_mesa) {
    const { data: activas } = await supabase
      .from('comandas')
      .select('id')
      .eq('id_reservacion', id_reservacion)
      .not('estado', 'in', '(pagado,cancelado)')
      .limit(1)

    if (activas && activas.length > 0) return

    const { error: reservacionError } = await supabase
      .from('reservaciones')
      .update({ estado: 'terminada' })
      .eq('id', id_reservacion)

    if (reservacionError) throw reservacionError

    await supabase
      .from('comandas')
      .update({ id_reservacion: null })
      .eq('id_reservacion', id_reservacion)

    if (id_mesa) {
      await supabase
        .from('mesas')
        .update({ estado: 'disponible' })
        .eq('id', id_mesa)
      avisarCambioMesas()
    }

    avisarCambioReservaciones()
  }

  return { comandas, loading, agregarComanda, actualizarComanda, actualizarEstadoComanda, eliminarComanda, refetch: fetchComandas }
}

// ── MESAS ─────────────────────────────────────
export function useMesas() {
  const [mesas, setMesas]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMesas()

    const recargarMesas = () => fetchMesas()
    window.addEventListener('mesas:changed', recargarMesas)

    return () => window.removeEventListener('mesas:changed', recargarMesas)
  }, [])

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
    avisarCambioMesas()
  }

  async function eliminarMesa(id) {
    await supabase.from('mesas').delete().eq('id', id)
    await fetchMesas()
    avisarCambioMesas()
  }

  async function cambiarEstadoMesa(id, estado) {
    await supabase.from('mesas').update({ estado }).eq('id', id)
    await fetchMesas()
    avisarCambioMesas()
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
  const [reservaciones, setReservaciones] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    fetchReservaciones()

    const recargarReservaciones = () => fetchReservaciones()
    window.addEventListener('reservaciones:changed', recargarReservaciones)

    return () => window.removeEventListener('reservaciones:changed', recargarReservaciones)
  }, [])

  async function fetchReservaciones() {
    const { data, error } = await supabase
      .from('reservaciones')
      .select('*')
      .order('fecha', { ascending: true })

    if (error) {
      console.error('No se pudieron cargar reservaciones:', error.message)
      setReservaciones([])
      setLoading(false)
      return
    }

    const { data: mesasData } = await supabase
      .from('mesas')
      .select('id, numero')

    const mesasPorId = (mesasData || []).reduce((acc, mesa) => {
      acc[mesa.id] = mesa.numero
      return acc
    }, {})

    if (data) {
      setReservaciones(data.map(reservacion => ({
        ...reservacion,
        cliente: reservacion.cliente || '',
        estado: reservacion.estado || 'activa',
        mesa: mesasPorId[reservacion.id_mesa] || reservacion.id_mesa || '',
        idMesa: reservacion.id_mesa
      })))
    }
    setLoading(false)
  }

  async function guardarCliente() {}

  async function eliminarCliente() {}

  async function guardarReservacion(formData) {
    const idMesa = formData.mesa ? parseInt(formData.mesa) : null
    const personas = parseInt(formData.personas)

    const { data: nuevaReservacion, error: insertError } = await supabase.from('reservaciones').insert({
      cliente:  formData.cliente?.trim(),
      fecha:    formData.fecha,
      hora:     formData.hora,
      personas,
      id_mesa:  idMesa,
      telefono: formData.telefono
    }).select().single()

    if (insertError) {
      console.error('No se pudo guardar la reservacion:', insertError.message)
      throw insertError
    }

    if (idMesa) {
      const { data: mesaData } = await supabase
        .from('mesas')
        .select('numero')
        .eq('id', idMesa)
        .single()

      const { error: mesaError } = await supabase
        .from('mesas')
        .update({ estado: 'reservada' })
        .eq('id', idMesa)

      if (mesaError) {
        console.error('No se pudo reservar la mesa:', mesaError.message)
        throw mesaError
      }
      avisarCambioMesas()

      const nombreMesa = `Reservacion - Mesa ${mesaData?.numero || idMesa} - ${formData.cliente?.trim()}`
      const { error: comandaError } = await supabase.from('comandas').insert({
        numero_comanda: `RES-${Date.now()}`,
        id_mesa: idMesa,
        nombre_mesa: nombreMesa,
        id_mesero: 1,
        estado: 'pendiente',
        subtotal: 0,
        descuento: 0,
        impuesto: 0,
        total: 0,
        id_reservacion: nuevaReservacion.id,
        limite_cuentas: personas
      })

      if (comandaError) {
        console.error('No se pudo crear la comanda de reservacion:', comandaError.message)
        throw comandaError
      }

      avisarCambioComandas()
    }

    await fetchReservaciones()
    avisarCambioReservaciones()
  }

  return {
    clientes: [],
    reservaciones,
    loading,
    guardarCliente,
    eliminarCliente,
    guardarReservacion,
    refetch: fetchReservaciones,
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
      .order('nombre')

    const { data: productosProveedorData, error: productosProveedorError } = await supabase
      .from('productos_proveedor')
      .select('*')
      .order('nombre')

    if (productosProveedorError) {
      console.error('No se pudieron cargar productos_proveedor:', productosProveedorError.message)
    }

    if (proveedoresData) {
      const proveedoresFormateados = proveedoresData.map(p => {
      const productosProveedorConfigurados = (productosProveedorData || [])
        .filter(producto => String(producto.id_proveedor) === String(p.id))
        .map(formatProductoProveedor)
      const productosGuardados = Array.isArray(p.productos)
        ? p.productos
        : parseProductosProveedor(p.productos)
      const productosProveedor = productosProveedorConfigurados.length > 0
        ? productosProveedorConfigurados
        : productosGuardados.map((nombre, index) => ({
            id: `proveedor-${p.id}-${index}`,
            nombre,
            unidadesPermitidas: ['kilos', 'piezas', 'litros', 'cajas'],
            preciosPorUnidad: {}
          }))

      const productos = productosProveedor.length > 0
        ? productosProveedor.map(producto => producto.nombre)
        : productosGuardados

      return {
        ...p,
        productos,
        productosProveedor,
        comprasRealizadas: p.compras_proveedor?.length || 0,
        ultimaCompra: p.compras_proveedor?.[0]?.fecha || ''
      }
    })

      setProveedores(proveedoresFormateados)
    }
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
    const productos = normalizarProductosProveedor(formData.productosProveedor?.length
      ? formData.productosProveedor
      : parseProductosProveedor(formData.productos).map(nombre => ({ nombre }))
    )
    let sincronizacionProductos = { ok: true }

    if (editando) {
      const { error } = await supabase.from('proveedores').update({
        nombre:   formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email:    formData.email,
        productos: formData.productos
      }).eq('id', editando.id)

      if (error) throw error
      sincronizacionProductos = await intentarSincronizarProductosProveedor(editando.id, productos)
    } else {
      const { data: proveedor, error } = await supabase.from('proveedores').insert({
        nombre:   formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email:    formData.email,
        productos: formData.productos,
        estado:   'activo'
      }).select('id').single()

      if (error) throw error
      if (proveedor?.id) {
        sincronizacionProductos = await intentarSincronizarProductosProveedor(proveedor.id, productos)
      }
    }
    await fetchProveedores()
    return { sincronizacionProductos }
  }

  async function intentarSincronizarProductosProveedor(idProveedor, productos) {
    try {
      await sincronizarProductosProveedor(idProveedor, productos)
      return { ok: true }
    } catch (error) {
      console.warn('No se pudieron sincronizar productos_proveedor:', error.message)
      return { ok: false, error }
    }
  }

  async function sincronizarProductosProveedor(idProveedor, productos) {
    const { data: existentes, error: cargarError } = await supabase
      .from('productos_proveedor')
      .select('id, nombre')
      .eq('id_proveedor', idProveedor)

    if (cargarError) throw cargarError

    const nombres = productos.map(producto => producto.nombre.toLowerCase())
    const updates = (existentes || []).map(producto => {
      const productoForm = productos.find(item => item.nombre.toLowerCase() === String(producto.nombre || '').toLowerCase())
      const sigueActivo = nombres.includes(String(producto.nombre || '').toLowerCase())
      return supabase
        .from('productos_proveedor')
        .update(sigueActivo ? {
          nombre: productoForm.nombre,
          unidades_permitidas: productoForm.unidadesPermitidas,
          precio_por_unidad: productoForm.preciosPorUnidad,
          estado: 'activo'
        } : { estado: 'inactivo' })
        .eq('id', producto.id)
    })

    const nuevos = productos
      .filter(productoForm => !(existentes || []).some(producto => String(producto.nombre || '').toLowerCase() === productoForm.nombre.toLowerCase()))
      .map(producto => ({
        id_proveedor: idProveedor,
        nombre: producto.nombre,
        unidades_permitidas: producto.unidadesPermitidas,
        precio_por_unidad: producto.preciosPorUnidad,
        estado: 'activo'
      }))

    if (nuevos.length > 0) {
      updates.push(supabase.from('productos_proveedor').insert(nuevos))
    }

    const results = await Promise.all(updates)
    const error = results.find(result => result.error)?.error
    if (error) throw error
  }

  async function eliminarProveedor(id) {
    await supabase.from('proveedores').update({ estado: 'inactivo' }).eq('id', id)
    await supabase.from('productos_proveedor').update({ estado: 'inactivo' }).eq('id_proveedor', id)
    await fetchProveedores()
  }

  async function activarProveedor(id) {
    await supabase.from('proveedores').update({ estado: 'activo' }).eq('id', id)
    await supabase.from('productos_proveedor').update({ estado: 'activo' }).eq('id_proveedor', id)
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

  async function actualizarPreciosProveedor(productos, idProveedor = null) {
    if (idProveedor) {
      const productosNormalizados = normalizarProductosProveedor(productos)
      const { error: proveedorError } = await supabase
        .from('proveedores')
        .update({ productos: productosNormalizados.map(producto => producto.nombre).join(', ') })
        .eq('id', idProveedor)

      if (proveedorError) throw proveedorError

      await sincronizarProductosProveedor(idProveedor, productosNormalizados)
      await fetchProveedores()
      return
    }

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
    activarProveedor,
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
            : String(p.aplicable_to || p.aplicableTo || '').split(',').map(item => item.trim()).filter(Boolean),
        precio: parseFloat(p.precio) || 0
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
    const payload = {
      nombre:      formData.nombre,
      tipo:        formData.tipo,
      descripcion: formData.descripcion,
      descuento:   parseFloat(formData.descuento) || 0,
      precio:      parseFloat(formData.precio) || 0,
      fecha_inicio: formData.fechaInicio || null,
      fecha_fin:    formData.fechaFin || null,
      aplicable_to: parseArrayText(formData.aplicableTo),
      estado:      formData.estado || 'activa'
    }

    if (editando) {
      const { error } = await supabase
        .from('promociones')
        .update(payload)
        .eq('id', editando.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('promociones')
        .insert({ ...payload, estado: 'activa' })

      if (error) throw error
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
    servido:   'Pendiente',
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

function parseProductosProveedor(value) {
  return [...new Set(String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean))]
}

function parseArrayText(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizarProductosProveedor(productos) {
  return productos
    .map(producto => {
      const unidadesPermitidas = (producto.unidadesPermitidas || []).filter(Boolean)
      const preciosPorUnidad = Object.fromEntries(unidadesPermitidas.map(unidad => [
        unidad,
        parseFloat(producto.preciosPorUnidad?.[unidad]) || 0
      ]))

      return {
        nombre: String(producto.nombre || '').trim(),
        unidadesPermitidas,
        preciosPorUnidad
      }
    })
    .filter(producto => producto.nombre && producto.unidadesPermitidas.length > 0)
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
