import { useState } from 'react'
import { DollarSignIcon, PrintIcon, XIcon } from '../Icons'
import { useComandas } from '../../hooks/useSupabase'

export const Pagos = ({ comandas: comandasProp = [] }) => {
  const { comandas: comandasBd, actualizarEstadoComanda } = useComandas()
  const comandas = comandasProp.length > 0 ? comandasProp : comandasBd
  const comandasActivas = comandas.filter(c => c.estado !== 'Pagado')
  const [mensajeAlerta, setMensajeAlerta] = useState('') 
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)
  const [mostrarTicket, setMostrarTicket] = useState(false)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)

  const obtenerNumeroMesa = (comanda) => {
    return comanda.id_mesa || comanda.mesa?.match(/Mesa\s*(\d+)/i)?.[1] || comanda.mesa || 'sin-mesa'
  }

  const obtenerNombreMesa = (comanda) => {
    const numero = comanda.mesa?.match(/Mesa\s*(\d+)/i)?.[1]
    return numero ? `Mesa ${numero}` : comanda.mesa || 'Sin mesa'
  }

  const parseMonto = (monto) => {
    return parseFloat(String(monto || '0').replace('$', '')) || 0
  }

  const gruposMesa = Object.values(comandasActivas.reduce((acc, comanda) => {
    const key = obtenerNumeroMesa(comanda)
    if (!acc[key]) {
      acc[key] = {
        key,
        mesa: obtenerNombreMesa(comanda),
        cuentas: [],
        total: 0,
        productos: 0
      }
    }
    acc[key].cuentas.push(comanda)
    acc[key].total += parseMonto(comanda.total)
    acc[key].productos += Number(comanda.productos) || 0
    return acc
  }, {}))

  const generarCuenta = (comanda) => {
    setTicketSeleccionado(comanda)
    setMostrarTicket(true)
  }

  const cerrarTicket = () => {
    setMostrarTicket(false)
    setTicketSeleccionado(null)
  }

  const imprimirTicket = () => {
    window.print()
  }

  const calcularPropina = (subtotal) => {
    return (subtotal * 0.1).toFixed(2) // 10% de propina
  }

  const calcularIva = (comanda, subtotal) => {
    const impuestoGuardado = parseFloat(comanda?.impuesto)
    if (!Number.isNaN(impuestoGuardado) && impuestoGuardado > 0) {
      return impuestoGuardado.toFixed(2)
    }
    return (subtotal * 0.15).toFixed(2)
  }

  const calcularTotal = (comanda, subtotal) => {
    const propina = parseFloat(calcularPropina(subtotal))
    const iva = parseFloat(calcularIva(comanda, subtotal))
    return (subtotal + iva + propina).toFixed(2)
  }

  const formatearFecha = (fechaStr) => {
    try {
      const date = new Date(fechaStr)
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      })
    } catch {
      return fechaStr
    }
  }

  const confirmarPago = async (comanda) => {
    await actualizarEstadoComanda(comanda.id, 'pagado')
    setMensajeAlerta(`Pago confirmado para comanda #${comanda.id}`)
    setMesaSeleccionada(prev => {
      if (!prev) return prev
      const cuentas = prev.cuentas.filter(cuenta => cuenta.id !== comanda.id)
      return cuentas.length > 0 ? { ...prev, cuentas } : null
    })
    setTimeout(() => setMensajeAlerta(''), 3000)
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%'}}>
      {/* Mesas disponibles */}
      <div style={{background: '#ECEFF1', borderRadius: '12px', overflow: 'hidden', border: '2px solid #FF6F00', flex: 1, display: 'flex', flexDirection: 'column'}}>
        {comandasActivas.length === 0 ? (
          <div style={{padding: '3rem', textAlign: 'center', color: '#999'}}>
            <p style={{fontSize: '16px', fontWeight: 500}}>No hay comandas activas</p>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', padding: '1.5rem'}}>
            {gruposMesa.map(grupo => (
              <div
                key={grupo.key}
                style={{
                  border: '2px solid #FF6F00',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  backgroundColor: '#fff8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(255, 111, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 111, 0, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 111, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Encabezado */}
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '2px solid #FF6F00', paddingBottom: '1rem', flexDirection: 'column'}}>
                  <div style={{color: '#FF6F00', fontWeight: 700, fontSize: '14px'}}>{grupo.cuentas.length} cuenta{grupo.cuentas.length === 1 ? '' : 's'}</div>
                  <div style={{color: '#000', fontWeight: 700, fontSize: '18px', marginTop: '0.3rem'}}>{grupo.mesa}</div>
                </div>

                {/* Detalles */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '13px', color: '#666'}}>
                  <div>
                    <div style={{color: '#999', fontSize: '11px', fontWeight: 500}}>CUENTAS</div>
                    <div style={{color: '#000', fontWeight: 600, marginTop: '0.3rem'}}>{grupo.cuentas.length}</div>
                  </div>
                  <div>
                    <div style={{color: '#999', fontSize: '11px', fontWeight: 500}}>PRODUCTOS</div>
                    <div style={{color: '#000', fontWeight: 600, marginTop: '0.3rem'}}>{grupo.productos}</div>
                  </div>
                  <div>
                    <div style={{color: '#999', fontSize: '11px', fontWeight: 500}}>TOTAL MESA</div>
                    <div style={{color: '#4CAF50', fontWeight: 700, fontSize: '14px', marginTop: '0.3rem'}}>${grupo.total.toFixed(2)}</div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button
                    onClick={() => setMesaSeleccionada(grupo)}
                    style={{
                      flex: 1,
                      padding: '0.8rem',
                      background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(90deg, #E55100 0%, #FF9800 50%, #FF7F3D 100%)'
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                     Ver cuenta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de cuentas por mesa */}
      {mesaSeleccionada && (
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
          zIndex: 1900,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            width: 'min(720px, 96vw)',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '3px solid #FF6F00'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.2rem 1.5rem',
              backgroundColor: '#FF6F00',
              borderBottom: '2px solid #111827'
            }}>
              <div>
                <h2 style={{margin: 0, color: '#111827', fontSize: '20px', fontWeight: 800}}>
                  {mesaSeleccionada.mesa}
                </h2>
                <div style={{fontSize: '13px', color: '#111827', fontWeight: 700, marginTop: '0.25rem'}}>
                  {mesaSeleccionada.cuentas.length} cuenta{mesaSeleccionada.cuentas.length === 1 ? '' : 's'}
                </div>
              </div>
              <button
                onClick={() => setMesaSeleccionada(null)}
                style={{background: 'none', border: 'none', cursor: 'pointer', color: '#111827'}}
                title="Cerrar"
              >
                <XIcon size={24} color="currentColor" />
              </button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem'}}>
              {mesaSeleccionada.cuentas.map(cuenta => (
                <div
                  key={cuenta.id}
                  style={{
                    border: '2px solid #FFB300',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#fff8f0',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{color: '#FF6F00', fontWeight: 800, fontSize: '13px'}}>Comanda #{cuenta.id}</div>
                    <div style={{color: '#111827', fontWeight: 800, fontSize: '17px', marginTop: '0.25rem'}}>
                      {cuenta.cuentaSeparada && cuenta.nombreCuenta ? `${cuenta.mesa} - ${cuenta.nombreCuenta}` : cuenta.mesa}
                    </div>
                    <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.6rem', color: '#555', fontSize: '13px'}}>
                      <span>{cuenta.productos} productos</span>
                      <span>{formatearFecha(cuenta.fecha)}</span>
                      <span style={{fontWeight: 800, color: '#4CAF50'}}>{cuenta.total}</span>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                    <button
                      onClick={() => generarCuenta(cuenta)}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 100%)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Ver ticket
                    </button>
                    <button
                      onClick={() => confirmarPago(cuenta)}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(90deg, #4CAF50 0%, #43A047 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Confirmar pago
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal del Ticket */}
      {mostrarTicket && ticketSeleccionado && (
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
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '2px solid #FF6F00',
              backgroundColor: '#FF6F00'
            }}>
              <h2 style={{color: '#000', margin: 0, fontSize: '18px', fontWeight: 700}}>Cuenta de Comanda</h2>
              <button
                onClick={cerrarTicket}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#000',
                  fontSize: '24px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                ×
              </button>
            </div>

            {/* Contenido del Ticket */}
            <div style={{flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column'}}>
              {/* Ticket Content */}
              <div
                id="ticket-content"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#000'
                }}
              >
                {/* Header */}
                <div style={{textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1rem'}}>
                  <img src="/LogoGastroSoftHeader.png" alt="GastroSoft" style={{height: '80px'}} />
                </div>

                {/* Info Comanda */}
                <div style={{marginBottom: '1rem', fontSize: '12px', textAlign: 'left'}}>
                  <div style={{marginBottom: '0.5rem'}}>
                    <span>Comanda Nº: <span style={{fontWeight: 700}}>#{ticketSeleccionado.id}</span></span>
                  </div>
                  <div style={{marginBottom: '0.5rem'}}>
                    <span>Mesa/Cliente: <span style={{fontWeight: 700}}>{ticketSeleccionado.mesa}</span></span>
                  </div>
                  <div style={{marginBottom: '0.5rem'}}>
                    <span>Fecha: {formatearFecha(ticketSeleccionado.fecha)}</span>
                  </div>
                  <div>
                    <span>Hora: {ticketSeleccionado.fecha.split(' ')[1]}</span>
                  </div>
                </div>

                {/* Separador */}
                <div style={{borderTop: '2px solid #000', padding: '0.8rem 0', margin: '1rem 0'}}>
                </div>

                {/* Items */}
                <div style={{marginBottom: '1rem', fontSize: '11px'}}>
                  {ticketSeleccionado.items && ticketSeleccionado.items.length > 0 ? (
                    ticketSeleccionado.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                          paddingBottom: '0.5rem',
                          borderBottom: '1px solid #ddd'
                        }}
                      >
                        <div style={{fontWeight: 600, flex: 1}}>
                          {item.nombre}
                        </div>
                        <div style={{textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '0.5rem'}}>
                          {item.cantidad} x {item.precio}
                        </div>
                        <div style={{textAlign: 'right', fontWeight: 700, color: '#4CAF50', whiteSpace: 'nowrap', marginLeft: '0.5rem', minWidth: '60px'}}>
                          ${item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{textAlign: 'center', color: '#999'}}>
                      Sin detalles de items
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div style={{borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '1rem 0', margin: '1rem 0'}}>
                  {(() => {
                    const subtotalTicket = ticketSeleccionado.subtotal || parseFloat(ticketSeleccionado.total.replace('$', ''))
                    return (
                      <>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.6rem'}}>
                    <span>Subtotal:</span>
                    <span style={{fontWeight: 700}}>${subtotalTicket.toFixed(2)}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.6rem'}}>
                    <span>IVA:</span>
                    <span style={{fontWeight: 700}}>
                      ${calcularIva(ticketSeleccionado, subtotalTicket)}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.6rem'}}>
                    <span>Costo Servicio (10%):</span>
                    <span style={{fontWeight: 700}}>
                      ${calcularPropina(subtotalTicket)}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: '#4CAF50'}}>
                    <span>TOTAL:</span>
                    <span style={{fontSize: '16px'}}>
                      ${calcularTotal(ticketSeleccionado, subtotalTicket)}
                    </span>
                  </div>
                      </>
                    )
                  })()}
                </div>

                {/* Footer */}
                <div style={{textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #ddd'}}>
                  <div>¡Gracias por su compra!</div>
                  <div style={{marginTop: '0.5rem'}}>Esperamos contar con usted pronto</div>
                  <div style={{marginTop: '1rem', fontSize: '9px', color: '#999'}}>
                    GastroSoft © 2026
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div style={{
              padding: '1.5rem',
              borderTop: '2px solid #FF6F00',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cerrarTicket}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
              >
                Cerrar
              </button>
              <button
                onClick={imprimirTicket}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
              >
                🖨 Imprimir
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
          backgroundColor: mensajeAlerta.includes('confirmado') ? '#4CAF50' : '#DC2626',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 3000,
          fontWeight: 700,
          fontSize: '14px',
          animation: 'slideIn 0.3s ease-in-out'
        }}>
          {mensajeAlerta}
        </div>
      )}

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #ticket-content {
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          button, .no-print {
            display: none !important;
          }
          div[style*="position: fixed"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
