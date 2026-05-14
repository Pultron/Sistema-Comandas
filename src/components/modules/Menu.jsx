import { MenuIcon } from '../Icons'
import { appStyles } from '../../styles/styles'

export const MenuModule = ({ menu, categories, selectedCategory, setSelectedCategory, selectedDish, setSelectedDish }) => {
  return (
    <>
      <div>
        <div style={appStyles.pageHeader}>
          <h1 style={appStyles.pageTitle}>
            <MenuIcon size={24} color="#FFD54F" style={{marginRight: '0.5rem', verticalAlign: 'middle'}} /> 
            Menú
          </h1>
          <button style={appStyles.btnPrimary}>+ Agregar Platillo</button>
        </div>
        
        {/* Botones de Categorías */}
        <div style={appStyles.categoryButtons}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              style={{
                ...appStyles.categoryBtn,
                ...(selectedCategory === cat.key && appStyles.categoryBtnActive)
              }}
              onClick={() => setSelectedCategory(cat.key)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
                e.currentTarget.style.transform = 'scale(1.08)'
                e.currentTarget.style.border = '2px solid #FF6F00'
              }}
              onMouseLeave={(e) => {
                if (selectedCategory === cat.key) {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #FF6F00 0%, #FFB300 50%, #FF9800 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.border = '2px solid #FF6F00'
                } else {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.border = '2px solid rgba(255, 111, 0, 0.3)'
                }
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Platillos de la Categoría (cuadrícula tipo POS) */}
        <div style={appStyles.dishGrid}>
          {(() => {
            const items = menu[selectedCategory].platillos || []

            return (
              <>
                {items.map((platillo) => (
                  <div
                    key={platillo.id}
                    style={{
                      ...appStyles.dishCard,
                      ...(selectedDish?.id === platillo.id ? appStyles.dishCardHover : {})
                    }}
                    onClick={() => setSelectedDish(platillo)}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, appStyles.dishCardHover)
                      const img = e.currentTarget.querySelector('img')
                      if (img) img.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', borderColor: '#e0e0e0', transition: 'all 0.3s ease' })
                      const img = e.currentTarget.querySelector('img')
                      if (img) img.style.transform = 'scale(1)'
                    }}
                  >
                    <div style={{width: '100%', height: '110px', overflow: 'hidden', borderRadius: '6px 6px 0 0', background: 'transparent'}}>
                      <img src={platillo.imagen} alt={platillo.nombre} style={{width: '100%', height: '110px', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease'}} />
                    </div>
                    <div style={appStyles.dishName}>{platillo.nombre}</div>
                  </div>
                ))}
              </>
            )
          })()}
        </div>
      </div>

      {selectedDish && (
        <div style={appStyles.modal} onClick={() => setSelectedDish(null)}>
          <div
            style={{
              ...appStyles.modalContent,
              padding: '0 1.2rem 1.5rem 1.2rem',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* X ahora pegada arriba sin espacio */}
            <button
              style={{
                ...appStyles.modalClose,
                position: 'absolute',
                top: '110px',
                right: '530px',
                fontSize: '3.5rem',
              }}
              onClick={() => setSelectedDish(null)}
            >
              ×
            </button>

            {selectedDish.imagen.startsWith('/') ? (
              <img
                src={selectedDish.imagen}
                alt={selectedDish.nombre}
                style={{
                  width: 'calc(100% + 2.4rem)',
                  marginLeft: '-1.2rem',
                  height: '140px',
                  objectFit: 'cover',
                  borderRadius: '8px 8px 0 0',
                  display: 'block',
                  marginBottom: '0.6rem',
                }}
              />
            ) : (
              <div style={appStyles.dishImage}>{selectedDish.imagen}</div>
            )}

            <h2 style={{color: '#000000', marginBottom: '0.8rem', textAlign: 'center', fontSize: '1.3rem'}}>
              {selectedDish.nombre}
            </h2>
            <div style={{color: '#4CAF50', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>
              {selectedDish.precio}
            </div>
            
            <h3 style={{color: '#000000', marginBottom: '0.8rem', fontSize: '1.1rem'}}>Ingredientes:</h3>
            <ul style={appStyles.ingredientsList}>
              {selectedDish.ingredientes.map((ingrediente, index) => (
                <li key={index} style={appStyles.ingredientItem}>
                  <span style={appStyles.bullet}>●</span>
                  {ingrediente}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
