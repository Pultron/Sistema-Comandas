import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { menuData, categories, comandasData } from './data/menuData'
import { modulesData } from './data/modulesData'
import { appStyles } from './styles/styles'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [activeModule, setActiveModule] = useState('comandas')
  const [selectedDish, setSelectedDish] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('caliente')
  const [comandas, setComandas] = useState(comandasData)

  // Credenciales válidas
  const validCredentials = {
    admin: { password: 'admin123', role: 'admin' },
    mesero: { password: 'mesero123', role: 'mesero' }
  }

  const agregarComanda = (comanda) => {
    setComandas([...comandas, comanda])
  }

  const handleLogin = () => {
    setLoginError('')
    
    const user = validCredentials[username]
    
    if (!user) {
      setLoginError('Usuario no válido')
      return
    }
    
    if (user.password !== password) {
      setLoginError('Contraseña incorrecta')
      return
    }

    setIsAuthenticated(true)
    setUserRole(user.role)
    setUsername('')
    setPassword('')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
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

  // Filtrar módulos según el rol
  const availableModules = userRole === 'mesero' 
    ? modulesData.filter(m => ['comandas', 'menu', 'pagos'].includes(m.id))
    : modulesData

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <Header 
        modules={availableModules}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={handleLogout}
      />

      <div style={{flex: 1, overflow: 'auto', height: '100%'}}>
        <Dashboard 
          activeModule={activeModule}
          menu={menuData}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDish={selectedDish}
          setSelectedDish={setSelectedDish}
          comandas={comandas}
          agregarComanda={agregarComanda}
          modules={availableModules}
        />
      </div>
    </div>
  )
}

export default App
