import { useState } from 'react'
import { appStyles } from '../../styles/styles'

export const CajaModule = ({ comandas }) => {
  const [mostrarCorte, setMostrarCorte] = useState(false)
  const [historialCortes, setHistorialCortes] = useState([
    {
      id: 1,
      fecha: '2024-05-17',
      turno: 'Mañana',
      totalVentas: 125000,
      pagosEfectivo: 75000,
      pagosTarjeta: 50000,
      cancelaciones: 5000,
      descuentos: 3000,
      usuario: 'Juan Pérez'
    },
    {
      id: 2,
      fecha: '2024-05-16',
      turno: 'Tarde',
      totalVentas: 98000,
      pagosEfectivo: 60000,
      pagosTarjeta: 38000,
      cancelaciones: 2000,
      descuentos: 1000,
      usuario: 'María García'
    }
  ])

  const [formCorte, setFormCorte] = useState({
    turno: 'Mañana',
    pagosEfectivo: '',
    pagosTarjeta: '',
    cancelaciones: '',
    descuentos: ''
  })

  const realizarCorte = () => {
    if (!formCorte.pagosEfectivo || !formCorte.pagosTarjeta) {
      alert('Por favor completa todos los campos de pago')
      return
    }

    const nuevoCorte = {
      id: Math.max(...historialCortes.map(c => c.id), 0) + 1,
      fecha: new Date().toISOString().split('T')[0],
      turno: formCorte.turno,
      totalVentas: parseInt(formCorte.pagosEfectivo) + parseInt(formCorte.pagosTarjeta),
      pagosEfectivo: parseInt(formCorte.pagosEfectivo),
      pagosTarjeta: parseInt(formCorte.pagosTarjeta),
      cancelaciones: parseInt(formCorte.cancelaciones) || 0,
      descuentos: parseInt(formCorte.descuentos) || 0,
      usuario: 'Admin'
    }

    setHistorialCortes([nuevoCorte, ...historialCortes])
    setFormCorte({
      turno: 'Mañana',
      pagosEfectivo: '',
      pagosTarjeta: '',
      cancelaciones: '',
      descuentos: ''
    })
    setMostrarCorte(false)
    alert('Corte de caja registrado exitosamente')
  }

  const calcularResumen = () => {
    const totalEfectivo = historialCortes.reduce((sum, c) => sum + c.pagosEfectivo, 0)
    const totalTarjeta = historialCortes.reduce((sum, c) => sum + c.pagosTarjeta, 0)
    const totalCancelaciones = historialCortes.reduce((sum, c) => sum + c.cancelaciones, 0)
    const totalDescuentos = historialCortes.reduce((sum, c) => sum + c.descuentos, 0)
    const totalVentas = totalEfectivo + totalTarjeta

    return {
      totalEfectivo,
      totalTarjeta,
      totalCancelaciones,
      totalDescuentos,
      totalVentas
    }
  }

  const resumen = calcularResumen()

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          💰 Caja y Ventas
        </h1>
        <button
          onClick={() => setMostrarCorte(true)}
          style={{...appStyles.btnPrimary}}
        >
          + Realizar Corte de Caja
        </button>
      </div>

      {/* Resumen de Hoy */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
        
        {/* Total Ventas */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6F00 0%, #FFB300 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: '#000',
          boxShadow: '0 4px 15px rgba(255, 111, 0, 0.3)',
          border: '2px solid #FFB300'
        }}>
          <div style={{fontSize: '13px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>TOTAL VENTAS</div>
          <div style={{fontSize: '2rem', fontWeight: 700}}>
            ${resumen.totalVentas.toLocaleString()}
          </div>
        </div>

        {/* Efectivo */}
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
          border: '2px solid #66BB6A'
        }}>
          <div style={{fontSize: '13px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>EFECTIVO</div>
          <div style={{fontSize: '2rem', fontWeight: 700}}>
            ${resumen.totalEfectivo.toLocaleString()}
          </div>
        </div>

        {/* Tarjeta */}
        <div style={{
          background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
          border: '2px solid #42A5F5'
        }}>
          <div style={{fontSize: '13px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>TARJETA</div>
          <div style={{fontSize: '2rem', fontWeight: 700}}>
            ${resumen.totalTarjeta.toLocaleString()}
          </div>
        </div>

        {/* Cancelaciones */}
        <div style={{
          background: 'linear-gradient(135deg, #FF5252 0%, #FF6E6E 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(255, 82, 82, 0.3)',
          border: '2px solid #FF6E6E'
        }}>
          <div style={{fontSize: '13px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>CANCELACIONES</div>
          <div style={{fontSize: '2rem', fontWeight: 700}}>
            -${resumen.totalCancelaciones.toLocaleString()}
          </div>
        </div>

      </div>

      {/* Métodos de Pago Activos */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          💳 Métodos de Pago Activos
        </h2>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
          <div style={{
            background: '#F5F5F5',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '2px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '28px', marginBottom: '0.5rem'}}>💵</div>
            <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>EFECTIVO</div>
            <div style={{fontSize: '18px', fontWeight: 700, color: '#333'}}>Activo</div>
            <div style={{fontSize: '12px', color: '#666', marginTop: '0.5rem'}}>Comisión: 0%</div>
          </div>

          <div style={{
            background: '#F5F5F5',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '2px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '28px', marginBottom: '0.5rem'}}>💳</div>
            <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>TARJETA DÉBITO</div>
            <div style={{fontSize: '18px', fontWeight: 700, color: '#333'}}>Activo</div>
            <div style={{fontSize: '12px', color: '#666', marginTop: '0.5rem'}}>Comisión: 2.5%</div>
          </div>

          <div style={{
            background: '#F5F5F5',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '2px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '28px', marginBottom: '0.5rem'}}>💰</div>
            <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>TARJETA CRÉDITO</div>
            <div style={{fontSize: '18px', fontWeight: 700, color: '#333'}}>Activo</div>
            <div style={{fontSize: '12px', color: '#666', marginTop: '0.5rem'}}>Comisión: 3.5%</div>
          </div>
        </div>
      </div>

      {/* Historial de Cortes */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          📋 Historial de Cortes de Caja
        </h2>

        <div style={{overflowX: 'auto'}}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{background: '#FF6F00', color: 'white'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 700}}>Fecha</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 700}}>Turno</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700}}>Total Ventas</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700}}>Efectivo</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700}}>Tarjeta</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700}}>Cancelaciones</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700}}>Descuentos</th>
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 700}}>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {historialCortes.map((corte, idx) => (
                <tr key={corte.id} style={{
                  borderBottom: '1px solid #e0e0e0',
                  background: idx % 2 === 0 ? '#f9f9f9' : 'white'
                }}>
                  <td style={{padding: '1rem', fontWeight: 600, color: '#333'}}>{corte.fecha}</td>
                  <td style={{padding: '1rem', color: '#666'}}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.6rem',
                      background: '#E3F2FD',
                      color: '#1976D2',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {corte.turno}
                    </span>
                  </td>
                  <td style={{padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#FF6F00'}}>
                    ${corte.totalVentas.toLocaleString()}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'right', color: '#4CAF50', fontWeight: 600}}>
                    ${corte.pagosEfectivo.toLocaleString()}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'right', color: '#2196F3', fontWeight: 600}}>
                    ${corte.pagosTarjeta.toLocaleString()}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'right', color: '#FF5252', fontWeight: 600}}>
                    -${corte.cancelaciones.toLocaleString()}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'right', color: '#FF9800', fontWeight: 600}}>
                    -${corte.descuentos.toLocaleString()}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center', color: '#666', fontSize: '12px'}}>
                    {corte.usuario}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Corte de Caja */}
      {mostrarCorte && (
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
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: '#333', margin: 0, fontSize: '20px', fontWeight: 700}}>
                💰 Realizar Corte de Caja
              </h2>
              <button
                onClick={() => setMostrarCorte(false)}
                style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'}}
              >
                ×
              </button>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Turno
                </label>
                <select
                  value={formCorte.turno}
                  onChange={(e) => setFormCorte({...formCorte, turno: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Pagos en Efectivo
                </label>
                <input
                  type="number"
                  value={formCorte.pagosEfectivo}
                  onChange={(e) => setFormCorte({...formCorte, pagosEfectivo: e.target.value})}
                  placeholder="0"
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
                  Pagos en Tarjeta
                </label>
                <input
                  type="number"
                  value={formCorte.pagosTarjeta}
                  onChange={(e) => setFormCorte({...formCorte, pagosTarjeta: e.target.value})}
                  placeholder="0"
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
                  Cancelaciones
                </label>
                <input
                  type="number"
                  value={formCorte.cancelaciones}
                  onChange={(e) => setFormCorte({...formCorte, cancelaciones: e.target.value})}
                  placeholder="0"
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
                  Descuentos
                </label>
                <input
                  type="number"
                  value={formCorte.descuentos}
                  onChange={(e) => setFormCorte({...formCorte, descuentos: e.target.value})}
                  placeholder="0"
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

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button
                  onClick={() => setMostrarCorte(false)}
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
                  onClick={realizarCorte}
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
                  Realizar Corte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
