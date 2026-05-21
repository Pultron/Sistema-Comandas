import { useState } from 'react'
import { appStyles } from '../styles/styles'
import '../styles/LoginScreen.css'
import fondoLogin from '../assets/FondoLogin.jpg'
import { supabase } from '../supabase'

export const LoginScreen = ({ username, setUsername, password, setPassword, onLogin, error }) => {
  const [mostrarAsistencia, setMostrarAsistencia] = useState(false)
  const [asistenciaData, setAsistenciaData] = useState({ usuario: '', password: '' })
  const [asistenciaMensaje, setAsistenciaMensaje] = useState(null)
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false)

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
        setAsistenciaMensaje({ tipo: 'success', texto: `${empleado.nombre} ya tiene entrada y salida registradas hoy` })
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
        setAsistenciaMensaje({ tipo: 'success', texto: `Salida registrada para ${empleado.nombre}` })
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
      setAsistenciaMensaje({ tipo: 'success', texto: `Entrada registrada para ${empleado.nombre}` })
      setAsistenciaData({ usuario: '', password: '' })
    }

    setRegistrandoAsistencia(false)
  }

  return (
    <div 
      style={{
        ...appStyles.loginContainer,
        backgroundImage: `linear-gradient(135deg, rgba(10, 31, 78, 0.65) 0%, rgba(26, 58, 122, 0.65) 50%, rgba(15, 42, 92, 0.65) 100%), url(${fondoLogin})`,
        backgroundSize: 'auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundAttachment: 'fixed, fixed',
      }}
      className="login-container-bg"
    >
      <div style={appStyles.loginWrapper} className="login-wrapper">
        {/* Sección de Branding */}
        <div style={appStyles.loginBrand}>
          <div style={appStyles.loginBrandBox}>
            <div style={appStyles.loginLogo}>
              🍴
            </div>
            <div style={appStyles.loginBrandTitle}>
              <span style={{color: 'white'}}>Gastro</span>
              <span style={{color: '#7D2BE8'}}>Soft</span>
            </div>
            <div style={appStyles.loginBrandSubtitle}>
              Sistema de Gestión
            </div>
          </div>
          <div style={appStyles.loginTagline}>
          </div>
        </div>

        {/* Sección de Login */}
        <div style={appStyles.loginFormBox}>
          <h1 style={appStyles.loginFormTitle}>Iniciar Sesión</h1>
          <p style={appStyles.loginFormSubtitle}>Ingresa tus credenciales</p>
          
          <div style={appStyles.loginFormGroup}>
            <label style={appStyles.loginLabel}>Usuario</label>
            <input
              type="text"
              placeholder="admin o mesero"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{...appStyles.loginInput}}
              onFocus={(e) => Object.assign(e.target.style, appStyles.loginInputFocus)}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0'
                e.target.style.background = '#f9f9f9'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={appStyles.loginFormGroup}>
            <label style={appStyles.loginLabel}>Contraseña</label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && username && password) {
                  onLogin()
                }
              }}
        
              style={{...appStyles.loginInput}}
              onFocus={(e) => Object.assign(e.target.style, appStyles.loginInputFocus)}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0'
                e.target.style.background = '#f9f9f9'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <div style={{padding: '0.8rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center'}}>
              {error}
            </div>
          )}

          <div style={appStyles.loginButtonGroup}>
            <button
              style={appStyles.loginButtonClear}
              onClick={() => {
                setUsername('')
                setPassword('')
              }}
              onMouseEnter={(e) => e.target.style.background = '#DC2626'}
              onMouseLeave={(e) => e.target.style.background = '#EF4444'}
            >
              Limpiar
            </button>
            <button
              style={appStyles.loginButtonEnter}
              onClick={() => username && password && onLogin()}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10B981'}
            >
             Entrar
            </button>
          </div>

          <button
            style={appStyles.loginButtonRegister}
            onClick={() => {
              setMostrarAsistencia(true)
              setAsistenciaMensaje(null)
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563EB'}
            onMouseLeave={(e) => e.target.style.background = '#3B82F6'}
          >
            ⏱ Registrar Asistencia
          </button>

          <div style={appStyles.loginFooter}>
            GastroSoft © 2026 - Todos los derechos reservados
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
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Usuario</label>
                <input
                  type="text"
                  value={asistenciaData.usuario}
                  onChange={(e) => setAsistenciaData({...asistenciaData, usuario: e.target.value})}
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}
                />
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Contrasena</label>
                <input
                  type="password"
                  value={asistenciaData.password}
                  onChange={(e) => setAsistenciaData({...asistenciaData, password: e.target.value})}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') registrarAsistencia()
                  }}
                  style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}
                />
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
                  style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}
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
    </div>
  )
}
