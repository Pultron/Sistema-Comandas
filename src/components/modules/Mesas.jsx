import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { XIcon } from '../Icons'

export const MesasModule = ({ comandas }) => {
  const [mesas, setMesas] = useState([
    { id: 1, numero: 1, capacidad: 4, ubicacion: 'Ventana', estado: 'disponible' },
    { id: 2, numero: 2, capacidad: 4, ubicacion: 'Centro', estado: 'ocupada' },
    { id: 3, numero: 3, capacidad: 6, ubicacion: 'Esquina', estado: 'disponible' },
    { id: 4, numero: 4, capacidad: 2, ubicacion: 'Barra', estado: 'ocupada' },
    { id: 5, numero: 5, capacidad: 8, ubicacion: 'Terraza', estado: 'disponible' },
    { id: 6, numero: 6, capacidad: 4, ubicacion: 'Interior', estado: 'disponible' },
  ])
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({ numero: '', capacidad: '', ubicacion: '' })

  const abrirFormulario = (mesa = null) => {
    if (mesa) {
      setEditando(mesa)
      setFormData({ numero: mesa.numero, capacidad: mesa.capacidad, ubicacion: mesa.ubicacion })
    } else {
      setFormData({ numero: '', capacidad: '', ubicacion: '' })
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const guardarMesa = () => {
    if (!formData.numero || !formData.capacidad || !formData.ubicacion) {
      alert('Por favor completa todos los campos')
      return
    }

    if (editando) {
      setMesas(mesas.map(m => m.id === editando.id ? {...editando, ...formData} : m))
    } else {
      const nuevaMesa = {
        id: Math.max(...mesas.map(m => m.id), 0) + 1,
        numero: parseInt(formData.numero),
        capacidad: parseInt(formData.capacidad),
        ubicacion: formData.ubicacion,
        estado: 'disponible'
      }
      setMesas([...mesas, nuevaMesa])
    }
    
    setMostrarFormulario(false)
    setFormData({ numero: '', capacidad: '', ubicacion: '' })
  }

  const eliminarMesa = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta mesa?')) {
      setMesas(mesas.filter(m => m.id !== id))
    }
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          🪑 Gestión de Mesas
        </h1>
        <button
          onClick={() => abrirFormulario()}
          style={{...appStyles.btnPrimary}}
        >
          + Agregar Mesa
        </button>
      </div>

      {/* Mesas en Grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'}}>
        {mesas.map(mesa => {
          const comanda = comandas.find(c => c.mesa === `Mesa ${mesa.numero}` && c.estado !== 'pagada')
          const mesaOcupada = !!comanda
          
          return (
            <div
              key={mesa.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: `2px solid ${mesaOcupada ? '#FF6F00' : '#4CAF50'}`,
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #eee'
              }}>
                <div>
                  <div style={{fontSize: '24px', fontWeight: 700, color: '#333'}}>Mesa {mesa.numero}</div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: mesaOcupada ? '#FF6F00' : '#4CAF50',
                    marginTop: '0.3rem'
                  }}>
                    {mesaOcupada ? '🔴 OCUPADA' : '🟢 DISPONIBLE'}
                  </div>
                </div>
                <div style={{fontSize: '28px'}}>🪑</div>
              </div>

              {/* Detalles */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem'}}>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>CAPACIDAD</div>
                  <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}>{mesa.capacidad} Personas</div>
                </div>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>UBICACIÓN</div>
                  <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}>{mesa.ubicacion}</div>
                </div>
                {mesaOcupada && (
                  <div>
                    <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>COMANDA ACTIVA</div>
                    <div style={{fontSize: '16px', fontWeight: 700, color: '#FF6F00'}}>#{comanda.id}</div>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem'}}>
                <button
                  onClick={() => abrirFormulario(mesa)}
                  style={{
                    padding: '0.7rem',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1976D2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2196F3'}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => eliminarMesa(mesa.id)}
                  style={{
                    padding: '0.7rem',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Formulario */}
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
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: '#333', margin: 0, fontSize: '20px', fontWeight: 700}}>
                {editando ? 'Editar Mesa' : 'Agregar Nueva Mesa'}
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
                  Número de Mesa
                </label>
                <input
                  type="number"
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Capacidad (Personas)
                </label>
                <input
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({...formData, capacidad: e.target.value})}
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
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  placeholder="Ej: Ventana, Centro, Terraza..."
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
                  onClick={guardarMesa}
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
    </div>
  )
}
