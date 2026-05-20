import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { useInventario } from '../../hooks/useSupabase'

export const InventarioModule = () => {
  const {
    ingredientes,
    movimientos,
    guardarIngrediente: guardarIngredienteBd,
    eliminarIngrediente: eliminarIngredienteBd,
    registrarMovimiento: registrarMovimientoBd
  } = useInventario()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarMovimiento, setMostrarMovimiento] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    unidad: 'kg',
    cantidad: '',
    minimo: '',
    proveedor: ''
  })
  const [movData, setMovData] = useState({
    ingrediente: '',
    tipo: 'entrada',
    cantidad: '',
    motivo: ''
  })

  const abrirFormulario = (ing = null) => {
    if (ing) {
      setEditando(ing)
      setFormData({
        nombre: ing.nombre,
        unidad: ing.unidad,
        cantidad: ing.cantidad,
        minimo: ing.minimo,
        proveedor: ing.proveedor
      })
    } else {
      setFormData({ nombre: '', unidad: 'kg', cantidad: '', minimo: '', proveedor: '' })
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const guardarIngrediente = () => {
    if (!formData.nombre || !formData.cantidad || !formData.minimo || !formData.proveedor) {
      alert('Por favor completa todos los campos')
      return
    }

    guardarIngredienteBd(formData, editando)

    setMostrarFormulario(false)
  }

  const eliminarIngrediente = (id) => {
    if (confirm('¿Eliminar este ingrediente?')) {
      eliminarIngredienteBd(id)
    }
  }

  const registrarMovimiento = () => {
    if (!movData.ingrediente || !movData.cantidad || !movData.motivo) {
      alert('Completa todos los campos')
      return
    }

    registrarMovimientoBd(movData)

    setMovData({ ingrediente: '', tipo: 'entrada', cantidad: '', motivo: '' })
    setMostrarMovimiento(false)
  }

  const bajos = ingredientes.filter(i => i.estado === 'bajo').length

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}></h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            onClick={() => setMostrarMovimiento(true)}
            style={{...appStyles.btnPrimary, background: '#4CAF50'}}
          >
            + Registrar Movimiento
          </button>
          <button
            onClick={() => abrirFormulario()}
            style={{...appStyles.btnPrimary}}
          >
            + Agregar Ingrediente
          </button>
        </div>
      </div>

      {/* Alerta de Stock Bajo */}
      {bajos > 0 && (
        <div style={{
          background: '#FFF3CD',
          border: '2px solid #FFB300',
          borderRadius: '8px',
          padding: '1rem',
          color: '#856404'
        }}>
          <strong>⚠️ Alerta:</strong> {bajos} ingrediente(s) con stock bajo. Considera realizar compras.
        </div>
      )}

      {/* Stats */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600}}>INGREDIENTES TOTALES</div>
          <div style={{fontSize: '28px', fontWeight: 700, color: 'white', margin: '0.5rem 0'}}>{ingredientes.length}</div>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.8)'}}>En inventario</div>
        </div>
        <div style={{...appStyles.statCard, background: 'linear-gradient(135deg, #FF6F00 0%, #FFB300 100%)'}}>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)', fontWeight: 600}}>STOCK BAJO</div>
          <div style={{fontSize: '28px', fontWeight: 700, color: '#000', margin: '0.5rem 0'}}>{bajos}</div>
          <div style={{fontSize: '12px', color: 'rgba(0,0,0,0.7)'}}>Por debajo del mínimo</div>
        </div>
      </div>

      {/* Tabla de Ingredientes */}
      <div style={{background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'}}>
        <h2 style={{color: '#333', marginTop: 0, fontSize: '18px', fontWeight: 700, marginBottom: '1rem'}}>Ingredientes</h2>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Ingrediente</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Cantidad</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Mínimo</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Proveedor</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Estado</th>
                <th style={{padding: '1rem', textAlign: 'center', fontWeight: 600}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map(ing => (
                <tr key={ing.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '1rem'}}>{ing.nombre}</td>
                  <td style={{padding: '1rem'}}>{ing.cantidad} {ing.unidad}</td>
                  <td style={{padding: '1rem'}}>{ing.minimo} {ing.unidad}</td>
                  <td style={{padding: '1rem'}}>{ing.proveedor}</td>
                  <td style={{padding: '1rem'}}>
                    <span style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: ing.estado === 'bajo' ? '#FFE0E0' : '#E0F0E0',
                      color: ing.estado === 'bajo' ? '#D32F2F' : '#2E7D32'
                    }}>
                      {ing.estado === 'bajo' ? 'Bajo' : 'Normal'}
                    </span>
                  </td>
                  <td style={{padding: '1rem', textAlign: 'center'}}>
                    <button
                      onClick={() => abrirFormulario(ing)}
                      style={{background: '#2196F3', color: 'white', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem'}}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarIngrediente(ing.id)}
                      style={{background: '#EF4444', color: 'white', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '4px', cursor: 'pointer'}}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div style={{background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'}}>
        <h2 style={{color: '#333', marginTop: 0, fontSize: '18px', fontWeight: 700, marginBottom: '1rem'}}>Últimos Movimientos</h2>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Ingrediente</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Tipo</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Cantidad</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Motivo</th>
                <th style={{padding: '1rem', textAlign: 'left', fontWeight: 600}}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.slice(0, 10).map(mov => (
                <tr key={mov.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={{padding: '1rem'}}>{mov.ingrediente}</td>
                  <td style={{padding: '1rem'}}>
                    <span style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: mov.tipo === 'entrada' ? '#E0F0E0' : '#FFE0E0',
                      color: mov.tipo === 'entrada' ? '#2E7D32' : '#D32F2F'
                    }}>
                      {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td style={{padding: '1rem'}}>{mov.cantidad}</td>
                  <td style={{padding: '1rem'}}>{mov.motivo}</td>
                  <td style={{padding: '1rem', color: '#999'}}>{mov.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ingrediente */}
      {mostrarFormulario && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>
              {editando ? 'Editar Ingrediente' : 'Agregar Ingrediente'}
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Nombre</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Unidad</label>
                  <select value={formData.unidad} onChange={(e) => setFormData({...formData, unidad: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}>
                    <option>kg</option>
                    <option>litros</option>
                    <option>unidad</option>
                    <option>docenas</option>
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Cantidad Actual</label>
                  <input type="number" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Stock Mínimo</label>
                  <input type="number" value={formData.minimo} onChange={(e) => setFormData({...formData, minimo: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Proveedor</label>
                  <input type="text" value={formData.proveedor} onChange={(e) => setFormData({...formData, proveedor: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => setMostrarFormulario(false)} style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={guardarIngrediente} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimiento */}
      {mostrarMovimiento && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000}}>
          <div style={{backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'}}>
            <h2 style={{color: '#333', margin: '0 0 1.5rem 0', fontSize: '20px', fontWeight: 700}}>Registrar Movimiento</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Ingrediente</label>
                <select value={movData.ingrediente} onChange={(e) => setMovData({...movData, ingrediente: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}>
                  <option value="">Selecciona...</option>
                  {ingredientes.map(i => <option key={i.id} value={i.nombre}>{i.nombre}</option>)}
                </select>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Tipo</label>
                  <select value={movData.tipo} onChange={(e) => setMovData({...movData, tipo: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}}>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Cantidad</label>
                  <input type="number" value={movData.cantidad} onChange={(e) => setMovData({...movData, cantidad: e.target.value})} style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>Motivo</label>
                <input type="text" value={movData.motivo} onChange={(e) => setMovData({...movData, motivo: e.target.value})} placeholder="Ej: Compra, Uso en cocina, Dañado..." style={{width: '100%', padding: '0.8rem', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'}} onFocus={(e) => e.target.style.borderColor = '#FF6F00'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button onClick={() => setMostrarMovimiento(false)} style={{padding: '0.8rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Cancelar</button>
                <button onClick={registrarMovimiento} style={{padding: '0.8rem', background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'}}>Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
