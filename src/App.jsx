import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { menuData, categories, comandasData } from './data/menuData'
import { modulesData } from './data/modulesData'
import { appStyles } from './styles/styles'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeModule, setActiveModule] = useState('comandas')
  const [selectedDish, setSelectedDish] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('caliente')
  const [comandas, setComandas] = useState(comandasData)

  const agregarComanda = (comanda) => {
    setComandas([...comandas, comanda])
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
    setPassword('')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    setActiveModule('comandas')
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen 
        password={password} 
        setPassword={setPassword} 
        onLogin={handleLogin}
      />
    )
  }

  return (
    <div style={appStyles.appContainer}>
      <Sidebar 
        modules={modulesData}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={handleLogout}
      />

      <div style={appStyles.mainContainer}>
        <Header />

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
          modules={modulesData}
        />
      </div>
    </div>
  )
}

export default App
