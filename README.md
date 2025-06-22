# Turnate - Sistema de Agendamiento de Citas

Turnate es una plataforma moderna y completa para que profesionales independientes (barberos, médicos, terapistas, etc.) gestionen sus citas de manera eficiente. Construida con Next.js, TypeScript, TailwindCSS y Supabase.

## 🚀 Características Principales

### Para Profesionales

- **Dashboard completo** con estadísticas y métricas avanzadas
- **Gestión de servicios** con precios y duraciones personalizables
- **Configuración de disponibilidad semanal** con horarios flexibles
- **Gestión de citas** con filtros, búsqueda y cancelaciones
- **Perfil público personalizable** con galería de imágenes
- **Sistema de reseñas** y calificaciones
- **Analíticas avanzadas** con tendencias y métricas de negocio
- **Notificaciones por email** automáticas
- **Configuraciones de seguridad** y gestión de datos

### Para Clientes

- **Páginas públicas** de profesionales con información completa
- **Sistema de agendamiento** sin necesidad de registro
- **Selección intuitiva** de servicios, fechas y horarios
- **Confirmación por email** con detalles de la cita
- **Sistema de reseñas** post-cita para feedback

### Características Técnicas

- **Autenticación segura** con Supabase Auth
- **Base de datos PostgreSQL** con Supabase
- **Almacenamiento de archivos** con Supabase Storage
- **Envío de emails** con Resend
- **Diseño responsivo** optimizado para móviles
- **Componentes reutilizables** con sistema de diseño consistente
- **Tipado completo** con TypeScript
- **Optimización de rendimiento** con Next.js 15

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS, componentes UI personalizados
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: React Icons
- **Deployment**: Vercel (recomendado)

## 📋 Prerequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd appointment-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.local
```

Completa las variables en `.env.local`: