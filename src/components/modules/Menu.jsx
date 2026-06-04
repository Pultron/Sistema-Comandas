import { useEffect, useMemo, useState } from 'react'
import { EditIcon, MenuIcon, SearchIcon, XIcon } from '../Icons'
import { useMenu } from '../../hooks/useSupabase'
import { supabase } from '../../supabase'
import '../../styles/Menu.css'

const desiredCategoryOrder = [
  'Platos Calientes',
  'Platos Frios',
  'Pizzas',
  'Pastas',
  'Bebidas Calientes',
  'Bebidas Frias',
  'Snacks & Extras'
]

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

const formatPrice = (value) => {
  const numeric = Number(String(value || '').replace(/[^0-9.]/g, '')) || 0
  return `$${numeric.toFixed(2)}`
}

const imageLooksValid = (src) => {
  const value = String(src || '').trim()
  return /^(https?:|data:image|blob:|\/|\.\/|\.\.\/)/i.test(value)
}

const getProductDescription = (product) => {
  if (product.descripcion) return product.descripcion
  if (product.ingredientes?.length) return product.ingredientes.join(', ')
  return 'Sin descripcion disponible.'
}

const CategoryIcon = ({ label }) => {
  const name = normalizeText(label)
  if (name.includes('pizza')) {
    return <svg viewBox="0 0 24 24"><path d="M4 20 20 4l-4 17-4-5-5 4Z" /><circle cx="14" cy="10" r="1.2" /><circle cx="11" cy="14" r="1.2" /></svg>
  }
  if (name.includes('pasta')) {
    return <svg viewBox="0 0 24 24"><path d="M5 14c3-5 11-5 14 0" /><path d="M7 14c2 4 8 4 10 0" /><path d="M9 10V5m3 5V5m3 5V5" /></svg>
  }
  if (name.includes('bebida')) {
    return <svg viewBox="0 0 24 24"><path d="M7 3h10l-1 18H8L7 3Z" /><path d="M8 8h8" /><path d="M12 3v18" /></svg>
  }
  if (name.includes('snack')) {
    return <svg viewBox="0 0 24 24"><path d="M5 8h14l-2 13H7L5 8Z" /><path d="M8 8V5h8v3" /><path d="M9 12h6" /></svg>
  }
  if (name.includes('frio')) {
    return <svg viewBox="0 0 24 24"><path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9" /></svg>
  }
  return <svg viewBox="0 0 24 24"><path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-5 5-10 5-10Z" /><path d="M12 22c-2-2-3-4-1-7" /></svg>
}

export const MenuModule = ({ menu, categories, selectedCategory, setSelectedCategory }) => {
  const { menu: menuBd, categories: categoriesBd, loading } = useMenu()
  const [localCategory, setLocalCategory] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('cards')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [products, setProducts] = useState([])
  const [modalMode, setModalMode] = useState(null)
  const [form, setForm] = useState({ id: null, nombre: '', precio: '', imagen: '', descripcion: '', categoria: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [imageInputRef, setImageInputRef] = useState(null)

  const menuActual = Object.keys(menuBd || {}).length > 0 ? menuBd : (menu || {})
  const rawCategories = categoriesBd.length > 0 ? categoriesBd : (categories || [])
  const sortedCategories = useMemo(() => {
    return [...rawCategories].sort((a, b) => {
      const aIndex = desiredCategoryOrder.findIndex(item => normalizeText(item) === normalizeText(a.label))
      const bIndex = desiredCategoryOrder.findIndex(item => normalizeText(item) === normalizeText(b.label))
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })
  }, [rawCategories])

  const activeCategory = selectedCategory || localCategory
  const setActiveCategory = (key) => {
    setSelectedCategory?.(key)
    setLocalCategory(key)
  }

  const dbProducts = useMemo(() => (
    Object.entries(menuActual).flatMap(([categoryKey, categoryData]) => (
      (categoryData.platillos || []).map(product => ({
        ...product,
        categoria: product.categoria || categoryKey,
        id_categoria: product.id_categoria || sortedCategories.find(cat => cat.key === categoryKey)?.id
      }))
    ))
  ), [menuActual, sortedCategories])

  useEffect(() => {
    const categoryExists = sortedCategories.some(category => category.key === activeCategory)
    if ((!activeCategory || !categoryExists) && sortedCategories[0]) {
      setActiveCategory(sortedCategories[0].key)
    }
  }, [activeCategory, sortedCategories])

  useEffect(() => {
    setProducts(dbProducts)
  }, [dbProducts])

  useEffect(() => {
    setPage(1)
  }, [activeCategory, search, pageSize])

  const filteredProducts = useMemo(() => {
    const searchText = normalizeText(search)
    return products.filter(product => {
      const matchesCategory = !activeCategory || product.categoria === activeCategory
      const matchesSearch = !searchText
        || normalizeText(product.nombre).includes(searchText)
        || normalizeText(getProductDescription(product)).includes(searchText)
      return matchesCategory && matchesSearch
    })
  }, [products, activeCategory, search])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const showingFrom = filteredProducts.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1
  const showingTo = Math.min(currentPage * pageSize, filteredProducts.length)

  const openAddModal = () => {
    setForm({ id: null, nombre: '', precio: '', imagen: '', descripcion: '', categoria: activeCategory || sortedCategories[0]?.key || '' })
    setFormError('')
    setModalMode('add')
  }

  const openEditModal = (product) => {
    setForm({
      id: product.id,
      nombre: product.nombre || '',
      precio: String(product.precioNumero || String(product.precio || '').replace(/[^0-9.]/g, '')),
      imagen: product.imagen || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || activeCategory || ''
    })
    setFormError('')
    setModalMode('edit')
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    const category = sortedCategories.find(cat => cat.key === form.categoria)
    const price = Number(String(form.precio).replace(/[^0-9.]/g, ''))

    if (!form.nombre.trim() || !category?.id || !price) {
      setFormError('Completa nombre, precio y categoria.')
      return
    }

    setSaving(true)
    setFormError('')

    let imagenUrl = form.imagen.trim() || null

    // Si la imagen es un data URL (cargada localmente), subirla a Supabase Storage
    if (imagenUrl && imagenUrl.startsWith('data:')) {
      try {
        const base64 = imagenUrl.split(',')[1]
        const binaryString = atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'image/png' })
        
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, blob)

        if (uploadError) {
          setFormError(`Error al subir imagen: ${uploadError.message}`)
          setSaving(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(uploadData.path)

        imagenUrl = publicUrl
      } catch (error) {
        setFormError(`Error procesando imagen: ${error.message}`)
        setSaving(false)
        return
      }
    }

    const payload = {
      nombre: form.nombre.trim(),
      precio: price,
      imagen: imagenUrl,
      descripcion: form.descripcion.trim() || '',
      id_categoria: category.id
    }

    const result = modalMode === 'edit'
      ? await supabase.from('productos').update(payload).eq('id', form.id).select('*').single()
      : await supabase.from('productos').insert({ ...payload, disponible: true }).select('*').single()

    if (result.error) {
      setFormError(result.error.message)
      setSaving(false)
      return
    }

    const savedProduct = {
      ...(result.data || payload),
      id: result.data?.id || form.id,
      nombre: payload.nombre,
      precio: formatPrice(price),
      precioNumero: price,
      imagen: payload.imagen || '',
      categoria: category.key,
      id_categoria: category.id,
      descripcion: result.data?.descripcion || result.data?.descripcion_corta || '',
      ingredientes: result.data?.ingredientes ? result.data.ingredientes.split(',').map(item => item.trim()) : []
    }

    setProducts(prev => modalMode === 'edit'
      ? prev.map(product => product.id === savedProduct.id ? { ...product, ...savedProduct } : product)
      : [savedProduct, ...prev]
    )
    setActiveCategory(category.key)
    setModalMode(null)
    setImageInputRef(null)
    setSaving(false)
  }

  return (
    <section className="menu-catalog">
      <div className="menu-catalog-header">
        <button className="menu-add-button" onClick={openAddModal}>
          <span>+</span> Agregar Platillo
        </button>
      </div>

      <div className="menu-toolbar">
        <div className="menu-category-row">
          {sortedCategories.map(category => (
            <button
              key={category.key}
              className={activeCategory === category.key ? 'active' : ''}
              onClick={() => setActiveCategory(category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="menu-search-actions">
          <label className="menu-search">
            <SearchIcon size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar platillo..." />
          </label>
          <button className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')} aria-label="Vista de tarjetas">
            <svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg>
          </button>
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="Vista de lista">
            <svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></svg>
          </button>
        </div>
      </div>

      <div className={`menu-products ${viewMode === 'list' ? 'list-view' : ''}`}>
        {loading ? (
          <div className="menu-empty-state">Cargando menú...</div>
        ) : pageProducts.length === 0 ? (
          <div className="menu-empty-state">No hay platillos para mostrar.</div>
        ) : pageProducts.map(product => (
          <article className="menu-product-card" key={product.id}>
            <div className="menu-product-image">
              {imageLooksValid(product.imagen) ? (
                <img src={product.imagen} alt={product.nombre} />
              ) : (
                <CategoryIcon label={sortedCategories.find(cat => cat.key === product.categoria)?.label || ''} />
              )}
            </div>
            <div className="menu-product-body">
              <h2>{product.nombre}</h2>
              <p>{getProductDescription(product)}</p>
              <strong>{product.precio}</strong>
              <button className="menu-edit-button" onClick={() => openEditModal(product)} aria-label={`Editar ${product.nombre}`}>
                <EditIcon size={18} />
                <span>Editar</span>
              </button>
            </div>
          </article>
        ))}

        {!loading && (
          <button className="menu-add-card" onClick={openAddModal}>
            <span>+</span>
            <strong>Agregar nuevo platillo</strong>
          </button>
        )}
      </div>

      <footer className="menu-pagination">
        <span>Mostrando {showingFrom} a {showingTo} de {filteredProducts.length} platillos</span>
        <div className="menu-pages">
          <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button>
          {Array.from({ length: Math.min(totalPages, 4) }, (_, index) => index + 1).map(pageNumber => (
            <button key={pageNumber} className={currentPage === pageNumber ? 'active' : ''} onClick={() => setPage(pageNumber)}>
              {pageNumber}
            </button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Siguiente</button>
        </div>
        <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={30}>30 por página</option>
        </select>
      </footer>

      {modalMode && (
        <div className="menu-modal-overlay" onClick={() => { setModalMode(null); setImageInputRef(null) }}>
          <form className="menu-modal" onSubmit={saveProduct} onClick={(event) => event.stopPropagation()}>
            <div className="menu-modal-header">
              <h2>{modalMode === 'edit' ? 'Editar platillo' : 'Agregar platillo'}</h2>
              <button type="button" onClick={() => { setModalMode(null); setImageInputRef(null) }}><XIcon size={20} /></button>
            </div>
            <label>Nombre<input value={form.nombre} onChange={(event) => setForm(prev => ({ ...prev, nombre: event.target.value }))} /></label>
            <label>Precio<input type="number" min="0" step="0.01" value={form.precio} onChange={(event) => setForm(prev => ({ ...prev, precio: event.target.value }))} /></label>
            <label>Descripción<textarea value={form.descripcion} onChange={(event) => setForm(prev => ({ ...prev, descripcion: event.target.value }))} placeholder="Describe el platillo..." /></label>
            <label className="menu-modal-image-label">
              Imagen
              <div className="menu-modal-image-drop" onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-active') }} onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-active') }} onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-active'); const file = e.dataTransfer.files[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { setForm(prev => ({ ...prev, imagen: event.target.result })) }; reader.readAsDataURL(file) } }}>
                <input ref={setImageInputRef} type="file" accept="image/*" onChange={(event) => { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { setForm(prev => ({ ...prev, imagen: e.target.result })) }; reader.readAsDataURL(file) } }} style={{ display: 'none' }} />
                {form.imagen ? (
                  <>
                    <img src={form.imagen} alt="Vista previa" className="menu-modal-image-preview" />
                    <button type="button" onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, imagen: '' })) }} className="menu-modal-image-remove">✕</button>
                  </>
                ) : (
                  <div className="menu-modal-image-placeholder" onClick={(e) => { e.preventDefault(); imageInputRef?.click() }}>
                    <p>Arrastra una imagen aquí o haz clic para seleccionar</p>
                  </div>
                )}
              </div>
            </label>
            <label>Categoría
              <select value={form.categoria} onChange={(event) => setForm(prev => ({ ...prev, categoria: event.target.value }))}>
                {sortedCategories.map(category => <option key={category.key} value={category.key}>{category.label}</option>)}
              </select>
            </label>
            {formError && <div className="menu-form-error">{formError}</div>}
            <div className="menu-modal-actions">
              <button type="button" onClick={() => { setModalMode(null); setImageInputRef(null) }} disabled={saving}>Cancelar</button>
              <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
