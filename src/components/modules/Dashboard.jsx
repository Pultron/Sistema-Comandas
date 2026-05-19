import { DashboardIcon } from '../Icons'
import { appStyles } from '../../styles/styles'

export const DashboardModule = ({ comandas }) => {
  // Calcula estadísticas del día
  const calcularEstadisticas = () => {
    const comandasActivas = comandas.filter(c => c.estado !== 'pagada')
    const totalVentas = comandas.reduce((sum, c) => sum + parseFloat(c.total || 0), 0)
    const mesasOcupadas = new Set(comandasActivas.map(c => c.mesa)).size
    
    // Productos más vendidos (simulado)
    const productosVendidos = {}
    comandas.forEach(comanda => {
      const productos = comanda.productos || 1
      productosVendidos['Pizza'] = (productosVendidos['Pizza'] || 0) + productos
    })
    
    const productoMasVendido = Object.entries(productosVendidos)[0]?.[0] || 'N/A'

    return {
      totalVentas: totalVentas.toFixed(2),
      comandasActivas: comandasActivas.length,
      mesasOcupadas,
      productoMasVendido
    }
  }

  const stats = calcularEstadisticas()

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          📊 Dashboard / Resumen del Día
        </h1>
      </div>

      {/* Cards de Estadísticas */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
        
        {/* Card - Total Ventas */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6F00 0%, #FFB300 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: '#000',
          boxShadow: '0 4px 15px rgba(255, 111, 0, 0.3)',
          border: '2px solid #FFB300'
        }}>
          <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>TOTAL VENTAS</div>
          <div style={{fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem'}}>
            ${stats.totalVentas}
          </div>
          <div style={{fontSize: '12px', opacity: 0.8}}>💰 Ingresos del día</div>
        </div>

        {/* Card - Comandas Activas */}
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
          border: '2px solid #66BB6A'
        }}>
          <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>COMANDAS ACTIVAS</div>
          <div style={{fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem'}}>
            {stats.comandasActivas}
          </div>
          <div style={{fontSize: '12px', opacity: 0.8}}>🧾 Órdenes en proceso</div>
        </div>

        {/* Card - Mesas Ocupadas */}
        <div style={{
          background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
          border: '2px solid #42A5F5'
        }}>
          <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>MESAS OCUPADAS</div>
          <div style={{fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem'}}>
            {stats.mesasOcupadas}
          </div>
          <div style={{fontSize: '12px', opacity: 0.8}}>🪑 De 10 disponibles</div>
        </div>

        {/* Card - Producto Más Vendido */}
        <div style={{
          background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)',
          border: '2px solid #BA68C8'
        }}>
          <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>PRODUCTO MÁS VENDIDO</div>
          <div style={{fontSize: '2rem', fontWeight: 700, marginBottom: '1rem'}}>
            {stats.productoMasVendido}
          </div>
          <div style={{fontSize: '12px', opacity: 0.8}}>⭐ Favorito del día</div>
        </div>

      </div>

      {/* Resumen de Actividad */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          📈 Resumen de Actividad
        </h2>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
          <div>
            <div style={{color: '#999', fontSize: '12px', fontWeight: 600, marginBottom: '0.5rem'}}>TICKETS EMITIDOS</div>
            <div style={{fontSize: '28px', fontWeight: 700, color: '#FF6F00'}}>
              {comandas.length}
            </div>
          </div>
          <div>
            <div style={{color: '#999', fontSize: '12px', fontWeight: 600, marginBottom: '0.5rem'}}>TICKET PROMEDIO</div>
            <div style={{fontSize: '28px', fontWeight: 700, color: '#4CAF50'}}>
              ${(stats.totalVentas / (comandas.length || 1)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Últimas Comandas */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          🕐 Últimas Comandas
        </h2>
        
        {comandas.slice(-5).reverse().map((comanda, idx) => (
          <div key={idx} style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{fontWeight: 700, color: '#333'}}>Comanda #{comanda.id}</div>
              <div style={{fontSize: '12px', color: '#999'}}>Mesa: {comanda.mesa}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: 700, color: '#FF6F00'}}>${comanda.total}</div>
              <div style={{fontSize: '12px', color: '#999'}}>{comanda.fecha}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
