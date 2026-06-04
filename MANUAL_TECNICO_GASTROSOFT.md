# Manual Técnico GastroSoft

## Documento Técnico para Desarrolladores y Administradores de Sistemas

**Versión:** 1.0  
**Fecha:** 29 de Mayo 2026  
**Proyecto:** Sistema de Gestión de Restaurante - GastroSoft  
**Plataforma:** Web (React + Vite)

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Diccionario de Datos](#diccionario-de-datos)
4. [Configuración del Entorno](#configuración-del-entorno)
5. [Endpoint API](#endpoint-api)
6. [Guía de Instalación](#guía-de-instalación)
7. [Estructura de Carpetas](#estructura-de-carpetas)

---

## Introducción

GastroSoft es un sistema integral de gestión para restaurantes que permite:
- Gestión de comandas (órdenes)
- Control de inventario
- Gestión de pagos y reportes
- Administración de personal
- Manejo de proveedores
- Control de mesas y promociones

**Stack Tecnológico:**
- **Frontend:** React 19.2.5 + Vite 8.0.9
- **Backend:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Base de Datos:** PostgreSQL (Supabase)
- **Lenguaje:** JavaScript/JSX
- **Styling:** CSS3 + Flexbox/Grid

---

## Arquitectura del Sistema

### Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA PRESENTACIÓN                     │
│                   (React + Vite)                         │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │  Comandas    │  Inventario  │   Pagos              │ │
│  │  Dashboard   │  Proveedores │   Personal/Asis.    │ │
│  │  Mesas       │  Promociones │   Clientes          │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                    useSupabase()
                    Hooks React
                       │
┌──────────────────────▼──────────────────────────────────┐
│              CAPA DE LÓGICA NEGOCIOS                     │
│         (useSupabase.js - Hooks Personalizados)         │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │ useComandas  │ useInventario│ useProveedores       │ │
│  │ useMesas     │ usePersonal  │ usePromociones       │ │
│  │ usePagos     │ useClientes  │ useReservas          │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                    Supabase SDK
                  (@supabase/js)
                       │
┌──────────────────────▼──────────────────────────────────┐
│              CAPA DE DATOS                              │
│           (Supabase + PostgreSQL)                       │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │  Tablas Base │  Funciones   │   Triggers           │ │
│  │  de Datos    │   RLS        │   Índices            │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario Interactúa
        ↓
  React Component
        ↓
  Llamada Hook (ej: useInventario)
        ↓
  Función Supabase (ej: registrarMovimiento)
        ↓
  Consulta PostgreSQL
        ↓
  Retorna Datos
        ↓
  setState() - Actualiza UI
        ↓
  Dispara evento 'inventario:changed'
        ↓
  Componentes escuchan evento
        ↓
  Re-render automático
```

### Componentes Principales

#### 1. **Módulos de Negocio**
- **Comandas**: Gestión de órdenes de clientes
- **Pagos**: Procesamiento de pagos y generación de recibos
- **Inventario**: Control de stock y movimientos
- **Proveedores**: Gestión de compras y relación con proveedores
- **Mesas**: Control de disponibilidad y asignación
- **Personal/Asistencia**: Gestión de empleados y asistencia
- **Clientes**: Base de datos de clientes
- **Promociones**: Creación y aplicación de ofertas
- **Reportes**: Análisis y estadísticas

#### 2. **Componentes Técnicos**
- **Header**: Navegación principal
- **Sidebar**: Menú lateral de módulos
- **Dashboard**: Vista de resumen (KPIs)
- **Icons**: Componentes de iconografía
- **NotificationContext**: Sistema de notificaciones global

---

## Diccionario de Datos

### Tablas Principales en PostgreSQL (Supabase)

#### 1. **MESAS**
```
Tabla: mesas
Descripción: Registro de mesas del restaurante

Campos:
  - id (UUID, PRIMARY KEY)
  - numero (INTEGER, UNIQUE)
  - cantidad_personas (INTEGER) - Capacidad de la mesa
  - estado (TEXT) - 'disponible', 'ocupada', 'reservada'
  - ubicacion (TEXT) - Zona del restaurante
  - notas (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - numero (índice único)
  - estado (para búsquedas rápidas)
```

#### 2. **COMANDAS**
```
Tabla: comandas
Descripción: Órdenes de clientes

Campos:
  - id (UUID, PRIMARY KEY)
  - id_mesa (UUID, FOREIGN KEY → mesas)
  - numero_comanda (INTEGER, UNIQUE)
  - estado (TEXT) - 'activa', 'pagada', 'cancelada'
  - total (DECIMAL)
  - subtotal (DECIMAL)
  - impuesto (DECIMAL)
  - propina (DECIMAL)
  - descuento (DECIMAL)
  - cuentaSeparada (BOOLEAN)
  - nombrePersona (TEXT) - Para cuentas separadas
  - fecha_creacion (TIMESTAMP)
  - fecha_pago (TIMESTAMP)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - id_mesa
  - numero_comanda (único)
  - estado
  - fecha_creacion
```

#### 3. **DETALLES_COMANDA**
```
Tabla: detalles_comanda
Descripción: Items dentro de cada comanda

Campos:
  - id (UUID, PRIMARY KEY)
  - id_comanda (UUID, FOREIGN KEY → comandas)
  - nombre_item (TEXT)
  - cantidad (DECIMAL)
  - precio_unitario (DECIMAL)
  - subtotal (DECIMAL)
  - observaciones (TEXT)
  - estado (TEXT) - 'pendiente', 'preparado', 'servido'
  - created_at (TIMESTAMP)

Índices:
  - id_comanda
  - estado
```

#### 4. **INVENTARIO**
```
Tabla: inventario
Descripción: Stock de ingredientes y productos

Campos:
  - id (UUID, PRIMARY KEY)
  - nombre (TEXT, UNIQUE)
  - unidad (TEXT) - 'kg', 'litros', 'piezas', 'cajas'
  - cantidad (DECIMAL)
  - cantidad_minima (DECIMAL)
  - cantidad_maxima (DECIMAL)
  - estado (TEXT) - 'normal', 'bajo', 'agotado'
  - id_proveedor (UUID, FOREIGN KEY → proveedores)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - nombre (único)
  - id_proveedor
  - estado
```

#### 5. **MOVIMIENTOS_INVENTARIO**
```
Tabla: movimientos_inventario
Descripción: Historial de entradas y salidas de inventario

Campos:
  - id (BIGINT, PRIMARY KEY, AUTO INCREMENT)
  - id_ingrediente (UUID, FOREIGN KEY → inventario)
  - tipo (TEXT) - 'entrada', 'salida'
  - cantidad (DECIMAL)
  - motivo (TEXT)
  - fecha (TIMESTAMP)
  - created_at (TIMESTAMP)

Índices:
  - id_ingrediente
  - tipo
  - fecha (descendente para ordenamiento)
  - id (descendente para últimos movimientos)
```

#### 6. **PROVEEDORES**
```
Tabla: proveedores
Descripción: Información de proveedores

Campos:
  - id (UUID, PRIMARY KEY)
  - nombre (TEXT, UNIQUE)
  - contacto (TEXT)
  - telefono (TEXT)
  - email (TEXT)
  - productos (TEXT) - JSON o lista separada por comas
  - estado (TEXT) - 'activo', 'inactivo'
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - nombre (único)
  - estado
```

#### 7. **PRODUCTOS_PROVEEDOR**
```
Tabla: productos_proveedor
Descripción: Productos disponibles de cada proveedor

Campos:
  - id (UUID, PRIMARY KEY)
  - id_proveedor (UUID, FOREIGN KEY → proveedores)
  - nombre (TEXT)
  - unidades_permitidas (ARRAY de TEXT) - ['kilos', 'piezas', 'cajas']
  - precio_por_unidad (JSONB) - {kilos: 10.5, piezas: 2.5, cajas: 50}
  - piezas_por_caja (TEXT) - Cantidad de piezas en cada caja
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - id_proveedor
  - nombre
```

#### 8. **COMPRAS_PROVEEDOR**
```
Tabla: compras_proveedor
Descripción: Registro de compras realizadas

Campos:
  - id (UUID, PRIMARY KEY)
  - id_proveedor (UUID, FOREIGN KEY → proveedores)
  - fecha (TIMESTAMP)
  - total (DECIMAL)
  - num_items (INTEGER)
  - observaciones (JSONB) - {items: [...]}
  - estado (TEXT) - 'pendiente', 'recibida'
  - created_at (TIMESTAMP)

Índices:
  - id_proveedor
  - fecha
```

#### 9. **PERSONAL**
```
Tabla: personal
Descripción: Empleados del restaurante

Campos:
  - id (UUID, PRIMARY KEY)
  - nombre (TEXT)
  - puesto (TEXT) - 'mesero', 'chef', 'gerente', etc.
  - email (TEXT, UNIQUE)
  - telefono (TEXT)
  - salario (DECIMAL)
  - estado (TEXT) - 'activo', 'inactivo'
  - fecha_ingreso (DATE)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - email (único)
  - puesto
  - estado
```

#### 10. **ASISTENCIA_PERSONAL**
```
Tabla: asistencia_personal
Descripción: Control de asistencia diaria

Campos:
  - id (UUID, PRIMARY KEY)
  - id_personal (UUID, FOREIGN KEY → personal)
  - fecha (DATE)
  - hora_entrada (TIME)
  - hora_salida (TIME)
  - estado (TEXT) - 'presente', 'ausente', 'retardo'
  - notas (TEXT)
  - created_at (TIMESTAMP)

Índices:
  - id_personal
  - fecha
```

#### 11. **PROMOCIONES**
```
Tabla: promociones
Descripción: Ofertas y descuentos disponibles

Campos:
  - id (UUID, PRIMARY KEY)
  - nombre (TEXT)
  - descripcion (TEXT)
  - tipo (TEXT) - 'porcentaje', 'fijo', 'compre_lleve'
  - valor (DECIMAL)
  - fecha_inicio (DATE)
  - fecha_fin (DATE)
  - estado (TEXT) - 'activa', 'inactiva'
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - estado
  - fecha_inicio
  - fecha_fin
```

#### 12. **CLIENTES**
```
Tabla: clientes
Descripción: Información de clientes frecuentes

Campos:
  - id (UUID, PRIMARY KEY)
  - nombre (TEXT)
  - email (TEXT, UNIQUE)
  - telefono (TEXT)
  - direccion (TEXT)
  - numero_visitas (INTEGER)
  - saldo_credito (DECIMAL)
  - estado (TEXT) - 'activo', 'inactivo'
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Índices:
  - email (único)
  - telefono
```

---

## Configuración del Entorno

### Requisitos Previos

- **Node.js**: versión 16.x o superior
- **npm** o **yarn**: gestor de paquetes
- **Git**: para control de versiones
- **Cuenta Supabase**: para la base de datos en la nube

### Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://gqeuavjeeqvwyokxzbtn.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZXVhdmplZXF2d3lva3h6YnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDcwNDgsImV4cCI6MjA5NDcyMzA0OH0.7lVtGfGfxNQ9mW4oN7aa6TD6zhbNo9MQDqA4XOW7-HI

# Aplicación
VITE_APP_NAME=GastroSoft
VITE_APP_VERSION=1.0.0
```

### Dependencias Principales

```json
{
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "@supabase/supabase-js": "^2.106.0"
}
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor Vite (puerto 5173)

# Producción
npm run build        # Compilar para producción
npm run preview      # Vista previa de compilación

# Linting
npm run lint         # Verificar código con ESLint
```

---

## Endpoint API

### Introducción a Supabase API

GastroSoft utiliza **Supabase** como backend, que proporciona:
- REST API automática para todas las tablas
- Autenticación JWT
- Realtime Subscriptions
- Row Level Security (RLS)

### Formato Base de Requests

```
Método: GET, POST, PUT, DELETE
Base URL: https://gqeuavjeeqvwyokxzbtn.supabase.co/rest/v1
Headers:
  - Authorization: Bearer {JWT_TOKEN}
  - Content-Type: application/json
```

### Ejemplos de Endpoints Principales

#### 1. **Mesas**

```bash
# Obtener todas las mesas
GET /mesas?select=*&order=numero.asc

# Crear nueva mesa
POST /mesas
{
  "numero": 5,
  "cantidad_personas": 4,
  "estado": "disponible",
  "ubicacion": "Área 1"
}

# Actualizar mesa
PATCH /mesas?id=eq.{mesa_id}
{
  "estado": "ocupada"
}

# Eliminar mesa
DELETE /mesas?id=eq.{mesa_id}
```

#### 2. **Comandas**

```bash
# Obtener comandas activas
GET /comandas?estado=eq.activa&select=*,detalles_comanda(*)

# Crear nueva comanda
POST /comandas
{
  "id_mesa": "uuid-mesa",
  "numero_comanda": 101,
  "estado": "activa",
  "total": 0
}

# Actualizar comanda
PATCH /comandas?id=eq.{comanda_id}
{
  "estado": "pagada",
  "total": 150.00,
  "impuesto": 24.00
}
```

#### 3. **Inventario**

```bash
# Obtener inventario completo
GET /inventario?select=*,proveedores(nombre)&order=nombre.asc

# Registrar movimiento de inventario
POST /movimientos_inventario
{
  "id_ingrediente": "uuid-ingrediente",
  "tipo": "salida",
  "cantidad": 2.5,
  "motivo": "Uso en cocina | Retiro: Juan Pérez",
  "fecha": "2026-05-29T09:30:45.123Z"
}

# Actualizar stock
PATCH /inventario?id=eq.{ingrediente_id}
{
  "cantidad": 50.5,
  "estado": "normal"
}
```

#### 4. **Proveedores**

```bash
# Listar proveedores
GET /proveedores?select=*,compras_proveedor(*)&estado=eq.activo

# Crear proveedor
POST /proveedores
{
  "nombre": "GranosMX",
  "contacto": "Juan Rodríguez",
  "telefono": "+52 123 456 7890",
  "email": "contacto@granosmx.com",
  "estado": "activo"
}

# Registrar compra
POST /compras_proveedor
{
  "id_proveedor": "uuid-proveedor",
  "fecha": "2026-05-29T09:30:45.123Z",
  "total": 1500.00,
  "num_items": 5
}
```

#### 5. **Personal**

```bash
# Obtener personal activo
GET /personal?estado=eq.activo&order=nombre.asc

# Crear empleado
POST /personal
{
  "nombre": "Carlos García",
  "puesto": "Mesero",
  "email": "carlos@gastrosoft.com",
  "telefono": "+52 555 1234",
  "salario": 8000.00,
  "estado": "activo"
}

# Registrar asistencia
POST /asistencia_personal
{
  "id_personal": "uuid-personal",
  "fecha": "2026-05-29",
  "hora_entrada": "09:00:00",
  "hora_salida": "18:00:00",
  "estado": "presente"
}
```

### Autenticación

```javascript
// Login en Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Token se obtiene automáticamente y se incluye en headers
// Válido por 60 minutos (JWT)
```

---

## Guía de Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-repo/sistema-comandas.git
cd sistema-comandas
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Crear archivo `.env.local`:

```bash
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_KEY=tu_key_aqui
```

### Paso 4: Iniciar en Desarrollo

```bash
npm run dev
```

Acceder en: `http://localhost:5173`

### Paso 5: Configurar Base de Datos (Supabase)

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Ejecutar SQL para crear tablas (scripts en `/docs/sql/`)
4. Configurar autenticación
5. Copiar credenciales a `.env.local`

### Paso 6: Build para Producción

```bash
npm run build
npm run preview  # Verificar build
```

La carpeta `dist/` contiene los archivos listos para desplegar.

### Despliegue Recomendado

**Opciones:**
- **Vercel**: Despliegue automático desde Git
- **Netlify**: Integración continua
- **Heroku**: Con imagen Docker
- **Servidor propio**: Node.js + Nginx

---

## Estructura de Carpetas

```
sistema-comandas/
│
├── public/                          # Archivos estáticos
│   └── MenuImagenes/               # Imágenes de menú
│
├── src/
│   ├── App.jsx                     # Componente raíz
│   ├── App.css                     # Estilos globales
│   ├── index.css                   # Estilos base
│   ├── main.jsx                    # Punto de entrada
│   ├── supabase.js                 # Configuración Supabase
│   │
│   ├── assets/                     # Recursos multimedia
│   │   └── images/
│   │
│   ├── components/
│   │   ├── Dashboard.jsx           # Página principal
│   │   ├── Header.jsx              # Barra superior
│   │   ├── Sidebar.jsx             # Menú lateral
│   │   ├── LoginScreen.jsx         # Autenticación
│   │   ├── Icons.jsx               # Iconografía
│   │   │
│   │   └── modules/                # Módulos de negocio
│   │       ├── Comandas.jsx        # Gestión de órdenes
│   │       ├── Caja.jsx            # Control de caja
│   │       ├── Inventario.jsx      # Control de stock
│   │       ├── Pagos.jsx           # Procesamiento de pagos
│   │       ├── Mesas.jsx           # Gestión de mesas
│   │       ├── Personal.jsx        # Empleados
│   │       ├── PersonalAsistencia.jsx # Control de asistencia
│   │       ├── Clientes.jsx        # Base de clientes
│   │       ├── Proveedores.jsx     # Gestión de proveedores
│   │       ├── Promociones.jsx     # Ofertas y descuentos
│   │       ├── Reportes.jsx        # Análisis y estadísticas
│   │       ├── Menu.jsx            # Gestión de menú
│   │       ├── Configuracion.jsx   # Configuraciones
│   │       ├── NotificationContext.jsx # Sistema de notificaciones
│   │       └── DefaultModule.jsx   # Módulo por defecto
│   │
│   ├── hooks/
│   │   └── useSupabase.js          # Hooks personalizados
│   │       ├── useComandas()
│   │       ├── useInventario()
│   │       ├── useMesas()
│   │       ├── useProveedores()
│   │       ├── usePersonal()
│   │       └── Más...
│   │
│   ├── data/
│   │   ├── menuData.js             # Datos de menú
│   │   └── modulesData.js          # Configuración de módulos
│   │
│   └── styles/
│       ├── Asistencia.css
│       ├── Comandas.css
│       ├── Header.css
│       ├── Inventario.css
│       ├── LoginScreen.css
│       ├── Menu.css
│       ├── PersonalAsistencia.css
│       ├── Sidebar.css
│       ├── Pagos.css
│       └── styles.js               # Estilos compartidos
│
├── vite.config.js                  # Configuración Vite
├── eslint.config.js                # Configuración ESLint
├── package.json                    # Dependencias
├── package-lock.json               # Lock file
├── index.html                      # Template HTML
│
├── docs/
│   ├── sql/                        # Scripts de base de datos
│   ├── api/                        # Documentación API
│   └── MANUAL_TECNICO_GASTROSOFT.md # Este archivo
│
└── .env.local                      # Variables de entorno (NO versionar)
```

---

## Flujos de Proceso Principales

### 1. **Flujo de Comanda**

```
Mesero crea comanda
        ↓
Selecciona mesa y número
        ↓
Añade items del menú
        ↓
Comanda se guarda en BD
        ↓
Se actualiza estado de mesa a "ocupada"
        ↓
Cliente pide cuenta
        ↓
Sistema calcula: Subtotal + Impuesto + Servicios - Descuentos
        ↓
Comanda lista para pago
        ↓
Se procesa pago
        ↓
Se genera recibo (PDF)
        ↓
Comanda marcada como "pagada"
        ↓
Mesa se libera y vuelve a "disponible"
```

### 2. **Flujo de Compra a Proveedor**

```
Registrar compra en módulo Proveedores
        ↓
Seleccionar proveedor
        ↓
Agregar productos y cantidades
        ↓
Sistema calcula subtotal
        ↓
Registrar compra en BD
        ↓
Sistema calcula piezas totales:
(cantidad de cajas × piezas_por_caja)
        ↓
Actualizar inventario automáticamente
        ↓
Crear movimiento de entrada
        ↓
Notificación de compra exitosa
```

### 3. **Flujo de Inventario**

```
Guardar movimiento de salida
        ↓
Validar ingrediente y cantidad disponible
        ↓
Restar cantidad del inventario
        ↓
Registrar movimiento en BD con:
- Tipo: entrada/salida
- Cantidad
- Motivo
- Persona responsable
- Fecha/hora
        ↓
Verificar si stock está bajo
        ↓
Mostrar alerta si cantidad ≤ mínimo
        ↓
Listar todos los movimientos (últimos primero)
```

---

## Mantenimiento y Monitoreo

### Tareas Diarias
- Verificar estado de mesas
- Revisar inventario bajo
- Confirmar pagos procesados

### Tareas Semanales
- Generar reportes de ventas
- Revisar asistencia de personal
- Reconciliación de caja

### Tareas Mensuales
- Análisis de proveedores
- Evaluación de promociones
- Auditoría de inventario completo

---

## Soporte y Contacto

Para reportar problemas o solicitar funcionalidades:
- **Email**: soporte@gastrosoft.com
- **Teléfono**: +52 (123) 456-7890
- **Repositorio**: GitHub (Sistema-Comandas)

---

**Documento generado automáticamente - GastroSoft v1.0**
