import { Comandas } from './modules/Comandas'
import { MenuModule } from './modules/Menu'
import { Pagos } from './modules/Pagos'
import { DefaultModule } from './modules/DefaultModule'
import { appStyles, moduleBackgrounds } from '../styles/styles'

export const Dashboard = ({ 
  activeModule, 
  menu, 
  categories,
  selectedCategory, 
  setSelectedCategory, 
  selectedDish, 
  setSelectedDish,
  comandas,
  agregarComanda,
  modules
}) => {
  // Determinar el fondo según el módulo activo usando colores configurables
  const getPageContentStyle = () => {
    const baseStyle = {...appStyles.pageContent}
    // Usar el color del módulo, o el default de styles.js si no existe
    baseStyle.background = moduleBackgrounds[activeModule] || appStyles.pageContent.background
    baseStyle.minHeight = '100%'
    baseStyle.width = '100%'
    return baseStyle
  }

  return (
    <main style={getPageContentStyle()}>
      {activeModule === 'comandas' && (
        <Comandas comandas={comandas} agregarComanda={agregarComanda} />
      )}

      {activeModule === 'menu' && (
        <MenuModule 
          menu={menu}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDish={selectedDish}
          setSelectedDish={setSelectedDish}
        />
      )}

      {activeModule === 'pagos' && (
        <Pagos comandas={comandas} />
      )}

      {activeModule !== 'comandas' && activeModule !== 'menu' && activeModule !== 'pagos' && (
        <DefaultModule module={activeModule} modules={modules} />
      )}
    </main>
  )
}
