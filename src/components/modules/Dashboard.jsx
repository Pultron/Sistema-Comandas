import { Comandas } from './Comandas'
import { MenuModule} from './Menu'
import { Pagos } from './Pagos'
import { MesasModule } from './Mesas'
import { PersonalModule } from './Personal'
import { ReportesModule } from './Reportes'
import { ClientesModule } from './Clientes'
import { CajaModule } from './Caja'
import { ConfiguracionModule } from './Configuracion'
import { InventarioModule} from './Inventario'
import { ProveedoresModule } from './Proveedores'
import { PromocionesModule } from './Promociones'
import { DefaultModule } from './DefaultModule'
import { appStyles, moduleBackgrounds } from '../../styles/styles'


import {
  useMenu,
  useComandas,
  useMesas,
  usePersonal,
  useClientes,
  useInventario,
  useProveedores,
  usePromociones,
  useCaja,
  useReportes
} from '../../hooks/useSupabase'

export const DashboardModule = ({
  activeModule,
  selectedCategory,
  setSelectedCategory,
  selectedDish,
  setSelectedDish,
  modules,
  currentUser
}) => {
  // ── Datos desde Supabase ──────────────────
  const { menu, categories, loading: loadingMenu }         = useMenu()
  const { comandas, agregarComanda, actualizarEstadoComanda,
          eliminarComanda, loading: loadingComandas }       = useComandas()
  const { mesas, guardarMesa, eliminarMesa,
          cambiarEstadoMesa, loading: loadingMesas }        = useMesas()
  const { personal, guardarEmpleado, eliminarEmpleado,
          loading: loadingPersonal }                        = usePersonal()
  const { clientes, reservaciones, guardarCliente,
          eliminarCliente, guardarReservacion,
          loading: loadingClientes }                        = useClientes()
  const { ingredientes, movimientos, guardarIngrediente,
          registrarMovimiento, loading: loadingInv }        = useInventario()
  const { proveedores, historialCompras, guardarProveedor,
          registrarCompra, loading: loadingProv }           = useProveedores()
  const { promociones, menuDelDia, guardarPromocion,
          loading: loadingPromo }                           = usePromociones()
  const { historialCortes, realizarCorte,
          loading: loadingCaja }                            = useCaja()
  const { ventas, topProductos, loading: loadingReportes } = useReportes()

  // Primer categoría disponible si no hay seleccionada
  const catActiva = selectedCategory || (categories.length > 0 ? categories[0].key : null)

  const getPageContentStyle = () => {
    const baseStyle = { ...appStyles.pageContent }
    baseStyle.background = moduleBackgrounds[activeModule] || appStyles.pageContent.background
    baseStyle.minHeight  = '100%'
    baseStyle.width      = '100%'
    return baseStyle
  }

  // Spinner simple mientras cargan datos
  const Loader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <p style={{ color: '#FF6F00', fontSize: '1.1rem' }}>Cargando datos...</p>
    </div>
  )

  return (
    <main style={getPageContentStyle()}>

      {activeModule === 'dashboard' && (
        loadingComandas ? <Loader /> :
        <DashboardModule comandas={comandas} />
      )}

      {activeModule === 'comandas' && (
        loadingComandas ? <Loader /> :
        <Comandas
          comandas={comandas}
          mesas={mesas}
          agregarComanda={agregarComanda}
          actualizarEstado={actualizarEstadoComanda}
          eliminarComanda={eliminarComanda}
          menu={menu}
          categories={categories}
          currentUser={currentUser}
        />
      )}

      {activeModule === 'menu' && (
        loadingMenu ? <Loader /> :
        <MenuModule
          menu={menu}
          categories={categories}
          selectedCategory={catActiva}
          setSelectedCategory={setSelectedCategory}
          selectedDish={selectedDish}
          setSelectedDish={setSelectedDish}
        />
      )}

      {activeModule === 'mesas' && (
        loadingMesas ? <Loader /> :
        <MesasModule
          mesas={mesas}
          comandas={comandas}
          guardarMesa={guardarMesa}
          eliminarMesa={eliminarMesa}
          cambiarEstado={cambiarEstadoMesa}
        />
      )}

      {activeModule === 'personal' && (
        loadingPersonal ? <Loader /> :
        <PersonalModule
          personal={personal}
          guardarEmpleado={guardarEmpleado}
          eliminarEmpleado={eliminarEmpleado}
        />
      )}

      {activeModule === 'clientes' && (
        loadingClientes ? <Loader /> :
        <ClientesModule
          clientes={clientes}
          reservaciones={reservaciones}
          guardarCliente={guardarCliente}
          eliminarCliente={eliminarCliente}
          guardarReservacion={guardarReservacion}
        />
      )}

      {activeModule === 'inventario' && (
        loadingInv ? <Loader /> :
        <InventarioModule
          ingredientes={ingredientes}
          movimientos={movimientos}
          guardarIngrediente={guardarIngrediente}
          registrarMovimiento={registrarMovimiento}
        />
      )}

      {activeModule === 'proveedores' && (
        loadingProv ? <Loader /> :
        <ProveedoresModule
          proveedores={proveedores}
          historialCompras={historialCompras}
          guardarProveedor={guardarProveedor}
          registrarCompra={registrarCompra}
        />
      )}

      {activeModule === 'promociones' && (
        loadingPromo ? <Loader /> :
        <PromocionesModule
          promociones={promociones}
          menuDelDia={menuDelDia}
          guardarPromocion={guardarPromocion}
        />
      )}

      {activeModule === 'caja' && (
        loadingCaja ? <Loader /> :
        <CajaModule
          comandas={comandas}
          historialCortes={historialCortes}
          realizarCorte={realizarCorte}
        />
      )}

      {activeModule === 'reportes' && (
        loadingReportes ? <Loader /> :
        <ReportesModule
          comandas={comandas}
          ventas={ventas}
          topProductos={topProductos}
        />
      )}

      {activeModule === 'pagos' && (
        loadingComandas ? <Loader /> :
        <Pagos comandas={comandas} />
      )}

      {activeModule === 'configuracion' && (
        <ConfiguracionModule currentUser={currentUser} />
      )}

      {activeModule !== 'dashboard'     && activeModule !== 'comandas'   &&
       activeModule !== 'menu'          && activeModule !== 'mesas'      &&
       activeModule !== 'personal'      && activeModule !== 'reportes'   &&
       activeModule !== 'clientes'      && activeModule !== 'caja'       &&
       activeModule !== 'configuracion' && activeModule !== 'pagos'      &&
       activeModule !== 'inventario'    && activeModule !== 'proveedores' &&
       activeModule !== 'promociones'   && (
        <DefaultModule module={activeModule} modules={modules} />
      )}
    </main>
  )
}
