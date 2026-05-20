import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { useClientes } from '../../hooks/useSupabase'

export const ClientesModule = () => {
  const {
    clientes,
    reservaciones,
    guardarCliente: guardarClienteBd,
    eliminarCliente: eliminarClienteBd,
    guardarReservacion: guardarReservacionBd,
    refetch,
    refetchReservaciones
  } = useClientes()

  const [pestana] = useState('reservaciones')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarReservacion, setMostrarReservacion] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mostrarDetalles, setMostrarDetalles] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipoCliente: 'regular',
    capitalConsumable: 0
  })

  const [reservaData, setReservaData] = useState({
    cliente: '',
    fecha: '',
    hora: '',
    personas: '',
    mesa: '',
    telefono: ''
  })

  const abrirFormulario = (cliente = null) => {
    if (cliente) {
      setEditando(cliente)
      setFormData({
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        tipoCliente: cliente.tipoCliente,
        capitalConsumable: cliente.capitalConsumable
      })
    } else {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        tipoCliente: 'regular',
        capitalConsumable: 0
      })
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const guardarCliente = () => {
    if (!formData.nombre || !formData.email || !formData.telefono) {
      alert('Por favor completa todos los campos')
      return
    }

    guardarClienteBd(formData, editando)

    setMostrarFormulario(false)
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      tipoCliente: 'regular',
      capitalConsumable: 0
    })
  }

  const eliminarCliente = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      eliminarClienteBd(id)
    }
  }

  const registrarVisita = async (id) => {
    const hoy = new Date().toISOString().split('T')[0]
    await supabase.from('visitas_clientes').insert({
      id_cliente: id,
      fecha_visita: hoy,
      total_gastado: 0
    })
    await refetch()
    alert('Visita registrada')
  }

  const abrirReservacion = (reserva = null) => {
    if (reserva) {
      setEditando(reserva)
      setReservaData({
        cliente: reserva.cliente,
        fecha: reserva.fecha,
        hora: reserva.hora,
        personas: reserva.personas,
        mesa: reserva.mesa,
        telefono: reserva.telefono
      })
    } else {
      setReservaData({
        cliente: '',
        fecha: '',
        hora: '',
        personas: '',
        mesa: '',
        telefono: ''
      })
      setEditando(null)
    }
    setMostrarReservacion(true)
  }

  const guardarReservacion = async () => {
    if (!reservaData.cliente || !reservaData.fecha || !reservaData.hora || !reservaData.personas || !reservaData.mesa) {
      alert('Completa todos los campos')
      return
    }

    if (editando) {
      await supabase.from('reservaciones').update({
        nombre_cliente: reservaData.cliente,
        telefono: reservaData.telefono,
        fecha: reservaData.fecha,
        hora: reservaData.hora,
        personas: parseInt(reservaData.personas),
        id_mesa: parseInt(reservaData.mesa),
        estado: 'pendiente'
      }).eq('id', editando.id)
    } else {
      await guardarReservacionBd(reservaData)
    }

    await refetchReservaciones()
    setMostrarReservacion(false)
  }

  const cancelarReservacion = async (id) => {
    if (confirm('¿Cancelar esta reservación?')) {
      await supabase.from('reservaciones').update({ estado: 'cancelada' }).eq('id', id)
      await refetchReservaciones()
    }
  }

  const confirmarReservacion = async (id) => {
    await supabase.from('reservaciones').update({ estado: 'confirmada' }).eq('id', id)
    await refetchReservaciones()
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          Reservaciones
        </h1>
        <button
          onClick={() => abrirReservacion()}
          style={{...appStyles.btnPrimary}}
        >
          + Nueva Reservación
        </button>
      </div>

      {/* SECCIÓN CLIENTES */}
      {pestana === 'clientes' && (
      <>
      {/* Grid de Clientes */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem'}}>
        {clientes.map(cliente => {
          const capitalDisponible = cliente.capitalConsumable - cliente.capitalUtilizado
          const porcentajeUtilizado = cliente.capitalConsumable > 0 
            ? ((cliente.capitalUtilizado / cliente.capitalConsumable) * 100).toFixed(1)
            : 0
          
          return (
            <div
              key={cliente.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: cliente.tipoCliente === 'vip' ? '2px solid #FFB300' : '2px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Encabezado */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {cliente.nombre}
                    {cliente.tipoCliente === 'vip' && <span style={{fontSize: '16px'}}></span>}
                  </div>
                  <div style={{fontSize: '12px', color: '#999', marginTop: '0.3rem'}}>
                    ID: #{cliente.id}
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <div style={{fontSize: '13px', color: '#666'}}>
                   {cliente.email}
                </div>
                <div style={{fontSize: '13px', color: '#666'}}>
                  {cliente.telefono}
                </div>
              </div>

              {/* Capital Consumible (solo para VIP) */}
              {cliente.tipoCliente === 'vip' && (
                <div style={{
                  background: '#FFF8F0',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: '1px solid #FFE0B2'
                }}>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>
                    CAPITAL CONSUMIBLE
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{fontSize: '16px', fontWeight: 700, color: '#FF6F00'}}>
                      ${cliente.capitalConsumable.toLocaleString()}
                    </div>
                    <div style={{fontSize: '12px', color: '#999'}}>
                      Utilizado: ${cliente.capitalUtilizado.toLocaleString()}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div style={{
                    background: '#e0e0e0',
                    borderRadius: '6px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 100%)',
                      height: '100%',
                      width: `${porcentajeUtilizado}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{fontSize: '11px', color: '#999', marginTop: '0.3rem'}}>
                    Disponible: ${capitalDisponible.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Últimas Visitas */}
              <div style={{marginBottom: '1rem'}}>
                <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>
                  VISITAS RECIENTES
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.3rem'}}>
                  {cliente.fechasVisitas.slice(0, 3).map((fecha, idx) => (
                    <div key={idx} style={{fontSize: '12px', color: '#333', padding: '0.3rem 0'}}>
                      📅 {fecha}
                    </div>
                  ))}
                  {cliente.fechasVisitas.length === 0 && (
                    <div style={{fontSize: '12px', color: '#999', fontStyle: 'italic'}}>
                      Sin visitas registradas
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem'}}>
                <button
                  onClick={() => registrarVisita(cliente.id)}
                  style={{
                    padding: '0.6rem',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#388E3C'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
                >
                  Visita Hoy
                </button>
                <button
                  onClick={() => setMostrarDetalles(cliente)}
                  style={{
                    padding: '0.6rem',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1976D2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2196F3'}
                >
                 Detalles
                </button>
              </div>

              {/* Botones Editar/Eliminar */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.8rem'}}>
                <button
                  onClick={() => abrirFormulario(cliente)}
                  style={{
                    padding: '0.6rem',
                    background: '#FFC107',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                   Editar
                </button>
                <button
                  onClick={() => eliminarCliente(cliente.id)}
                  style={{
                    padding: '0.6rem',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                >
                   Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>
      </>
      )}

      {/* SECCIÓN RESERVACIONES */}
      {pestana === 'reservaciones' && (
      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'}}>
        {reservaciones.map(reserva => (
          <div key={reserva.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: `2px solid ${reserva.estado === 'confirmada' ? '#4CAF50' : '#FFC107'}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            <div>
              <div style={{fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '1rem'}}>
                {reserva.cliente}
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem'}}>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>FECHA</div>
                  <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}> {reserva.fecha}</div>
                </div>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>HORA</div>
                  <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}> {reserva.hora}</div>
                </div>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>PERSONAS</div>
                  <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}> {reserva.personas}</div>
                </div>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>MESA</div>
                  <div style={{fontSize: '16px', fontWeight: 700, color: '#FF6F00'}}> #{reserva.mesa}</div>
                </div>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>TELÉFONO</div>
                  <div style={{fontSize: '14px', color: '#333'}}>{reserva.telefono}</div>
                </div>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>ESTADO</div>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.3rem 0.8rem',
                    background: reserva.estado === 'confirmada' ? '#E0F0E0' : '#FFF3E0',
                    color: reserva.estado === 'confirmada' ? '#2E7D32' : '#E65100',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {reserva.estado === 'confirmada' ? '✓ Confirmada' : ' Pendiente'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: '120px'}}>
              {reserva.estado === 'pendiente' && (
                <button
                  onClick={() => confirmarReservacion(reserva.id)}
                  style={{
                    padding: '0.7rem 1rem',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Confirmar
                </button>
              )}
              <button
                onClick={() => abrirReservacion(reserva)}
                style={{
                  padding: '0.7rem 1rem',
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
              <button
                onClick={() => cancelarReservacion(reserva.id)}
                style={{
                  padding: '0.7rem 1rem',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                 Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal Formulario Clientes */}
      {mostrarFormulario && (
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
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: '#333', margin: 0, fontSize: '20px', fontWeight: 700}}>
                {editando ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'}}
              >
                ×
              </button>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Tipo de Cliente
                </label>
                <select
                  value={formData.tipoCliente}
                  onChange={(e) => setFormData({...formData, tipoCliente: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                >
                  <option value="regular">Cliente Regular</option>
                  <option value="vip">Cliente VIP</option>
                </select>
              </div>

              {formData.tipoCliente === 'vip' && (
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                    Capital Consumible ($)
                  </label>
                  <input
                    type="number"
                    value={formData.capitalConsumable}
                    onChange={(e) => setFormData({...formData, capitalConsumable: e.target.value})}
                    placeholder="Ej: 50000"
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
              )}

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  style={{
                    padding: '0.8rem',
                    background: '#e0e0e0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCliente}
                  style={{
                    padding: '0.8rem',
                    background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {mostrarDetalles && (
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
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: '#333', margin: 0, fontSize: '20px', fontWeight: 700}}>
                {mostrarDetalles.nombre}
              </h2>
              <button
                onClick={() => setMostrarDetalles(null)}
                style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'}}
              >
                
              </button>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              <div>
                <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>EMAIL</div>
                <div style={{fontSize: '16px', color: '#333', fontWeight: 600}}>{mostrarDetalles.email}</div>
              </div>

              <div>
                <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>TELÉFONO</div>
                <div style={{fontSize: '16px', color: '#333', fontWeight: 600}}>{mostrarDetalles.telefono}</div>
              </div>

              <div>
                <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>TIPO DE CLIENTE</div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.4rem 0.8rem',
                  background: mostrarDetalles.tipoCliente === 'vip' ? '#FFE082' : '#E0E0E0',
                  color: mostrarDetalles.tipoCliente === 'vip' ? '#FF6F00' : '#666',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '12px'
                }}>
                  {mostrarDetalles.tipoCliente === 'vip' ? ' VIP' : ' Regular'}
                </div>
              </div>

              {mostrarDetalles.tipoCliente === 'vip' && (
                <>
                  <div>
                    <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>CAPITAL CONSUMIBLE</div>
                    <div style={{fontSize: '20px', color: '#FF6F00', fontWeight: 700}}>
                      ${mostrarDetalles.capitalConsumible.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>UTILIZADO</div>
                    <div style={{fontSize: '20px', color: '#333', fontWeight: 700}}>
                      ${mostrarDetalles.capitalUtilizado.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>DISPONIBLE</div>
                    <div style={{fontSize: '20px', color: '#4CAF50', fontWeight: 700}}>
                      ${(mostrarDetalles.capitalConsumible - mostrarDetalles.capitalUtilizado).toLocaleString()}
                    </div>
                  </div>
                </>
              )}

              <div>
                <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.8rem'}}>HISTORIAL DE VISITAS</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {mostrarDetalles.fechasVisitas.map((fecha, idx) => (
                    <div key={idx} style={{
                      padding: '0.8rem',
                      background: '#F5F5F5',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#333'
                    }}>
                      📅 {fecha}
                    </div>
                  ))}
                  {mostrarDetalles.fechasVisitas.length === 0 && (
                    <div style={{color: '#999', fontStyle: 'italic'}}>Sin visitas registradas</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setMostrarDetalles(null)}
                style={{
                  padding: '0.8rem',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginTop: '1rem'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reservación */}
      {mostrarReservacion && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '90%', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', maxHeight: '90vh', overflowY: 'auto'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>
              {editando ? 'Editar Reservación' : 'Nueva Reservación'}
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Cliente</label>
                <select 
                  value={reservaData.cliente} 
                  onChange={(e) => setReservaData({...reservaData, cliente: e.target.value})} 
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                >
                  <option value="">Selecciona un cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Fecha</label>
                  <input 
                    type="date" 
                    value={reservaData.fecha} 
                    onChange={(e) => setReservaData({...reservaData, fecha: e.target.value})} 
                    style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                    onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Hora</label>
                  <input 
                    type="time" 
                    value={reservaData.hora} 
                    onChange={(e) => setReservaData({...reservaData, hora: e.target.value})} 
                    style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                    onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Personas</label>
                  <input 
                    type="number" 
                    value={reservaData.personas} 
                    onChange={(e) => setReservaData({...reservaData, personas: e.target.value})} 
                    style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                    onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Mesa</label>
                  <input 
                    type="number" 
                    value={reservaData.mesa} 
                    onChange={(e) => setReservaData({...reservaData, mesa: e.target.value})} 
                    style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                    onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Teléfono</label>
                <input 
                  type="text" 
                  value={reservaData.telefono} 
                  onChange={(e) => setReservaData({...reservaData, telefono: e.target.value})} 
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button 
                  onClick={() => setMostrarReservacion(false)} 
                  style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}
                >
                  Cancelar
                </button>
                <button 
                  onClick={guardarReservacion} 
                  style={{padding: '0.8rem', background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
