import { useState } from 'react'
import { DollarSignIcon, PrintIcon, XIcon } from '../Icons'
import { appStyles } from '../../styles/styles'

export const Pagos = ({ comandas }) => {
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)
  const [mostrarTicket, setMostrarTicket] = useState(false)

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

  const calcularTotal = (subtotal) => {
    const propina = parseFloat(calcularPropina(subtotal))
    return (subtotal + propina).toFixed(2)
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

  return (
    <div>
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          <DollarSignIcon size={24} color="#FFD54F" style={{marginRight: '0.5rem', verticalAlign: 'middle'}} /> 
          Gestión de Pagos
        </h1>
      </div>

      {/* Mesas disponibles */}
      <div style={{background: 'white', borderRadius: '12px', overflow: 'hidden', border: '2px solid #FF6F00', marginBottom: '2rem'}}>
        {comandas.length === 0 ? (
          <div style={{padding: '3rem', textAlign: 'center', color: '#999'}}>
            <p style={{fontSize: '16px', fontWeight: 500}}>No hay comandas activas</p>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', padding: '1.5rem'}}>
            {comandas.map(comanda => (
              <div
                key={comanda.id}
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
                  <div style={{color: '#FF6F00', fontWeight: 700, fontSize: '14px'}}>Comanda #{comanda.id}</div>
                  <div style={{color: '#000', fontWeight: 700, fontSize: '18px', marginTop: '0.3rem'}}>{comanda.mesa}</div>
                </div>

                {/* Detalles */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '13px', color: '#666'}}>
                  <div>
                    <div style={{color: '#999', fontSize: '11px', fontWeight: 500}}>FECHA</div>
                    <div style={{color: '#000', fontWeight: 600, marginTop: '0.3rem'}}>{formatearFecha(comanda.fecha)}</div>
                  </div>
                  <div>
                    <div style={{color: '#999', fontSize: '11px', fontWeight: 500}}>HORA</div>
                    <div style={{color: '#000', fontWeight: 600, marginTop: '0.3rem'}}>{comanda.fecha.split(' ')[1]}</div>
                  </div>
                  <div>
                    <div style={{color: '#999', fontSize: '11px', fontWeight: 500}}>PRODUCTOS</div>
                    <div style={{color: '#000', fontWeight: 600, marginTop: '0.3rem'}}>{comanda.productos}</div>
                  </div>
                  <div>
                    <div style={{color: '#999', fontSize: '11px', fontWeight: 500}}>TOTAL</div>
                    <div style={{color: '#4CAF50', fontWeight: 700, fontSize: '14px', marginTop: '0.3rem'}}>{comanda.total}</div>
                  </div>
                </div>

                {/* Botón Generar Cuenta */}
                <button
                  onClick={() => generarCuenta(comanda)}
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
                    transition: 'all 0.3s ease',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E55100'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF6F00'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  🧾 Generar Cuenta
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <div style={{fontSize: '16px', fontWeight: 700}}>🍴 GASTROSOFT</div>
                  <div style={{fontSize: '11px', color: '#666', marginTop: '0.3rem'}}>Sistema de Gestión de Restaurante</div>
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
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.6rem'}}>
                    <span>Subtotal:</span>
                    <span style={{fontWeight: 700}}>${ticketSeleccionado.subtotal ? ticketSeleccionado.subtotal.toFixed(2) : parseFloat(ticketSeleccionado.total.replace('$', '')).toFixed(2)}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.6rem'}}>
                    <span>Costo Servicio (10%):</span>
                    <span style={{fontWeight: 700}}>
                      ${calcularPropina(ticketSeleccionado.subtotal || parseFloat(ticketSeleccionado.total.replace('$', '')))}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: '#4CAF50'}}>
                    <span>TOTAL:</span>
                    <span style={{fontSize: '16px'}}>
                      ${calcularTotal(ticketSeleccionado.subtotal || parseFloat(ticketSeleccionado.total.replace('$', '')))}
                    </span>
                  </div>
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
