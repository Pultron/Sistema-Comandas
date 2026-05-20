import { useState } from 'react'
import { appStyles } from '../../styles/styles'
import { XIcon } from '../Icons'
import { useMesas } from '../../hooks/useSupabase'

export const MesasModule = ({ comandas = [] }) => {
  const { mesas, guardarMesa: guardarMesaBd, eliminarMesa: eliminarMesaBd } = useMesas()
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({ numero: '', ubicacion: '' })

  const obtenerComandaActiva = (mesa) => {
    return comandas.find(c => {
      const mismaMesa = c.mesa === `Mesa ${mesa.numero}` || c.mesa?.startsWith(`Mesa ${mesa.numero} `)
      return mismaMesa && c.estado !== 'Pagado' && c.estado !== 'Cancelado'
    })
  }

  const mesasConEstado = mesas
    .map((mesa) => {
      const comanda = obtenerComandaActiva(mesa)
      return {
        ...mesa,
        comanda,
        ocupada: !!comanda
      }
    })
    .sort((a, b) => Number(a.numero) - Number(b.numero))

  const totalOcupadas = mesasConEstado.filter(mesa => mesa.ocupada).length
  const totalDisponibles = mesasConEstado.length - totalOcupadas

  const getMesaMapPosition = (index) => {
    const posicionesPrincipales = [
      { left: '38%', top: '30%' },
      { left: '54%', top: '30%' },
      { left: '70%', top: '30%' },
      { left: '38%', top: '46%' },
      { left: '54%', top: '46%' },
      { left: '70%', top: '46%' },
      { left: '38%', top: '62%' },
      { left: '54%', top: '62%' },
      { left: '70%', top: '62%' }
    ]
    const posicionesTerraza = [
      { left: '26%', top: '86%' },
      { left: '38%', top: '86%' },
      { left: '50%', top: '86%' },
      { left: '62%', top: '86%' },
      { left: '74%', top: '86%' },
      { left: '86%', top: '86%' },
      { left: '32%', top: '94%' },
      { left: '44%', top: '94%' },
      { left: '56%', top: '94%' },
      { left: '68%', top: '94%' },
      { left: '80%', top: '94%' }
    ]

    if (index < posicionesPrincipales.length) {
      return posicionesPrincipales[index]
    }

    return posicionesTerraza[(index - posicionesPrincipales.length) % posicionesTerraza.length]
  }

  const abrirFormulario = (mesa = null) => {
    if (mesa) {
      setEditando(mesa)
      setFormData({ numero: mesa.numero, ubicacion: mesa.ubicacion })
    } else {
      setFormData({ numero: '', ubicacion: '' })
      setEditando(null)
    }
    setMostrarFormulario(true)
  }

  const guardarMesa = () => {
    if (!formData.numero || !formData.ubicacion) {
      alert('Por favor completa todos los campos')
      return
    }

    guardarMesaBd(formData, editando)
    
    setMostrarFormulario(false)
    setFormData({ numero: '', ubicacion: '' })
  }

  const eliminarMesa = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta mesa?')) {
      eliminarMesaBd(id)
    }
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', width: '100%'}}>
      {/* Header */}
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          🪑 Gestión de Mesas
        </h1>
        <div style={{display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
          <button
            onClick={() => setMostrarMapa(true)}
            style={{
              ...appStyles.btnPrimary,
              background: '#111827',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(17, 24, 39, 0.25)'
            }}
          >
            Mapa de Mesas
          </button>
          <button
            onClick={() => abrirFormulario()}
            style={{...appStyles.btnPrimary}}
          >
            + Agregar Mesa
          </button>
        </div>
      </div>

      {/* Mesas en Grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem'}}>
        {mesasConEstado.map(mesa => {
          const comanda = mesa.comanda
          const mesaOcupada = mesa.ocupada
          
          return (
            <div
              key={mesa.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                border: `2px solid ${mesaOcupada ? '#FF6F00' : '#4CAF50'}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Encabezado */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #eee'
              }}>
                <div>
                  <div style={{fontSize: '24px', fontWeight: 700, color: '#333'}}>Mesa {mesa.numero}</div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: mesaOcupada ? '#FF6F00' : '#4CAF50',
                    marginTop: '0.3rem'
                  }}>
                    {mesaOcupada ? 'OCUPADA' : 'DISPONIBLE'}
                  </div>
                </div>
                <div style={{fontSize: '28px'}}></div>
              </div>

              {/* Detalles */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem'}}>
                <div>
                  <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>UBICACIÓN</div>
                  <div style={{fontSize: '16px', fontWeight: 700, color: '#333'}}>{mesa.ubicacion}</div>
                </div>
                {mesaOcupada && (
                  <div>
                    <div style={{fontSize: '12px', color: '#999', fontWeight: 600}}>COMANDA ACTIVA</div>
                    <div style={{fontSize: '16px', fontWeight: 700, color: '#FF6F00'}}>#{comanda.id}</div>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem'}}>
                <button
                  onClick={() => abrirFormulario(mesa)}
                  style={{
                    padding: '0.7rem',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1976D2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2196F3'}
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminarMesa(mesa.id)}
                  style={{
                    padding: '0.7rem',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                >
                   Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Mapa de Mesas */}
      {mostrarMapa && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2100,
          padding: '1.2rem'
        }}>
          <div style={{
            width: 'min(1180px, 96vw)',
            height: 'min(760px, 92vh)',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '3px solid #FF6F00',
            boxShadow: '0 18px 60px rgba(0, 0, 0, 0.45)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1rem 1.25rem',
              background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 100%)',
              borderBottom: '2px solid #111827'
            }}>
              <div>
                <h2 style={{margin: 0, color: '#111827', fontSize: '20px', fontWeight: 800}}>
                  Mapa de Mesas
                </h2>
                <div style={{fontSize: '13px', color: '#111827', fontWeight: 700, marginTop: '0.25rem'}}>
                  {totalDisponibles} disponibles / {totalOcupadas} ocupadas
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#111827', fontSize: '13px'}}>
                  <span style={{width: '14px', height: '14px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', border: '2px solid #14532D'}}></span>
                  Disponible
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#111827', fontSize: '13px'}}>
                  <span style={{width: '14px', height: '14px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', border: '2px solid #7F1D1D'}}></span>
                  Ocupada
                </div>
                <button
                  onClick={() => setMostrarMapa(false)}
                  title="Cerrar mapa"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '6px',
                    border: '2px solid #111827',
                    background: '#fff',
                    color: '#111827',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <XIcon size={20} color="currentColor" />
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              padding: '1rem',
              overflow: 'auto',
              background: '#e5e7eb'
            }}>
              <div style={{
                minWidth: '860px',
                minHeight: '560px',
                height: '100%',
                position: 'relative',
                background: '#fff',
                border: '3px solid #374151',
                boxShadow: 'inset 0 0 0 2px #cbd5e1',
                overflow: 'hidden'
              }}>
                <div style={{position: 'absolute', left: '3%', top: '5%', width: '22%', height: '34%', border: '2px solid #94a3b8', background: '#f8fafc'}}>
                  <div style={{padding: '0.6rem', fontWeight: 800, color: '#475569', fontSize: '12px'}}>COCINA</div>
                </div>
                <div style={{position: 'absolute', left: '9%', top: '44%', width: '7%', height: '24%', border: '2px solid #94a3b8', background: '#f8fafc'}}>
                  <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#475569', fontSize: '12px', writingMode: 'vertical-rl', textOrientation: 'mixed'}}>BARRA</div>
                </div>
                <div style={{position: 'absolute', right: '5%', top: '6%', width: '12%', height: '16%', border: '2px solid #94a3b8', background: '#f8fafc'}}>
                  <div style={{padding: '0.6rem', fontWeight: 800, color: '#475569', fontSize: '12px'}}>ENTRADA</div>
                </div>
                <div style={{position: 'absolute', left: '20%', right: '8%', bottom: '1%', height: '25%', border: '3px dashed #94a3b8', borderLeft: 'none', borderRight: 'none', color: '#64748b', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '0.2rem'}}>
                  TERRAZA
                </div>
                <div style={{position: 'absolute', left: '30%', top: '14%', width: '50%', height: '55%', background: '#fff7ed', border: '2px solid #fdba74', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', color: '#9a3412', fontWeight: 800, fontSize: '12px', paddingTop: '0.45rem'}}>
                  AREA PRINCIPAL
                </div>
                <div style={{position: 'absolute', left: '30%', top: '14%', width: '50%', height: '55%', border: '2px dashed #cbd5e1', background: 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.12) 8px, transparent 8px, transparent 16px)'}}></div>

                {mesasConEstado.length === 0 ? (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontWeight: 800,
                    fontSize: '18px'
                  }}>
                    Agrega mesas para verlas en el mapa
                  </div>
                ) : mesasConEstado.map((mesa, index) => {
                  const posicion = getMesaMapPosition(index)
                  const colorMesa = mesa.ocupada ? '#EF4444' : '#22C55E'
                  const bordeMesa = mesa.ocupada ? '#7F1D1D' : '#14532D'

                  return (
                    <button
                      key={mesa.id}
                      title={`Mesa ${mesa.numero} - ${mesa.ocupada ? 'Ocupada' : 'Disponible'}`}
                      style={{
                        position: 'absolute',
                        left: posicion.left,
                        top: posicion.top,
                        transform: 'translate(-50%, -50%)',
                        width: '84px',
                        height: '64px',
                        border: `3px solid ${bordeMesa}`,
                        background: '#111827',
                        color: '#fff',
                        borderRadius: '8px',
                        cursor: 'default',
                        boxShadow: `0 6px 14px ${mesa.ocupada ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.3)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.2rem',
                        fontWeight: 800,
                        fontSize: '12px'
                      }}
                    >
                      <span style={{
                        width: '30px',
                        height: '22px',
                        borderRadius: '50%',
                        background: colorMesa,
                        border: `2px solid ${bordeMesa}`,
                        boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.12)'
                      }}></span>
                      <span>Mesa {mesa.numero}</span>
                      <span style={{fontSize: '10px', color: mesa.ocupada ? '#FCA5A5' : '#86EFAC'}}>
                        {mesa.ocupada ? 'Ocupada' : 'Disponible'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: '#333', margin: 0, fontSize: '20px', fontWeight: 700}}>
                {editando ? 'Editar Mesa' : 'Agregar Nueva Mesa'}
              </h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'}}
              >
                ×
              </button>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Número de Mesa
                </label>
                <input
                  type="number"
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333'}}>
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  placeholder="Ej: Ventana, Centro, Terraza..."
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6F00'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  style={{
                    padding: '0.8rem',
                    background: '#e0e0e0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarMesa}
                  style={{
                    padding: '0.8rem',
                    background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
