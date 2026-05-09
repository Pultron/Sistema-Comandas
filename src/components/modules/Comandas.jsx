import { useState } from 'react'
import { ComandIcon, ReportesIcon, HourglassIcon, CheckCircleIcon, DollarSignIcon, EditIcon, TrashIcon } from '../Icons'
import { appStyles } from '../../styles/styles'
import { menuData } from '../../data/menuData'

export const Comandas = ({ comandas }) => {
  const [showComandaForm, setShowComandaForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('caliente')
  const [itemsComanda, setItemsComanda] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [comentarios, setComentarios] = useState('')

  const getBadgeStyle = (estado) => {
    if (estado === 'Servido') return { ...appStyles.badge, ...appStyles.badgeSuccess }
    if (estado === 'Pendiente') return { ...appStyles.badge, ...appStyles.badgePending }
    return { ...appStyles.badge, ...appStyles.badgeProgress }
  }

  const agregarAlComanda = () => {
    if (!selectedItem) return
    
    const nuevoItem = {
      id: Date.now(),
      ...selectedItem,
      cantidad,
      comentarios,
      subtotal: parseFloat(selectedItem.precio.replace('$', '')) * cantidad
    }
    
    setItemsComanda([...itemsComanda, nuevoItem])
    setSelectedItem(null)
    setCantidad(1)
    setComentarios('')
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
    setSelectedItem(null)
    setCantidad(1)
    setComentarios('')
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
            width: '95vw',
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
            <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
              {/* Left Side - Platillos */}
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', borderRight: '2px solid #000', overflow: 'hidden'}}>
                
                {/* Categorías */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderBottom: '2px solid #000',
                  overflowX: 'auto',
                  backgroundColor: '#FF6F00'
                }}>
                  {Object.entries(menuData).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      style={{
                        padding: '0.6rem 1.2rem',
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
                  padding: '0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '0',
                  backgroundColor: '#fff'
                }}>
                  {menuData[selectedCategory].platillos.map((platillo) => (
                    <div
                      key={platillo.id}
                      onClick={() => setSelectedItem(platillo)}
                      style={{
                        cursor: 'pointer',
                        border: '1px solid #999',
                        borderRadius: '0',
                        padding: '1rem 0.8rem',
                        textAlign: 'center',
                        backgroundColor: '#fff',
                        transition: 'background-color 0.2s',
                        height: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minWidth: '0'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                      <div style={{marginBottom: '0.5rem'}}>
                        {typeof platillo.imagen === 'string' && platillo.imagen.startsWith('/') ? (
                          <img 
                            src={platillo.imagen} 
                            alt={platillo.nombre} 
                            style={{
                              width: '50px', 
                              height: '50px', 
                              objectFit: 'cover', 
                              borderRadius: '2px'
                            }} 
                          />
                        ) : (
                          <div style={{fontSize: '2.5rem'}}>{platillo.imagen}</div>
                        )}
                      </div>
                      <p style={{
                        fontSize: '0.65rem',
                        color: '#000',
                        margin: '0.3rem 0 0 0',
                        fontWeight: 600,
                        lineHeight: '1.2'
                      }}>
                        {platillo.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Comanda */}
              <div style={{width: '300px', display: 'flex', flexDirection: 'column', backgroundColor: '#FF6F00'}}>
                
                {/* Item Details */}
                {selectedItem && (
                  <div style={{padding: '1rem', borderBottom: '2px solid #000'}}>
                    <h3 style={{color: '#000', margin: '0 0 1rem 0', fontSize: '0.9rem'}}>Detalles</h3>
                    <p style={{color: '#000', fontSize: '0.85rem', margin: '0.3rem 0'}}>{selectedItem.nombre}</p>
                    <p style={{color: '#000', fontSize: '0.9rem', fontWeight: 700, margin: '0.5rem 0 1rem 0'}}>{selectedItem.precio}</p>
                    
                    <label style={{color: '#000', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem'}}>
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={cantidad}
                      onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '1rem',
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        color: '#000',
                        borderRadius: '4px'
                      }}
                    />

                    <label style={{color: '#000', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem'}}>
                      Comentarios
                    </label>
                    <textarea
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      placeholder="Ej: sin cebolla, poco picante..."
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        color: '#000',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        height: '50px',
                        marginBottom: '1rem'
                      }}
                    />

                    <button
                      onClick={agregarAlComanda}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        backgroundColor: '#000',
                        color: '#FFD54F',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Agregar a Comanda
                    </button>
                  </div>
                )}

                {/* Items en la Comanda */}
                <div style={{flex: 1, overflowY: 'auto', padding: '1rem', borderBottom: '2px solid #000'}}>
                  <h3 style={{color: '#000', margin: '0 0 1rem 0', fontSize: '0.9rem'}}>
                    Items ({itemsComanda.length})
                  </h3>
                  {itemsComanda.map((item) => (
                    <div key={item.id} style={{
                      backgroundColor: '#fff',
                      padding: '0.6rem',
                      marginBottom: '0.6rem',
                      borderRadius: '6px',
                      border: '2px solid #000',
                      maxHeight: '80px'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                        <div style={{flex: 1}}>
                          <p style={{color: '#000', margin: '0 0 0.2rem 0', fontSize: '0.8rem', fontWeight: 700}}>
                            {item.nombre}
                          </p>
                          <p style={{color: '#000', margin: '0 0 0.2rem 0', fontSize: '0.7rem'}}>
                            Cant: {item.cantidad}
                          </p>
                          {item.comentarios && (
                            <p style={{color: '#000', margin: '0.2rem 0 0 0', fontSize: '0.65rem', fontStyle: 'italic'}}>
                              {item.comentarios}
                            </p>
                          )}
                          <p style={{color: '#000', margin: '0.2rem 0 0 0', fontSize: '0.75rem', fontWeight: 700}}>
                            ${item.subtotal.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarDelComanda(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#000',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{padding: '1rem', backgroundColor: '#FF6F00'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                    <span style={{color: '#000'}}>Total:</span>
                    <span style={{color: '#000', fontWeight: 700, fontSize: '1.2rem'}}>
                      ${calcularTotal()}
                    </span>
                  </div>
                  <button
                    onClick={cerrarComanda}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      backgroundColor: '#4CAF50',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer'
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
