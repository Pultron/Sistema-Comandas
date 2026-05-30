import { useState } from 'react'
import { ComandIcon, CheckCircleIcon, DollarSignIcon, ClockIcon, SearchIcon, UserIcon } from '../Icons'
import { appStyles } from '../../styles/styles'
import { useComandas, useMenu, useMesas, usePromociones } from '../../hooks/useSupabase'
import '../../styles/Comandas.css'

const IconShell = ({ children, size = 24, className = '' }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

const TableRestaurantIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="M4 10h16" />
    <path d="M6 10l-2 9" />
    <path d="M18 10l2 9" />
    <path d="M8 10l1 9" />
    <path d="M16 10l-1 9" />
    <path d="M7 5h10l2 5H5l2-5z" />
  </IconShell>
)

const UtensilsIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="M4 3v8" />
    <path d="M8 3v8" />
    <path d="M6 3v18" />
    <path d="M14 3v7a4 4 0 0 0 4 4h1" />
    <path d="M18 3v18" />
  </IconShell>
)

const CalendarCheckIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
    <path d="m9 16 2 2 4-5" />
  </IconShell>
)

const UsersIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconShell>
)

const EyeIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </IconShell>
)

const CalendarIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </IconShell>
)

const ChevronDownIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="m6 9 6 6 6-6" />
  </IconShell>
)

const ChevronLeftIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="m15 18-6-6 6-6" />
  </IconShell>
)

const ChevronRightIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="m9 18 6-6-6-6" />
  </IconShell>
)

const TrashSmallIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </IconShell>
)

const ClipboardEmptyIcon = ({ size = 24, className = '' }) => (
  <IconShell size={size} className={className}>
    <path d="M9 5a3 3 0 0 1 6 0h2a2 2 0 0 1 2 2v13H5V7a2 2 0 0 1 2-2h2z" />
    <path d="M9 5h6" />
    <path d="M9 13h6" />
    <path d="M9 17h3" />
  </IconShell>
)

const imageLooksValid = (src) => {
  const value = String(src || '').trim()
  return /^(https?:|data:image|blob:|\/|\.\/|\.\.\/)/i.test(value)
}

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
  const [busquedaComanda, setBusquedaComanda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [paginaActual, setPaginaActual] = useState(1)

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
      await agregarComanda({
        mesa: `Mesa ${numeroMesa.trim()}`,
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
        nombreCuenta: comandaBaseCuenta ? nombreMesa.trim() : null,
        idReservacion: comandaBaseCuenta?.idReservacion || null,
        nombreReservacion: comandaBaseCuenta?.nombreReservacion || obtenerNombreReservacion(comandaBaseCuenta)
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

  const obtenerNumeroMesa = (comanda) => {
    const textoMesa = String(comanda.mesa || '')
    const coincidencia = textoMesa.match(/Mesa\s*(\d+)/i)
    return coincidencia?.[1] || textoMesa.replace(/Reservaci[oó]n\s*-\s*/i, '').trim()
  }

  const obtenerMesaVisible = (comanda) => {
    const numero = obtenerNumeroMesa(comanda)
    const mesaBase = String(numero).toLowerCase().startsWith('mesa') ? String(numero) : `Mesa ${numero}`
    const nombreCuenta = String(comanda?.nombreCuenta || '').trim()
    if (comanda?.cuentaSeparada && nombreCuenta) return `${mesaBase} - ${nombreCuenta}`
    return mesaBase
  }

  const esComandaReservacion = (comanda) => {
    return Boolean(comanda?.idReservacion)
  }

  const obtenerNombreReservacion = (comanda) => {
    const directo = String(comanda?.nombreReservacion || '').trim()
    if (directo) return directo

    const mesa = String(comanda?.mesa || '')
    const partes = mesa.split(' - ').map(parte => parte.trim()).filter(Boolean)
    if (/^Reservaci[oó]n/i.test(partes[0] || '') && partes.length >= 3) {
      return partes.slice(2).join(' - ')
    }

    const baseReservacion = comandas.find(item =>
      item.idReservacion &&
      item.idReservacion === comanda?.idReservacion &&
      !item.cuentaSeparada &&
      String(item.nombreReservacion || '').trim()
    )
    if (baseReservacion) return String(baseReservacion.nombreReservacion || '').trim()

    return ''
  }

  const obtenerConteoProductos = (comanda) => Number(comanda.productos ?? comanda.items?.length ?? 0)

  const obtenerTextoCuentaDividida = (comanda) => {
    const limite = obtenerLimiteCuentas(comanda)
    return `${limite.usadas}/${limite.limite ?? 0}`
  }

  const obtenerClaseEstado = (estado) => (
    estado === 'Pendiente' ? 'comanda-status comanda-status--pending' : 'comanda-status comanda-status--paid'
  )

  const buscarEnComanda = (comanda) => {
    const termino = normalizarTexto(busquedaComanda)
    if (!termino) return true

    const valores = [
      comanda.mesa,
      obtenerMesaVisible(comanda),
      comanda.nombreCuenta,
      comanda.mesero,
      `#${comanda.id}`,
      comanda.id
    ]

    return valores.some(valor => normalizarTexto(valor).includes(termino))
  }

  const comandasFiltradas = comandas.filter(comanda => {
    const coincideEstado =
      filtroEstado === 'todas' ||
      (filtroEstado === 'pendientes' && comanda.estado === 'Pendiente') ||
      (filtroEstado === 'pagadas' && comanda.estado === 'Pagado')

    return coincideEstado && buscarEnComanda(comanda)
  })

  const comandasPendientes = comandas.filter(c => c.estado === 'Pendiente').length
  const comandasPorPagina = 10
  const totalPaginas = Math.max(1, Math.ceil(comandasFiltradas.length / comandasPorPagina))
  const paginaSegura = Math.min(paginaActual, totalPaginas)
  const inicioPagina = (paginaSegura - 1) * comandasPorPagina
  const comandasPagina = comandasFiltradas.slice(inicioPagina, inicioPagina + comandasPorPagina)
  const fechaSelector = 'Hoy, 25 jun 2026'

  return (
    <div className="comandas-active-module">
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 0' }}>
        <button className="comandas-new-button" onClick={abrirNuevaComanda}>
          <span aria-hidden="true">+</span>
          Nueva Comanda
        </button>
      </div>

      <section className="comandas-kpis" aria-label="Resumen de comandas">
        <article className="comandas-kpi comandas-kpi--total">
          <div className="comandas-kpi-icon">
            <ComandIcon size={34} color="currentColor" />
          </div>
          <div>
            <div className="comandas-kpi-label">Total Comandas</div>
            <div className="comandas-kpi-value">{totalComandas}</div>
          </div>
        </article>
        <article className="comandas-kpi comandas-kpi--pending">
          <div className="comandas-kpi-icon">
            <ClockIcon size={34} color="currentColor" />
          </div>
          <div>
            <div className="comandas-kpi-label">Pendientes</div>
            <div className="comandas-kpi-value">{comandasPendientes}</div>
          </div>
        </article>
        <article className="comandas-kpi comandas-kpi--paid">
          <div className="comandas-kpi-icon">
            <CheckCircleIcon size={36} color="currentColor" />
          </div>
          <div>
            <div className="comandas-kpi-label">Pagadas</div>
            <div className="comandas-kpi-value">{comandasPagadas}</div>
          </div>
        </article>
        <article className="comandas-kpi comandas-kpi--income">
          <div className="comandas-kpi-icon">
            <DollarSignIcon size={36} color="currentColor" />
          </div>
          <div>
            <div className="comandas-kpi-label">Ingresos Hoy</div>
            <div className="comandas-kpi-value">${ingresosHoy.toFixed(2)}</div>
          </div>
        </article>
      </section>

      <section className="comandas-filters comandas-filters--simple" style={{ gap: '0px', marginTop: '-5px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }} aria-label="Filtros de comandas">
        <label className="comandas-search" style={{ flex: '0 1 auto' }}>
          <SearchIcon size={22} color="currentColor" />
          <input
            type="search"
            value={busquedaComanda}
            onChange={(event) => {
              setBusquedaComanda(event.target.value)
              setPaginaActual(1)
            }}
            placeholder="Buscar mesa o cliente..."
          />
        </label>

        <div className="comandas-quick-filters" style={{ gap: '2px', display: 'flex', marginLeft: '2px' }} role="group" aria-label="Filtros rapidos">
          <button
            className={`comandas-filter-pill comandas-filter-pill--all ${filtroEstado === 'todas' ? 'is-active' : ''}`}
            onClick={() => {
              setFiltroEstado('todas')
              setPaginaActual(1)
            }}
          >
            <ComandIcon size={17} color="currentColor" />
            Todas ({totalComandas})
          </button>
          <button
            className={`comandas-filter-pill comandas-filter-pill--pending ${filtroEstado === 'pendientes' ? 'is-active' : ''}`}
            onClick={() => {
              setFiltroEstado('pendientes')
              setPaginaActual(1)
            }}
          >
            <ClockIcon size={18} color="currentColor" />
            Pendientes ({comandasPendientes})
          </button>
          <button
            className={`comandas-filter-pill comandas-filter-pill--paid ${filtroEstado === 'pagadas' ? 'is-active' : ''}`}
            onClick={() => {
              setFiltroEstado('pagadas')
              setPaginaActual(1)
            }}
          >
            <CheckCircleIcon size={18} color="currentColor" />
            Pagadas ({comandasPagadas})
          </button>
        </div>
      </section>

      <section className="comandas-card-grid" aria-label="Comandas">
        {comandasPagina.length === 0 ? (
          <div className="comandas-empty-state">No hay comandas para mostrar.</div>
        ) : (
          comandasPagina.map(comanda => {
            const reservacion = esComandaReservacion(comanda)
            const productos = obtenerConteoProductos(comanda)

            return (
              <article className="comanda-card" key={comanda.id}>
                <div className="comanda-card-top">
                  <span className="comanda-id-pill">
                    <ComandIcon size={14} color="currentColor" />
                    #{comanda.id}
                  </span>
                  <span className={obtenerClaseEstado(comanda.estado)}>
                    {comanda.estado === 'Pendiente' ? (
                      <ClockIcon size={18} color="currentColor" />
                    ) : (
                      <CheckCircleIcon size={18} color="currentColor" />
                    )}
                    {comanda.estado === 'Pendiente' ? 'Pendiente' : 'Pagada'}
                  </span>
                </div>

                <div className="comanda-table-title">
                  <TableRestaurantIcon size={31} className="comanda-table-icon" />
                  <strong>{obtenerMesaVisible(comanda)}</strong>
                </div>

                {reservacion && (
                  <div className="comanda-reservation-pill">
                    <CalendarCheckIcon size={17} />
                    Reservación{obtenerNombreReservacion(comanda) ? ` - ${obtenerNombreReservacion(comanda)}` : ''}
                  </div>
                )}

                {comanda.cuentaSeparada && (
                  <div className="comanda-split-info" title="Cuenta separada">
                    <div className="comanda-split-pill">
                      <UsersIcon size={17} />
                      Cuenta separada
                    </div>
                    <div className="comanda-split-person">
                      {String(comanda.nombreCuenta || '').trim() || 'Sin nombre asignado'}
                    </div>
                  </div>
                )}

                <div className="comanda-divider" />

                <div className="comanda-metrics">
                  <div className="comanda-metric comanda-metric--time">
                    <ClockIcon size={19} color="currentColor" />
                    <span>{formatearHora(comanda.fecha)}</span>
                  </div>
                  <div className={`comanda-metric ${comanda.estado === 'Pendiente' ? 'comanda-metric--products-pending' : 'comanda-metric--products-paid'}`}>
                    <UtensilsIcon size={20} />
                    <span>{productos} productos</span>
                  </div>
                </div>

                <div className="comanda-waiter">
                  <span>Mesero</span>
                  <strong>
                    <UserIcon size={20} color="currentColor" />
                    {comanda.mesero || 'Sin mesero'}
                  </strong>
                </div>

                <div className="comanda-divider comanda-divider--tight" />

                <div className="comanda-total">
                  <span>Total</span>
                  <strong>{comanda.total}</strong>
                </div>

                <div className={`comanda-actions ${comanda.cuentaSeparada ? 'comanda-actions--single' : ''}`}>
                  <button className="comanda-view-button" onClick={() => verComanda(comanda)}>
                    <EyeIcon size={19} />
                    Ver Comanda
                  </button>
                  {!comanda.cuentaSeparada && (
                    <button
                      className="comanda-split-button"
                      onClick={() => abrirCuentaSeparada(comanda)}
                      title="Gestionar cuentas divididas"
                    >
                      <UsersIcon size={24} />
                      <span>{obtenerTextoCuentaDividida(comanda)}</span>
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>

      <footer className="comandas-pagination">
        <div>Mostrando {comandasFiltradas.length === 0 ? 0 : inicioPagina + 1} a {Math.min(inicioPagina + comandasPagina.length, comandasFiltradas.length)} de {comandasFiltradas.length} comandas</div>
        <div className="comandas-page-controls">
          <button
            className="comandas-page-button"
            disabled={paginaSegura <= 1}
            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
          >
            <ChevronLeftIcon size={18} />
            Anterior
          </button>
          <span className="comandas-current-page">{paginaSegura}</span>
          <button
            className="comandas-page-button"
            disabled={paginaSegura >= totalPaginas}
            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
          >
            <ChevronRightIcon size={18} />
            Siguiente
          </button>
        </div>
        <button className="comandas-page-size" type="button">
          10 por página
          <ChevronDownIcon size={18} />
        </button>
      </footer>

      {/* Modal POS */}
      {showComandaForm && (
        <div className="gs-pos-overlay" style={{
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
          <div className="gs-pos-modal" style={{
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
            <div className="gs-pos-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '2px solid #000',
              backgroundColor: '#FF6F00'
            }}>
              <h2 className="gs-pos-title" style={{color: '#000', margin: 0}}>
                <ComandIcon size={30} color="currentColor" />
                {comandaAEditar ? 'Editar Comanda' : comandaBaseCuenta ? `Nueva Cuenta - Mesa ${numeroMesa}` : 'Nueva Comanda'}
              </h2>
              <button className="gs-pos-close" onClick={cerrarComanda} style={{
                background: 'none',
                border: 'none',
                color: '#000',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}>×</button>
            </div>

            {/* Content */}
            <div className="gs-pos-content" style={{display: 'flex', flex: 1, overflow: 'hidden', alignItems: 'stretch'}}>
              {/* Left Side - Platillos */}
              <div className="gs-pos-menu-panel" style={{flex: '1 1 780px', minWidth: '650px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #000', overflow: 'hidden'}}>
                
                {/* Categorías */}
                <div className="gs-pos-tabs" style={{
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
                        className={`gs-pos-tab ${activeCategory === key ? 'is-active' : ''}`}
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

                <label className="gs-pos-product-search">
                  <SearchIcon size={20} color="currentColor" />
                  <input type="search" placeholder="Buscar producto..." aria-label="Buscar producto" />
                </label>

                {/* Grilla de Platillos */}
                <div className="gs-pos-products" style={{
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
                      className="gs-pos-product-card"
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
                      <div className="gs-pos-product-image">
                        {imageLooksValid(platillo.imagen) ? (
                          <img src={platillo.imagen} alt={platillo.nombre} />
                        ) : (
                          <span>{String(platillo.nombre || '?').charAt(0)}</span>
                        )}
                      </div>
                      <p className="gs-pos-product-name" style={{
                        fontSize: '13px',
                        color: '#000',
                        margin: '0',
                        fontWeight: 600,
                        lineHeight: '1.2',
                        padding: '0'
                      }}>
                        {platillo.nombre}
                      </p>
                      <strong className="gs-pos-product-price">{platillo.precio}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Comanda (Carrito) */}
              <div className="gs-pos-order-panel" style={{width: '390px', minWidth: '360px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FF6F00', boxSizing: 'border-box'}}>
                
                {/* Cabecera */}
                <div className="gs-pos-panel-header" style={{
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
                    className="gs-pos-clear-button"
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
                    Eliminar todo
                  </button>
                </div>

                {/* Lista de Items - Formato Tabla */}
                <div className="gs-pos-order-body" style={{flex: 1, overflowY: 'auto', padding: '0', backgroundColor: '#FF6F00'}}>
                  {itemsComanda.length === 0 ? (
                    <div className="gs-pos-empty-order">
                      <ClipboardEmptyIcon size={78} />
                      <strong>Aún no has agregado productos</strong>
                      <span>Selecciona productos del menú para agregarlos a la comanda</span>
                    </div>
                  ) : (
                    <div className="gs-pos-cart-list" style={{display: 'flex', flexDirection: 'column'}}>
                      {/* Encabezado */}
                      <div className="gs-pos-cart-heading" style={{
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
                        <div key={item.id} className="gs-pos-cart-item">
                          {/* Row Principal */}
                          <div className="gs-pos-cart-row" style={{
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
                            <div className="gs-pos-quantity" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}>
                              <button
                                onClick={() => decrementarCantidad(item.id)}
                                className="gs-pos-qty-button"
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
                                className="gs-pos-qty-button"
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
                            <div className="gs-pos-cart-name" style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}>
                              <span style={{fontWeight: 600, color: '#000'}}>
                                {item.nombre}
                              </span>

                            </div>

                            {/* Subtotal */}
                            <div className="gs-pos-subtotal" style={{textAlign: 'right', fontWeight: 700, color: '#4CAF50', fontSize: '14px'}}>
                              ${item.subtotal.toFixed(2)}
                            </div>
                          </div>

                          <button
                            onClick={() => eliminarDelComanda(item.id)}
                            className="gs-pos-item-delete gs-pos-item-delete--corner"
                            aria-label={`Eliminar ${item.nombre}`}
                            type="button"
                          >
                            ×
                          </button>

                          {/* Row Comentarios */}
                          <div className="gs-pos-comment-wrap" style={{
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
                              className={`gs-pos-comment ${item.comentarios ? 'has-value' : ''}`}
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
                <div className="gs-pos-order-footer" style={{padding: '1rem', borderTop: '2px solid #000', backgroundColor: '#FF6F00'}}>
                  {calcularDescuentoPromocion() > 0 && (
                    <>
                      <div className="gs-pos-total-line" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                        <span style={{color: '#000', fontWeight: 700, fontSize: '13px'}}>Subtotal:</span>
                        <span style={{color: '#000', fontWeight: 700, fontSize: '14px'}}>${calcularSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="gs-pos-total-line gs-pos-total-line--discount" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem'}}>
                        <span style={{color: '#000', fontWeight: 700, fontSize: '13px'}}>Promo:</span>
                        <span style={{color: '#064E3B', fontWeight: 800, fontSize: '14px'}}>- ${calcularDescuentoPromocion().toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="gs-pos-grand-total" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                    <span style={{color: '#000', fontWeight: 700, fontSize: '14px'}}>Total:</span>
                    <span style={{color: '#000', fontWeight: 700, fontSize: '18px'}}>
                      ${calcularTotal()}
                    </span>
                  </div>
                  <button
                    onClick={guardarComanda}
                    disabled={itemsComanda.length === 0}
                    className="gs-pos-save-button"
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
              <div className="gs-pos-promos-panel" style={{width: '320px', minWidth: '300px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FF6F00', borderLeft: '2px solid #000', boxSizing: 'border-box'}}>
                <div className="gs-pos-panel-header gs-pos-panel-header--promos" style={{padding: '1rem', minHeight: '68px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderBottom: '2px solid #000'}}>
                  <h3 style={{color: '#000', margin: 0, fontSize: '16px', fontWeight: 800}}>Promociones</h3>
                </div>
                <div className="gs-pos-promos-body" style={{flex: 1, overflowY: 'auto', padding: '1rem'}}>
                  <div className="gs-pos-promos-list" style={{background: '#fff', borderRadius: '8px', padding: '0.85rem', border: '1px solid #000'}}>
                    <div style={{display: 'grid', gap: '0.45rem'}}>
                      {promocionesAplicables.length === 0 ? (
                        <div style={{fontSize: '12px', color: '#666'}}>No hay promociones activas disponibles.</div>
                      ) : promocionesAplicables.map(promo => {
                        const esComboMenu = promocionAgregaProductos(promo)
                        const aplicada = calcularPromocionesAplicadas().find(aplicada => aplicada.promo.id === promo.id)

                        return (
                          <div key={promo.id} className={`gs-pos-promo-card ${promocionesSeleccionadasIds.includes(String(promo.id)) ? 'is-selected' : ''}`} style={{display: 'grid', gap: '0.45rem', background: promocionesSeleccionadasIds.includes(String(promo.id)) ? '#FFF7ED' : '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.55rem'}}>
                            <label className="gs-pos-promo-check" style={{display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'start', gap: '0.5rem', fontSize: '12px', fontWeight: 700, color: '#111', cursor: 'pointer'}}>
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
                                className="gs-pos-combo-button"
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
                      <div className="gs-pos-applied-promos" style={{marginTop: '0.8rem', display: 'grid', gap: '0.65rem', fontSize: '12px', color: '#333'}}>
                        <div><strong>Modo pruebas:</strong> se puede aplicar aunque la fecha o dia no coincida.</div>
                        {calcularPromocionesAplicadas().map(aplicada => (
                          <div key={aplicada.promo.id} className="gs-pos-applied-promo" style={{borderTop: '1px solid #E5E7EB', paddingTop: '0.6rem'}}>
                            <div className="gs-pos-applied-promo-title" style={{display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontWeight: 800}}>
                              <span>{aplicada.promo.nombre}{aplicada.combos > 1 ? ` x${aplicada.combos}` : ''}</span>
                              <span>- ${aplicada.descuento.toFixed(2)}</span>
                            </div>
                            {aplicada.promo.descripcion && (
                              <div style={{marginTop: '0.35rem', color: '#334155', lineHeight: 1.35, fontWeight: 700}}>
                                {aplicada.promo.descripcion}
                              </div>
                            )}
                            {aplicada.items.length > 0 ? (
                              <div className="gs-pos-applied-items" style={{marginTop: '0.4rem', color: '#475569'}}>
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
              Agregar Cuenta Individual
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
                <span> {obtenerMesaVisible(comandaSeleccionada)}</span>
              </div>
              <div style={{marginBottom: '0.8rem'}}>
                <span style={{fontWeight: 700}}>MESERO:</span>
                <span> {comandaSeleccionada.mesero || '-'}</span>
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
                      <span style={{color: '#FF6F00', fontWeight: 700}}>x{item.cantidad}</span>
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

