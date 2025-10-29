# AppWisp - Sistema de Gestión para WISP

Sistema web completo para la administración de clientes, pagos, planes y cortes de servicio de un proveedor de internet inalámbrico (WISP).

## 🚀 Tecnologías

- **Next.js 15.2.4** - Framework React
- **Supabase** - Base de datos y autenticación
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS** - Estilos
- **Shadcn/ui** - Componentes UI
- **Recharts** - Gráficas y visualizaciones
- **Google Maps API** - Mapas e integración geográfica

## 📋 Requisitos Previos

- Node.js 18.x o superior
- npm, yarn o pnpm
- Cuenta de Supabase
- Google Maps API Key (opcional, para funcionalidad de mapas)

## 🔧 Configuración Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/olara1989/wisp-platform.git
cd AppWisp
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` y renómbralo a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` y completa las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-api-key

# URL base
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Cómo obtener las claves de Supabase:**
1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Settings → API
3. Copia la `URL` y las keys `anon` y `service_role`

### 4. Ejecutar el proyecto en desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Ejecuta la aplicación en modo producción
- `npm run lint` - Ejecuta el linter

## 🌐 Despliegue en Vercel

### Opción 1: Despliegue Automático desde GitHub

1. **Conecta tu repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js

2. **Configura las variables de entorno:**
   En la configuración del proyecto en Vercel, agrega las siguientes variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (opcional)
   - `NEXT_PUBLIC_BASE_URL` (será la URL de Vercel, ej: `https://tu-app.vercel.app`)

3. **Despliega:**
   - Vercel desplegará automáticamente
   - Cada push a la rama principal desplegará una nueva versión

### Opción 2: Despliegue Manual con Vercel CLI

1. **Instala Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión:**
   ```bash
   vercel login
   ```

3. **Despliega:**
   ```bash
   vercel
   ```

4. **Para producción:**
   ```bash
   vercel --prod
   ```

### Configuración Específica de Vercel

Vercel detecta automáticamente Next.js y no requiere configuración adicional. Sin embargo, si necesitas un `vercel.json`, puedes crear uno:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## 🔐 Seguridad

- ⚠️ **NUNCA** subas el archivo `.env.local` o cualquier archivo `.env` al repositorio
- La `SUPABASE_SERVICE_ROLE_KEY` tiene permisos elevados, mantenla segura
- En Vercel, las variables de entorno están encriptadas y seguras

## 📱 Funcionalidades Principales

- ✅ Dashboard con métricas y gráficas
- ✅ Gestión completa de clientes (CRUD)
- ✅ Registro y seguimiento de pagos
- ✅ Gestión de cortes y morosidad
- ✅ Administración de planes de servicio
- ✅ Integración con Mikrotik (simulada)
- ✅ Sistema de autenticación por roles
- ✅ Mapas interactivos con Google Maps

## 🛠️ Estructura del Proyecto

```
AppWisp/
├── app/              # Rutas y páginas de Next.js
├── components/       # Componentes React reutilizables
├── lib/             # Utilidades y configuración
├── public/          # Archivos estáticos
└── styles/          # Estilos globales
```

## 📝 Notas

- El proyecto usa Supabase como base de datos y servicio de autenticación
- La integración con Mikrotik está actualmente simulada
- Asegúrate de tener las tablas necesarias creadas en Supabase

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📄 Licencia

Este proyecto es privado.

