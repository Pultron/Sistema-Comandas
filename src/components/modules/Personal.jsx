import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { XIcon } from '../Icons'

export const PersonalModule = () => {
  const [personal, setPersonal] = useState([
    { id: 1, nombre: 'Juan Pérez', usuario: 'juan_p', rol: 'mesero', estado: 'activo', fechaIngreso: '2024-01-15', asistencia: 22 },
    { id: 2, nombre: 'María García', usuario: 'maria_g', rol: 'mesero', estado: 'activo', fechaIngreso: '2024-02-20', asistencia: 20 },
    { id: 3, nombre: 'Carlos López', usuario: 'carlos_l', rol: 'cocinero', estado: 'activo', fechaIngreso: '2023-12-10', asistencia: 21 },
    { id: 4, nombre: 'Ana Rodríguez', usuario: 'ana_r', rol: 'mesero', estado: 'inactivo', fechaIngreso: '2024-01-01', asistencia: 10 },
  ])

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    rol: 'mesero',
    estado: 'activo'
  })

  const abrirFormulario = (empleado = null) => {
    if (empleado) {
      setEditando(empleado)
      setFormData({
        nombre: empleado.nombre,
        usuario: empleado.usuario,
        password: '',
        rol: empleado.rol,
        estado: empleado.estado
      })
    } else {
      setFormData({
        nombre: '',
        usuario: '',
        password: '',
        rol: 'mesero',
        estado: 'activo'
      })
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const guardarEmpleado = () => {
    if (!formData.nombre || !formData.usuario || !formData.password) {
      alert('Por favor completa todos los campos')
      return
    }

    if (editando) {
      setPersonal(personal.map(p => p.id === editando.id ? {
        ...editando,
        nombre: formData.nombre,
        usuario: formData.usuario,
        rol: formData.rol,
        estado: formData.estado
      } : p))
    } else {
      const nuevoEmpleado = {
        id: Math.max(...personal.map(p => p.id), 0) + 1,
        nombre: formData.nombre,
        usuario: formData.usuario,
        rol: formData.rol,
        estado: 'activo',
        fechaIngreso: new Date().toISOString().split('T')[0],
        asistencia: 0
      }
      setPersonal([...personal, nuevoEmpleado])
    }

    setMostrarFormulario(false)
  }

  const eliminarEmpleado = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      setPersonal(personal.filter(p => p.id !== id))
    }
  }

  const toggleEstado = (id) => {
    setPersonal(personal.map(p => 
      p.id === id ? {...p, estado: p.estado === 'activo' ? 'inactivo' : 'activo'} : p
    ))
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          👥 Gestión de Personal
        </h1>
        <button
          onClick={() => abrirFormulario()}
          style={{...appStyles.btnPrimary}}
        >
          + Agregar Personal
        </button>
      </div>

      {/* Tabla de Personal */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '2px solid #e8dcc8',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{overflowX: 'auto'}}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{background: '#FF6F00', color: 'white'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 700}}>Nombre</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 700}}>Usuario</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 700}}>Rol</th>
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 700}}>Estado</th>
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 700}}>Ingreso</th>
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 700}}>Asistencia</th>
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 700}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personal.map((empleado, idx) => (
                <tr
                  key={empleado.id}
                  style={{
                    borderBottom: '1px solid #e0e0e0',
                    background: idx % 2 === 0 ? '#f9f9f9' : 'white',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#f9f9f9' : 'white'}
                >
                  <td style={{padding: '1rem'}}>
                    <div style={{fontWeight: 700, color: '#333'}}>{empleado.nombre}</div>
                  </td>
                  <td style={{padding: '1rem'}}>
                    <div style={{color: '#666'}}>{empleado.usuario}</div>
                  </td>
                  <td style={{padding: '1rem'}}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.8rem',
                      background: '#E3F2FD',
                      color: '#1976D2',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}>
                      {empleado.rol === 'mesero' ? '🧑‍💼' : '👨‍🍳'} {empleado.rol}
                    </div>
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center'}}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.8rem',
                      background: empleado.estado === 'activo' ? '#C8E6C9' : '#FFCCCC',
                      color: empleado.estado === 'activo' ? '#2E7D32' : '#C62828',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}>
                      {empleado.estado === 'activo' ? '🟢 Activo' : '🔴 Inactivo'}
                    </div>
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center', color: '#666', fontSize: '12px'}}>
                    {empleado.fechaIngreso}
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#FF6F00'}}>
                    {empleado.asistencia} días
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center'}}>
                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                      <button
                        onClick={() => abrirFormulario(empleado)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1976D2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#2196F3'}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleEstado(empleado.id)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: empleado.estado === 'activo' ? '#FF9800' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {empleado.estado === 'activo' ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => eliminarEmpleado(empleado.id)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: '#333', margin: 0, fontSize: '20px', fontWeight: 700}}>
                {editando ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
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
                  Nombre Completo
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
                  Usuario
                </label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData({...formData, usuario: e.target.value})}
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
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editando ? '(Dejar en blanco para no cambiar)' : 'Ingresa contraseña segura'}
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
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
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
                  <option value="mesero">Mesero</option>
                  <option value="cocinero">Cocinero</option>
                  <option value="caja">Caja</option>
                  <option value="admin">Administrador</option>
                </select>
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
                  onClick={guardarEmpleado}
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
