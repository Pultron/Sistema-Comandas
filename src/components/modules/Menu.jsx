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

        {/* Platillos de la Categoría */}
        <div style={appStyles.dishGrid}>
          {menu[selectedCategory].platillos.map((platillo) => (
            <div
              key={platillo.id}
              style={{
                ...appStyles.dishCard,
                ...(selectedDish?.id === platillo.id && appStyles.dishCardHover)
              }}
              onClick={() => setSelectedDish(platillo)}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, appStyles.dishCardHover)
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  transform: 'none',
                  boxShadow: '0 4px 12px rgba(255, 111, 0, 0.2)',
                  borderColor: '#FF6F00',
                })
              }}
            >
              <div style={{width: '100%', height: '150px', marginBottom: '1rem', overflow: 'hidden', borderRadius: '6px'}}>
                <img src={platillo.imagen} alt={platillo.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
              <div style={appStyles.dishName}>{platillo.nombre}</div>
              <div style={appStyles.dishPrice}>{platillo.precio}</div>  
              <div style={appStyles.dishClick}>Haz clic para ver ingredientes</div>
            </div>
          ))}
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
