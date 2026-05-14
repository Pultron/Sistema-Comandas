import { LogoutIcon, LogoIcon } from './Icons'
import { appStyles } from '../styles/styles'
import '../styles/Sidebar.css'

export const Sidebar = ({ modules, activeModule, onModuleChange, onLogout }) => {
  return (
    <aside style={appStyles.sidebar}>
      <div style={appStyles.sidebarHeader}>
        <div 
          style={appStyles.logo}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <LogoIcon size={28} color="#FFD54F" />
        </div>
        <h3 style={appStyles.sidebarHeader_h3}>GastroSoft</h3>
      </div>

      <nav style={appStyles.sidebarNav}>
        {modules.map(module => (
          <a
            key={module.id}
            href="#"
            className={`sidebar-nav-item ${activeModule === module.id ? 'active' : ''}`}
            style={{
              ...appStyles.navItem,
              ...(activeModule === module.id ? appStyles.navItemActive : {})
            }}
            onClick={(e) => {
              e.preventDefault()
              onModuleChange(module.id)
            }}
            onMouseEnter={(e) => {
              if (activeModule !== module.id) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderLeftColor = '#FFD54F'
                e.currentTarget.style.color = '#000000'
                e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeModule !== module.id) {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.borderLeftColor = 'transparent'
                e.currentTarget.style.color = '#000000'
                e.currentTarget.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)'
              }
            }}
          >
            <span style={appStyles.navIcon}>
              <module.icon size={20} color="currentColor" />
            </span>
            <span>{module.name}</span>
          </a>
        ))}
      </nav>

      <div style={appStyles.sidebarFooter}>
        <button 
          style={appStyles.logoutBtn} 
          onClick={onLogout}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.color = '#000000'
            e.target.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <LogoutIcon size={16} color="currentColor" style={{marginRight: '0.4rem'}} />
          Salir
        </button>
      </div>
    </aside>
  )
}
