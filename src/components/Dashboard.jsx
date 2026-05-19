import { Comandas } from './modules/Comandas'
import { MenuModule } from './modules/Menu'
import { Pagos } from './modules/Pagos'
import { DashboardModule } from './modules/Dashboard'
import { MesasModule } from './modules/Mesas'
import { PersonalModule } from './modules/Personal'
import { ReportesModule } from './modules/Reportes'
import { ClientesModule } from './modules/Clientes'
import { CajaModule } from './modules/Caja'
import { ConfiguracionModule } from './modules/Configuracion'
import { InventarioModule } from './modules/Inventario'
import { ProveedoresModule } from './modules/Proveedores'
import { PromocionesModule } from './modules/Promociones'
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
      {activeModule === 'dashboard' && (
        <DashboardModule comandas={comandas} />
      )}

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

      {activeModule === 'mesas' && (
        <MesasModule comandas={comandas} />
      )}

      {activeModule === 'personal' && (
        <PersonalModule />
      )}

      {activeModule === 'reportes' && (
        <ReportesModule comandas={comandas} />
      )}

      {activeModule === 'clientes' && (
        <ClientesModule />
      )}

      {activeModule === 'inventario' && (
        <InventarioModule />
      )}

      {activeModule === 'proveedores' && (
        <ProveedoresModule />
      )}

      {activeModule === 'promociones' && (
        <PromocionesModule />
      )}

      {activeModule === 'caja' && (
        <CajaModule comandas={comandas} />
      )}

      {activeModule === 'configuracion' && (
        <ConfiguracionModule />
      )}

      {activeModule === 'pagos' && (
        <Pagos comandas={comandas} />
      )}

      {activeModule !== 'dashboard' && activeModule !== 'comandas' && activeModule !== 'menu' && 
       activeModule !== 'mesas' && activeModule !== 'personal' && activeModule !== 'reportes' && 
       activeModule !== 'clientes' && activeModule !== 'caja' && activeModule !== 'configuracion' && 
       activeModule !== 'pagos' && activeModule !== 'inventario' && activeModule !== 'proveedores' && 
       activeModule !== 'promociones' && (
        <DefaultModule module={activeModule} modules={modules} />
      )}
    </main>
  )
}
