import { useState, useEffect } from 'react'
import { UserIcon, LogoutIcon } from './Icons'
import { appStyles } from '../styles/styles'
import '../styles/Header.css'

export const Header = ({ modules, activeModule, onModuleChange, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

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

  return (
    <>
      {/* SECCIÓN SUPERIOR - FIJA */}
      <div style={{
        background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
        borderBottom: '2px solid #FF6F00',
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
        {/* Hora */}
        <div style={{
          color: '#000000',
          fontSize: '0.85rem',
          fontWeight: 600,
          minWidth: '80px',
        }}>
          {formatTime(currentTime)}
        </div>

        {/* Usuario y Salir */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginLeft: 'auto',
        }}>
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
            <UserIcon size={16} color="#000000" />
            Usuario
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
        padding: '0.8rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        boxShadow: '0 4px 12px rgba(255, 111, 0, 0.2)',
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'sticky',
        top: '42px',
        zIndex: 99,
        scrollBehavior: 'smooth',
      }}>
        {/* Logo y Título */}
        <div style={{
          fontSize: '1.3rem',
          fontWeight: 'bold',
          color: '#000000',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          🍴 GastroSoft
        </div>

        {/* Módulos horizontales - DESPLAZABLES */}
        <nav style={{
          display: 'flex',
          gap: '0.8rem',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          paddingBottom: '0.5rem',
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
                transform: activeModule === module.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: activeModule === module.id ? '0 4px 12px rgba(255, 111, 0, 0.3)' : 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onClick={() => onModuleChange(module.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'scale(1.08)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                if (activeModule === module.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
                } else {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.transform = 'scale(1)'
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
        </nav>
      </header>
    </>
  )
}





