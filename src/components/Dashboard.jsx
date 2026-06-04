import { Comandas } from './modules/Comandas'
import { MenuModule } from './modules/Menu'
import { Pagos } from './modules/Pagos'
import { DashboardModule } from './modules/Dashboard'
import { MesasModule } from './modules/Mesas'
import { PersonalModule } from './modules/Personal'
import { AsistenciaModule } from './modules/Asistencia'
import { PersonalAsistenciaModule } from './modules/PersonalAsistencia'
import { ReportesModule } from './modules/Reportes'
import { ClientesModule } from './modules/Clientes'
import { CajaModule } from './modules/Caja'
import { ConfiguracionModule } from './modules/Configuracion'
import { InventarioModule } from './modules/Inventario'
import { ProveedoresModule } from './modules/Proveedores'
import { PromocionesModule } from './modules/Promociones'
import { DefaultModule } from './modules/DefaultModule'
import { appStyles, moduleBackgrounds } from '../styles/styles'
import { useComandas, useMesas } from '../hooks/useSupabase'

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
  eliminarComanda,
  modules,
  currentUser
}) => {
  const {
    comandas: comandasBd,
    agregarComanda: agregarComandaBd,
    actualizarComanda: actualizarComandaBd,
    eliminarComanda: eliminarComandaBd
  } = useComandas()
  const { mesas } = useMesas()

  const comandasActivas = comandas || comandasBd
  const guardarComandaActiva = agregarComanda || agregarComandaBd
  const eliminarComandaActiva = eliminarComanda || eliminarComandaBd

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
        <DashboardModule comandas={comandasActivas} />
      )}

      {activeModule === 'comandas' && (
        <Comandas
          comandas={comandasActivas}
          mesas={mesas}
          agregarComanda={guardarComandaActiva}
          actualizarComanda={actualizarComandaBd}
          eliminarComanda={eliminarComandaActiva}
          currentUser={currentUser}
        />
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
        <MesasModule comandas={comandasActivas} />
      )}

      {activeModule === 'personal' && (
        <PersonalModule />
      )}

      {activeModule === 'asistencia' && (
        <AsistenciaModule />
      )}

      {activeModule === 'personal_asistencia' && (
        <PersonalAsistenciaModule />
      )}

      {activeModule === 'reportes' && (
        <ReportesModule comandas={comandasActivas} />
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
        <CajaModule comandas={comandasActivas} currentUser={currentUser} />
      )}

      {activeModule === 'configuracion' && (
        <ConfiguracionModule />
      )}

      {activeModule === 'pagos' && (
        <Pagos comandas={comandas} currentUser={currentUser} />
      )}

      {activeModule !== 'dashboard' && activeModule !== 'comandas' && activeModule !== 'menu' && 
       activeModule !== 'mesas' && activeModule !== 'personal' && activeModule !== 'reportes' && 
       activeModule !== 'asistencia' && activeModule !== 'personal_asistencia' && activeModule !== 'clientes' && activeModule !== 'caja' && activeModule !== 'configuracion' && 
       activeModule !== 'pagos' && activeModule !== 'inventario' && activeModule !== 'proveedores' && 
       activeModule !== 'promociones' && (
        <DefaultModule module={activeModule} modules={modules} />
      )}
    </main>
  )
}
