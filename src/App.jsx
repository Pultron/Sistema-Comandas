import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { modulesData } from './data/modulesData'
import { supabase } from './supabase'



function App() {
  const savedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('gastrosoft_user') || 'null')
    } catch {
      return null
    }
  })()

  const [isAuthenticated, setIsAuthenticated] = useState(!!savedUser)
  const [currentUser, setCurrentUser]         = useState(savedUser)
  const [userRole, setUserRole]               = useState(savedUser?.rol || null)
  const [username, setUsername]               = useState('')
  const [password, setPassword]               = useState('')
  const [loginError, setLoginError]           = useState('')
  const savedModule = (() => {
    try {
      return localStorage.getItem('gastrosoft_active_module') || null
    } catch {
      return null
    }
  })()

  const [activeModule, setActiveModuleState]  = useState(savedModule || 'dashboard')
  const [selectedDish, setSelectedDish]       = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const setActiveModule = (moduleId) => {
    setActiveModuleState(moduleId)
    localStorage.setItem('gastrosoft_active_module', moduleId)
  }

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
    localStorage.setItem('gastrosoft_user', JSON.stringify(data))
    setActiveModule('dashboard')
    setUsername('')
    setPassword('')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setUserRole(null)
    localStorage.removeItem('gastrosoft_user')
    localStorage.removeItem('gastrosoft_active_module')
    setUsername('')
    setPassword('')
    setActiveModuleState('dashboard')
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
        onUserUpdate={(usuarioActualizado) => {
          setCurrentUser(usuarioActualizado)
          localStorage.setItem('gastrosoft_user', JSON.stringify(usuarioActualizado))
        }}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Dashboard
          activeModule={activeModule}
          onModuleChange={setActiveModule}
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
