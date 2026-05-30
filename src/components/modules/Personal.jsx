import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { XIcon } from '../Icons'
import { usePersonal } from '../../hooks/useSupabase'

export const PersonalModule = () => {
  const { personal, guardarEmpleado: guardarEmpleadoBd, eliminarEmpleado: eliminarEmpleadoBd } = usePersonal()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [toast, setToast] = useState(null)
  const [mostrarInfo, setMostrarInfo] = useState(null)
  const [mostrarContraInfo, setMostrarContraInfo] = useState(false)
  const [mostrarContraFormulario, setMostrarContraFormulario] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    correo: '',
    telefono: '',
    rol: 'mesero',
    estado: 'activo'
  })

  const abrirFormulario = (empleado = null) => {
    if (empleado) {
      setEditando(empleado)
      setFormData({
        nombre: empleado.nombre,
        usuario: empleado.usuario,
        password: empleado.contrasena || '',
        correo: empleado.correo || '',
        telefono: empleado.telefono || '',
        rol: empleado.rol,
        estado: empleado.estado
      })
    } else {
      setFormData({
        nombre: '',
        usuario: '',
        password: '',
        correo: '',
        telefono: '',
        rol: 'mesero',
        estado: 'activo'
      })
      setEditando(null)
    }
    setMostrarContraFormulario(false)
    setMostrarFormulario(true)
  }

  const guardarEmpleado = () => {
    if (!formData.nombre || !formData.usuario) {
      alert('Por favor completa los campos requeridos')
      return
    }
    if (!editando && !formData.password) {
      alert('Por favor ingresa una contraseña')
      return
    }

    guardarEmpleadoBd(formData, editando)
    
    const tipoMensaje = editando ? 'Cambios realizados exitosamente' : 'Usuario registrado correctamente'
    setToast({ mensaje: tipoMensaje, tipo: 'success' })
    
    setMostrarFormulario(false)
    setMostrarContraFormulario(false)
    setEditando(null)
    
    setTimeout(() => setToast(null), 3000)
  }

  const eliminarEmpleado = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      eliminarEmpleadoBd(id)
    }
  }

  const personalFiltrado = personal.filter(empleado => {
    const coincideBusqueda = busqueda === '' || 
      empleado.nombre.toLowerCase().startsWith(busqueda.toLowerCase()) ||
      empleado.usuario.toLowerCase().startsWith(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === 'todos' || empleado.estado === filtroEstado
    const coincideRol = filtroRol === 'todos' || empleado.rol === filtroRol
    return coincideBusqueda && coincideEstado && coincideRol
  })

  // Estadísticas
  const totalActivos = personal.filter(e => e.estado === 'activo').length
  const totalInactivos = personal.filter(e => e.estado === 'inactivo').length
  const rolesUnicos = [...new Set(personal.map(e => e.rol))]
  const empleadosPorRol = rolesUnicos.map(rol => ({
    rol,
    cantidad: personal.filter(e => e.rol === rol && e.estado === 'activo').length
  }))

  const toggleEstado = (id) => {
    const empleado = personal.find(p => p.id === id)
    if (!empleado) return

    guardarEmpleadoBd({
      nombre: empleado.nombre,
      usuario: empleado.usuario,
      rol: empleado.rol,
      correo: empleado.correo || '',
      telefono: empleado.telefono || '',
      estado: empleado.estado === 'activo' ? 'inactivo' : 'activo'
    }, empleado)
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Toast notificación */}
      {toast && (
        <div style={{
          position: 'fixed', top: '5.5rem', left: '50%', transform: 'translateX(-50%)',
          background: toast.tipo === 'error' ? '#EF4444' : '#4CAF50',
          color: 'white', padding: '1rem 2rem', borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontWeight: 600,
          fontSize: '14px', zIndex: 9999
        }}>
          {toast.mensaje}
        </div>
      )}
      
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem'}}>
        <button
          onClick={() => abrirFormulario()}
          style={{...appStyles.btnPrimary}}
        >
          + Agregar Personal
        </button>
      </div>

      {/* Búsqueda y Filtros */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '2px solid #e8dcc8',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <input
          type="text"
          placeholder="Buscar por nombre o usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            padding: '0.8rem',
            border: '2px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            width: '100%'
          }}
        />
        
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{
            padding: '0.8rem',
            border: '2px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            width: '100%'
          }}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          style={{
            padding: '0.8rem',
            border: '2px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            width: '100%'
          }}
        >
          <option value="todos">Todos los roles</option>
          {rolesUnicos.map(rol => (
            <option key={rol} value={rol}>{rol}</option>
          ))}
        </select>
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
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 700}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personalFiltrado.map((empleado, idx) => (
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
                      {empleado.rol === 'mesero' ? '' : ''} {empleado.rol}
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
                      {empleado.estado === 'activo' ? ' Activo' : ' Inactivo'}
                    </div>
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center'}}>
                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap'}}>
                      <button
                        onClick={() => setMostrarInfo(empleado)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: '#9C27B0',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#7B1FA2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#9C27B0'}
                      >
                        Ver Informacion
                      </button>
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
                        Editar
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
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {personalFiltrado.length === 0 && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#999',
            fontSize: '14px'
          }}>
            No hay empleados que coincidan con los filtros aplicados
          </div>
        )}
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
                <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                  <input
                    type={mostrarContraFormulario ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editando ? '(Dejar en blanco para no cambiar)' : 'Ingresa contraseña segura'}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      paddingRight: '2.5rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContraFormulario(!mostrarContraFormulario)}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{color: '#999'}}
                    >
                      {mostrarContraFormulario ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Teléfono
                </label>
                <input
                  type="tel"
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

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Correo
                </label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({...formData, correo: e.target.value})}
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
                    background: '#DC2626',
                    color: '#fff',
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
                    background: '#4CAF50',
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

      {/* Modal Ver Información */}
      {mostrarInfo && (
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
            padding: '1.5rem',
            maxWidth: '550px',
            width: '95%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem'}}>
              <h2 style={{color: '#333', margin: 0, fontSize: '20px', fontWeight: 700}}>
                Información del Empleado
              </h2>
              <button
                onClick={() => {setMostrarInfo(null); setMostrarContraInfo(false)}}
                style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'}}
              >
                ×
              </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem'}}>
              <div style={{padding: '0.8rem', background: '#F5F5F5', borderRadius: '6px'}}>
                <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>Nombre</div>
                <div style={{fontSize: '14px', color: '#333', fontWeight: 700}}>{mostrarInfo.nombre}</div>
              </div>

              <div style={{padding: '0.8rem', background: '#F5F5F5', borderRadius: '6px'}}>
                <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>Usuario</div>
                <div style={{fontSize: '14px', color: '#333', fontWeight: 700}}>{mostrarInfo.usuario}</div>
              </div>

              <div style={{padding: '0.8rem', background: '#F5F5F5', borderRadius: '6px'}}>
                <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>Correo</div>
                <div style={{fontSize: '14px', color: '#333', fontWeight: 700}}>{mostrarInfo.correo || 'No especificado'}</div>
              </div>

              <div style={{padding: '0.8rem', background: '#F5F5F5', borderRadius: '6px'}}>
                <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>Teléfono</div>
                <div style={{fontSize: '14px', color: '#333', fontWeight: 700}}>{mostrarInfo.telefono || 'No especificado'}</div>
              </div>

              <div style={{padding: '0.8rem', background: '#F5F5F5', borderRadius: '6px'}}>
                <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>Contraseña</div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{fontSize: '14px', color: '#333', fontWeight: 700, letterSpacing: mostrarContraInfo ? '0' : '4px'}}>
                    {mostrarContraInfo ? mostrarInfo.contrasena : (mostrarInfo.contrasena ? '●●●●●●●●' : 'No especificada')}
                  </div>
                  {mostrarInfo.contrasena && (
                    <button
                      onClick={() => setMostrarContraInfo(!mostrarContraInfo)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {mostrarContraInfo ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div style={{padding: '0.8rem', background: '#F5F5F5', borderRadius: '6px'}}>
                <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>Rol</div>
                <div style={{fontSize: '14px', color: '#333', fontWeight: 700}}>{mostrarInfo.rol}</div>
              </div>

              <div style={{padding: '0.8rem', background: '#F5F5F5', borderRadius: '6px', gridColumn: '1 / -1'}}>
                <div style={{fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '0.3rem'}}>Estado</div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: mostrarInfo.estado === 'activo' ? '#2E7D32' : '#C62828'
                }}>
                  {mostrarInfo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </div>
              </div>

              <button
                onClick={() => {setMostrarInfo(null); setMostrarContraInfo(false)}}
                style={{
                  padding: '0.8rem',
                  background: '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  gridColumn: '1 / -1'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
