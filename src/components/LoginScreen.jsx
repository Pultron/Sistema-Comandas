import { useState } from 'react'
import { appStyles } from '../styles/styles'
import '../styles/LoginScreen.css'
import fondoLogin from '../assets/FondoLogin.jpg'
import logoGastroSoft from '../../public/LogoGastroSoftHeader.png'
import { supabase } from '../supabase'

export const LoginScreen = ({ username, setUsername, password, setPassword, onLogin, error }) => {
  const [mostrarAsistencia, setMostrarAsistencia] = useState(false)
  const [mostrarContraLogin, setMostrarContraLogin] = useState(false)
  const [mostrarContraAsistencia, setMostrarContraAsistencia] = useState(false)
  const [asistenciaData, setAsistenciaData] = useState({ usuario: '', password: '' })
  const [asistenciaMensaje, setAsistenciaMensaje] = useState(null)
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [modalConfirmacion, setModalConfirmacion] = useState(null)

  const registrarAsistencia = async () => {
    if (!asistenciaData.usuario || !asistenciaData.password) {
      setAsistenciaMensaje({ tipo: 'error', texto: 'Ingresa usuario y contraseña' })
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
      setAsistenciaMensaje({ tipo: 'error', texto: 'Usuario o contraseña incorrectos' })
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
        setModalConfirmacion({ tipo: 'duplicada', texto: `${empleado.nombre} ya tiene entrada y salida registradas hoy` })
        setTimeout(() => setModalConfirmacion(null), 2500)
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
        setModalConfirmacion({ tipo: 'salida', texto: `Salida registrada para ${empleado.nombre}` })
        setTimeout(() => setModalConfirmacion(null), 2500)
        setAsistenciaData({ usuario: '', password: '' })
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
    } else {
      setModalConfirmacion({ tipo: 'entrada', texto: `Entrada registrada para ${empleado.nombre}` })
      setTimeout(() => setModalConfirmacion(null), 2500)
      setAsistenciaData({ usuario: '', password: '' })
    }

    setRegistrandoAsistencia(false)
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
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
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
            ⏱ Registrar Asistencia
          </button>

          </div>
          <div style={appStyles.loginFooter}>
            GastroSoft © 2026 · Todos los derechos reservados
          </div>
          </div>
        </div>
      </div>

      {mostrarAsistencia && (
        <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000}}>
          <div style={{background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.35)'}}>
            <h2 style={{margin: '0 0 0.4rem 0', color: '#111', fontSize: '20px', fontWeight: 700}}>Registrar Asistencia</h2>
            <p style={{margin: '0 0 1.5rem 0', color: '#666', fontSize: '14px'}}>Ingresa tus credenciales para marcar entrada o salida.</p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position: 'absolute', left: '0.8rem', color: '#9ca3af', pointerEvents: 'none'}}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    value={asistenciaData.usuario}
                    onChange={(e) => setAsistenciaData({...asistenciaData, usuario: e.target.value})}
                    placeholder="Usuario"
                    style={{width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.8rem', border: '0.5px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', height: '40px'}}
                  />
                </div>
              </div>

              <div>
                <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position: 'absolute', left: '0.8rem', color: '#9ca3af', pointerEvents: 'none'}}>
                    <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type={mostrarContraAsistencia ? 'text' : 'password'}
                    value={asistenciaData.password}
                    onChange={(e) => setAsistenciaData({...asistenciaData, password: e.target.value})}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') registrarAsistencia()
                    }}
                    placeholder="Contraseña"
                    style={{width: '100%', padding: '0.8rem 2.8rem 0.8rem 2.8rem', border: '0.5px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', height: '40px'}}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContraAsistencia(!mostrarContraAsistencia)}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af'
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
              </div>

              {asistenciaMensaje && (
                <div style={{
                  padding: '0.8rem',
                  borderRadius: '6px',
                  background: asistenciaMensaje.tipo === 'success' ? '#DCFCE7' : '#FEE2E2',
                  color: asistenciaMensaje.tipo === 'success' ? '#166534' : '#991B1B',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {asistenciaMensaje.texto}
                </div>
              )}

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem'}}>
                <button
                  onClick={() => setMostrarAsistencia(false)}
                  style={{padding: '0.8rem', background: '#ff0202', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}
                >
                  Cancelar
                </button>
                <button
                  onClick={registrarAsistencia}
                  disabled={registrandoAsistencia}
                  style={{padding: '0.8rem', background: registrandoAsistencia ? '#9CA3AF' : '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: registrandoAsistencia ? 'not-allowed' : 'pointer'}}
                >
                  {registrandoAsistencia ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalConfirmacion && (
        <div style={{position: 'fixed', inset: 0, backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, pointerEvents: 'none'}}>
          <div style={{background: 'white', borderRadius: '16px', padding: '2.5rem 2rem', width: '90%', maxWidth: '340px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', textAlign: 'center', pointerEvents: 'auto'}}>
            <div style={{marginBottom: '1rem', fontSize: '48px', color: modalConfirmacion.tipo === 'entrada' ? '#10B981' : modalConfirmacion.tipo === 'salida' ? '#EF4444' : '#F59E0B'}}>
              {modalConfirmacion.tipo === 'entrada' ? (
                '✓'
              ) : modalConfirmacion.tipo === 'salida' ? (
                '⬇'
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </div>
            <h2 style={{margin: '0', color: modalConfirmacion.tipo === 'entrada' ? '#10B981' : modalConfirmacion.tipo === 'salida' ? '#EF4444' : '#F59E0B', fontSize: '18px', fontWeight: 700}}>
              {modalConfirmacion.texto}
            </h2>
          </div>
        </div>
      )}
    </div>
  )
}
