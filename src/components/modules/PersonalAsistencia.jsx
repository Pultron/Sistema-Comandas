import { useState } from 'react'
import { PersonalModule } from './Personal'
import { AsistenciaModule } from './Asistencia'
import '../../styles/PersonalAsistencia.css'

const iconPaths = {
  menu: (
    <>
      <line x1="4" y1="7" x2="20" y2="7"></line>
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <line x1="4" y1="17" x2="20" y2="17"></line>
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9.5" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
      <path d="m9 16 2 2 4-5"></path>
    </>
  )
}

const Icon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {iconPaths[name]}
  </svg>
)

export const PersonalAsistenciaModule = () => {
  const [activeSection, setActiveSection] = useState('asistencia')
  const [menuOpen, setMenuOpen] = useState(false)

  const selectSection = (section) => {
    setActiveSection(section)
    setMenuOpen(false)
  }

  return (
    <div className="personal-attendance-module">
      <div className="personal-attendance-shell">
        <div className="personal-attendance-menu-wrap">
          <button
            type="button"
            className={`personal-attendance-menu-button ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Abrir menu de Personal / Asistencia"
            aria-expanded={menuOpen}
          >
            <Icon name="menu" size={22} />
          </button>

          {menuOpen && (
            <div className="personal-attendance-dropdown">
              <button
                type="button"
                className={activeSection === 'personal' ? 'active' : ''}
                onClick={() => selectSection('personal')}
              >
                <Icon name="users" />
                <span>Gestion de Personal</span>
              </button>
              <button
                type="button"
                className={activeSection === 'asistencia' ? 'active' : ''}
                onClick={() => selectSection('asistencia')}
              >
                <Icon name="calendar" />
                <span>Control Asistencia</span>
              </button>
            </div>
          )}
        </div>

        <section className="personal-attendance-content">
          {activeSection === 'personal' ? <PersonalModule /> : <AsistenciaModule />}
        </section>
      </div>
    </div>
  )
}
