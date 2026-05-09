import { Comandas } from './modules/Comandas'
import { MenuModule } from './modules/Menu'
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
  modules
}) => {
  return (
    <main style={appStyles.pageContent}>
      {activeModule === 'comandas' && (
        <Comandas comandas={comandas} />
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

      {activeModule !== 'comandas' && activeModule !== 'menu' && (
        <DefaultModule module={activeModule} modules={modules} />
      )}
    </main>
  )
}
