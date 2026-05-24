import { useState, useEffect } from 'react'
import { UserIcon, LogoutIcon } from './Icons'
import { appStyles } from '../styles/styles'
import '../styles/Header.css'
import { supabase } from '../supabase'

export const Header = ({ modules, activeModule, onModuleChange, onLogout, currentUser, onUserUpdate }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  const [guardandoFoto, setGuardandoFoto] = useState(false)
  const [mensajePerfil, setMensajePerfil] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const inicialUsuario = currentUser?.nombre?.charAt(0)?.toUpperCase() || 'U'
  const activeModuleName = modules.find(module => module.id === activeModule)?.name || 'GastroSoft'

  const cambiarFotoPerfil = (event) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser?.id) return

    if (!file.type.startsWith('image/')) {
      setMensajePerfil({ tipo: 'error', texto: 'Selecciona una imagen valida' })
      return
    }

    if (file.size > 900 * 1024) {
      setMensajePerfil({ tipo: 'error', texto: 'La imagen debe pesar menos de 900 KB' })
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const fotoPerfil = reader.result
      setGuardandoFoto(true)
      setMensajePerfil(null)

      const { error } = await supabase
        .from('usuarios')
        .update({ foto_perfil: fotoPerfil })
        .eq('id', currentUser.id)

      if (error) {
        setMensajePerfil({ tipo: 'error', texto: error.message })
      } else {
        onUserUpdate?.({ ...currentUser, foto_perfil: fotoPerfil })
        setMensajePerfil({ tipo: 'success', texto: 'Foto de perfil actualizada' })
      }

      setGuardandoFoto(false)
      event.target.value = ''
    }

    reader.readAsDataURL(file)
  }

  return (
    <>
      {/* SECCIÓN SUPERIOR - FIJA */}
      <div style={{
        background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
        padding: '0.7rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        boxShadow: '0 4px 12px rgba(255, 111, 0, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <img
          src="/LogoGastroSoftHeader.png"
          alt="GastroSoft"
          style={{
            position: 'absolute',
            left: '2rem',
            top: '0.3rem',
            width: '132px',
            height: '120px',
            objectFit: 'contain',
            display: 'block',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        <div style={{
          position: 'absolute',
          left: 'calc(2rem + 132px + 1rem)',
          right: 0,
          bottom: 0,
          height: '2px',
          background: '#FF6F00',
          pointerEvents: 'none',
        }} />

        {/* Identidad y modulo actual */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          minWidth: 0,
        }}>
          <div style={{
            width: '132px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexShrink: 0,
          }}>
          </div>
          <div style={{
            height: '28px',
            width: '1px',
            background: 'rgba(0,0,0,0.22)',
          }} />
          <div style={{
            color: '#2b2b2b',
            fontSize: '0.95rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            {activeModuleName}
          </div>
        </div>

        {/* Usuario y Salir */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginLeft: 'auto',
        }}>
          {/* Hora */}
          <div style={{
            color: '#000000',
            fontSize: '1.08rem',
            fontWeight: 800,
            minWidth: '92px',
            textAlign: 'right',
          }}>
            {formatTime(currentTime)}
          </div>

          {/* Usuario */}
          <button style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#000000',
            borderRadius: '6px',
            padding: '0.5rem 0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            transition: 'all 0.3s ease',
            fontWeight: 500,
          }}
          onClick={() => {
            setMostrarPerfil(true)
            setMensajePerfil(null)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          >
            {currentUser?.foto_perfil ? (
              <img src={currentUser.foto_perfil} alt="Perfil" style={{width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
              <UserIcon size={16} color="#000000" />
            )}
            {currentUser?.nombre || 'Usuario'}
          </button>

          {/* Salir */}
          <button
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#000000',
              borderRadius: '6px',
              padding: '0.5rem 0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              fontWeight: 500,
            }}
            onClick={onLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 100, 100, 0.3)'
              e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.5)'
              e.currentTarget.style.transform = 'scale(1.08)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <LogoutIcon size={16} color="#000000" />
            Salir
          </button>
        </div>
      </div>

      {/* SECCIÓN INFERIOR - DESPLAZABLE */}
      <header style={{
        background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
        borderBottom: '3px solid #FF6F00',
        padding: '0.55rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 4px 12px rgba(255, 111, 0, 0.2)',
        overflowX: 'auto',
        overflowY: 'visible',
        position: 'sticky',
        top: '42px',
        zIndex: 99,
        scrollBehavior: 'smooth',
      }}>
        {/* Espacio reservado para el logo */}
        <div style={{
          width: '132px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
        </div>

        <div style={{
          height: '42px',
          width: '1px',
          background: 'rgba(0,0,0,0.22)',
          flexShrink: 0,
        }} />

        {/* Módulos horizontales - DESPLAZABLES */}
        <nav style={{
          display: 'flex',
          gap: '0.8rem',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'visible',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          padding: '0 1.25rem 0.5rem 0',
        }}>
          {modules.map((module) => (
            <button
              key={module.id}
              style={{
                background: activeModule === module.id 
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : 'rgba(255, 255, 255, 0.12)',
                color: '#000000',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '6px',
                padding: '0.6rem 0.9rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeModule === module.id ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: activeModule === module.id ? '0 4px 12px rgba(255, 111, 0, 0.3)' : 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onClick={() => onModuleChange(module.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                if (activeModule === module.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
                } else {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <span style={{fontSize: '1.1rem', display: 'flex', alignItems: 'center'}}>
                <module.icon size={18} color="#000000" />
              </span>
              {module.name}
            </button>
          ))}
          <span style={{flex: '0 0 1.25rem'}} />
        </nav>
      </header>

      {mostrarPerfil && (
        <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000}}>
          <div style={{background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '460px', boxShadow: '0 10px 40px rgba(0,0,0,0.35)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', marginBottom: '1.5rem'}}>
              <div>
                <h2 style={{margin: 0, color: '#111', fontSize: '20px', fontWeight: 700}}>Perfil de usuario</h2>
                <div style={{color: '#666', fontSize: '13px', marginTop: '0.3rem'}}>Informacion de la sesion actual</div>
              </div>
              <button onClick={() => setMostrarPerfil(false)} style={{background: 'transparent', border: 'none', color: '#777', fontSize: '24px', cursor: 'pointer', lineHeight: 1}}>x</button>
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
              <div style={{width: '82px', height: '82px', borderRadius: '50%', background: '#FFE0CC', color: '#D32F2F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 800, overflow: 'hidden', border: '3px solid #FFB300'}}>
                {currentUser?.foto_perfil ? (
                  <img src={currentUser.foto_perfil} alt="Foto de perfil" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : inicialUsuario}
              </div>
              <div>
                <label style={{display: 'inline-block', padding: '0.65rem 0.9rem', background: '#2196F3', color: 'white', borderRadius: '6px', fontWeight: 700, cursor: guardandoFoto ? 'not-allowed' : 'pointer', fontSize: '13px'}}>
                  {guardandoFoto ? 'Guardando...' : 'Cambiar foto'}
                  <input type="file" accept="image/*" onChange={cambiarFotoPerfil} disabled={guardandoFoto} style={{display: 'none'}} />
                </label>
                <div style={{fontSize: '12px', color: '#777', marginTop: '0.5rem'}}>JPG o PNG menor a 900 KB</div>
              </div>
            </div>

            <div style={{display: 'grid', gap: '0.8rem', marginBottom: '1rem'}}>
              <div style={{padding: '0.8rem', background: '#f7f7f7', borderRadius: '6px'}}>
                <div style={{fontSize: '11px', color: '#777', fontWeight: 700}}>NOMBRE</div>
                <div style={{color: '#222', fontWeight: 700}}>{currentUser?.nombre || 'Sin nombre'}</div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem'}}>
                <div style={{padding: '0.8rem', background: '#f7f7f7', borderRadius: '6px'}}>
                  <div style={{fontSize: '11px', color: '#777', fontWeight: 700}}>USUARIO</div>
                  <div style={{color: '#222', fontWeight: 700}}>{currentUser?.usuario || '-'}</div>
                </div>
                <div style={{padding: '0.8rem', background: '#f7f7f7', borderRadius: '6px'}}>
                  <div style={{fontSize: '11px', color: '#777', fontWeight: 700}}>ROL</div>
                  <div style={{color: '#222', fontWeight: 700}}>{currentUser?.rol || '-'}</div>
                </div>
              </div>
              <div style={{padding: '0.8rem', background: '#f7f7f7', borderRadius: '6px'}}>
                <div style={{fontSize: '11px', color: '#777', fontWeight: 700}}>CORREO</div>
                <div style={{color: '#222', fontWeight: 700}}>{currentUser?.correo || 'Sin correo'}</div>
              </div>
            </div>

            {mensajePerfil && (
              <div style={{
                padding: '0.8rem',
                borderRadius: '6px',
                background: mensajePerfil.tipo === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: mensajePerfil.tipo === 'success' ? '#166534' : '#991B1B',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {mensajePerfil.texto}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}





