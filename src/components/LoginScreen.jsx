import { useEffect, useMemo, useState } from 'react'
import { appStyles } from '../styles/styles'
import '../styles/LoginScreen.css'
import fondoLogin from '../assets/FondoLogin.jpg'
import { supabase } from '../supabase'

const logoGastroSoft = '/LogoGastroSoftHeader.png'

export const LoginScreen = ({ username, setUsername, password, setPassword, onLogin, error }) => {
  const [mostrarAsistencia, setMostrarAsistencia] = useState(false)
  const [mostrarContraLogin, setMostrarContraLogin] = useState(false)
  const [mostrarContraAsistencia, setMostrarContraAsistencia] = useState(false)
  const [asistenciaData, setAsistenciaData] = useState({ usuario: '', password: '' })
  const [asistenciaMensaje, setAsistenciaMensaje] = useState(null)
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [relojAsistencia, setRelojAsistencia] = useState(new Date())

  useEffect(() => {
    if (!mostrarAsistencia) return undefined

    setRelojAsistencia(new Date())
    const intervalo = setInterval(() => setRelojAsistencia(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [mostrarAsistencia])

  useEffect(() => {
    if (!asistenciaMensaje) return undefined

    const timeout = setTimeout(() => setAsistenciaMensaje(null), 5000)
    return () => clearTimeout(timeout)
  }, [asistenciaMensaje])

  const fechaAsistencia = useMemo(() => (
    relojAsistencia.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  ), [relojAsistencia])

  const diaAsistencia = useMemo(() => (
    relojAsistencia.toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase()
  ), [relojAsistencia])

  const horaAsistencia = useMemo(() => (
    relojAsistencia.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  ), [relojAsistencia])

  const limpiarCamposAsistencia = () => {
    setAsistenciaData({ usuario: '', password: '' })
  }

  const registrarAsistencia = async () => {
    if (!asistenciaData.usuario || !asistenciaData.password) {
      setAsistenciaMensaje({ tipo: 'error', texto: 'Ingresa usuario y contrasena' })
      return
    }

    setRegistrandoAsistencia(true)
    setAsistenciaMensaje(null)

    const { data: empleado, error: empleadoError } = await supabase
      .from('usuarios')
      .select('id,nombre')
      .eq('usuario', asistenciaData.usuario)
      .eq('contrasena', asistenciaData.password)
      .eq('estado', 'activo')
      .single()

    if (empleadoError || !empleado) {
      setAsistenciaMensaje({ tipo: 'error', texto: 'Usuario o contrasena incorrectos' })
      setRegistrandoAsistencia(false)
      return
    }

    const ahora = new Date()
    const inicioDia = new Date(ahora)
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = new Date(inicioDia)
    finDia.setDate(finDia.getDate() + 1)

    const { data: asistenciaExistente, error: buscarError } = await supabase
      .from('asistencia')
      .select('id, fecha_salida')
      .eq('id_usuario', empleado.id)
      .gte('fecha_entrada', inicioDia.toISOString())
      .lt('fecha_entrada', finDia.toISOString())
      .maybeSingle()

    if (buscarError) {
      setAsistenciaMensaje({ tipo: 'error', texto: buscarError.message })
      setRegistrandoAsistencia(false)
      return
    }

    if (asistenciaExistente) {
      if (asistenciaExistente.fecha_salida) {
        setAsistenciaMensaje({
          tipo: 'warning',
          texto: `${empleado.nombre} ya tiene entrada y salida registradas hoy`
        })
        setRegistrandoAsistencia(false)
        return
      }

      const { error: salidaError } = await supabase
        .from('asistencia')
        .update({ fecha_salida: ahora.toISOString() })
        .eq('id', asistenciaExistente.id)

      if (salidaError) {
        setAsistenciaMensaje({ tipo: 'error', texto: salidaError.message })
      } else {
        setAsistenciaMensaje({
          tipo: 'success',
          texto: `Salida registrada para ${empleado.nombre} a las ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}`
        })
        limpiarCamposAsistencia()
      }

      setRegistrandoAsistencia(false)
      return
    }

    const { error: registroError } = await supabase
      .from('asistencia')
      .insert({
        id_usuario: empleado.id,
        fecha_entrada: ahora.toISOString(),
        estado: 'presente'
      })

    if (registroError) {
      setAsistenciaMensaje({ tipo: 'error', texto: registroError.message })
      setRegistrandoAsistencia(false)
    } else {
      setAsistenciaMensaje({
        tipo: 'success',
        texto: `Entrada registrada para ${empleado.nombre} a las ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}`
      })
      limpiarCamposAsistencia()
      setRegistrandoAsistencia(false)
    }
  }

  const cerrarAsistencia = () => {
    setMostrarAsistencia(false)
    setAsistenciaMensaje(null)
  }

  const renderAsistenciaMensajeIcon = () => {
    if (!asistenciaMensaje) return null

    if (asistenciaMensaje.tipo === 'error') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      )
    }

    if (asistenciaMensaje.tipo === 'warning') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="7" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )
    }

    if (asistenciaMensaje.texto.startsWith('Salida registrada')) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      )
    }

    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>
    )
  }

  return (
    <div
      style={{
        ...appStyles.loginContainer,
        backgroundImage: `linear-gradient(135deg, rgba(248, 250, 252, 0.76) 0%, rgba(255, 237, 213, 0.64) 46%, rgba(226, 232, 240, 0.74) 100%), url(${fondoLogin})`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundAttachment: 'fixed, fixed',
      }}
      className="login-container-bg"
    >
      <div style={appStyles.loginWrapper} className="login-wrapper">
        <div style={appStyles.loginFormBox}>
          <div className="login-form-content">
            <div style={appStyles.loginBrand}>
              <img
                src={logoGastroSoft}
                alt="GastroSoft Logo"
                style={{
                  width: '260px',
                  height: '260px',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div className="login-lower-content">
              <div className="login-welcome">Bienvenido a GastroSoft</div>
              <h1 style={appStyles.loginFormTitle}>Iniciar Sesion</h1>
              <p style={appStyles.loginFormSubtitle}>Ingresa tus credenciales para continuar</p>

              <div style={appStyles.loginFormGroup}>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21a8 8 0 0 0-16 0"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{...appStyles.loginInput}}
                    onFocus={(e) => Object.assign(e.target.style, appStyles.loginInputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.background = '#ffffff'
                      e.target.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.06)'
                    }}
                  />
                </div>
              </div>

              <div style={appStyles.loginFormGroup}>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type={mostrarContraLogin ? 'text' : 'password'}
                    placeholder="Contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && username && password) {
                        onLogin()
                      }
                    }}
                    style={{...appStyles.loginInput, paddingRight: '3.25rem'}}
                    onFocus={(e) => Object.assign(e.target.style, appStyles.loginInputFocus)}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.background = '#ffffff'
                      e.target.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.06)'
                    }}
                  />
                  <button
                    type="button"
                    className="login-eye-button"
                    onClick={() => setMostrarContraLogin(!mostrarContraLogin)}
                    aria-label={mostrarContraLogin ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {mostrarContraLogin ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {(error || loginError) && (
                <div style={{padding: '0.8rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center'}}>
                  {error || loginError}
                </div>
              )}

              <div style={appStyles.loginButtonGroup}>
                <button
                  style={appStyles.loginButtonClear}
                  onClick={() => {
                    setUsername('')
                    setPassword('')
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#475569'}
                  onMouseLeave={(e) => e.target.style.background = '#64748b'}
                >
                  Limpiar
                </button>
                <button
                  style={appStyles.loginButtonEnter}
                  onClick={() => {
                    if (!username || !password) {
                      setLoginError('Completa las credenciales para continuar')
                      setTimeout(() => setLoginError(''), 3000)
                    } else {
                      setLoginError('')
                      onLogin()
                    }
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#ea580c'}
                  onMouseLeave={(e) => e.target.style.background = '#f97316'}
                >
                  Entrar
                </button>
              </div>

              <button
                style={appStyles.loginButtonRegister}
                className="login-register-main"
                onClick={() => {
                  setMostrarAsistencia(true)
                  setAsistenciaMensaje(null)
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fff7ed'
                  e.target.style.color = '#ea580c'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff'
                  e.target.style.color = '#f97316'
                }}
              >
                <svg className="login-register-clock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Registrar Asistencia</span>
              </button>
            </div>

            <div style={appStyles.loginFooter}>
              GastroSoft 2026. Todos los derechos reservados
            </div>
          </div>
        </div>
      </div>

      {mostrarAsistencia && (
        <div className="attendance-overlay">
          <form
            className="attendance-window"
            onSubmit={(e) => {
              e.preventDefault()
              registrarAsistencia()
            }}
          >
            <div className="attendance-titlebar">
              <div>
                <h2>Registro de asistencias</h2>
              </div>
            </div>

            <div className="attendance-toolbar">
              <label className="attendance-field">
                <span>Usuario:</span>
                <div className="attendance-input-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21a8 8 0 0 0-16 0"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    value={asistenciaData.usuario}
                    onChange={(e) => setAsistenciaData({...asistenciaData, usuario: e.target.value})}
                    autoFocus
                  />
                </div>
              </label>

              <label className="attendance-field">
                <span>Contraseña:</span>
                <div className="attendance-input-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type={mostrarContraAsistencia ? 'text' : 'password'}
                    value={asistenciaData.password}
                    onChange={(e) => setAsistenciaData({...asistenciaData, password: e.target.value})}
                  />
                  <button
                    type="button"
                    className="attendance-eye"
                    onClick={() => setMostrarContraAsistencia(!mostrarContraAsistencia)}
                    aria-label={mostrarContraAsistencia ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {mostrarContraAsistencia ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </label>

              <button type="submit" className="attendance-action" disabled={registrandoAsistencia}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span>Registrar asistencia</span>
              </button>

              <button type="button" className="attendance-exit" onClick={cerrarAsistencia}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Salir</span>
              </button>
            </div>

            <div className="attendance-body">
              <section className="attendance-clock-panel">
                <div className="attendance-date-row">
                  <div className="attendance-info-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div>
                    <div className="attendance-kicker">FECHA ACTUAL</div>
                    <div className="attendance-date">{fechaAsistencia}</div>
                  </div>
                </div>

                <div className="attendance-divider"></div>

                <div className="attendance-time-row">
                  <div className="attendance-day-block">
                    <div className="attendance-info-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="attendance-kicker">DIA</div>
                      <div className="attendance-day">{diaAsistencia}</div>
                    </div>
                  </div>

                  <div className="attendance-vertical-divider"></div>

                  <div className="attendance-hour-block">
                    <div className="attendance-kicker">HORA ACTUAL</div>
                    <div className="attendance-time">{horaAsistencia}</div>
                  </div>
                </div>
              </section>
            </div>

            <div className={`attendance-message ${asistenciaMensaje ? `attendance-message-${asistenciaMensaje.tipo}` : ''}`}>
              {asistenciaMensaje && (
                <>
                  <span className={`attendance-message-icon attendance-message-icon-${asistenciaMensaje.tipo}`}>
                    {renderAsistenciaMensajeIcon()}
                  </span>
                  <span>{asistenciaMensaje.texto}</span>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
