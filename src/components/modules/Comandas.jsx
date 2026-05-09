import { useState } from 'react'
import { ComandIcon, ReportesIcon, HourglassIcon, CheckCircleIcon, DollarSignIcon, EditIcon, TrashIcon } from '../Icons'
import { appStyles } from '../../styles/styles'
import { menuData } from '../../data/menuData'

export const Comandas = ({ comandas }) => {
  const [showComandaForm, setShowComandaForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('caliente')
  const [itemsComanda, setItemsComanda] = useState([])

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

  const cerrarComanda = () => {
    setShowComandaForm(false)
    setItemsComanda([])
    setSelectedCategory('caliente')
  }

  return (
    <div>
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          <ComandIcon size={24} color="#FFD54F" style={{marginRight: '0.5rem', verticalAlign: 'middle'}} /> 
          Comandas Activas
        </h1>
        <button style={appStyles.btnPrimary} onClick={() => setShowComandaForm(true)}>+ Nueva Comanda</button>
      </div>

      {/* Stats */}
      <div style={appStyles.statsContainer}>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <ReportesIcon size={28} color="white" />
          </div>
          <div style={appStyles.statLabel}>Total Comandas</div>
          <div style={appStyles.statValue}>12</div>
        </div>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <HourglassIcon size={28} color="white" />
          </div>
          <div style={appStyles.statLabel}>En Progreso</div>
          <div style={appStyles.statValue}>5</div>
        </div>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <CheckCircleIcon size={28} color="white" />
          </div>
          <div style={appStyles.statLabel}>Completadas</div>
          <div style={appStyles.statValue}>6</div>
        </div>
        <div style={appStyles.statCard}>
          <div style={appStyles.statIcon}>
            <DollarSignIcon size={28} color="white" />
          </div>
          <div style={appStyles.statLabel}>Ingresos Hoy</div>
          <div style={appStyles.statValue}>$850</div>
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
                  <button style={{background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem', color: '#FFD54F', padding: '0.4rem'}}>
                    <EditIcon size={18} color="currentColor" />
                  </button>
                  <button style={{background: 'none', border: 'none', cursor: 'pointer', color: '#FF6F6F', padding: '0.4rem'}}>
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
              <h2 style={{color: '#000', margin: 0}}>Nueva Comanda</h2>
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
                    onClick={cerrarComanda}
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
                    Guardar Comanda
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
