# Análisis y Diseño de Gestión

## Sistema de Gestión de Comandas para Restaurante

**GastroSoft**

---

## Portada

**Aplicación Web para la Gestión de Comandas de Restaurante**

**Análisis y Diseño de Gestión**

**Nombre:** Hector Paul Vizcarra Astorga

**Grupo:** D-308

---

## 1. Requerimientos

### Recurso Humano
- **Hector Paul Vizcarra Astorga** - Desarrollador y arquitecto del proyecto

### Hardware
- **Laptop (Desarrollo):** PC con mínimo 8GB RAM, procesador moderno
- **Servidor Web:** Hosting para despliegue de la aplicación (AWS, Vercel, Netlify, etc.)
- **Dispositivos de Prueba:** Navegadores en desktop (Chrome, Firefox, Safari, Edge)
- **Tablets/Dispositivos Móviles:** Para pruebas responsivas

### Software
- **Frontend:** React 19.2.5 + Vite 8.0.9
- **Editor de Código:** Visual Studio Code
- **Versiones:** GitHub (repositorio de código fuente)
- **Herramientas de Desarrollo:** Node.js, npm

### Redes
- **Conexión a Internet:** Para despliegue y acceso a la aplicación desde múltiples dispositivos
- **Hosting Web:** Servidor de producción accesible via HTTP/HTTPS
- **Comunicación:** Protocolo HTTPS para seguridad de datos

### Datos
- **Base de Datos:** Datos de comandas, mesas, productos, clientes
- **Información del Restaurante:** Menú, precios, descripción de platillos
- **Información de Transacciones:** Órdenes, pagos, historial de ventas
- **Información de Usuarios:** Datos de clientes, direcciones, teléfonos

---

## 2. Análisis

### Recolectar Datos
- Levantamiento de requisitos del negocio con personal del restaurante
- Identificación de procesos actuales de toma de comandas
- Análisis de necesidades de reportes y estadísticas
- Definición de estructura de mesas del restaurante

### Capturar Datos
- Ingreso manual de información de productos (menú, precios, categorías)
- Ingreso de configuración de mesas y áreas del restaurante
- Captura de información de clientes y órdenes
- Registro de transacciones y pagos

### Almacenar Datos
- **Estado Actual:** Almacenamiento en memoria/localStorage del navegador
- **Mejora Futura:** Base de datos relacional (MySQL, PostgreSQL, Firebase)
- Estructura de datos para: Comandas, Mesas, Productos, Clientes, Pagos

### Procesar Datos
- Frontend (React) procesa y valida datos de entrada
- Cálculo de totales y subtotales por comanda
- Gestión de estado con React hooks (useState, useContext)
- Lógica de filtrado y búsqueda de comandas y productos

### Difusión de los Datos
- Interfaz web accesible desde navegadores modernos
- Visualización en tiempo real de comandas activas
- Pantallas para diferentes módulos: Comandas, Menú, Mesas, Reportes, Pagos
- Exportación de reportes (PDF/Excel) para análisis

---

## 3. Diseño

### Investigación Preliminar

**Problema Identificado:**
- Falta de herramienta digital para gestión eficiente de comandas en restaurantes
- Pérdida de pedidos por comunicación deficiente entre meseros y cocina
- Dificultad en el seguimiento de pagos y control de inventario
- Ausencia de reportes de ventas en tiempo real

**Solución Propuesta:**
- Aplicación web intuitiva para captura y seguimiento de comandas
- Asignación clara de mesas y estado de órdenes
- Módulo de pagos integrado
- Reportes de ventas y desempeño

### Investigación de Requisitos

#### Requerimientos Funcionales

1. **Gestión de Comandas:**
   - Crear nuevas comandas asignadas a mesas
   - Visualizar comandas en diferentes estados (Pendiente, En Progreso, Servido)
   - Agregar/eliminar productos a una comanda
   - Modificar cantidad de productos
   - Cambiar estado de comanda

2. **Gestión de Mesas:**
   - Visualizar estado de todas las mesas (Disponible, Ocupada, Reservada)
   - Asignar mesas a clientes
   - Liberar mesas cuando termine la comanda

3. **Gestión de Menú:**
   - Catálogo de productos disponibles
   - Categorización de productos (Bebidas, Entradas, Platos principales, Postres)
   - Búsqueda y filtrado de productos
   - Precios y disponibilidad

4. **Gestión de Pedidos:**
   - Resumen de pedidos pendientes
   - Historial de pedidos completados
   - Detalles de cada pedido

5. **Gestión de Pagos:**
   - Cálculo automático de totales
   - Método de pago (Efectivo, Tarjeta, Transferencia)
   - Generación de recibos
   - Descuentos y promociones

6. **Reportes:**
   - Ventas diarias/semanales/mensuales
   - Productos más vendidos
   - Ingresos por categoría
   - Tiempo promedio de atención

#### Requerimientos No Funcionales

1. **Interfaz de Usuario:**
   - Diseño intuitivo y fácil de usar
   - Accesible para usuarios sin experiencia técnica
   - Responsive (funciona en desktop y tablets)
   - Carga rápida de páginas

2. **Rendimiento:**
   - Respuesta inmediata en acciones del usuario
   - Transiciones suaves entre vistas
   - Manejo eficiente de datos

3. **Seguridad:**
   - Validación de datos de entrada
   - Almacenamiento seguro de información
   - Protección de datos sensibles (pagos, clientes)

4. **Escalabilidad:**
   - Estructura modular y reutilizable
   - Fácil de extender con nuevas funcionalidades
   - Preparado para migrar a backend en el futuro

### Diseño de la Gestión

**Arquitectura Frontend:**
- Componentes React reutilizables
- Gestión de estado con hooks (useState, useContext)
- Separación de componentes: Sidebar, Módulos, Contenido
- Estilos CSS con componentes inline

**Estructura de Módulos:**
- `App.jsx` - Componente principal
- `components/` - Componentes reutilizables
- `pages/` o `modules/` - Componentes específicos de cada módulo
- `styles/` - Archivos CSS/estilos

**Flujo de Datos:**
1. Usuario selecciona módulo en sidebar
2. Se renderiza el componente correspondiente
3. Usuario interactúa con los datos
4. React actualiza el estado y la vista
5. Datos persisten en localStorage

---

## 4. Implementación

### Desarrollo de Gestión

**Frontend Implementation:**
- Implementación de todos los módulos (Comandas, Menú, Mesas, Pedidos, Clientes, Reportes, Pagos, Configuración)
- Componentes React con JSX
- Manejo de estado con useState y useContext
- Validación de formularios
- Estilos CSS con diseño moderno

**Stack Tecnológico:**
- React 19.2.5 para UI interactiva
- Vite para bundling y dev server
- JavaScript ES6+ para lógica de negocio
- localStorage para persistencia de datos

### Pruebas

**Validación de Funcionalidades:**
- Crear/editar/eliminar comandas
- Cambiar estado de mesas y comandas
- Seleccionar productos y calcular totales
- Procesar pagos
- Generar reportes

**Pruebas de Interfaz:**
- Navegación entre módulos
- Responsividad en diferentes resoluciones
- Validación de formularios
- Mensajes de error y confirmación

**Pruebas de Rendimiento:**
- Carga rápida de la aplicación
- Transiciones suaves
- Manejo de múltiples comandas simultáneas

### Puesta en Marcha

**Despliegue:**
- Compilación del proyecto con `npm run build`
- Subir archivos a servidor web (Vercel, Netlify, AWS S3 + CloudFront)
- Configurar dominio y HTTPS
- Realizar pruebas en ambiente de producción

**Capacitación:**
- Documentación de usuario
- Capacitación del personal del restaurante
- Soporte inicial durante la implementación

---

## 5. Implementación - Detalles Técnicos

### Procesos Esperados de la Gestión

1. **Mostrar todas las comandas del día**
   - Listado dinámico de comandas con filtros
   - Estados visuales claros

2. **Asignar productos a una comanda**
   - Interfaz de selección de productos
   - Gestión de cantidad
   - Cálculo automático de totales

3. **Consultar estado de mesas**
   - Vista gráfica del estado de mesas
   - Información detallada por mesa

4. **Registrar pagos**
   - Captura de forma de pago
   - Cálculo de cambio
   - Generación de recibo

5. **Generar reportes**
   - Consolidación de datos de ventas
   - Estadísticas por período
   - Exportación de datos

### Posibles Fallas de la Gestión

| Falla | Descripción | Impacto |
|-------|-------------|--------|
| **Pérdida de datos** | Datos perdidos al cerrar navegador | Alto |
| **Inconsistencia de estado** | Discrepancias entre mesas y comandas | Alto |
| **Lentitud en carga** | Aplicación tarda mucho en cargar | Medio |
| **Errores de cálculo** | Totales incorrectos en comandas | Alto |
| **Incompatibilidad navegadores** | Funcionamiento deficiente en algunos navegadores | Medio |
| **Interfaz confusa** | Usuarios desconocen cómo usar ciertos módulos | Bajo |

### Puesta en Marcha - Soluciones

| Solución | Descripción | Prioridad |
|----------|-------------|-----------|
| **Backend + Base de datos** | Implementar backend con Node.js/Express + MySQL | Alta |
| **Sincronización de datos** | Sistema de sincronización en tiempo real | Alta |
| **Optimización de código** | Code splitting, lazy loading, memoización | Media |
| **Validación robusta** | Validaciones en cliente y servidor | Alta |
| **Testing automatizado** | Unit tests y integration tests | Media |
| **PWA (Progressive Web App)** | Funciona offline y es instalable | Baja |
| **Documentación mejorada** | Guías de usuario y manuales | Media |

---

## 6. Verificación

### Medir

**Métricas a Evaluar:**
- Número de comandas procesadas correctamente
- Tiempo de respuesta de la aplicación
- Precisión en cálculos de totales y pagos
- Cobertura de funcionalidades implementadas

### Comparar

**Comparación contra Requerimientos:**
- ¿Se cumplen todos los requerimientos funcionales?
- ¿Cumple con los requerimientos de rendimiento?
- ¿La interfaz es intuitiva como se especificó?
- ¿Es escalable y mantenible?

### Identificar

**Identificación de Errores:**
- Bugs en creación/edición de comandas
- Errores en cálculos de totales
- Inconsistencias en estados de mesas
- Problemas de responsividad
- Lentitud en ciertas operaciones

### Corregir

**Ajustes Implementados:**
- Revisión y corrección de lógica de negocio
- Optimización de componentes React
- Mejora de algoritmos de cálculo
- Fixes de CSS para compatibilidad
- Mejora de accesibilidad

### Validar

**Validación Final:**
- Pruebas de aceptación con usuario final
- Confirmación que todas las funcionalidades funcionan
- Verificación de datos correctos antes del despliegue
- Revisión de documentación

---

## 7. Mantenimiento

### Transferencia de Responsabilidad

- **Documentación Completa:** Código comentado, README.md detallado
- **Entrega a Equipo:** Capacitación al equipo de soporte
- **Repositorio GitHub:** Acceso y permisos configurados
- **Ambiente de Producción:** Configuración documented

### Mantenimiento Preventivo

- **Monitoreo Regular:**
  - Revisión de logs de errores
  - Verificación de disponibilidad de la aplicación
  - Revisión de actualizaciones de librerías (React, Vite)
  - Chequeo de seguridad de dependencias

- **Actualización de Datos:**
  - Actualización del menú (precios, productos)
  - Revisión de información de mesas
  - Validez de configuraciones

### Gestión de Incidentes

- **Reporte de Errores:**
  - Tracking de bugs en GitHub Issues
  - Priorización de incidentes
  - SLA de resolución

- **Tipos de Incidentes:**
  - Datos perdidos o inconsistentes
  - Errores en cálculos
  - Fallas de interfaz
  - Errores de autenticación
  - Problemas de rendimiento

### Gestión de Evolución (Adaptativo/Perfectivo)

- **Nuevas Funcionalidades:**
  - Sistema de reservas
  - Integración con proveedores
  - App móvil nativa
  - Notificaciones en tiempo real
  - Integración de pagos online

- **Mejoras:**
  - Mejor UI/UX basado en feedback de usuarios
  - Reportes más avanzados
  - Automatizaciones de procesos
  - Integración con sistemas de terceros

### Monitoreo del Desempeño

**Indicadores Clave (KPIs):**
- Tiempo de carga de la aplicación
- Número de comandas por día
- Tiempo promedio de procesamiento
- Disponibilidad del servicio (uptime)
- Errores reportados vs resueltos
- Satisfacción del usuario
- Velocidad de transacciones
- Número de usuarios activos

**Herramientas de Monitoreo:**
- Google Analytics para uso de aplicación
- Sentry o LogRocket para tracking de errores
- Lighthouse para auditoría de rendimiento
- Monitoreo de servidor (uptime monitoring)

---

## Roadmap de Desarrollo

### Fase 1: MVP (Minimum Viable Product)
- [ ] Módulo de Comandas
- [ ] Módulo de Mesas
- [ ] Módulo de Pagos
- [ ] Almacenamiento básico en localStorage

### Fase 2: Ampliación
- [ ] Módulo de Menú completo
- [ ] Módulo de Reportes
- [ ] Módulo de Clientes
- [ ] Integración con backend

### Fase 3: Optimización
- [ ] Testing y QA
- [ ] Optimización de rendimiento
- [ ] Mejora de UI/UX
- [ ] Documentación completa

### Fase 4: Escalabilidad
- [ ] Backend con base de datos
- [ ] Sincronización en tiempo real
- [ ] App móvil
- [ ] Integraciones externas

---

## Conclusión

**GastroSoft** es una solución integral para la gestión de comandas de restaurante. Con una arquitectura bien definida, funcionalidades claras y un plan de mantenimiento sólido, la aplicación está posicionada para mejorar significativamente la eficiencia operativa del restaurante.

El proyecto seguirá iterando con base en el feedback de usuarios y las necesidades del negocio, asegurando su relevancia y utilidad a largo plazo.

---

**Documento Elaborado:** Hector Paul Vizcarra Astorga  
**Grupo:** D-308  
**Fecha:** Abril 2026  
**Versión:** 1.0