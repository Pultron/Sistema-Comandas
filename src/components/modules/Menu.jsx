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
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Platillos de la Categoría (cuadrícula tipo POS con placeholders) */}
        <div style={appStyles.dishGrid}>
          {(() => {
            const items = menu[selectedCategory].platillos || []
            const columns = 5
            const remainder = items.length % columns
            const placeholders = remainder === 0 ? 0 : columns - remainder

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
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, appStyles.dishCardHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: 'none', borderColor: '#e6e6e6' })}
                  >
                    <div style={{width: '100%', height: '110px', overflow: 'hidden'}}>
                      <img src={platillo.imagen} alt={platillo.nombre} style={{width: '100%', height: '110px', objectFit: 'cover', display: 'block'}} />
                    </div>
                    <div style={appStyles.dishName}>{platillo.nombre}</div>
                  </div>
                ))}

                {/* Placeholders para mantener la cuadrícula uniforme */}
                {Array.from({ length: placeholders }).map((_, idx) => (
                  <div key={`ph-${idx}`} style={appStyles.placeholderCard} />
                ))}
              </>
            )
          })()}
        </div>
      </div>

      {selectedDish && (
        <div style={appStyles.modal} onClick={() => setSelectedDish(null)}>
          <div
            style={appStyles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={appStyles.modalClose} onClick={() => setSelectedDish(null)}>
              ×
            </button>
            {selectedDish.imagen.startsWith('/') ? (
              <img src={selectedDish.imagen} alt={selectedDish.nombre} style={{width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem'}} />
            ) : (
              <div style={appStyles.dishImage}>{selectedDish.imagen}</div>
            )}
            <h2 style={{color: '#FFD54F', marginBottom: '1rem', textAlign: 'center'}}>
              {selectedDish.nombre}
            </h2>
            <div style={{color: '#4CAF50', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center'}}>
              {selectedDish.precio}
            </div>
            
            <h3 style={{color: '#FFD54F', marginBottom: '1rem'}}>Ingredientes:</h3>
            <ul style={appStyles.ingredientsList}>
              {selectedDish.ingredientes.map((ingrediente, index) => (
                <li key={index} style={appStyles.ingredientItem}>
                  <span style={appStyles.bullet}>●</span>
                  {ingrediente}
                </li>
              ))}
            </ul>

            <button
              style={{...appStyles.btnPrimary, width: '100%', marginTop: '1.5rem'}}
              onClick={() => {
                alert(`${selectedDish.nombre} agregado a la comanda`)
                setSelectedDish(null)
              }}
            >
              Agregar a Comanda
            </button>
          </div>
        </div>
      )}
    </>
  )
}
