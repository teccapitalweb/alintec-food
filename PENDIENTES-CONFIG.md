# Club VIP Alintec Food · Pendientes de configuración

Sistema replicado del flujo VIP de Odonteck (auth → panel miembro → admin → verificar + webhook),
con paleta verde Alintec, contenido del sector alimentario y certificado estilo Bionova.

## Antes de que funcione en producción

### 1. Firebase (obligatorio)
Crear proyecto **club-alintec** (Auth con Email/Password + Google, Firestore, Storage)
y pegar la config web en los 4 archivos — buscar `PEGA_AQUI_APIKEY_ALINTEC` en:
- `vip-auth.html` · `vip-panel.html` · `vip-admin.html` · `verificar.html`

Copiar las reglas de Firestore del proyecto club-odonteck (mismas colecciones:
`miembros`, `cursos`, `webinars`, `pdfs`, `certificados`, `noticias_auto`,
`notificaciones`, `posts`, `comentarios`, `directorio`, `config`).

### 2. Stripe (obligatorio para cobros)
- Crear producto "Alintec Food VIP" (mensual y anual).
- Pegar la llave pública: buscar `pk_live_PEGA_AQUI_LLAVE_PUBLICA_STRIPE_ALINTEC`.
- En Railway configurar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.

### 3. Webhook en Railway (`alintec-webhook/`)
Variables de entorno (igual que Odonteck):
`FIREBASE_SERVICE_ACCOUNT`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEWSDATA_API_KEY` (noticias del sector alimentario), `RESEND_API_KEY` (correo bienvenida),
`PANEL_URL=https://alitecfood.com`, `CRON_KEY` (default: alintec2026).
La URL esperada por el panel es `https://alintec-production.up.railway.app` —
si Railway asigna otra, buscar/reemplazar en los 4 HTML.

### 4. Dominio
Se usó `alitecfood.com` (tomado del CNAME del repo). Los QR de certificados apuntan a
`https://alitecfood.com/verificar.html`. Si el dominio final es otro, buscar/reemplazar.

### 5. Admins
`ADMINS` quedó con `teccapitalweb@gmail.com`. Agregar el correo del cliente Alintec
en `vip-admin.html` (const ADMINS) y en la variable `ADMIN_EMAILS` del webhook.

## Decisiones tomadas (avisar si se cambian)
- **Certificado**: diseño Bionova (marco, medalla, sello IPCI navy/dorado), firmas de
  IBQ. Monserrat Martínez Machado (Coordinadora General) y Coordinación de Certificación
  · IPCI Latinoamericano. Logo Alintec. Folios: `ALINTEC-AÑO-XXXXXX`.
- **Herramientas pro**: las dentales de Odonteck quedaron OCULTAS (comentadas en el
  sidebar y drawer de `vip-panel.html`); el código sigue ahí por si se reactiva alguna.
  Las herramientas para alimentos se definen en la siguiente fase.
- **Noticias automáticas**: 6 categorías (Industria Alimentaria, Inocuidad, Tecnología
  de Alimentos, Normativa/Etiquetado, Innovación, Nutrición) con rotación diaria.
- WhatsApp: 238 119 5336 · IG: @alintecfood · FB: profile.php?id=61592065820031.
- El `index.html` del sitio público NO fue tocado (aún no enlaza a `vip-auth.html`;
  agregar el botón "Acceso VIP" cuando se decida).
