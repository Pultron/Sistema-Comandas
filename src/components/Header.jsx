import { useState, useEffect } from 'react'
import { UserIcon, LogoutIcon } from './Icons'
import { appStyles } from '../styles/styles'

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
    <header style={{
      background: 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)',
      borderBottom: '2px solid #FF6F00',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      boxShadow: '0 4px 12px rgba(255, 111, 0, 0.2)',
      height: 'auto',
    }}>
      {/* Logo y Módulos */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        flex: 1,
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#000000',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          🍴 GastroSoft
        </div>

        {/* Módulos horizontales */}
        <nav style={{
          display: 'flex',
          gap: '1rem',
          flex: 1,
        }}>
          {modules.map((module) => (
            <button
              key={module.id}
              style={{
                background: activeModule === module.id 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '0.7rem 1rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: activeModule === module.id ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                transform: activeModule === module.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: activeModule === module.id ? '0 4px 12px rgba(255, 111, 0, 0.3)' : 'none',
              }}
              onClick={() => onModuleChange(module.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'scale(1.08)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                if (activeModule === module.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
                } else {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <span style={{fontSize: '1.2rem'}}>
                <module.icon size={18} color="#000000" />
              </span>
              {module.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Derecha: Hora, Usuario y Salir */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}>
        {/* Hora */}
        <div style={{
          color: '#000000',
          fontSize: '0.9rem',
          fontWeight: 500,
          minWidth: '80px',
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
          padding: '0.6rem 1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.95rem',
          transition: 'all 0.3s ease',
          transform: 'scale(1)',
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
          <UserIcon size={18} color="#000000" />
          Usuario
        </button>

        {/* Salir */}
        <button
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#000000',
            borderRadius: '6px',
            padding: '0.6rem 1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            fontWeight: 500,
            transform: 'scale(1)',
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
          <LogoutIcon size={18} color="#000000" />
          Salir
        </button>
      </div>
    </header>
  )
}





