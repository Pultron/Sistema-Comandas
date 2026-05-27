import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { supabase } from '../../supabase'
import { useClientes, useComandas, useMesas } from '../../hooks/useSupabase'

export const ClientesModule = () => {
  const {
    clientes,
    reservaciones,
    guardarCliente: guardarClienteBd,
    eliminarCliente: eliminarClienteBd,
    guardarReservacion: guardarReservacionBd,
    refetchReservaciones
  } = useClientes()
  const { mesas, refetch: refetchMesas } = useMesas()
  const { comandas } = useComandas()

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

  const reservacionesTerminadas = reservaciones.filter(reserva => reserva.estado === 'terminada')
  const reservacionesActivas = reservaciones.filter(reserva => reserva.estado !== 'terminada')

  const obtenerComandaActiva = (mesa) => {
    return comandas.find(c => {
      const mismaMesa = c.mesa === `Mesa ${mesa.numero}` || c.mesa?.startsWith(`Mesa ${mesa.numero} `)
      return mismaMesa && c.estado !== 'Pagado' && c.estado !== 'Cancelado'
    })
  }

  const mesasDisponibles = mesas
    .filter(mesa => {
      const esMesaActual = String(mesa.id) === String(reservaData.mesa)
      const estadoMesa = String(mesa.estado || '').trim().toLowerCase()
      const estadoDisponible = !['ocupada', 'reservada'].includes(estadoMesa) || esMesaActual
      return !obtenerComandaActiva(mesa) && estadoDisponible
    })
    .sort((a, b) => Number(a.numero) - Number(b.numero))

  const avisarCambioComandas = () => {
    window.dispatchEvent(new Event('comandas:changed'))
    window.dispatchEvent(new Event('mesas:changed'))
    window.dispatchEvent(new Event('reservaciones:changed'))
  }

  const sincronizarComandaReservacion = async (idReservacion, reserva) => {
    const idMesa = parseInt(reserva.mesa)
    const personas = parseInt(reserva.personas)
    const cliente = reserva.cliente.trim()

    const { data: mesaData } = await supabase
      .from('mesas')
      .select('numero')
      .eq('id', idMesa)
      .single()

    const nombreMesa = `Reservacion - Mesa ${mesaData?.numero || idMesa} - ${cliente}`

    const { data: comandaExistente } = await supabase
      .from('comandas')
      .select('id')
      .eq('id_reservacion', idReservacion)
      .maybeSingle()

    if (comandaExistente?.id) {
      const { error } = await supabase
        .from('comandas')
        .update({
          id_mesa: idMesa,
          nombre_mesa: nombreMesa,
          limite_cuentas: personas,
          updated_at: new Date().toISOString()
        })
        .eq('id', comandaExistente.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from('comandas').insert({
        numero_comanda: `RES-${Date.now()}`,
        id_mesa: idMesa,
        nombre_mesa: nombreMesa,
        id_mesero: 1,
        estado: 'pendiente',
        subtotal: 0,
        descuento: 0,
        impuesto: 0,
        total: 0,
        id_reservacion: idReservacion,
        limite_cuentas: personas
      })

      if (error) throw error
    }

    avisarCambioComandas()
  }

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

  const registrarVisita = async () => {
    alert('El historial de visitas ya no esta activo')
  }

  const abrirReservacion = (reserva = null) => {
    if (reserva) {
      setEditando(reserva)
      setReservaData({
        cliente: reserva.cliente,
        fecha: reserva.fecha,
        hora: reserva.hora,
        personas: reserva.personas,
        mesa: reserva.idMesa || reserva.id_mesa || '',
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

    try {
      if (editando) {
        const mesaAnterior = editando.idMesa || editando.id_mesa

        if (mesaAnterior && String(mesaAnterior) !== String(reservaData.mesa)) {
          const { error: liberarError } = await supabase
            .from('mesas')
            .update({ estado: 'disponible' })
            .eq('id', mesaAnterior)

          if (liberarError) throw liberarError
        }

        const { error: reservaError } = await supabase.from('reservaciones').update({
          cliente: reservaData.cliente.trim(),
          fecha: reservaData.fecha,
          hora: reservaData.hora,
          personas: parseInt(reservaData.personas),
          id_mesa: parseInt(reservaData.mesa),
          telefono: reservaData.telefono
        }).eq('id', editando.id)

        if (reservaError) throw reservaError

        const { error: mesaError } = await supabase
          .from('mesas')
          .update({ estado: 'reservada' })
          .eq('id', parseInt(reservaData.mesa))

        if (mesaError) throw mesaError
        await sincronizarComandaReservacion(editando.id, reservaData)
      } else {
        await guardarReservacionBd(reservaData)
      }

      await refetchReservaciones()
      await refetchMesas()
      setMostrarReservacion(false)
    } catch (error) {
      alert(`No se pudo guardar la reservacion: ${error.message}`)
    }
  }

  const cancelarReservacion = async (reserva) => {
    if (confirm('¿Cancelar esta reservación?')) {
      const { data: comandasReserva } = await supabase
        .from('comandas')
        .select('id')
        .eq('id_reservacion', reserva.id)

      const idsComandas = (comandasReserva || []).map(comanda => comanda.id)
      if (idsComandas.length > 0) {
        await supabase.from('detalles_comanda').delete().in('id_comanda', idsComandas)
        await supabase.from('comandas').delete().in('id', idsComandas)
      }

      await supabase.from('reservaciones').delete().eq('id', reserva.id)
      if (reserva.idMesa || reserva.id_mesa) {
        await supabase
          .from('mesas')
          .update({ estado: 'disponible' })
          .eq('id', reserva.idMesa || reserva.id_mesa)
      }
      await refetchReservaciones()
      await refetchMesas()
      avisarCambioComandas()
    }
  }

  const renderTarjetaReservacion = (reserva, terminada = false) => (
    <div key={reserva.id} style={{
      background: terminada ? '#F8FAFC' : 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: `2px solid ${terminada ? '#22C55E' : '#FFC107'}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      display: 'grid',
      gridTemplateColumns: terminada ? '1fr' : '1fr auto',
      gap: '1.5rem',
      alignItems: 'center'
    }}>
      <div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem'}}>
          <div style={{fontSize: '18px', fontWeight: 700, color: '#333'}}>
            {reserva.cliente}
          </div>
          {terminada && (
            <span style={{
              display: 'inline-block',
              padding: '0.35rem 0.7rem',
              background: '#DCFCE7',
              color: '#166534',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '12px'
            }}>
              Terminada
            </span>
          )}
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
            <div style={{fontSize: '16px', fontWeight: 700, color: terminada ? '#166534' : '#FF6F00'}}> #{reserva.mesa}</div>
          </div>
          <div>
            <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>TELEFONO</div>
            <div style={{fontSize: '14px', color: '#333'}}>{reserva.telefono}</div>
          </div>
        </div>
      </div>
      {!terminada && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: '120px'}}>
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
            onClick={() => cancelarReservacion(reserva)}
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
      )}
    </div>
  )

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
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
          <h2 style={{margin: 0, color: '#333', fontSize: '20px', fontWeight: 800}}>Reservaciones activas</h2>
          <span style={{fontSize: '13px', fontWeight: 700, color: '#666'}}>{reservacionesActivas.length} activas</span>
        </div>
        {reservacionesActivas.length === 0 && (
          <div style={{padding: '2rem', background: 'white', borderRadius: '12px', border: '2px dashed #D1D5DB', color: '#777', textAlign: 'center'}}>
            No hay reservaciones activas
          </div>
        )}
        {reservacionesActivas.map(reserva => (
          <div key={reserva.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '2px solid #FFC107',
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
              </div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: '120px'}}>
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
                onClick={() => cancelarReservacion(reserva)}
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

        <div style={{height: '1px', background: '#E5E7EB', margin: '0.5rem 0'}} />

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
          <h2 style={{margin: 0, color: '#333', fontSize: '20px', fontWeight: 800}}>Reservaciones terminadas</h2>
          <span style={{fontSize: '13px', fontWeight: 700, color: '#166534'}}>{reservacionesTerminadas.length} terminadas</span>
        </div>
        {reservacionesTerminadas.length === 0 ? (
          <div style={{padding: '2rem', background: '#F8FAFC', borderRadius: '12px', border: '2px dashed #BBF7D0', color: '#166534', textAlign: 'center'}}>
            Las reservaciones pagadas apareceran aqui
          </div>
        ) : (
          reservacionesTerminadas.map(reserva => renderTarjetaReservacion(reserva, true))
        )}
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
                <input
                  type="text"
                  value={reservaData.cliente} 
                  onChange={(e) => setReservaData({...reservaData, cliente: e.target.value})} 
                  placeholder="Nombre del cliente"
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
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
                  <select
                    value={reservaData.mesa} 
                    onChange={(e) => setReservaData({...reservaData, mesa: e.target.value})} 
                    disabled={mesasDisponibles.length === 0}
                    style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} 
                    onFocus={(e) => e.target.style.borderColor = '#FF6F00'} 
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  >
                    <option value="">Selecciona una mesa</option>
                    {mesasDisponibles.map(mesa => (
                      <option key={mesa.id} value={mesa.id}>
                        Mesa {mesa.numero} - {mesa.ubicacion}
                      </option>
                    ))}
                  </select>
                  {mesasDisponibles.length === 0 && (
                    <div style={{color: '#7F1D1D', fontSize: '13px', fontWeight: 700, marginTop: '0.5rem'}}>
                      No hay mesas disponibles en este momento.
                    </div>
                  )}
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
