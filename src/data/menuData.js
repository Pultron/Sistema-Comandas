export const menuData = {
  caliente: {
    nombre: '🔥 Platos Calientes',
    color: '#FF6F00',
    platillos: [
      {
        id: 1,
        nombre: 'Filete de Pescado Empanizado',
        precio: '$18.50',
        imagen: '/MenuImagenes/Pescado Empanizado.jpg',
        ingredientes: ['Filete de pargo', 'Pan molido', 'Huevo', 'Limón', 'Sal y pimienta', 'Arroz blanco', 'Papas a la francesa']
      },
      {
        id: 2,
        nombre: 'Camarones Rellenos',
        precio: '$22.00',
        imagen: '/MenuImagenes/Camarones Rellenos.jpg',
        ingredientes: ['Camarones ', 'Queso fresco', 'Jamón', 'Especias', 'Salsa de champiñones', 'Vegetales salteados']
      },
      {
        id: 5,
        nombre: 'Pechuga CordonBlue',
        precio: '$17.00',
        imagen: '/MenuImagenes/PechugaCordonblue.png',
        ingredientes: ['Pechuga de pollo', 'Queso cheddar', 'Jamón serrano', 'Salsa blanca', 'Vegetales al vapor', 'Papas gratinadas']
      },
      {
        id: 6,
        nombre: 'Costillas BBQ',
        precio: '$19.99',
        imagen: '/MenuImagenes/CostillasBBQ.png',
        ingredientes: ['Costillas de cerdo', 'Salsa BBQ casera', 'Especias ahumadas', 'Ensalada de col', 'Papas rellenas', 'Pan de ajo']
      },
    ]
  },
  fria: {
    nombre: '❄️ Platos Fríos',
    color: '#2196F3',
    platillos: [
      {
        id: 8,
        nombre: 'Ceviche Mixto',
        precio: '$16.00',
        imagen: '/MenuImagenes/CevicheMixto.jpg',
        ingredientes: ['Filete de pez', 'Camarones', 'Pulpo', 'Limón', 'Cilantro', 'Cebolla roja', 'Ají mirasol', 'Patata']
      },
      {
        id: 9,
        nombre: 'Aguachile',
        precio: '$12.00',
        imagen: '/MenuImagenes/Aguachile.jpg',
        ingredientes: ['Lechuga romana', 'Queso parmesano', 'Croutons', 'Pollo a la parrilla', 'Salsa César casera', 'Pimienta']
      },
    ]
  },
  pizza: {
    nombre: '🍕 Pizzas',
    color: '#FF9800',
    platillos: [
      {
        id: 3,
        nombre: 'PizzaMediana(Ingrediente a elegir)',
        precio: '$14.99',
        imagen: '/MenuImagenes/Pizza.png',
        ingredientes: ['Masa artesanal', 'Tomate fresco', 'Queso mozzarella', 'Albahaca', 'Aceite de oliva', 'Orégano']
      },
      {
        id: 4,
        nombre: 'Pizza Pepperoni',
        precio: '$16.50',
        imagen: '🌶️',
        ingredientes: ['Masa artesanal', 'Salsa de tomate', 'Queso mozzarella', 'Pepperoni', 'Cebolla', 'Champiñones']
      },
    ]
  },
  pasta: {
    nombre: '🍝 Pastas',
    color: '#8B4513',
    platillos: [
      {
        id: 7,
        nombre: 'Fettuccini Alfredo',
        precio: '$15.50',
        imagen: '🍝',
        ingredientes: ['Fettuccini', 'Crema de leche', 'Parmesano rallado', 'Mantequilla', 'Ajo', 'Pimienta negra']
      },
      {
        id: 10,
        nombre: 'Espagueti a la Bolognesa',
        precio: '$13.50',
        imagen: '🍴',
        ingredientes: ['Espagueti', 'Carne molida', 'Salsa de tomate', 'Cebolla', 'Ajo', 'Parmesano', 'Albahaca']
      },
    ]
  },
  bebidas_calientes: {
    nombre: '☕ Bebidas Calientes',
    color: '#A0522D',
    platillos: [
      {
        id: 11,
        nombre: 'Café Espresso',
        precio: '$2.50',
        imagen: '☕',
        ingredientes: ['Café premium', 'Agua caliente']
      },
      {
        id: 12,
        nombre: 'Café con Leche',
        precio: '$3.50',
        imagen: '🥛',
        ingredientes: ['Café espresso', 'Leche caliente', 'Espuma']
      },
      {
        id: 13,
        nombre: 'Chocolate Caliente',
        precio: '$4.00',
        imagen: '🍫',
        ingredientes: ['Chocolate premium', 'Leche caliente', 'Malvaviscos', 'Canela']
      },
      {
        id: 14,
        nombre: 'Té de Hierbas',
        precio: '$2.00',
        imagen: '🫖',
        ingredientes: ['Té variado', 'Agua caliente', 'Miel (opcional)']
      },
    ]
  },
  bebidas_frias: {
    nombre: '🧊 Bebidas Frías',
    color: '#0277BD',
    platillos: [
      {
        id: 15,
        nombre: 'Jugo de Naranja',
        precio: '$3.00',
        imagen: '🍊',
        ingredientes: ['Naranja fresca', 'Hielo', 'Azúcar (opcional)']
      },
      {
        id: 16,
        nombre: 'Gaseosa Surtida',
        precio: '$2.50',
        imagen: '🥤',
        ingredientes: ['Gaseosa premium', 'Hielo']
      },
      {
        id: 17,
        nombre: 'Limonada',
        precio: '$3.50',
        imagen: '🍋',
        ingredientes: ['Limón fresco', 'Agua', 'Azúcar', 'Hielo', 'Menta']
      },
      {
        id: 18,
        nombre: 'Batido de Frutas',
        precio: '$4.50',
        imagen: '🍓',
        ingredientes: ['Frutas variadas', 'Yogurt', 'Hielo', 'Miel']
      },
    ]
  },
  snacks: {
    nombre: '🍟 Snacks & Extras',
    color: '#FFB300',
    platillos: [
      {
        id: 19,
        nombre: 'Papas Fritas',
        precio: '$2.50',
        imagen: '🍟',
        ingredientes: ['Papas premium', 'Sal', 'Aceite vegetal']
      },
      {
        id: 20,
        nombre: 'Alitas de Pollo',
        precio: '$6.50',
        imagen: '🍗',
        ingredientes: ['Alitas de pollo', 'Salsa BBQ', 'Hierbas aromáticas']
      },
      {
        id: 21,
        nombre: 'Nachos con Queso',
        precio: '$5.00',
        imagen: '🧀',
        ingredientes: ['Nachos crujientes', 'Queso derretido', 'Jalapeños', 'Sour cream']
      },
      {
        id: 22,
        nombre: 'Pan de Ajo',
        precio: '$3.50',
        imagen: '🍞',
        ingredientes: ['Pan tostado', 'Ajo', 'Mantequilla', 'Perejil']
      },
    ]
  },
}

export const categories = [
  { key: 'caliente', label: 'Calientes', icon: '🔥' },
  { key: 'fria', label: 'Fríos', icon: '❄️' },
  { key: 'pizza', label: 'Pizzas', icon: '🍕' },
  { key: 'pasta', label: 'Pastas', icon: '🍝' },
  { key: 'bebidas_calientes', label: 'Bebidas Calientes', icon: '☕' },
  { key: 'bebidas_frias', label: 'Bebidas Frías', icon: '🧊' },
  { key: 'snacks', label: 'Snacks', icon: '🍟' },
]

export const comandasData = [
  { id: 1, mesa: 'Mesa 1', fecha: '2024-04-24 10:30', productos: 3, total: '$45.50', estado: 'En progreso', items: [] },
  { id: 2, mesa: 'Mesa 3', fecha: '2024-04-24 10:15', productos: 2, total: '$28.00', estado: 'Servido', items: [] },
  { id: 3, mesa: 'Barra', fecha: '2024-04-24 10:45', productos: 1, total: '$12.00', estado: 'Pendiente', items: [] },
]
