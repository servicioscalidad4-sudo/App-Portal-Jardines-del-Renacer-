# Portal Jardines del Renacer – una sola entrada, varias aplicaciones

```
portal/
├─ index.html          Login único + Oficina + panel de Usuarios y accesos
├─ portal-guard.js     Guardia de sesión que usan todas las apps
├─ apps/cafeteria/     CRM Cafetería Regional Quindío (sin login propio)
├─ apps/ss-diarios/    Análisis de Ss diarios
└─ gas/Code.gs         Backend de usuarios (Google Apps Script + Google Sheets)
```

## Cómo funciona
1. El usuario entra **una sola vez** en `index.html`.
2. La Oficina muestra solo las apps que el administrador le asignó.
3. Las apps ya no piden clave: validan la sesión del portal (`portal-guard.js`). Si alguien abre una app sin sesión o sin permiso, lo devuelve al portal.
4. En **Usuarios y accesos** el administrador crea usuarios, los activa/inactiva y marca qué apps ve cada uno y con qué rol:
   - Cafetería: `ADMINISTRADOR`, `COORDINADOR`, `SEDE` (este último usa el campo *Sede*).
   - Ss Diarios: `EDITOR`, `LECTOR` (el lector no ve los botones de edición).

## Puesta en marcha
1. **Modo prueba (sin backend):** publica la carpeta (p. ej. GitHub Pages) y abre `index.html`. La primera vez pide crear el administrador. Los usuarios se guardan solo en ese navegador.
2. **Modo real (recomendado):** 
   - Crea una hoja de cálculo de Google, abre *Extensiones > Apps Script* y pega `gas/Code.gs`.
   - *Implementar > Nueva implementación > Aplicación web* (ejecutar como tú, acceso: cualquier persona).
   - Copia la URL `/exec` en `PORTAL_CONFIG.GAS_URL` dentro de `index.html`.
   - Abre el portal y crea el administrador. Las claves se guardan con hash y sal (nunca en texto plano).

## Agregar otra app
1. Copia su carpeta en `apps/<nombre>/`.
2. En su `<head>`: `<script src="../../portal-guard.js" data-app="<id>"></script>`
3. Agrega un objeto en `APPS` (index.html) con `id`, `nombre`, `url` y `roles`.

## Límites a tener en cuenta
- El control de acceso es a nivel de interfaz. Las apps siguen consultando sus propios Apps Script (URLs públicas); para blindarlos, cada Code.gs debe exigir el token del portal.
- Se retiraron de Cafetería el login, el registro y el módulo *Usuarios* (ahora se administra en el portal). Las cuentas `admin/admin123` y `coordinador/coord123` quedaron sin uso: no las uses.
