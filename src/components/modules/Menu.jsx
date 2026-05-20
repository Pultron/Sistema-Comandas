import { useEffect, useState } from 'react'
import { MenuIcon } from '../Icons'
import { appStyles } from '../../styles/styles'
import { useMenu } from '../../hooks/useSupabase'

export const MenuModule = ({ menu, categories, selectedCategory, setSelectedCategory, selectedDish, setSelectedDish }) => {
  const { menu: menuBd, categories: categoriesBd, loading } = useMenu()
  const menuActual = menu && Object.keys(menu).length > 0 ? menu : menuBd
  const categoriesActual = categories && categories.length > 0 ? categories : categoriesBd
  const [dishSeleccionadoLocal, setDishSeleccionadoLocal] = useState(null)
  const dishSeleccionado = selectedDish ?? dishSeleccionadoLocal
  const setDishSeleccionado = setSelectedDish || setDishSeleccionadoLocal

  useEffect(() => {
    if (!selectedCategory && categoriesActual.length > 0) {
      setSelectedCategory?.(categoriesActual[0].key)
    }
  }, [categoriesActual, selectedCategory, setSelectedCategory])

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
          {categoriesActual.map((cat) => (
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

        {/* Platillos de la Categoría (cuadrícula tipo POS con placeholders) */}
        <div style={appStyles.dishGrid}>
          {(() => {
            if (loading && (!selectedCategory || !menuActual[selectedCategory])) {
              return <div style={{padding: '1rem', color: '#666'}}>Cargando menú...</div>
            }

            const items = menuActual[selectedCategory]?.platillos || []
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
                      ...(dishSeleccionado?.id === platillo.id ? appStyles.dishCardHover : {})
                    }}
                    onClick={() => setDishSeleccionado(platillo)}
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

                {/* Placeholders para mantener la cuadrícula uniforme */}
                {Array.from({ length: placeholders }).map((_, idx) => (
                  <div key={`ph-${idx}`} style={appStyles.placeholderCard} />
                ))}
              </>
            )
          })()}
        </div>
      </div>

      {dishSeleccionado && (
        <div style={appStyles.modal} onClick={() => setDishSeleccionado(null)}>
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
              onClick={() => setDishSeleccionado(null)}
            >
              ×
            </button>

            {dishSeleccionado.imagen.startsWith('/') ? (
              <img
                src={dishSeleccionado.imagen}
                alt={dishSeleccionado.nombre}
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
              <div style={appStyles.dishImage}>{dishSeleccionado.imagen}</div>
            )}

            <h2 style={{color: '#000000', marginBottom: '0.8rem', textAlign: 'center', fontSize: '1.3rem'}}>
              {dishSeleccionado.nombre}
            </h2>
            <div style={{color: '#4CAF50', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>
              {dishSeleccionado.precio}
            </div>
            
            <h3 style={{color: '#000000', marginBottom: '0.8rem', fontSize: '1.1rem'}}>Ingredientes:</h3>
            <ul style={appStyles.ingredientsList}>
              {dishSeleccionado.ingredientes.map((ingrediente, index) => (
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
