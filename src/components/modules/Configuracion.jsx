import { useState } from 'react'
import { appStyles } from '../../styles/styles'

export const ConfiguracionModule = () => {
  const [datosRestaurante, setDatosRestaurante] = useState({
    nombre: 'Mi Restaurante',
    direccion: 'Calle Principal 123',
    telefono: '+1-234-567-8900',
    email: 'contacto@restaurante.com',
    rfc: 'RFC123456789',
    impuesto: 16,
    nombreLogo: 'logo-restaurante.png',
    horaApertura: '09:00',
    horaCierre: '23:00',
    capacidadMaxima: 50
  })

  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState(datosRestaurante)

  const guardarCambios = () => {
    setDatosRestaurante(formData)
    setEditando(false)
    alert('Configuración actualizada exitosamente')
  }

  const cancelarEdicion = () => {
    setFormData(datosRestaurante)
    setEditando(false)
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          ⚙️ Configuración del Restaurante
        </h1>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            style={{...appStyles.btnPrimary}}
          >
            ✏️ Editar Configuración
          </button>
        )}
      </div>

      {/* Información General */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          📋 Información General
        </h2>

        {editando ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Nombre del Restaurante
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
                  RFC
                </label>
                <input
                  type="text"
                  value={formData.rfc}
                  onChange={(e) => setFormData({...formData, rfc: e.target.value})}
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
            </div>

            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
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

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
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
            </div>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
            <div>
              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.3rem'}}>NOMBRE</div>
              <div style={{fontSize: '16px', fontWeight: 700, color: '#333', marginBottom: '1.5rem'}}>{datosRestaurante.nombre}</div>

              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.3rem'}}>RFC</div>
              <div style={{fontSize: '16px', fontWeight: 700, color: '#333', marginBottom: '1.5rem'}}>{datosRestaurante.rfc}</div>

              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.3rem'}}>DIRECCIÓN</div>
              <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}>{datosRestaurante.direccion}</div>
            </div>
            <div>
              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.3rem'}}>TELÉFONO</div>
              <div style={{fontSize: '16px', fontWeight: 700, color: '#333', marginBottom: '1.5rem'}}>{datosRestaurante.telefono}</div>

              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.3rem'}}>EMAIL</div>
              <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}>{datosRestaurante.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Configuración Fiscal */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          💳 Configuración Fiscal
        </h2>

        {editando ? (
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
              Porcentaje de Impuesto (%)
            </label>
            <input
              type="number"
              value={formData.impuesto}
              onChange={(e) => setFormData({...formData, impuesto: parseFloat(e.target.value)})}
              min="0"
              max="100"
              step="0.1"
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                maxWidth: '200px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
            <div>
              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>IMPUESTO ACTUAL</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#FF6F00',
                display: 'flex',
                alignItems: 'baseline'
              }}>
                {datosRestaurante.impuesto}%
              </div>
              <div style={{fontSize: '12px', color: '#666', marginTop: '0.5rem'}}>
                Se aplicará automáticamente a cada venta
              </div>
            </div>
            <div style={{
              background: '#FFF8F0',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #FFE0B2'
            }}>
              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>EJEMPLO</div>
              <div style={{fontSize: '12px', color: '#666'}}>
                Venta: $1,000.00<br/>
                Impuesto ({datosRestaurante.impuesto}%): ${(1000 * datosRestaurante.impuesto / 100).toFixed(2)}<br/>
                <strong style={{color: '#333'}}>Total: ${(1000 + (1000 * datosRestaurante.impuesto / 100)).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Horarios de Operación */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          🕐 Horarios de Operación
        </h2>

        {editando ? (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div>
              <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                Hora de Apertura
              </label>
              <input
                type="time"
                value={formData.horaApertura}
                onChange={(e) => setFormData({...formData, horaApertura: e.target.value})}
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
                Hora de Cierre
              </label>
              <input
                type="time"
                value={formData.horaCierre}
                onChange={(e) => setFormData({...formData, horaCierre: e.target.value})}
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
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
            <div>
              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>ABRE</div>
              <div style={{fontSize: '20px', fontWeight: 700, color: '#333'}}>{datosRestaurante.horaApertura}</div>
            </div>
            <div>
              <div style={{fontSize: '12px', color: '#999', fontWeight: 600, marginBottom: '0.5rem'}}>CIERRA</div>
              <div style={{fontSize: '20px', fontWeight: 700, color: '#333'}}>{datosRestaurante.horaCierre}</div>
            </div>
          </div>
        )}
      </div>

      {/* Capacidad */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          🪑 Capacidad del Restaurante
        </h2>

        {editando ? (
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
              Capacidad Máxima (Personas)
            </label>
            <input
              type="number"
              value={formData.capacidadMaxima}
              onChange={(e) => setFormData({...formData, capacidadMaxima: parseInt(e.target.value)})}
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                maxWidth: '200px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
        ) : (
          <div style={{
            background: '#E8F5E9',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '2px solid #C8E6C9',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{fontSize: '32px'}}>🪑</div>
            <div>
              <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>CAPACIDAD MÁXIMA</div>
              <div style={{fontSize: '24px', fontWeight: 700, color: '#2E7D32'}}>{datosRestaurante.capacidadMaxima} Personas</div>
            </div>
          </div>
        )}
      </div>

      {/* Personalización */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          🎨 Personalización
        </h2>

        {editando ? (
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
              Logo del Restaurante
            </label>
            <div style={{
              border: '2px dashed #e0e0e0',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              background: '#f9f9f9'
            }}>
              <div style={{fontSize: '32px', marginBottom: '0.5rem'}}>📸</div>
              <div style={{color: '#666', fontSize: '14px', fontWeight: 600}}>
                Arrastra tu logo aquí o haz clic para seleccionar
              </div>
              <input type="file" accept="image/*" style={{display: 'none'}} />
            </div>
            {formData.nombreLogo && (
              <div style={{marginTop: '1rem', color: '#666', fontSize: '12px'}}>
                Archivo: {formData.nombreLogo}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: '#FFF8F0',
            borderRadius: '8px',
            padding: '2rem',
            border: '2px dashed #FFE0B2',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '40px', marginBottom: '0.5rem'}}>🏪</div>
            <div style={{color: '#999', fontSize: '12px', fontWeight: 600}}>Logo del Restaurante</div>
            <div style={{color: '#666', fontSize: '12px', marginTop: '0.5rem'}}>{datosRestaurante.nombreLogo}</div>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      {editando && (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          <button
            onClick={cancelarEdicion}
            style={{
              padding: '1rem',
              background: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            ❌ Cancelar
          </button>
          <button
            onClick={guardarCambios}
            style={{
              padding: '1rem',
              background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ✅ Guardar Cambios
          </button>
        </div>
      )}
    </div>
  )
}
