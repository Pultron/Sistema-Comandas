import { useState } from 'react'
import { ComandIcon, CheckCircleIcon, DollarSignIcon, ClockIcon } from '../Icons'
import { appStyles } from '../../styles/styles'
import { useComandas, useMenu, useMesas, usePromociones } from '../../hooks/useSupabase'

export const Comandas = ({
  comandas: comandasProp,
  mesas: mesasProp,
  agregarComanda: agregarComandaProp,
  actualizarComanda: actualizarComandaProp,
  eliminarComanda: eliminarComandaProp,
  currentUser
}) => {
  const { comandas: comandasBd, agregarComanda: agregarComandaBd, actualizarComanda, eliminarComanda: eliminarComandaHook } = useComandas()
  const { menu, categories, loading: loadingMenu } = useMenu()
  const { mesas: mesasBd } = useMesas()
  const { promociones } = usePromociones()

  const comandas = comandasProp || comandasBd
  const mesas = mesasProp || mesasBd
  const agregarComanda = agregarComandaProp || agregarComandaBd
  const actualizarComandaActiva = actualizarComandaProp || actualizarComanda
  const eliminarComandaBd = eliminarComandaProp || eliminarComandaHook
  const puedeEliminarComandas = ['administrador', 'admin'].includes(currentUser?.rol)
  const [showComandaForm, setShowComandaForm] = useState(false)
  const [showMesaModal, setShowMesaModal] = useState(false)
  const [numeroMesa, setNumeroMesa] = useState('')
  const [nombreMesa, setNombreMesa] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [itemsComanda, setItemsComanda] = useState([])
  const [comandaSeleccionada, setComandaSeleccionada] = useState(null)
  const [mostrarVerComanda, setMostrarVerComanda] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState('')
  const [comandaAEditar, setComandaAEditar] = useState(null)
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false)
  const [comandaAEliminar, setComandaAEliminar] = useState(null)
  const [mostrarCuentaSeparada, setMostrarCuentaSeparada] = useState(false)
  const [comandaBaseCuenta, setComandaBaseCuenta] = useState(null)
  const [nombreCuentaSeparada, setNombreCuentaSeparada] = useState('')
  const [promocionesSeleccionadasIds, setPromocionesSeleccionadasIds] = useState([])

  // Calcular ID automáticamente basado en comandas existentes
  const proximoId = comandas.length + 1
  const activeCategory = selectedCategory || categories[0]?.key || ''
  const productosMenu = Object.entries(menu).flatMap(([key, categoria]) => {
    const categoriaInfo = categories.find(cat => cat.key === key)
    return (categoria.platillos || []).map(producto => ({
      ...producto,
      categoria: key,
      categoriaLabel: categoriaInfo?.label || categoria.nombre || key
    }))
  })
  const categoriasMenu = [...new Set(productosMenu.map(producto => producto.categoriaLabel).filter(Boolean))]

  // Calcular estadísticas
  const totalComandas = comandas.length
  const comandasPagadas = comandas.filter(c => c.estado === 'Pagado').length
  const ingresosHoy = comandas.reduce((total, c) => {
    const precio = parseFloat(c.total.replace('$', ''))
    return total + precio
  }, 0)

  const getBadgeStyle = (estado) => {
    if (estado === 'Pendiente') return { ...appStyles.badge, ...appStyles.badgePending }
    return { ...appStyles.badge, ...appStyles.badgeSuccess }
  }

  const formatearHora = (fecha) => {
    const date = new Date(fecha)
    if (Number.isNaN(date.getTime())) return fecha || ''

    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const obtenerComandaActiva = (mesa) => {
    return comandas.find(c => {
      const mismaMesa = c.mesa === `Mesa ${mesa.numero}` || c.mesa?.startsWith(`Mesa ${mesa.numero} `)
      return mismaMesa && c.estado !== 'Pagado' && c.estado !== 'Cancelado'
    })
  }

  const mesasDisponibles = mesas
    .filter(mesa => {
      const estadoMesa = String(mesa.estado || '').trim().toLowerCase()
      return !obtenerComandaActiva(mesa) && !['ocupada', 'reservada'].includes(estadoMesa)
    })
    .sort((a, b) => Number(a.numero) - Number(b.numero))

  const obtenerLimiteCuentas = (comanda) => {
    const limite = Number(comanda.limiteCuentas)
    if (!comanda.idReservacion || !limite) {
      return { limitado: false, usadas: 0, limite: null, alcanzado: false }
    }

    const usadas = comandas.filter(c =>
      c.cuentaSeparada &&
      c.idReservacion === comanda.idReservacion &&
      c.estado !== 'Cancelado'
    ).length

    return {
      limitado: true,
      usadas,
      limite,
      alcanzado: usadas >= limite
    }
  }

  const puedeAgregarCuentaSeparada = (comanda) => {
    const limite = obtenerLimiteCuentas(comanda)
    return !limite.alcanzado
  }

  const textoBotonCuenta = (comanda) => {
    const limite = obtenerLimiteCuentas(comanda)
    return limite.limitado ? `+ Cuenta (${limite.usadas}/${limite.limite})` : '+ Cuenta'
  }

  const obtenerPrecioNumero = (precio) => parseFloat(String(precio || '0').replace('$', '')) || 0

  const agregarAlComanda = (platillo, categoriaOverride = null) => {
    const categoriaKey = categoriaOverride?.key || platillo.categoria || activeCategory
    const categoriaActual = categoriaOverride || categories.find(cat => cat.key === categoriaKey)
    const existente = itemsComanda.find(item => item.nombre === platillo.nombre)
    
    if (existente) {
      const actualizado = itemsComanda.map(item => 
        item.nombre === platillo.nombre 
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              subtotal: obtenerPrecioNumero(platillo.precio) * (item.cantidad + 1)
            }
          : item
      )
      setItemsComanda(actualizado)
    } else {
      const nuevoItem = {
        id: itemsComanda.length + 1,
        ...platillo,
        categoria: categoriaKey,
        categoriaLabel: platillo.categoriaLabel || categoriaActual?.label || categoriaKey,
        cantidad: 1,
        comentarios: '',
        subtotal: obtenerPrecioNumero(platillo.precio)
      }
      setItemsComanda([...itemsComanda, nuevoItem])
    }
  }

  const incrementarCantidad = (id) => {
    const actualizado = itemsComanda.map(item => 
      item.id === id 
        ? {
            ...item,
            cantidad: item.cantidad + 1,
            subtotal: obtenerPrecioNumero(item.precio) * (item.cantidad + 1)
          }
        : item
    )
    setItemsComanda(actualizado)
  }

  const decrementarCantidad = (id) => {
    const actualizado = itemsComanda.map(item => 
      item.id === id && item.cantidad > 1
        ? {
            ...item,
            cantidad: item.cantidad - 1,
            subtotal: obtenerPrecioNumero(item.precio) * (item.cantidad - 1)
          }
        : item
    )
    setItemsComanda(actualizado)
  }

  const actualizarComentario = (id, nuevoComentario) => {
    const actualizado = itemsComanda.map(item =>
      item.id === id ? { ...item, comentarios: nuevoComentario } : item
    )
    setItemsComanda(actualizado)
  }

  const eliminarTodo = () => {
    setItemsComanda([])
  }

  const eliminarDelComanda = (id) => {
    setItemsComanda(itemsComanda.filter(item => item.id !== id))
  }

  const promocionesAplicables = promociones.filter(promo =>
    promo.estado === 'activa' &&
    !String(promo.nombre || '').toLowerCase().includes('vip')
  )

  const promocionesSeleccionadas = promocionesAplicables.filter(promo =>
    promocionesSeleccionadasIds.includes(String(promo.id))
  )

  const normalizarTexto = (texto) => String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const obtenerObjetivosPromocion = (promo) => {
    const explicitos = Array.isArray(promo.aplicableTo)
      ? promo.aplicableTo.map(normalizarTexto).filter(Boolean)
      : []

    if (explicitos.length > 0) return explicitos

    const texto = normalizarTexto(`${promo.nombre || ''} ${promo.descripcion || ''}`)
    const objetivos = categoriasMenu
      .map(categoria => normalizarTexto(categoria))
      .filter(categoria => texto.includes(categoria))

    const posibles = [
      'pizzas',
      'pizza',
      'bebidas',
      'bebida',
      'aguachile',
      'aguachiles',
      'pastas',
      'pasta',
      'postres',
      'postre',
      'mariscos',
      'camarones',
      'pollo',
      'cafe',
      'cafes'
    ]

    posibles.forEach(posible => {
      if (texto.includes(posible)) objetivos.push(posible)
    })

    if (texto.includes('happy hour')) objetivos.push('bebidas', 'bebida')

    return [...new Set(objetivos)]
  }

  const obtenerAplicablesExplicitos = (promo) => (
    Array.isArray(promo?.aplicableTo)
      ? promo.aplicableTo.map(item => String(item || '').trim()).filter(Boolean)
      : []
  )

  const aplicableEsCategoria = (aplicable) => (
    categoriasMenu.some(categoria => normalizarTexto(categoria) === normalizarTexto(aplicable))
  )

  const buscarProductoMenu = (objetivo) => {
    const objetivoNormalizado = normalizarTexto(objetivo)
    return productosMenu.find(producto => {
      const nombre = normalizarTexto(producto.nombre)
      return nombre === objetivoNormalizado || nombre.includes(objetivoNormalizado) || objetivoNormalizado.includes(nombre)
    })
  }

  const obtenerProductosComboPromocion = (promo) => {
    return obtenerAplicablesExplicitos(promo)
      .filter(aplicable => !aplicableEsCategoria(aplicable))
      .map(buscarProductoMenu)
      .filter(Boolean)
      .filter((producto, index, arr) => arr.findIndex(item => item.nombre === producto.nombre) === index)
  }

  const obtenerReglaDescripcionPromocion = (promo) => {
    const descripcion = normalizarTexto(promo?.descripcion || '')
    const nxm = descripcion.match(/(\d+)\s*x\s*(\d+)/)
    const porcentaje = descripcion.match(/(\d+(?:\.\d+)?)\s*%/)
    const precioEspecial = descripcion.match(/(?:por|a|x)\s*\$?\s*(\d+(?:\.\d+)?)/) || descripcion.match(/\$\s*(\d+(?:\.\d+)?)/)

    return {
      texto: descripcion,
      nxm: nxm ? { compra: Number(nxm[1]), paga: Number(nxm[2]) } : promo?.tipo === '2x1' ? { compra: 2, paga: 1 } : null,
      gratis: descripcion.includes('gratis'),
      gratisTodo: descripcion.includes('todo gratis') || descripcion.includes('todos gratis') || descripcion.includes('productos gratis') || descripcion.trim() === 'gratis',
      porcentaje: porcentaje ? Number(porcentaje[1]) : descripcion.includes('mitad de precio') ? 50 : null,
      precioEspecial: precioEspecial ? Number(precioEspecial[1]) : null
    }
  }

  const obtenerPrecioEspecialPromocion = (promo, regla = obtenerReglaDescripcionPromocion(promo)) => (
    regla.precioEspecial || parseFloat(promo?.precio) || 0
  )

  const promocionAgregaProductos = (promo) => {
    const regla = obtenerReglaDescripcionPromocion(promo)
    return obtenerProductosComboPromocion(promo).length > 0 && (
      obtenerPrecioEspecialPromocion(promo, regla) > 0 ||
      regla.nxm ||
      promo?.tipo === 'menu'
    )
  }

  const obtenerCantidadAgregarPromocion = (promo) => {
    const regla = obtenerReglaDescripcionPromocion(promo)
    return regla.nxm?.compra || 1
  }

  const obtenerDetalleComboPromocion = (promo) => {
    const productosCombo = obtenerProductosComboPromocion(promo)
    if (productosCombo.length === 0) return null

    const productos = productosCombo.map(producto => {
      const productoNormalizado = normalizarTexto(producto.nombre)
      const item = itemsComanda.find(item => normalizarTexto(item.nombre) === productoNormalizado)
      return {
        producto,
        item,
        cantidad: item?.cantidad || 0,
        precio: obtenerPrecioNumero(item?.precio || producto.precio)
      }
    })

    return {
      productos,
      grupos: Math.min(...productos.map(producto => producto.cantidad)),
      basePorCombo: productos.reduce((total, producto) => total + producto.precio, 0)
    }
  }

  const agregarProductosCombo = (promo) => {
    const productosCombo = obtenerProductosComboPromocion(promo)
    if (productosCombo.length === 0) return
    const cantidadAgregar = obtenerCantidadAgregarPromocion(promo)

    setItemsComanda(prev => {
      const siguienteId = prev.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
      let nuevos = 0

      const actualizados = prev.map(item => {
        const productoCombo = productosCombo.find(producto => normalizarTexto(producto.nombre) === normalizarTexto(item.nombre))
        if (!productoCombo) return item

        const cantidad = item.cantidad + cantidadAgregar
        return {
          ...item,
          cantidad,
          subtotal: obtenerPrecioNumero(item.precio) * cantidad
        }
      })

      const agregados = productosCombo
        .filter(producto => !prev.some(item => normalizarTexto(item.nombre) === normalizarTexto(producto.nombre)))
        .map(producto => {
          nuevos += 1
          return {
            id: siguienteId + nuevos - 1,
            ...producto,
            cantidad: cantidadAgregar,
            comentarios: '',
            subtotal: obtenerPrecioNumero(producto.precio) * cantidadAgregar
          }
        })

      return [...actualizados, ...agregados]
    })
  }

  const seleccionarPromocion = (id) => {
    const idTexto = String(id)
    setPromocionesSeleccionadasIds(prev => (
      prev.includes(idTexto) ? prev : [...prev, idTexto]
    ))
  }

  const agregarComboPromocion = (promo) => {
    agregarProductosCombo(promo)
    seleccionarPromocion(promo.id)
  }

  const calcularSubtotal = () => {
    return itemsComanda.reduce((total, item) => total + item.subtotal, 0)
  }

  const obtenerItemsPromocion = (promo) => {
    if (!promo) return []
    const aplicables = obtenerObjetivosPromocion(promo)
    if (aplicables.length === 0) return []

    return itemsComanda.filter(item => {
      const nombre = normalizarTexto(item.nombre)
      const categoria = normalizarTexto(item.categoriaLabel || item.categoria)
      return aplicables.some(aplica =>
        nombre.includes(aplica) ||
        aplica.includes(nombre) ||
        categoria.includes(aplica) ||
        aplica.includes(categoria)
      )
    })
  }

  const itemCoincideConObjetivoGratis = (item, regla) => {
    if (!regla.gratis) return false
    if (regla.gratisTodo) return true

    const nombre = normalizarTexto(item.nombre)
    const categoria = normalizarTexto(item.categoriaLabel || item.categoria)
    const antesGratis = regla.texto.split('gratis')[0] || ''
    const objetivoGratis = antesGratis.includes('+')
      ? antesGratis.split('+').pop().trim()
      : antesGratis.trim()

    if (!objetivoGratis) return false
    if (objetivoGratis.includes(nombre) || nombre.includes(objetivoGratis)) return true
    if (objetivoGratis.includes(categoria) || categoria.includes(objetivoGratis)) return true

    const esBebida = categoria.includes('bebida') ||
      ['refresco', 'bebida', 'gaseosa', 'limonada', 'jugo', 'te', 'cafe'].some(palabra => nombre.includes(palabra))

    if ((objetivoGratis.includes('bebida') || objetivoGratis.includes('refresco')) && esBebida) return true

    return !regla.texto.includes('+') && regla.texto.includes(nombre)
  }

  const calcularPromocionesAplicadas = () => {
    return promocionesSeleccionadas.map(promo => {
      const items = obtenerItemsPromocion(promo)
      const base = items.reduce((total, item) => total + item.subtotal, 0)
      let descuento = 0
      const regla = obtenerReglaDescripcionPromocion(promo)
      const detalleCombo = obtenerDetalleComboPromocion(promo)
      const precioEspecial = obtenerPrecioEspecialPromocion(promo, regla)

      if (regla.nxm) {
        descuento = items.reduce((total, item) => {
          const precioUnitario = obtenerPrecioNumero(item.precio)
          const grupos = Math.floor(item.cantidad / regla.nxm.compra)
          const unidadesGratis = Math.max(regla.nxm.compra - regla.nxm.paga, 0)
          return total + (grupos * unidadesGratis * precioUnitario)
        }, 0)
      } else if (regla.gratis) {
        descuento = items
          .filter(item => itemCoincideConObjetivoGratis(item, regla))
          .reduce((total, item) => total + item.subtotal, 0)
      } else if (detalleCombo?.grupos > 0 && precioEspecial > 0) {
        descuento = (detalleCombo.basePorCombo - precioEspecial) * detalleCombo.grupos
      } else if (precioEspecial > 0) {
        descuento = base - precioEspecial
      } else if (regla.porcentaje) {
        descuento = base * (regla.porcentaje / 100)
      } else if (promo.tipo === '2x1') {
        descuento = items.reduce((total, item) => {
          const precioUnitario = obtenerPrecioNumero(item.precio)
          return total + (Math.floor(item.cantidad / 2) * precioUnitario)
        }, 0)
      } else {
        const descuentoPorcentaje = parseFloat(promo.descuento) || 0
        descuento = base * (descuentoPorcentaje / 100)
      }

      return {
        promo,
        items,
        base,
        descuento: parseFloat(descuento.toFixed(2)),
        combos: detalleCombo?.grupos || 0
      }
    })
  }

  const calcularDescuentoPromocion = () => {
    const subtotal = calcularSubtotal()
    const descuento = calcularPromocionesAplicadas().reduce((total, promo) => total + promo.descuento, 0)
    return Math.min(parseFloat(descuento.toFixed(2)), subtotal)
  }

  const calcularTotal = () => {
    const subtotal = calcularSubtotal()
    const descuento = calcularDescuentoPromocion()
    return Math.max(subtotal - descuento, 0).toFixed(2)
  }

  const abrirNuevaComanda = () => {
    setShowMesaModal(true)
    setNumeroMesa('')
    setNombreMesa('')
    setComandaBaseCuenta(null)
    setNombreCuentaSeparada('')
  }

  const confirmarMesa = () => {
    if (numeroMesa.trim()) {
      setShowMesaModal(false)
      setShowComandaForm(true)
      setItemsComanda([])
    }
  }

  const cerrarComanda = () => {
    setShowComandaForm(false)
    setItemsComanda([])
    setSelectedCategory('')
    setNumeroMesa('')
    setNombreMesa('')
    setComandaAEditar(null)
    setComandaBaseCuenta(null)
    setNombreCuentaSeparada('')
    setPromocionesSeleccionadasIds([])
  }

  const guardarComanda = async () => {
    if (itemsComanda.length === 0) return

    if (comandaAEditar) {
      try {
        const descuento = calcularDescuentoPromocion()
        await actualizarComandaActiva(comandaAEditar.id, {
          items: itemsComanda,
          descuento,
          promocionAplicada: calcularPromocionesAplicadas().map(aplicada => ({
            id: aplicada.promo.id,
            nombre: aplicada.promo.nombre,
            descuento: aplicada.descuento,
            productos: aplicada.items.map(item => item.nombre)
          }))
        })
        setMensajeAlerta(`Comanda #${comandaAEditar.id} actualizada correctamente`)
        setTimeout(() => setMensajeAlerta(''), 3000)
        cerrarComanda()
        return
      } catch (error) {
        setMensajeAlerta(`No se pudo actualizar la comanda: ${error.message}`)
        setTimeout(() => setMensajeAlerta(''), 3000)
        return
      }
      setMensajeAlerta('La edición visual sigue disponible, pero la actualización completa se sincroniza con la BD desde el hook de comandas.')
      setComandaAEditar(null)
    } else {
      const referenciaMesa = nombreMesa.trim()
      await agregarComanda({
        mesa: referenciaMesa ? `Mesa ${numeroMesa.trim()} - ${referenciaMesa}` : `Mesa ${numeroMesa.trim()}`,
        items: itemsComanda,
        descuento: calcularDescuentoPromocion(),
        promocionAplicada: calcularPromocionesAplicadas().map(aplicada => ({
          id: aplicada.promo.id,
          nombre: aplicada.promo.nombre,
          descuento: aplicada.descuento,
          productos: aplicada.items.map(item => item.nombre)
        })),
        id_mesa: comandaBaseCuenta?.id_mesa || null,
        cuentaSeparada: !!comandaBaseCuenta,
        nombreCuenta: comandaBaseCuenta ? referenciaMesa : null,
        idReservacion: comandaBaseCuenta?.idReservacion || null
      })
    }

    setTimeout(() => setMensajeAlerta(''), 3000)
    cerrarComanda()
  }

  const verComanda = (comanda) => {
    setComandaSeleccionada(comanda)
    setMostrarVerComanda(true)
  }

  const cerrarVerComanda = () => {
    setMostrarVerComanda(false)
    setComandaSeleccionada(null)
    setMensajeAlerta('')
  }

  const editarComanda = (comanda) => {
    if (comanda.estado !== 'Pendiente') {
      setMensajeAlerta('Solo se pueden editar comandas en estado Pendiente')
      setTimeout(() => setMensajeAlerta(''), 3000)
      return
    }
    // Establecer la comanda a editar y los items
    setComandaAEditar(comanda)
    setItemsComanda(comanda.items)
    setPromocionesSeleccionadasIds([])
    setNumeroMesa(comanda.mesa?.match(/Mesa\s*(\d+)/i)?.[1] || '')
    setNombreMesa(comanda.mesa?.replace(/Mesa\s*\d+\s*-?\s*/i, '') || comanda.mesa)
    setShowComandaForm(true)
    setMostrarVerComanda(false)
  }

  const abrirCuentaSeparada = (comanda) => {
    if (comanda.estado !== 'Pendiente') {
      setMensajeAlerta('Solo se pueden agregar cuentas a comandas pendientes')
      setTimeout(() => setMensajeAlerta(''), 3000)
      return
    }

    if (!puedeAgregarCuentaSeparada(comanda)) {
      const limite = obtenerLimiteCuentas(comanda)
      setMensajeAlerta(`Esta reservacion ya tiene ${limite.usadas} de ${limite.limite} cuentas separadas`)
      setTimeout(() => setMensajeAlerta(''), 3000)
      return
    }

    setComandaBaseCuenta(comanda)
    setNumeroMesa(comanda.mesa?.match(/Mesa\s*(\d+)/i)?.[1] || '')
    setNombreCuentaSeparada('')
    setMostrarCuentaSeparada(true)
    setMostrarVerComanda(false)
  }

  const confirmarCuentaSeparada = () => {
    const nombre = nombreCuentaSeparada.trim()
    if (!nombre) return

    if (comandaBaseCuenta && !puedeAgregarCuentaSeparada(comandaBaseCuenta)) {
      const limite = obtenerLimiteCuentas(comandaBaseCuenta)
      setMensajeAlerta(`Esta reservacion ya tiene ${limite.usadas} de ${limite.limite} cuentas separadas`)
      setTimeout(() => setMensajeAlerta(''), 3000)
      setMostrarCuentaSeparada(false)
      return
    }

    setNombreMesa(nombre)
    setItemsComanda([])
    setSelectedCategory('')
    setMostrarCuentaSeparada(false)
    setShowComandaForm(true)
  }

  const eliminarComanda = (comanda) => {
    if (!puedeEliminarComandas) {
      setMensajeAlerta('Solo el administrador puede eliminar comandas')
      setTimeout(() => setMensajeAlerta(''), 3000)
      return
    }

    setComandaAEliminar(comanda)
    setMostrarConfirmacionEliminar(true)
  }

  const confirmarEliminacion = async () => {
    if (comandaAEliminar) {
      await eliminarComandaBd(comandaAEliminar.id)
      setMostrarConfirmacionEliminar(false)
      setComandaAEliminar(null)
      setMensajeAlerta(`Comanda #${comandaAEliminar.id} eliminada correctamente`)
      setTimeout(() => setMensajeAlerta(''), 3000)
    }
  }

  const alternarPromocion = (id) => {
    const idTexto = String(id)
    const promo = promocionesAplicables.find(promo => String(promo.id) === idTexto)

    if (promo && !promocionesSeleccionadasIds.includes(idTexto) && promocionAgregaProductos(promo)) {
      agregarProductosCombo(promo)
    }

    setPromocionesSeleccionadasIds(prev =>
      prev.includes(idTexto)
        ? prev.filter(item => item !== idTexto)
        : [...prev, idTexto]
    )
  }

  return (
    <div>
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          <ComandIcon size={24} color="#FFD54F" style={{marginRight: '0.5rem', verticalAlign: 'middle'}} /> 
          Comandas Activas
        </h1>
        <button style={appStyles.btnPrimary} onClick={abrirNuevaComanda}>+ Nueva Comanda</button>
      </div>

      {/* Stats */}
      <div style={appStyles.statsContainer}>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <ComandIcon size={28} color="#000000" />
          </div>
          <div style={appStyles.statLabel}>Total Comandas</div>
          <div style={appStyles.statValue}>{totalComandas}</div>
        </div>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <ClockIcon size={28} color="#000000" />
          </div>
          <div style={appStyles.statLabel}>Pendientes</div>
          <div style={appStyles.statValue}>{comandas.filter(c => c.estado === 'Pendiente').length}</div>
        </div>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <CheckCircleIcon size={28} color="#000000" />
          </div>
          <div style={appStyles.statLabel}>Pagadas</div>
          <div style={appStyles.statValue}>{comandasPagadas}</div>
        </div>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <DollarSignIcon size={28} color="#000000" />
          </div>
          <div style={appStyles.statLabel}>Ingresos Hoy</div>
          <div style={appStyles.statValue}>${ingresosHoy.toFixed(2)}</div>
        </div>
      </div>

      {/* Table */}
      <div style={appStyles.tableContainer}>
        <table style={appStyles.table}>
          <colgroup>
            <col style={{width: '11%'}} />
            <col style={{width: '19%'}} />
            <col style={{width: '14%'}} />
            <col style={{width: '10%'}} />
            <col style={{width: '10%'}} />
            <col style={{width: '12%'}} />
            <col style={{width: '24%'}} />
          </colgroup>
          <thead style={appStyles.tableHead}>
            <tr>
              <th style={{...appStyles.tableTh, textAlign: 'left'}}>Comanda ID</th>
              <th style={{...appStyles.tableTh, textAlign: 'left'}}>Mesa / Cliente</th>
              <th style={{...appStyles.tableTh, textAlign: 'left'}}>Hora</th>
              <th style={{...appStyles.tableTh, textAlign: 'center'}}>Productos</th>
              <th style={{...appStyles.tableTh, textAlign: 'right'}}>Total</th>
              <th style={{...appStyles.tableTh, textAlign: 'center'}}>Estado</th>
              <th style={{...appStyles.tableTh, textAlign: 'center'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comandas.map(comanda => (
              <tr key={comanda.id}>
                <td style={{...appStyles.tableTd, textAlign: 'left'}}>
                  <strong>#{comanda.id}</strong>
                </td>
                <td style={{...appStyles.tableTd, textAlign: 'left'}}>{comanda.mesa}</td>
                <td style={{...appStyles.tableTd, textAlign: 'left'}}>{formatearHora(comanda.fecha)}</td>
                <td style={{...appStyles.tableTd, textAlign: 'center'}}>{comanda.productos}</td>
                <td style={{...appStyles.tableTd, textAlign: 'right'}}><strong>{comanda.total}</strong></td>
                <td style={{...appStyles.tableTd, textAlign: 'center'}}><span style={getBadgeStyle(comanda.estado)}>{comanda.estado}</span></td>
                <td style={{...appStyles.tableTd, textAlign: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
                  <button 
                    onClick={() => verComanda(comanda)}
                    style={{
                      background: '#4CAF50',
                      border: 'none',
                      cursor: 'pointer',
                      marginRight: '0.5rem',
                      color: '#fff',
                      padding: '0.6rem 1rem',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#45A049'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.5)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#4CAF50'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                    title="Ver Comanda"
                  >
                     Ver Comanda
                  </button>
                  {!comanda.cuentaSeparada && (
                    (() => {
                      const limiteCuenta = obtenerLimiteCuentas(comanda)
                      const cuentaHabilitada = comanda.estado === 'Pendiente' && !limiteCuenta.alcanzado

                      return (
                        <button
                          onClick={() => abrirCuentaSeparada(comanda)}
                          disabled={!cuentaHabilitada}
                          style={{
                            background: '#111827',
                            border: 'none',
                            cursor: cuentaHabilitada ? 'pointer' : 'not-allowed',
                            marginRight: '0.5rem',
                            color: '#fff',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '12px',
                            opacity: cuentaHabilitada ? 1 : 0.5
                          }}
                          title={limiteCuenta.alcanzado ? 'Limite de cuentas separadas alcanzado' : 'Agregar cuenta separada'}
                        >
                          {textoBotonCuenta(comanda)}
                        </button>
                      )
                    })()
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal POS */}
      {showComandaForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '98vw',
            maxWidth: '1540px',
            height: '88vh',
            backgroundColor: '#FF6F00',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #FF6F00',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '2px solid #000',
              backgroundColor: '#FF6F00'
            }}>
              <h2 style={{color: '#000', margin: 0}}>
                {comandaAEditar ? 'Editar Comanda' : comandaBaseCuenta ? `Nueva Cuenta - Mesa ${numeroMesa}` : 'Nueva Comanda'}
              </h2>
              <button onClick={cerrarComanda} style={{
                background: 'none',
                border: 'none',
                color: '#000',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}>×</button>
            </div>

            {/* Content */}
            <div style={{display: 'flex', flex: 1, overflow: 'hidden', alignItems: 'stretch'}}>
              {/* Left Side - Platillos */}
              <div style={{flex: '1 1 780px', minWidth: '650px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #000', overflow: 'hidden'}}>
                
                {/* Categorías */}
                <div style={{
                  display: 'flex',
                  gap: '0.3rem',
                  padding: '0.3rem 0.2rem',
                  borderBottom: '2px solid #000',
                  overflowX: 'auto',
                  backgroundColor: '#FF6F00'
                }}>
                  {Object.entries(menu).map(([key, category]) => {
                    let label = category.nombre || key.replace(/_/g, ' ')
                    label = label.replace(/^[\p{Emoji}]+\s*/u, '').trim()
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          border: '2px solid #000',
                          backgroundColor: activeCategory === key ? '#000' : '#FF6F00',
                          color: activeCategory === key ? '#FFD54F' : '#000',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.3s',
                          fontSize: '0.85rem'
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Grilla de Platillos */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0.5rem',
                  margin: '0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gridAutoRows: '100px',
                  alignContent: 'start',
                  gap: '0.5rem',
                  backgroundColor: '#fff'
                }}>
                  {loadingMenu ? (
                    <p style={{color: '#000', margin: 0}}>Cargando menú desde la BD...</p>
                  ) : (menu[activeCategory]?.platillos || []).map((platillo) => (
                    <div
                      key={platillo.id}
                      onClick={() => agregarAlComanda(platillo)}
                      style={{
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '0',
                        padding: '8px',
                        textAlign: 'center',
                        backgroundColor: '#FF6F00',
                        transition: 'all 0.3s ease-in-out',
                        height: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: '0',
                        transform: 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)'
                        e.currentTarget.style.backgroundColor = '#E55100'
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.backgroundColor = '#FF6F00'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      }}
                    >
                      <p style={{
                        fontSize: '13px',
                        color: '#000',
                        margin: '0',
                        fontWeight: 600,
                        lineHeight: '1.2',
                        padding: '0'
                      }}>
                        {platillo.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Comanda (Carrito) */}
              <div style={{width: '390px', minWidth: '360px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FF6F00', boxSizing: 'border-box'}}>
                
                {/* Cabecera */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  minHeight: '68px',
                  boxSizing: 'border-box',
                  borderBottom: '2px solid #000',
                  backgroundColor: '#FF6F00'
                }}>
                  <h3 style={{color: '#000', margin: 0, fontSize: '16px', fontWeight: 700}}>Comanda</h3>
                  <button
                    onClick={eliminarTodo}
                    disabled={itemsComanda.length === 0}
                    style={{
                      backgroundColor: itemsComanda.length === 0 ? '#ccc' : '#DC2626',
                      border: 'none',
                      color: '#fff',
                      cursor: itemsComanda.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      opacity: itemsComanda.length === 0 ? 0.6 : 1,
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: itemsComanda.length === 0 ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (itemsComanda.length > 0) {
                        e.currentTarget.style.backgroundColor = '#B91C1C'
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (itemsComanda.length > 0) {
                        e.currentTarget.style.backgroundColor = '#DC2626'
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                  >
                    🗑 Eliminar Todo
                  </button>
                </div>

                {/* Lista de Items - Formato Tabla */}
                <div style={{flex: 1, overflowY: 'auto', padding: '0', backgroundColor: '#FF6F00'}}>
                  {itemsComanda.length === 0 ? (
                    <p style={{color: '#000', textAlign: 'center', fontSize: '14px', margin: '2rem 1rem'}}>
                      Selecciona productos para agregar
                    </p>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      {/* Encabezado */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 60px 60px',
                        gap: '8px',
                        padding: '0.8rem 1rem',
                        backgroundColor: '#FF6F00',
                        borderBottom: '2px solid #000',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#000',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                      }}>
                        <div style={{textAlign: 'center'}}>CANT.</div>
                        <div>DESCRIPCIÓN</div>
                        <div style={{textAlign: 'right'}}>PRECIO</div>
                        <div style={{textAlign: 'right'}}>TOTAL</div>
                      </div>

                      {/* Items */}
                      {itemsComanda.map((item, index) => (
                        <div key={item.id}>
                          {/* Row Principal */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '50px 1fr 60px 60px',
                            gap: '8px',
                            padding: '0.8rem 1rem',
                            backgroundColor: '#fff',
                            borderBottom: '1px solid #FFD54F',
                            alignItems: 'center',
                            fontSize: '13px'
                          }}>
                            {/* Cantidad con controles */}
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}>
                              <button
                                onClick={() => decrementarCantidad(item.id)}
                                style={{
                                  background: '#FF6F00',
                                  border: '1px solid #000',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: '#fff',
                                  padding: '0',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55100'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6F00'}
                              >
                                −
                              </button>
                              <span style={{fontWeight: 700, minWidth: '16px', textAlign: 'center', color: '#000'}}>
                                {item.cantidad}
                              </span>
                              <button
                                onClick={() => incrementarCantidad(item.id)}
                                style={{
                                  background: '#FF6F00',
                                  border: '1px solid #000',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: '#fff',
                                  padding: '0',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55100'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6F00'}
                              >
                                +
                              </button>
                            </div>

                            {/* Descripción */}
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontWeight: 600, color: '#000'}}>
                                {item.nombre}
                              </span>
                              <button
                                onClick={() => eliminarDelComanda(item.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#DC2626',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  padding: '0',
                                  fontWeight: 700,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                ×
                              </button>
                            </div>

                            {/* Precio Unitario */}
                            <div style={{textAlign: 'right', fontWeight: 600, color: '#FF6F00'}}>
                              {item.precio}
                            </div>

                            {/* Subtotal */}
                            <div style={{textAlign: 'right', fontWeight: 700, color: '#4CAF50', fontSize: '14px'}}>
                              ${item.subtotal.toFixed(2)}
                            </div>
                          </div>

                          {/* Row Comentarios */}
                          <div style={{
                            display: 'flex',
                            padding: '0.6rem 1rem',
                            backgroundColor: '#f9f9f9',
                            borderBottom: index === itemsComanda.length - 1 ? '2px solid #000' : '1px solid #FFD54F'
                          }}>
                            <input
                              type="text"
                              value={item.comentarios}
                              onChange={(e) => actualizarComentario(item.id, e.target.value)}
                              placeholder="Agregar comentario..."
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                fontSize: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                fontStyle: item.comentarios ? 'normal' : 'italic',
                                color: item.comentarios ? '#000' : '#999'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total y Botón Guardar */}
                <div style={{padding: '1rem', borderTop: '2px solid #000', backgroundColor: '#FF6F00'}}>
                  {calcularDescuentoPromocion() > 0 && (
                    <>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                        <span style={{color: '#000', fontWeight: 700, fontSize: '13px'}}>Subtotal:</span>
                        <span style={{color: '#000', fontWeight: 700, fontSize: '14px'}}>${calcularSubtotal().toFixed(2)}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem'}}>
                        <span style={{color: '#000', fontWeight: 700, fontSize: '13px'}}>Promo:</span>
                        <span style={{color: '#064E3B', fontWeight: 800, fontSize: '14px'}}>- ${calcularDescuentoPromocion().toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                    <span style={{color: '#000', fontWeight: 700, fontSize: '14px'}}>Total:</span>
                    <span style={{color: '#000', fontWeight: 700, fontSize: '18px'}}>
                      ${calcularTotal()}
                    </span>
                  </div>
                  <button
                    onClick={guardarComanda}
                    disabled={itemsComanda.length === 0}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      backgroundColor: itemsComanda.length === 0 ? '#ccc' : '#4CAF50',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: itemsComanda.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {comandaAEditar ? 'Actualizar Comanda' : 'Guardar Comanda'}
                  </button>
                </div>
              </div>
              <div style={{width: '320px', minWidth: '300px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FF6F00', borderLeft: '2px solid #000', boxSizing: 'border-box'}}>
                <div style={{padding: '1rem', minHeight: '68px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderBottom: '2px solid #000'}}>
                  <h3 style={{color: '#000', margin: 0, fontSize: '16px', fontWeight: 800}}>Promociones</h3>
                </div>
                <div style={{flex: 1, overflowY: 'auto', padding: '1rem'}}>
                  <div style={{background: '#fff', borderRadius: '8px', padding: '0.85rem', border: '1px solid #000'}}>
                    <div style={{display: 'grid', gap: '0.45rem'}}>
                      {promocionesAplicables.length === 0 ? (
                        <div style={{fontSize: '12px', color: '#666'}}>No hay promociones activas disponibles.</div>
                      ) : promocionesAplicables.map(promo => {
                        const esComboMenu = promocionAgregaProductos(promo)
                        const aplicada = calcularPromocionesAplicadas().find(aplicada => aplicada.promo.id === promo.id)

                        return (
                          <div key={promo.id} style={{display: 'grid', gap: '0.45rem', background: promocionesSeleccionadasIds.includes(String(promo.id)) ? '#FFF7ED' : '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.55rem'}}>
                            <label style={{display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', gap: '0.5rem', fontSize: '12px', fontWeight: 700, color: '#111', cursor: 'pointer'}}>
                              <input
                                type="checkbox"
                                checked={promocionesSeleccionadasIds.includes(String(promo.id))}
                                onChange={() => alternarPromocion(promo.id)}
                                style={{marginTop: '0.15rem'}}
                              />
                              <span style={{display: 'grid', gap: '0.25rem'}}>
                                <span>{promo.nombre} {promo.descuento > 0 ? `- ${promo.descuento}%` : ''}</span>
                                {promo.descripcion && (
                                  <span style={{fontSize: '11px', lineHeight: 1.35, color: '#475569', fontWeight: 600}}>
                                    {promo.descripcion}
                                  </span>
                                )}
                              </span>
                            </label>
                            {esComboMenu && (
                              <button
                                type="button"
                                onClick={() => agregarComboPromocion(promo)}
                                style={{padding: '0.45rem 0.55rem', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 800, cursor: 'pointer'}}
                              >
                                + Agregar combo{aplicada?.combos > 0 ? ` (${aplicada.combos})` : ''}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {calcularPromocionesAplicadas().length > 0 && (
                      <div style={{marginTop: '0.8rem', display: 'grid', gap: '0.65rem', fontSize: '12px', color: '#333'}}>
                        <div><strong>Modo pruebas:</strong> se puede aplicar aunque la fecha o dia no coincida.</div>
                        {calcularPromocionesAplicadas().map(aplicada => (
                          <div key={aplicada.promo.id} style={{borderTop: '1px solid #E5E7EB', paddingTop: '0.6rem'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontWeight: 800}}>
                              <span>{aplicada.promo.nombre}{aplicada.combos > 1 ? ` x${aplicada.combos}` : ''}</span>
                              <span>- ${aplicada.descuento.toFixed(2)}</span>
                            </div>
                            {aplicada.promo.descripcion && (
                              <div style={{marginTop: '0.35rem', color: '#334155', lineHeight: 1.35, fontWeight: 700}}>
                                {aplicada.promo.descripcion}
                              </div>
                            )}
                            {aplicada.items.length > 0 ? (
                              <div style={{marginTop: '0.4rem', color: '#475569'}}>
                                {aplicada.items.map(item => (
                                  <div key={`${aplicada.promo.id}-${item.id}`} style={{display: 'flex', justifyContent: 'space-between', gap: '0.5rem'}}>
                                    <span>{item.nombre}</span>
                                    <span>${item.subtotal.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{marginTop: '0.35rem', color: '#B45309'}}>No aplica a los productos actuales.</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar cuenta separada */}
      {mostrarCuentaSeparada && comandaBaseCuenta && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            width: 'min(460px, 92vw)',
            border: '3px solid #FF6F00',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <h2 style={{color: '#000', margin: '0 0 1.5rem 0', fontSize: '22px', fontWeight: 800}}>
              Agregar cuenta
            </h2>
            <label style={{display: 'block', color: '#333', fontWeight: 700, marginBottom: '0.5rem', fontSize: '14px'}}>
              Mesa
            </label>
            <input
              type="text"
              value={`Mesa ${numeroMesa}`}
              disabled
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                backgroundColor: '#f3f4f6',
                color: '#111827',
                fontWeight: 700
              }}
            />
            <label style={{display: 'block', color: '#333', fontWeight: 700, marginBottom: '0.5rem', fontSize: '14px'}}>
              Nombre de la persona
            </label>
            <input
              type="text"
              value={nombreCuentaSeparada}
              onChange={(e) => setNombreCuentaSeparada(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarCuentaSeparada()}
              autoFocus
              placeholder="Ej: Juan Perez"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '16px',
                border: '2px solid #FF6F00',
                borderRadius: '6px',
                marginBottom: '1.5rem',
                boxSizing: 'border-box'
              }}
            />
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button
                onClick={() => {
                  setMostrarCuentaSeparada(false)
                  setComandaBaseCuenta(null)
                  setNombreCuentaSeparada('')
                }}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#fc0101',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCuentaSeparada}
                disabled={!nombreCuentaSeparada.trim()}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: nombreCuentaSeparada.trim() ? '#4CAF50' : '#4CAF50',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: nombreCuentaSeparada.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para solicitar nombre de mesa */}
      {showMesaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: '#FF6F00',
            borderRadius: '12px',
            padding: '2rem',
            minWidth: '400px',
            border: '2px solid #000',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <h2 style={{color: '#000', margin: '0 0 1.5rem 0', fontSize: '24px', fontWeight: 700, textAlign: 'center'}}>
              Nueva Comanda #{proximoId}
            </h2>
            <label style={{display: 'block', color: '#000', fontWeight: 700, marginBottom: '0.5rem', fontSize: '14px'}}>
              Número de mesa:
            </label>
            <select
              value={numeroMesa}
              onChange={(e) => setNumeroMesa(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '16px',
                border: '2px solid #000',
                borderRadius: '6px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                backgroundColor: '#fff'
              }}
            >
              <option value="">Selecciona una mesa</option>
              {mesasDisponibles.map(mesa => (
                <option key={mesa.id} value={mesa.numero}>
                  Mesa {mesa.numero} - {mesa.ubicacion}
                </option>
              ))}
            </select>
            {mesasDisponibles.length === 0 && (
              <div style={{color: '#7F1D1D', fontSize: '13px', fontWeight: 700, marginBottom: '1rem'}}>
                No hay mesas disponibles en este momento.
              </div>
            )}
            <label style={{display: 'block', color: '#000', fontWeight: 700, marginBottom: '0.5rem', fontSize: '14px'}}>
              Nombre o referencia:
            </label>
            <input
              type="text"
              value={nombreMesa}
              onChange={(e) => setNombreMesa(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarMesa()}
              placeholder="Ej: Juan, Mesa VIP, etc. (opcional)"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '16px',
                border: '2px solid #000',
                borderRadius: '6px',
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button
                onClick={() => {
                  setShowMesaModal(false)
                  setNumeroMesa('')
                  setNombreMesa('')
                }}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarMesa}
                disabled={!numeroMesa.trim() || mesasDisponibles.length === 0}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: !numeroMesa.trim() || mesasDisponibles.length === 0 ? '#ccc' : '#4CAF50',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: !numeroMesa.trim() || mesasDisponibles.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (numeroMesa.trim() && mesasDisponibles.length > 0) {
                    e.currentTarget.style.backgroundColor = '#45A049'
                  }
                }}
                onMouseLeave={(e) => {
                  if (numeroMesa.trim() && mesasDisponibles.length > 0) {
                    e.currentTarget.style.backgroundColor = '#4CAF50'
                  }
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ver Comanda */}
      {mostrarVerComanda && comandaSeleccionada && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '3px solid #FF6F00',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Encabezado */}
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #FF6F00', position: 'relative'}}>
              <h2 style={{color: '#000', margin: 0, fontSize: '20px', fontWeight: 700}}>COMANDA</h2>
              <button 
                onClick={cerrarVerComanda}
                style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', fontWeight: 700, position: 'absolute', right: 0}}
              >
                ×
              </button>
            </div>

            {/* Información de la comanda */}
            <div style={{marginBottom: '1.5rem', fontSize: '14px', textAlign: 'left'}}>
              <div style={{marginBottom: '0.8rem'}}>
                <span style={{fontWeight: 700}}>MESA:</span>
                <span> {comandaSeleccionada.mesa}</span>
              </div>
              <div style={{marginBottom: '0.8rem'}}>
                <span style={{fontWeight: 700}}>MESERO:</span>
                <span> -</span>
              </div>
              <div>
                <span style={{fontWeight: 700}}>COMANDA ID:</span>
                <span> #{comandaSeleccionada.id}</span>
              </div>
            </div>

            {/* Separador */}
            <div style={{borderTop: '2px solid #FF6F00', padding: '1rem 0', margin: '1rem 0'}}></div>

            {/* Productos */}
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{margin: '0 0 1rem 0', fontSize: '14px', fontWeight: 700, color: '#000'}}>PRODUCTOS:</h3>
              {comandaSeleccionada.items && comandaSeleccionada.items.length > 0 ? (
                comandaSeleccionada.items.map((item, idx) => (
                  <div key={idx} style={{marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '13px'}}>
                      <span style={{fontWeight: 600}}>{item.nombre}</span>
                      <span style={{color: '#FF6F00', fontWeight: 700}}>{item.cantidad} x {item.precio}</span>
                    </div>
                    {item.comentarios && (
                      <div style={{fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '0.5rem'}}>
                        Nota: {item.comentarios}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{color: '#999', fontSize: '12px'}}>Sin productos</p>
              )}
            </div>

            {/* Botones de Acción */}
            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
              {comandaSeleccionada.estado === 'Pendiente' && (
                <button 
                  onClick={() => {
                    editarComanda(comandaSeleccionada)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    backgroundColor: '#00c3ff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFD54F'}
                >
                   Editar
                </button>
              )}
              {puedeEliminarComandas && (
                <button
                  onClick={() => {
                    eliminarComanda(comandaSeleccionada)
                    setMostrarVerComanda(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    backgroundColor: '#EF4444',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                >
                  Eliminar
                </button>
              )}
              <button 
                onClick={cerrarVerComanda}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  backgroundColor: '#FF6F00',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55100'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6F00'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert de Mensaje */}
      {mensajeAlerta && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#DC2626',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 2000,
          fontWeight: 700,
          fontSize: '14px'
        }}>
          {mensajeAlerta}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {puedeEliminarComandas && mostrarConfirmacionEliminar && comandaAEliminar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2001
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            border: '3px solid #FF6F00',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <h2 style={{color: '#000', margin: '0 0 1rem 0', fontSize: '18px', fontWeight: 700, textAlign: 'center'}}>
              ¿Eliminar Comanda?
            </h2>
            <p style={{color: '#666', fontSize: '14px', textAlign: 'center', margin: '0 0 1.5rem 0'}}>
              ¿Estás seguro de que deseas eliminar la comanda #{comandaAEliminar.id} de {comandaAEliminar.mesa}? Esta acción no se puede deshacer.
            </p>
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button
                onClick={() => {
                  setMostrarConfirmacionEliminar(false)
                  setComandaAEliminar(null)
                }}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#999',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#777'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#999'}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

