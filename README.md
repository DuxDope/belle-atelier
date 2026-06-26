# Belle·Atelier — Catálogo de Maquillaje

Catálogo web completo con base de datos real (Neon PostgreSQL), imágenes en la nube (Cloudinary) y deploy en Vercel. **100% gratuito.**

---

## Estructura del proyecto

```
belle-atelier/
├── api/
│   ├── products.js        ← GET listar / POST crear productos
│   ├── products/
│   │   └── [id].js        ← DELETE eliminar producto
│   └── upload-sign.js     ← Firma para subir imágenes a Cloudinary
├── css/
│   └── style.css
├── js/
│   └── app.js
├── index.html
├── package.json
├── vercel.json
└── README.md
```

---

## Paso 1 — Crear base de datos en Neon (gratis)

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta gratuita
2. Crea un nuevo proyecto → dale un nombre (ej: `belle-atelier`)
3. En el dashboard de tu proyecto, ve a **Connection Details**
4. Copia la **Connection string** que tiene esta forma:
   ```
   postgresql://usuario:contraseña@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Guárdala, la necesitarás en el Paso 3

> La tabla `products` se crea automáticamente la primera vez que la API recibe una petición.

---

## Paso 2 — Crear cuenta en Cloudinary (gratis)

1. Ve a [cloudinary.com](https://cloudinary.com) y crea una cuenta gratuita
2. En el dashboard ve a **Settings → API Keys**
3. Anota estos tres valores:
   - **Cloud Name** (ej: `dxyz123abc`)
   - **API Key** (ej: `123456789012345`)
   - **API Secret** (ej: `AbCdEfGhIjKlMnOpQrStUvWxYz`)

---

## Paso 3 — Subir a GitHub

```bash
# Desde la carpeta belle-atelier en tu terminal
git init
git add .
git commit -m "Belle Atelier - catálogo de maquillaje"

# Crea un repositorio en github.com, luego:
git remote add origin https://github.com/TU_USUARIO/belle-atelier.git
git branch -M main
git push -u origin main
```

---

## Paso 4 — Deploy en Vercel + Variables de entorno

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa tu repositorio de GitHub
3. Antes de hacer deploy, ve a **Environment Variables** y agrega:

| Nombre                    | Valor                                      |
|---------------------------|--------------------------------------------|
| `DATABASE_URL`            | Tu connection string de Neon               |
| `CLOUDINARY_CLOUD_NAME`   | Tu cloud name de Cloudinary                |
| `CLOUDINARY_API_KEY`      | Tu API key de Cloudinary                   |
| `CLOUDINARY_API_SECRET`   | Tu API secret de Cloudinary                |

4. Haz clic en **Deploy** — listo ✓

---

## Probar en local (VS Code)

Para probar localmente necesitas instalar Vercel CLI:

```bash
npm install -g vercel
```

Crea un archivo `.env` en la raíz del proyecto con tus variables:

```env
DATABASE_URL=postgresql://usuario:contraseña@host/neondb?sslmode=require
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

Luego instala dependencias y corre localmente:

```bash
npm install
vercel dev
```

Se abrirá en `http://localhost:3000`

> **Importante:** Agrega `.env` a tu `.gitignore` para no subir tus credenciales a GitHub.

---

## Cómo usar el sitio

### Ver el catálogo
Simplemente abre la página. Los productos se cargan desde la base de datos.

### Agregar un producto
1. Haz clic en **+ Agregar producto** (nav superior)
2. Completa los campos requeridos (*)
3. Sube una foto (arrastra o haz clic en el área de carga)
4. Haz clic en **Publicar en catálogo**

El producto queda guardado en la base de datos y lo verán todos los visitantes.

### Eliminar un producto
Abre el panel admin → lista de productos → botón **Eliminar**.

---

## Personalizar

### Cambiar nombre de la marca
En `index.html` busca `Belle·Atelier` y reemplázalo por tu nombre de marca.

### Cambiar colores
En `css/style.css` edita las variables en `:root`:
```css
--rose-dark: #C4869A;   /* Color principal */
--gold:      #B89A6A;   /* Color dorado    */
```

### Cambiar el slogan del hero
En `index.html` edita:
```html
<h1>Tu belleza,<br><em>curada con amor</em></h1>
<p>Descubre nuestra selección...</p>
```

---

## Servicios gratuitos usados

| Servicio    | Para qué                        | Límite gratis                     |
|-------------|---------------------------------|-----------------------------------|
| **Vercel**  | Hosting + backend (Functions)   | 100GB bandwidth / mes             |
| **Neon**    | Base de datos PostgreSQL        | 0.5 GB almacenamiento             |
| **Cloudinary** | Almacenamiento de imágenes   | 25 créditos/mes (~1000 imágenes)  |

Todo suficiente para un catálogo de maquillaje real.
