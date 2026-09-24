# Club VIP Alintec Food · Pendientes de configuración

Flujo VIP de Alintec Food (auth → panel miembro → admin → verificar + webhook),
con paleta verde Alintec, contenido del sector alimentario y certificado estilo Bionova.

## Antes de que funcione en producción

### 1. Firebase (obligatorio)
Crear proyecto **club-alintec** (Auth con Email/Password + Google, Firestore, Storage)
y pegar la config web en los 4 archivos — buscar `PEGA_AQUI_APIKEY_ALINTEC` en:
- `vip-auth.html` · `vip-panel.html` · `vip-admin.html` · `verificar.html`

Publicar las reglas de Firestore de este repo (`firestore.rules`; colecciones:
`miembros`, `cursos`, `webinars`, `certificados`, `noticias_auto`, `notificaciones`,
`posts`, `comentarios`, `directorio`, `config`, `accesos`, `pagos`).

### 2. Stripe (obligatorio para cobros)
- Crear producto "Alintec Food VIP" (mensual y anual).
- Pegar la llave pública: buscar `pk_live_PEGA_AQUI_LLAVE_PUBLICA_STRIPE_ALINTEC`.
- En Railway configurar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.

### 3. Webhook en Railway (`alintec-webhook/`)
Variables de entorno:
`FIREBASE_SERVICE_ACCOUNT`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEWSDATA_API_KEY` (noticias del sector alimentario), `RESEND_API_KEY` (correo bienvenida),
`PANEL_URL=https://alitecfood.com`, `CRON_KEY` (obligatoria; sin ella `/cron/noticias` responde 401),
`CERTIFICATE_SIGNING_KEY` (obligatoria para firmar certificados). Ver `alintec-webhook/README.md`.
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
- **Herramientas pro**: Calculadora NOM-051, HACCP, BPM, Vida de anaquel y Microbiología UFC
  (solo para miembros VIP). El módulo dental heredado fue eliminado por completo.
- **Noticias automáticas**: 6 categorías (Industria Alimentaria, Inocuidad, Tecnología
  de Alimentos, Normativa/Etiquetado, Innovación, Nutrición) con rotación diaria.
- WhatsApp: 238 119 5336 · IG: @alintecfood · FB: profile.php?id=61592065820031.
- El `index.html` del sitio público NO fue tocado (aún no enlaza a `vip-auth.html`;
  agregar el botón "Acceso VIP" cuando se decida).
