import { appStyles } from '../styles/styles'
import '../styles/LoginScreen.css'
import fondoLogin from '../assets/FondoLogin.jpg'

export const LoginScreen = ({ password, setPassword, onLogin }) => {
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
          <p style={appStyles.loginFormSubtitle}>Ingresa tu contraseña para acceder</p>
          
          <div style={appStyles.loginFormGroup}>
            <label style={appStyles.loginLabel}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && password) {
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

          <div style={appStyles.loginButtonGroup}>
            <button
              style={appStyles.loginButtonClear}
              onClick={() => setPassword('')}
              onMouseEnter={(e) => e.target.style.background = '#DC2626'}
              onMouseLeave={(e) => e.target.style.background = '#EF4444'}
            >
              Limpiar
            </button>
            <button
              style={appStyles.loginButtonEnter}
              onClick={() => password && onLogin()}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10B981'}
            >
             Entrar
            </button>
          </div>

          <button
            style={appStyles.loginButtonRegister}
            onClick={() => alert('Función de registro en desarrollo')}
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
    </div>
  )
}
