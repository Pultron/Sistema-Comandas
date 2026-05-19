import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { modulesData } from './data/modulesData'
import { appStyles } from './styles/styles'
import { supabase } from './supabase'



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser]         = useState(null)
  const [userRole, setUserRole]               = useState(null)
  const [username, setUsername]               = useState('')
  const [password, setPassword]               = useState('')
  const [loginError, setLoginError]           = useState('')
  const [activeModule, setActiveModule]       = useState('comandas')
  const [selectedDish, setSelectedDish]       = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // ── LOGIN CON SUPABASE ──────────────────────
  const handleLogin = async () => {
    setLoginError('')

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', username)
      .eq('contrasena', password)   // En producción usa hashing
      .eq('estado', 'activo')
      .single()

    if (error || !data) {
      setLoginError('Usuario o contraseña incorrectos')
      return
    }

    setCurrentUser(data)
    setIsAuthenticated(true)
    setUserRole(data.rol)
    setActiveModule(data.rol === 'administrador' || data.rol === 'gerente' ? 'dashboard' : 'comandas')
    setUsername('')
    setPassword('')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setUserRole(null)
    setUsername('')
    setPassword('')
    setActiveModule('comandas')
    setLoginError('')
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        onLogin={handleLogin}
        error={loginError}
      />
    )
  }

  // Filtrar módulos según rol
  const modulosAdmin   = modulesData
  const modulosMesero  = modulesData.filter(m => ['comandas', 'menu', 'pagos'].includes(m.id))
  const modulosGerente = modulesData.filter(m => !['configuracion'].includes(m.id))

  const availableModules =
    userRole === 'mesero'        ? modulosMesero  :
    userRole === 'gerente'       ? modulosGerente :
    userRole === 'cocinero'      ? modulosMesero  :
    modulosAdmin

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        modules={availableModules}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Dashboard
          activeModule={activeModule}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDish={selectedDish}
          setSelectedDish={setSelectedDish}
          modules={availableModules}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}

export default App