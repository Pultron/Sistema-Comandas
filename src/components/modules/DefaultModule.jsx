import { appStyles } from '../../styles/styles'

export const DefaultModule = ({ module, modules }) => {
  return (
    <div>
      <div style={appStyles.pageHeader}>
        <h1 style={appStyles.pageTitle}>
          {(() => {
            const currentModule = modules?.find(m => m.id === module)
            if (currentModule) {
              const IconComponent = currentModule.icon
              return (
                <>
                  <IconComponent size={24} color="#FFD54F" style={{marginRight: '0.5rem', verticalAlign: 'middle'}} />
                  {currentModule.name}
                </>
              )
            }
            return null
          })()}
        </h1>
      </div>
      <div style={{background: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e8dcc8', textAlign: 'center', color: '#8b7355'}}>
        <p>Módulo en desarrollo</p>
      </div>
    </div>
  )
}
