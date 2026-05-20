import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { useComandas } from '../../hooks/useSupabase'

export const ReportesModule = () => {
  const { comandas } = useComandas()
  const [filtroFecha, setFiltroFecha] = useState('mes')

  const calcularReportes = () => {
    const totalVentas = comandas.reduce((sum, c) => sum + parseFloat(c.total || 0), 0)
    const tickets = comandas.length
    const promedioTicket = tickets > 0 ? (totalVentas / tickets).toFixed(2) : '0.00'

    // Productos más vendidos (simulado)
    const productosVendidos = {}
    comandas.forEach(() => {
      productosVendidos['Pizza'] = (productosVendidos['Pizza'] || 0) + 3
      productosVendidos['Hamburguesa'] = (productosVendidos['Hamburguesa'] || 0) + 2
      productosVendidos['Bebida'] = (productosVendidos['Bebida'] || 0) + 4
    })

    const productosOrdenados = Object.entries(productosVendidos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Rendimiento por mesero (simulado)
    const meseros = [
      { nombre: 'Juan Pérez', ventas: 45000, tickets: 18 },
      { nombre: 'María García', ventas: 38000, tickets: 15 },
      { nombre: 'Carlos López', ventas: 32000, tickets: 13 },
    ]

    return {
      totalVentas: totalVentas.toFixed(2),
      tickets,
      promedioTicket,
      productosVendidos: productosOrdenados,
      meseros
    }
  }

  const reportes = calcularReportes()

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
           Reportes y Ventas
        </h1>
      </div>

      {/* Filtros */}
      <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
        <button
          onClick={() => setFiltroFecha('dia')}
          style={{
            padding: '0.8rem 1.5rem',
            background: filtroFecha === 'dia' ? '#FF6F00' : 'white',
            color: filtroFecha === 'dia' ? 'white' : '#333',
            border: '2px solid #FF6F00',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Hoy
        </button>
        <button
          onClick={() => setFiltroFecha('semana')}
          style={{
            padding: '0.8rem 1.5rem',
            background: filtroFecha === 'semana' ? '#FF6F00' : 'white',
            color: filtroFecha === 'semana' ? 'white' : '#333',
            border: '2px solid #FF6F00',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
           Esta Semana
        </button>
        <button
          onClick={() => setFiltroFecha('mes')}
          style={{
            padding: '0.8rem 1.5rem',
            background: filtroFecha === 'mes' ? '#FF6F00' : 'white',
            color: filtroFecha === 'mes' ? 'white' : '#333',
            border: '2px solid #FF6F00',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
           Este Mes
        </button>
      </div>

      {/* Resumen General */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
        
        {/* Total Ventas */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6F00 0%, #FFB300 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: '#000',
          boxShadow: '0 4px 15px rgba(255, 111, 0, 0.3)',
          border: '2px solid #FFB300'
        }}>
          <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>TOTAL VENTAS</div>
          <div style={{fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem'}}>
            ${reportes.totalVentas}
          </div>
          <div style={{fontSize: '12px', opacity: 0.8}}> Período: {
            filtroFecha === 'dia' ? 'Hoy' : 
            filtroFecha === 'semana' ? 'Esta Semana' : 
            'Este Mes'
          }</div>
        </div>

        {/* Tickets */}
        <div style={{
          background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
          border: '2px solid #42A5F5'
        }}>
          <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>TICKETS EMITIDOS</div>
          <div style={{fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem'}}>
            {reportes.tickets}
          </div>
          <div style={{fontSize: '12px', opacity: 0.8}}>Órdenes procesadas</div>
        </div>

        {/* Promedio Ticket */}
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
          border: '2px solid #66BB6A'
        }}>
          <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '0.5rem'}}>PROMEDIO TICKET</div>
          <div style={{fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem'}}>
            ${reportes.promedioTicket}
          </div>
          <div style={{fontSize: '12px', opacity: 0.8}}> Venta por comanda</div>
        </div>

      </div>

      {/* Productos Más Vendidos */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
          ⭐ Productos Más Vendidos
        </h2>
        
        <div style={{display: 'grid', gap: '1rem'}}>
          {reportes.productosVendidos.map((producto, idx) => (
            <div key={idx} style={{
              padding: '1rem',
              background: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{fontWeight: 700, color: '#333', marginBottom: '0.3rem'}}>
                  #{idx + 1} {producto[0]}
                </div>
                <div style={{fontSize: '12px', color: '#999'}}>
                  {producto[1]} unidades vendidas
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#FF6F00',
                background: '#fff8f0',
                padding: '0.8rem 1.2rem',
                borderRadius: '6px'
              }}>
                {producto[1]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rendimiento por Mesero */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
           Rendimiento por Mesero
        </h2>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{background: '#F5F5F5', borderBottom: '2px solid #e0e0e0'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#333'}}>Mesero</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#333'}}>Ventas Totales</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#333'}}>Tickets</th>
                <th style={{padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#333'}}>Promedio/Ticket</th>
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#333'}}>Comisión</th>
              </tr>
            </thead>
            <tbody>
              {reportes.meseros.map((mesero, idx) => {
                const promedio = (mesero.ventas / mesero.tickets).toFixed(2)
                const comision = (mesero.ventas * 0.05).toFixed(2) // 5% de comisión
                return (
                  <tr key={idx} style={{
                    borderBottom: '1px solid #e0e0e0',
                    background: idx % 2 === 0 ? '#f9f9f9' : 'white'
                  }}>
                    <td style={{padding: '1rem', fontWeight: 700, color: '#333'}}>{mesero.nombre}</td>
                    <td style={{padding: '1rem', textAlign: 'right', color: '#FF6F00', fontWeight: 700}}>
                      ${mesero.ventas.toFixed(2)}
                    </td>
                    <td style={{padding: '1rem', textAlign: 'right', color: '#666'}}>{mesero.tickets}</td>
                    <td style={{padding: '1rem', textAlign: 'right', color: '#4CAF50', fontWeight: 600}}>
                      ${promedio}
                    </td>
                    <td style={{padding: '1rem', textAlign: 'center', fontWeight: 700, color: '#2196F3'}}>
                      ${comision}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico Simple */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '2px solid #e8dcc8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{color: '#333', fontWeight: 700, marginBottom: '1.5rem', fontSize: '18px'}}>
           Tendencia de Ventas
        </h2>
        
        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '200px', gap: '1rem'}}>
          {[45000, 52000, 48000, 61000, 58000, 65000, 70000].map((valor, idx) => (
            <div
              key={idx}
              title={`Día ${idx + 1}: $${valor}`}
              style={{
                flex: 1,
                background: 'linear-gradient(180deg, #FF6F00 0%, #FFB300 100%)',
                borderRadius: '6px 6px 0 0',
                height: `${(valor / 70000) * 100}%`,
                minHeight: '20px',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scaleY(1.05)'
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scaleY(1)'
                e.currentTarget.style.opacity = '1'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FF6F00',
                whiteSpace: 'nowrap'
              }}>
                ${valor / 1000}k
              </div>
            </div>
          ))}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: '2rem',
          fontSize: '12px',
          color: '#999',
          fontWeight: 600
        }}>
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
          <div>Dom</div>
        </div>
      </div>
    </div>
  )
}
