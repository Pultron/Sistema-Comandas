import { useState } from 'react'
import { ComandIcon, ReportesIcon, HourglassIcon, CheckCircleIcon, DollarSignIcon, EditIcon, TrashIcon, ClockIcon } from '../Icons'
import { appStyles } from '../../styles/styles'
import { menuData } from '../../data/menuData'

export const Comandas = ({ comandas, agregarComanda }) => {
  const [showComandaForm, setShowComandaForm] = useState(false)
  const [showMesaModal, setShowMesaModal] = useState(false)
  const [nombreMesa, setNombreMesa] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('caliente')
  const [itemsComanda, setItemsComanda] = useState([])
  const [comandaSeleccionada, setComandaSeleccionada] = useState(null)
  const [mostrarVerComanda, setMostrarVerComanda] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState('')
  const [comandaAEditar, setComandaAEditar] = useState(null)
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false)
  const [comandaAEliminar, setComandaAEliminar] = useState(null)

  // Calcular ID automáticamente basado en comandas existentes
  const proximoId = comandas.length + 1

  // Calcular estadísticas
  const totalComandas = comandas.length
  const comandasEnProgreso = comandas.filter(c => c.estado === 'En progreso').length
  const comandasCompletadas = comandas.filter(c => c.estado === 'Servido').length
  const ingresosHoy = comandas.reduce((total, c) => {
    const precio = parseFloat(c.total.replace('$', ''))
    return total + precio
  }, 0)

  const getBadgeStyle = (estado) => {
    if (estado === 'Servido') return { ...appStyles.badge, ...appStyles.badgeSuccess }
    if (estado === 'Pendiente') return { ...appStyles.badge, ...appStyles.badgePending }
    return { ...appStyles.badge, ...appStyles.badgeProgress }
  }

  const agregarAlComanda = (platillo) => {
    const existente = itemsComanda.find(item => item.nombre === platillo.nombre)
    
    if (existente) {
      const actualizado = itemsComanda.map(item => 
        item.nombre === platillo.nombre 
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              subtotal: parseFloat(platillo.precio.replace('$', '')) * (item.cantidad + 1)
            }
          : item
      )
      setItemsComanda(actualizado)
    } else {
      const nuevoItem = {
        id: Date.now(),
        ...platillo,
        cantidad: 1,
        comentarios: '',
        subtotal: parseFloat(platillo.precio.replace('$', '')) * 1
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
            subtotal: parseFloat(item.precio.replace('$', '')) * (item.cantidad + 1)
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
            subtotal: parseFloat(item.precio.replace('$', '')) * (item.cantidad - 1)
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

  const calcularTotal = () => {
    return itemsComanda.reduce((total, item) => total + item.subtotal, 0).toFixed(2)
  }

  const abrirNuevaComanda = () => {
    setShowMesaModal(true)
    setNombreMesa('')
  }

  const confirmarMesa = () => {
    if (nombreMesa.trim()) {
      setShowMesaModal(false)
      setShowComandaForm(true)
      setItemsComanda([])
    }
  }

  const cerrarComanda = () => {
    setShowComandaForm(false)
    setItemsComanda([])
    setSelectedCategory('caliente')
    setNombreMesa('')
    setComandaAEditar(null)
  }

  const guardarComanda = () => {
    if (itemsComanda.length === 0) return

    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0]
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5)
    const fechaHora = `${fecha} ${hora}`

    if (comandaAEditar) {
      // Modo edición: actualizar comanda existente
      const comandasActualizadas = comandas.map(c => 
        c.id === comandaAEditar.id 
          ? {
              ...c,
              mesa: nombreMesa,
              items: itemsComanda,
              productos: itemsComanda.length,
              total: `$${calcularTotal()}`,
              subtotal: parseFloat(calcularTotal())
            }
          : c
      )
      // Aquí deberías actualizar en App.jsx
      setMensajeAlerta(`Comanda #${comandaAEditar.id} actualizada correctamente`)
      setComandaAEditar(null)
    } else {
      // Modo creación: nueva comanda
      const nuevaComanda = {
        id: proximoId,
        mesa: nombreMesa,
        fecha: fechaHora,
        productos: itemsComanda.length,
        total: `$${calcularTotal()}`,
        estado: 'En progreso',
        items: itemsComanda,
        subtotal: parseFloat(calcularTotal())
      }
      agregarComanda(nuevaComanda)
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
    if (comanda.estado !== 'En progreso') {
      setMensajeAlerta('No se puede editar una comanda finalizada. El pedido ya ha sido completado.')
      setTimeout(() => setMensajeAlerta(''), 3000)
      return
    }
    // Establecer la comanda a editar y los items
    setComandaAEditar(comanda)
    setItemsComanda(comanda.items)
    setNombreMesa(comanda.mesa)
    setShowComandaForm(true)
    setMostrarVerComanda(false)
  }

  const eliminarComanda = (comanda) => {
    setComandaAEliminar(comanda)
    setMostrarConfirmacionEliminar(true)
  }

  const confirmarEliminacion = () => {
    if (comandaAEliminar) {
      const comandasActualizadas = comandas.filter(c => c.id !== comandaAEliminar.id)
      // Aquí deberías actualizar el estado en App.jsx, por ahora solo actualizamos local
      setMostrarConfirmacionEliminar(false)
      setComandaAEliminar(null)
      setMensajeAlerta(`Comanda #${comandaAEliminar.id} eliminada correctamente`)
      setTimeout(() => setMensajeAlerta(''), 3000)
    }
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
          <div style={appStyles.statLabel}>En Progreso</div>
          <div style={appStyles.statValue}>{comandasEnProgreso}</div>
        </div>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <CheckCircleIcon size={28} color="#000000" />
          </div>
          <div style={appStyles.statLabel}>Completadas</div>
          <div style={appStyles.statValue}>{comandasCompletadas}</div>
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
          <thead style={appStyles.tableHead}>
            <tr>
              <th style={appStyles.tableTh}>Comanda ID</th>
              <th style={appStyles.tableTh}>Mesa / Cliente</th>
              <th style={appStyles.tableTh}>Hora</th>
              <th style={appStyles.tableTh}>Productos</th>
              <th style={appStyles.tableTh}>Total</th>
              <th style={appStyles.tableTh}>Estado</th>
              <th style={appStyles.tableTh}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comandas.map(comanda => (
              <tr key={comanda.id}>
                <td style={appStyles.tableTd}>
                  <strong>#{comanda.id}</strong>
                </td>
                <td style={appStyles.tableTd}>{comanda.mesa}</td>
                <td style={appStyles.tableTd}>{comanda.fecha}</td>
                <td style={appStyles.tableTd}>{comanda.productos}</td>
                <td style={appStyles.tableTd}><strong>{comanda.total}</strong></td>
                <td style={appStyles.tableTd}><span style={getBadgeStyle(comanda.estado)}>{comanda.estado}</span></td>
                <td style={appStyles.tableTd}>
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
                    📄 Ver Comanda
                  </button>
                  <button 
                    onClick={() => editarComanda(comanda)}
                    style={{background: 'none', border: 'none', cursor: comanda.estado === 'En progreso' ? 'pointer' : 'not-allowed', marginRight: '0.5rem', color: comanda.estado === 'En progreso' ? '#FFD54F' : '#ccc', padding: '0.4rem', opacity: comanda.estado === 'En progreso' ? 1 : 0.5}}
                    title={comanda.estado === 'En progreso' ? 'Editar Comanda' : 'No se puede editar'}
                  >
                    <EditIcon size={18} color="currentColor" />
                  </button>
                  <button 
                    onClick={() => eliminarComanda(comanda)}
                    style={{background: 'none', border: 'none', cursor: 'pointer', color: '#FF6F6F', padding: '0.4rem', transition: 'all 0.2s'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#DC2626'
                      e.currentTarget.style.transform = 'scale(1.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#FF6F6F'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <TrashIcon size={18} color="currentColor" />
                  </button>
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
            width: '100vw',
            maxWidth: '1110px',
            height: '85vh',
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
                {comandaAEditar ? 'Editar Comanda' : 'Nueva Comanda'}
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
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #000', overflow: 'hidden'}}>
                
                {/* Categorías */}
                <div style={{
                  display: 'flex',
                  gap: '0.3rem',
                  padding: '0.3rem 0.2rem',
                  borderBottom: '2px solid #000',
                  overflowX: 'auto',
                  backgroundColor: '#FF6F00'
                }}>
                  {Object.entries(menuData).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '2px solid #000',
                        backgroundColor: selectedCategory === key ? '#000' : '#FF6F00',
                        color: selectedCategory === key ? '#FFD54F' : '#000',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s',
                        fontSize: '0.85rem'
                      }}
                    >
                      {key === 'caliente' && 'Barra Caliente'}
                      {key === 'fria' && 'Barra Fría'}
                      {key === 'pizza' && 'Pizzas'}
                      {key === 'pasta' && 'Pastas'}
                      {key === 'bebidas_calientes' && 'Bebidas Cal.'}
                      {key === 'bebidas_frias' && 'Bebidas Frías'}
                      {key === 'snacks' && 'Snacks'}
                    </button>
                  ))}
                </div>

                {/* Grilla de Platillos */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0.5rem',
                  margin: '0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '0.5rem',
                  backgroundColor: '#fff'
                }}>
                  {menuData[selectedCategory].platillos.map((platillo) => (
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
              <div style={{width: '400px', minWidth: '380px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FF6F00', boxSizing: 'border-box'}}>
                
                {/* Cabecera */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
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
              Nombre de la Mesa:
            </label>
            <input
              type="text"
              value={nombreMesa}
              onChange={(e) => setNombreMesa(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && confirmarMesa()}
              placeholder="Ej: Mesa 5, Barra, Domicilio"
              autoFocus
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
                disabled={!nombreMesa.trim()}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: !nombreMesa.trim() ? '#ccc' : '#4CAF50',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: !nombreMesa.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (nombreMesa.trim()) {
                    e.currentTarget.style.backgroundColor = '#45A049'
                  }
                }}
                onMouseLeave={(e) => {
                  if (nombreMesa.trim()) {
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

            {/* Botón Cerrar */}
            <button 
              onClick={cerrarVerComanda}
              style={{
                width: '100%',
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
      {mostrarConfirmacionEliminar && comandaAEliminar && (
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

