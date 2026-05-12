import { Comandas } from './modules/Comandas'
import { MenuModule } from './modules/Menu'
import { Pagos } from './modules/Pagos'
import { DefaultModule } from './modules/DefaultModule'
import { appStyles } from '../styles/styles'

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
  return (
    <main style={appStyles.pageContent}>
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
