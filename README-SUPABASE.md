# Supabase — configuración del proyecto

La app ya está integrada con Supabase, pero funciona en **modo demostración** hasta que pegues tus credenciales. No necesitas instalar nada por consola.

## 1. Crear el proyecto

1. Entra a https://supabase.com y crea un proyecto (plan Free).
2. Espera a que termine de aprovisionarse (1–2 min).

## 2. Ejecutar el esquema SQL

1. En el menú lateral: **SQL Editor** → **New query**.
2. Abre `supabase-schema.sql`, copia TODO su contenido y pégalo.
3. Clic en **Run**. Debe terminar sin errores.

Eso crea las tablas:

| Tabla | Para qué sirve |
|---|---|
| `perfiles` | Datos del usuario (se crea automáticamente al registrarse) |
| `contactos` | Los mensajes del formulario de contacto |
| `videojuegos` | Catálogo de juegos |
| `artistas` / `canciones` | Artistas y su Top 10 |
| `auditorias` | Resultados de las auditorías semántica, smoke test y contraste |
| `preferencias` | Tema y alto contraste por usuario |

El SQL ya incluye los **6 juegos, 15 artistas y 150 canciones** actuales como datos semilla.

## 3. Habilitar login con correo

1. **Authentication** → **Providers** → **Email**.
2. Asegúrate de que esté **habilitado**.
3. Si quieres evitar la confirmación por correo para probar rápido:
   **Authentication → Providers → Email → desactiva "Confirm email"** y guarda.
   (Recomendado dejarla activa en producción.)

## 4. Pegar las credenciales

1. **Project Settings** → **API**.
2. Copia **Project URL** y **anon / public key**.
3. Abre `supabase-config.js` y rellena:

```js
window.SUPABASE_CONFIG = {
  url: 'https://abcdefgh.supabase.co',
  anonKey: 'eyJhbGciOi...',
  habilitado: true
};
```

> ⚠️ Nunca pongas la **service_role key** en el frontend. La anon key es pública y está protegida por las políticas RLS del esquema.

## 5. Probar

Recarga la página. Verás el botón de **login** en la barra superior.

- Regístrate con **Crear cuenta** (mínimo 6 caracteres de contraseña).
- Inicia sesión: el formulario de contacto se rellena con tu correo y los mensajes se guardan en `contactos`.
- Cambia el tema o el alto contraste: se guarda en `preferencias`.
- Ejecuta la auditoría semántica o el smoke test: se registra en `auditorias`.
- El catálogo se carga desde Supabase; si hay error, se mantiene el catálogo local (no se rompe nada).

## 6. Ver los datos

**Table Editor** → selecciona la tabla. Para ver mensajes: `contactos`. Para ver auditorías: `auditorias`.

## Notas de seguridad (RLS)

- `contactos`: cualquiera puede **insertar**, solo usuarios autenticados pueden **leer**.
- `videojuegos`, `artistas`, `canciones`: **lectura pública**; escritura solo con `service_role` (desde SQL Editor).
- `perfiles` y `preferencias`: cada usuario solo ve/edita lo suyo.
- `auditorias`: cualquiera puede registrar; cada usuario ve solo las suyas.

## Archivos nuevos

- `supabase-schema.sql` — esquema + datos semilla + políticas RLS.
- `supabase-config.js` — **único archivo que debes editar** con tus llaves.
- `supabase-client.js` — capa de acceso a datos (auth, contactos, catálogo, auditorías, preferencias).
- `README-SUPABASE.md` — esta guía.
