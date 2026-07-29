// ════════════════════════════════════════════════════════════════
//  Alintec Food · Webhook (noticias + membership + Stripe con precio dinámico)
//  MIGRADO al patrón de SYNOVA: el precio de la membresía es editable
//  desde vip-admin.html (colección Firestore config/club) y se refleja
//  en el COBRO REAL, no solo en la pantalla — usamos price_data dinámico
//  de Stripe en vez de un Price ID fijo.
//    POST /stripe/checkout    → crea sesión Embedded Checkout (precio en vivo desde Firestore)
//    POST /stripe/webhook     → recibe eventos Stripe y activa membresía
//    GET  /stripe/session/:id → consulta estado de una sesión (éxito)
//    GET  /membership/:uid    → paywall del panel (lee Firestore)
//    Cron de noticias del sector alimentario (NewsData → noticias_auto, 15 días)
//
//  Variables en Railway → Settings → Variables:
//    - FIREBASE_SERVICE_ACCOUNT  (JSON cuenta de servicio club-alintec)
//    - STRIPE_SECRET_KEY         (sk_live_… · la SECRETA, no la pública)
//    - STRIPE_WEBHOOK_SECRET     (whsec_… · del endpoint que crees en Stripe)
//    - PANEL_URL                 (opcional · https://alitecfood.com)
//    - NEWSDATA_API_KEY          (key pub_… de NewsData.io)
//    - CRON_KEY                  (opcional, default 'alintec2026')
//    - CURRENCY                  (opcional, default 'mxn')
//    - RESEND_API_KEY            (re_… de resend.com · correo de bienvenida al activarse)
//    - MAIL_FROM                 (opcional · remitente, ej. "Alintec Food <hola@alitecfood.com>")
//    - ADMIN_EMAILS              (opcional · lista de administradores separada por comas)
//  ⚠️ STRIPE_PRICE_MENSUAL y STRIPE_PRICE_ANUAL YA NO SE USAN — puedes
//     borrarlas de Railway. El precio vive en Firestore → config/club.
// ════════════════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const admin   = require('firebase-admin');
const cron    = require('node-cron');
const Stripe  = require('stripe');
const { syncNoticias } = require('./services/noticias');

const app = express();

// ══ FIREBASE ADMIN ═══════════════════════════════════════════
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FATAL: Falta FIREBASE_SERVICE_ACCOUNT en variables de entorno');
  process.exit(1);
}
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  console.error('❌ FATAL: FIREBASE_SERVICE_ACCOUNT no es JSON válido');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;

// ══ STRIPE ═══════════════════════════════════════════════════
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const CURRENCY = (process.env.CURRENCY || 'mxn').toLowerCase();
const PANEL_URL     = process.env.PANEL_URL || 'https://alitecfood.com';
const WH_SECRET     = process.env.STRIPE_WEBHOOK_SECRET;
// Marca de proyecto: esta cuenta de Stripe es compartida por varios clubes.
// Solo procesamos lo que lleve este source para no cruzarnos con IMDIIL/FisioTeck.
const SOURCE = 'alintec-panel';
const esLive = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_')
  || (process.env.STRIPE_SECRET_KEY || '').startsWith('rk_live_');
console.log('✅ Stripe inicializado · modo:', esLive ? 'LIVE' : 'TEST/none');

// ══ CORREO (Resend) ══════════════════════════════════════════
// Mismo patrón que IMDIIL: correo transaccional vía Resend (solo fetch, sin SDK).
// El correo NO truena el webhook si falla: loguea y sigue.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'Alintec Food <onboarding@resend.dev>';

// ══ CORS ═════════════════════════════════════════════════════
app.use(cors({ origin: true }));

// ⚠️ /stripe/webhook va ANTES de express.json(): necesita el body crudo
//    (raw) para poder verificar la firma de Stripe.
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], WH_SECRET);
  } catch (err) {
    console.error('⚠️  Firma de webhook inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    await procesarEvento(event);
    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error procesando webhook:', err.message);
    res.status(500).send('Error interno');
  }
});

// El resto de endpoints sí usan JSON normal
app.use(express.json());

// ══ HEALTH CHECK ═════════════════════════════════════════════
app.get('/', (req, res) => res.json({
  status: 'Alintec Food Webhook Online ✅',
  timestamp: new Date().toISOString()
}));

// ══ Helper: leer el precio VIGENTE desde Firestore (editable en vip-admin.html) ══
// Punto central de la migración al patrón SYNOVA: cambiar el precio en el
// admin cambia lo que de verdad se cobra, no solo lo que se muestra.
async function leerPreciosConfig() {
  const snap = await db.collection('config').doc('club').get();
  const c = snap.exists ? snap.data() : {};
  const precioMes = Number(c.precioMes) > 0 ? Number(c.precioMes) : 199;
  const precioAno = Number(c.precioAno) > 0 ? Number(c.precioAno) : 1899;
  return { precioMes, precioAno };
}

// ══ MEMBRESÍA · paywall del panel (igual que IMDIIL) ═════════
// GET /membership/:uid → { activa, activo, plan, estado, proximaRenovacion }
app.get('/membership/:uid', async (req, res) => {
  try {
    const doc = await db.collection('miembros').doc(req.params.uid).get();
    if (!doc.exists) {
      return res.json({ activa: false, activo: false, motivo: 'sin-membresia' });
    }
    const d = doc.data();
    const activaFlag = d.activa === true || d.activo === true;
    const exp = d.expiraEn || d.fechaFinAcceso || d.fechaProximaRenovacion;
    const expDate = exp ? (exp.toDate ? exp.toDate() : new Date(exp)) : null;
    const vigente = activaFlag && (!expDate || expDate.getTime() > Date.now());

    res.json({
      activa: vigente,
      activo: vigente,                                  // alias por compat con el panel
      plan: d.plan || (d.esRegalo ? 'regalo' : null),
      estado: d.estado || (vigente ? 'activa' : 'inactiva'),
      proximaRenovacion: (d.fechaProximaRenovacion && d.fechaProximaRenovacion.toDate)
        ? d.fechaProximaRenovacion.toDate().toISOString()
        : (expDate ? expDate.toISOString() : null)
    });
  } catch (err) {
    console.error('❌ /membership error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══ STRIPE · crear sesión de Embedded Checkout con PRECIO DINÁMICO ══
// POST /stripe/checkout  body: { plan:'mensual'|'anual', uid, email }
// En vez de un Price ID fijo, arma el precio en el momento leyendo
// config/club — así cambiar el precio en el admin cambia el cobro real
// desde la siguiente suscripción, sin tocar Stripe manualmente.
// allow_promotion_codes:true  → Stripe muestra el campo del CUPÓN solito.
app.post('/stripe/checkout', async (req, res) => {
  try {
    const { plan, uid, email } = req.body;
    if (!['mensual', 'anual'].includes(plan)) {
      throw new Error('Plan inválido (debe ser mensual o anual)');
    }
    const { precioMes, precioAno } = await leerPreciosConfig();
    const montoMXN = plan === 'mensual' ? precioMes : precioAno;
    const interval = plan === 'mensual' ? 'month' : 'year';

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: CURRENCY,
          unit_amount: Math.round(montoMXN * 100),
          recurring: { interval },
          product_data: {
            name: `Alintec Food VIP · Plan ${plan === 'mensual' ? 'Mensual' : 'Anual'}`,
            metadata: { plan, source: SOURCE }
          }
        },
        quantity: 1
      }],
      allow_promotion_codes: true,                       // ← campo del cupón
      client_reference_id: uid || undefined,
      customer_email: email || undefined,
      metadata: { plan, uid: uid || '', source: SOURCE, precioAlCobrar: String(montoMXN) },
      subscription_data: { metadata: { plan, uid: uid || '', source: SOURCE } },
      return_url: `${PANEL_URL}/vip-panel.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      locale: 'es-419',
      payment_method_types: ['card']
    });

    res.json({ clientSecret: session.client_secret, sessionId: session.id });
  } catch (err) {
    console.error('❌ /stripe/checkout error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ══ STRIPE · consultar sesión (página de éxito) ══════════════
app.get('/stripe/session/:id', async (req, res) => {
  try {
    const s = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({
      status: s.status,
      payment_status: s.payment_status,
      plan: s.metadata && s.metadata.plan,
      email: s.customer_details && s.customer_details.email
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ══ NOTICIAS · disparo MANUAL para probar ════════════════════
// GET /cron/noticias?key=TU_CRON_KEY
app.get('/cron/noticias', async (req, res) => {
  if (req.query.key !== (process.env.CRON_KEY || 'alintec2026')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const r = await syncNoticias(db);
    res.status(200).json({ ok: true, ...r });
  } catch (err) {
    console.error('Cron noticias (manual) error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ══ Helpers robustos (resuelven subId por customer y user de Auth por email) ══
async function resolverSubId(m) {
  if (m && m.stripeSubscriptionId) return m.stripeSubscriptionId;
  if (m && m.stripeCustomerId) {
    try {
      const subs = await stripe.subscriptions.list({ customer: m.stripeCustomerId, status: 'all', limit: 3 });
      const act = subs.data.find(s => s.status === 'active' || s.status === 'trialing') || subs.data[0];
      if (act) return act.id;
    } catch (e) { console.warn('[resolverSubId]', e.message); }
  }
  return null;
}
async function borrarUsuarioAuth(m, docId) {
  const intentos = [];
  if (m && m.uid) intentos.push(m.uid);
  if (docId && !String(docId).startsWith('email_') && !intentos.includes(docId)) intentos.push(docId);
  for (const id of intentos) {
    try { await admin.auth().deleteUser(id); return { ok: true, via: id }; } catch (e) { /* probar siguiente */ }
  }
  const email = m && m.email;
  if (email) {
    try { const u = await admin.auth().getUserByEmail(email); await admin.auth().deleteUser(u.uid); return { ok: true, via: 'email:' + email }; }
    catch (e) { return { ok: false, error: e.message }; }
  }
  return { ok: false, error: 'No se encontró el usuario en Firebase Auth' };
}

// Busca el doc del miembro por uid (docId) o, si no está, por email.
// Cubre a los miembros cuyo doc quedó como 'email_…' (activación manual/regalo).
async function buscarMiembroRobusto({ uid, email }) {
  if (uid) {
    const d = await db.collection('miembros').doc(uid).get();
    if (d.exists) return { ref: d.ref, data: d.data() };
  }
  if (email) {
    const q = await db.collection('miembros')
      .where('email', '==', String(email).toLowerCase()).limit(1).get();
    if (!q.empty) return { ref: q.docs[0].ref, data: q.docs[0].data() };
  }
  return null;
}

// ══ CANCELAR SUSCRIPCIÓN · panel VIP (deja de cobrar, conserva acceso hasta fin de periodo) ══
app.post('/stripe/cancel-subscription', async (req, res) => {
  try {
    const { uid, email } = req.body || {};
    if (!uid && !email) return res.status(400).json({ error: 'Falta uid o email' });
    const miembro = await buscarMiembroRobusto({ uid, email });
    if (!miembro) return res.status(404).json({ error: 'Miembro no encontrado' });
    const ref = miembro.ref;
    const m = miembro.data;
    const subId = await resolverSubId(m);
    if (!subId) return res.status(400).json({ error: 'No se encontró una suscripción de Stripe para este miembro' });
    const sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    const finAcceso = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : (m.fechaProximaRenovacion || m.fechaFinAcceso || null);
    await ref.set({ cancelacionProgramada: true, fechaFinAcceso: finAcceso, estadoSuscripcion: 'cancelacion_programada', actualizadoEn: new Date().toISOString() }, { merge: true });
    console.log('[cancel VIP] sub', subId, '· cancel_at_period_end · fin', finAcceso);
    return res.json({ ok: true, finAcceso, cancelAtPeriodEnd: true });
  } catch (e) {
    console.error('[cancel VIP] error:', e.message);
    return res.status(500).json({ error: e.message || 'No se pudo cancelar la suscripción' });
  }
});

// ══ REACTIVAR SUSCRIPCIÓN · panel VIP (revierte la cancelación programada) ══
// Solo aplica si la suscripción aún no expiró. Pone cancel_at_period_end:false.
app.post('/stripe/reactivate-subscription', async (req, res) => {
  try {
    const { uid, email } = req.body || {};
    if (!uid && !email) return res.status(400).json({ error: 'Falta uid o email' });
    const miembro = await buscarMiembroRobusto({ uid, email });
    if (!miembro) return res.status(404).json({ error: 'Miembro no encontrado' });
    const subId = await resolverSubId(miembro.data);
    if (!subId) return res.status(400).json({ error: 'No se encontró una suscripción de Stripe para reactivar' });
    const sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: false });
    const prox = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
    await miembro.ref.set({
      cancelacionProgramada: false,
      fechaFinAcceso: null,
      estadoSuscripcion: 'activa',
      fechaProximaRenovacion: prox ? Timestamp.fromDate(new Date(prox)) : (miembro.data.fechaProximaRenovacion || null),
      actualizadoEn: new Date().toISOString()
    }, { merge: true });
    console.log('[reactivate VIP] sub', subId, '· cancel_at_period_end:false · prox', prox);
    return res.json({ ok: true, reactivada: true, proximaRenovacion: prox });
  } catch (e) {
    console.error('[reactivate VIP] error:', e.message);
    return res.status(500).json({ error: e.message || 'No se pudo reactivar la suscripción' });
  }
});

// ══ PORTAL DE FACTURACIÓN · panel VIP (Stripe Billing Portal) ══
// Requiere tener activado el Customer Portal en Stripe (Settings → Billing → Customer portal).
app.post('/stripe/create-billing-portal', async (req, res) => {
  try {
    const { uid, email, returnUrl } = req.body || {};
    if (!uid && !email) return res.status(400).json({ error: 'Falta uid o email' });
    const miembro = await buscarMiembroRobusto({ uid, email });
    if (!miembro) return res.status(404).json({ error: 'Miembro no encontrado' });
    let customerId = miembro.data.stripeCustomerId;
    if (!customerId) {
      // Intentar resolver el customer desde la suscripción
      const subId = await resolverSubId(miembro.data);
      if (subId) {
        try { const s = await stripe.subscriptions.retrieve(subId); customerId = s.customer; } catch (e) { /* sigue */ }
      }
    }
    if (!customerId) return res.status(400).json({ error: 'No se encontró el cliente de Stripe para este miembro' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${PANEL_URL}/vip-panel.html`
    });
    return res.json({ ok: true, url: portal.url });
  } catch (e) {
    console.error('[billing-portal] error:', e.message);
    return res.status(500).json({ error: e.message || 'No se pudo abrir el portal de facturación' });
  }
});

// ══ Helper: verificar que quien llama es ADMIN ══
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'teccapitalweb@gmail.com,fisiotec25@gmail.com')
  .split(',').map(s => s.trim().toLowerCase());
async function requireAdmin(req) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) throw new Error('Falta token de autenticación');
  const decoded = await admin.auth().verifyIdToken(token);
  const email = (decoded.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) throw new Error('No autorizado: no es administrador');
  return decoded;
}
function adminErrStatus(msg){ return (/(autoriz|token|administrador)/i.test(msg)) ? 401 : 500; }

// ══ ADMIN: cancelar la suscripción de un miembro ══
app.post('/admin/cancelar-suscripcion', async (req, res) => {
  try {
    await requireAdmin(req);
    const { uid, atPeriodEnd } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'Falta uid' });
    const ref = db.collection('miembros').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Miembro no encontrado' });
    const m = snap.data();
    const subId = await resolverSubId(m);
    if (atPeriodEnd) {
      let finAcceso = m.fechaProximaRenovacion || m.fechaFinAcceso || null;
      if (subId) {
        const sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
        if (sub.current_period_end) finAcceso = new Date(sub.current_period_end * 1000).toISOString();
      }
      await ref.set({ cancelacionProgramada: true, fechaFinAcceso: finAcceso, estadoSuscripcion: 'cancelacion_programada', actualizadoEn: new Date().toISOString() }, { merge: true });
      console.log('[admin cancel] period-end · uid', uid, '· stripe', !!subId, '· fin', finAcceso);
      return res.json({ ok: true, modo: 'period-end', finAcceso, stripeAplicado: !!subId });
    } else {
      let stripeCancelado = false;
      if (subId) { try { await stripe.subscriptions.cancel(subId); stripeCancelado = true; } catch (e) { console.warn('[admin cancel] stripe:', e.message); } }
      const ahora = new Date().toISOString();
      await ref.set({ activa: false, activo: false, cancelacionProgramada: false, expiraEn: ahora, fechaFinAcceso: ahora, estadoSuscripcion: 'cancelada', actualizadoEn: ahora }, { merge: true });
      console.log('[admin cancel] inmediata · uid', uid, '· stripe', stripeCancelado);
      return res.json({ ok: true, modo: 'immediate', stripeCancelado });
    }
  } catch (e) {
    console.error('[admin cancel] error:', e.message);
    return res.status(adminErrStatus(e.message)).json({ error: e.message });
  }
});

// ══ ADMIN: eliminar miembro por completo (Stripe + Firestore + Firebase Auth) ══
app.post('/admin/eliminar-miembro', async (req, res) => {
  try {
    await requireAdmin(req);
    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'Falta uid' });
    const ref = db.collection('miembros').doc(uid);
    const snap = await ref.get();
    const m = snap.exists ? snap.data() : null;
    // 1) Stripe
    let stripeCancelado = false;
    const subId = m ? await resolverSubId(m) : null;
    if (subId) { try { await stripe.subscriptions.cancel(subId); stripeCancelado = true; } catch (e) { console.warn('[admin del] stripe:', e.message); } }
    // 2) Firestore
    if (snap.exists) await ref.delete();
    // 3) Firebase Auth (por uid del doc, por docId o por email)
    const auth = await borrarUsuarioAuth(m, uid);
    console.log('[admin del] uid', uid, '· fs', snap.exists, '· auth', auth.ok, '· stripe', stripeCancelado);
    return res.json({ ok: true, firestoreBorrado: snap.exists, authBorrado: auth.ok, authVia: auth.via || null, authError: auth.error || null, stripeCancelado });
  } catch (e) {
    console.error('[admin del] error:', e.message);
    return res.status(adminErrStatus(e.message)).json({ error: e.message });
  }
});

// ══ INICIAR SERVIDOR ═════════════════════════════════════════
const PORT = process.env.PORT || 3000;
// ══ DIAGNÓSTICO: probar el correo sin necesidad de un pago real ══
//    Uso: GET /test-correo?to=tucorreo@gmail.com&key=TU_CRON_KEY
//    (protegido con la misma key que /cron/noticias para que nadie más lo use)
app.get('/test-correo', async (req, res) => {
  if (req.query.key !== (process.env.CRON_KEY || 'alintec2026')) {
    return res.status(401).json({ error: 'No autorizado · agrega ?key=TU_CRON_KEY' });
  }
  const to = req.query.to;
  const diag = { resendKeyPresente: !!RESEND_API_KEY, mailFrom: MAIL_FROM };
  if (!RESEND_API_KEY) {
    return res.status(200).json({ ...diag, problema: 'El contenedor NO ve RESEND_API_KEY. Revisa el nombre/valor de la variable en Railway y vuelve a hacer Redeploy.' });
  }
  if (!to) return res.status(400).json({ ...diag, problema: 'Agrega ?to=tucorreo@gmail.com a la URL.' });
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [to],
        subject: 'Prueba Alintec Food · correo de bienvenida',
        html: '<div style="font-family:sans-serif;padding:24px"><h2>✅ Correo de prueba Alintec Food</h2><p>Si recibes este correo, el envío de bienvenida funciona correctamente.</p></div>'
      })
    });
    const body = await r.json().catch(() => ({}));
    return res.status(200).json({ ...diag, enviado: r.ok, statusResend: r.status, respuestaResend: body });
  } catch (e) {
    return res.status(200).json({ ...diag, problema: e.message });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Alintec Food Webhook corriendo en puerto ${PORT}`);
  console.log(`   POST /stripe/checkout     · crea sesión de pago (con cupón)`);
  console.log(`   POST /stripe/webhook      · recibe eventos de Stripe`);
  console.log(`   GET  /stripe/session/:id  · consulta una sesión`);
  console.log(`   GET  /membership/:uid     · paywall del panel`);
  console.log(`   GET  /cron/noticias?key=… · noticias manual`);
  console.log(`📰 Cron de noticias: 1 vez al día (13:00 UTC = 7am CDMX)`);
});

// ══ CRON DE NOTICIAS DEL SECTOR ALIMENTARIO ══════════════════
cron.schedule('0 13 * * *', () => {
  console.log('⏰ Cron diario noticias · 7am CDMX');
  syncNoticias(db).catch(e => console.error('Cron noticias error:', e.message));
}, { timezone: 'UTC' });

// Una corrida al arrancar, para que haya noticias desde el primer deploy
syncNoticias(db).catch(e => console.error('Cron noticias (arranque) error:', e.message));

// ════════════════════════════════════════════════════════════
//  HANDLERS DE EVENTOS DE STRIPE
// ════════════════════════════════════════════════════════════
async function procesarEvento(event) {
  console.log('📥 Stripe event:', event.type, '·', event.id);
  switch (event.type) {
    case 'checkout.session.completed':
      await onCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await onSubscriptionChange(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await onInvoicePaid(event.data.object);
      break;
    default:
      console.log('   (sin handler para este evento)');
  }
}

// checkout.session.completed → activa la membresía en Firestore
async function onCheckoutCompleted(session) {
  // Filtro multi-proyecto ESTRICTO (patrón SYNOVA): la cuenta de Stripe es
  // compartida entre varios proyectos de TEC CAPITAL/IPCI y Stripe avisa de
  // TODOS los pagos a TODOS los webhooks. Solo procesamos checkouts creados
  // por NUESTRO endpoint /stripe/checkout, que siempre marca
  // metadata.source='alintec-panel'.
  // NOTA MIGRACIÓN: antes había una 2da capa que validaba por Price ID fijo;
  // con price_data dinámico ya no existen Price IDs fijos, así que el filtro
  // estricto por source la sustituye (un pago de otro club SIN source ya NO
  // se cuela, porque exigimos source === SOURCE, no solo "distinto").
  const src = (session.metadata && session.metadata.source) || '';
  if (src !== SOURCE) {
    console.log('⏭️  Ignorado: checkout ajeno a Alintec Food (source=' + (src || 'vacío') + ')');
    return;
  }

  const uid   = session.client_reference_id || (session.metadata && session.metadata.uid);
  const email = session.customer_email || (session.customer_details && session.customer_details.email);
  if (!uid && !email) {
    console.warn('⚠️  Checkout sin uid ni email · session:', session.id);
    return;
  }
  const plan = (session.metadata && session.metadata.plan) || 'mensual';

  // Periodo de renovación (de la suscripción, si aplica)
  let periodoFin = null;
  try {
    if (session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      if (sub.current_period_end) periodoFin = new Date(sub.current_period_end * 1000);
    }
  } catch (e) {
    console.warn('⚠️  No se pudo leer la suscripción:', e.message);
  }

  const docId = uid || ('email_' + (email || '').replace(/[^a-z0-9]/gi, '_'));
  await db.collection('miembros').doc(docId).set({
    uid: uid || null,
    email: (email || '').toLowerCase(),
    plan,
    activa: true,
    activo: true,
    estado: 'activa',
    stripeCustomerId: session.customer || null,
    stripeSubscriptionId: session.subscription || null,
    fechaAlta: FieldValue.serverTimestamp(),
    fechaProximaRenovacion: periodoFin ? Timestamp.fromDate(periodoFin) : null,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('✅ Miembro activado:', docId, '·', plan, '·', email);

  // Correo de bienvenida (no bloquea ni truena el webhook si falla)
  const nombre = (session.customer_details && session.customer_details.name)
    || (email ? email.split('@')[0] : '');
  enviarBienvenida({ to: email, nombre, plan }).catch(e =>
    console.warn('⚠️  No se pudo enviar bienvenida:', e.message));
}

// customer.subscription.updated / deleted → actualiza estado
async function onSubscriptionChange(sub) {
  const activa = ['active', 'trialing'].includes(sub.status);
  const snap = await db.collection('miembros')
    .where('stripeSubscriptionId', '==', sub.id).limit(1).get();
  if (snap.empty) {
    console.log('   (suscripción no es de Alintec Food · ignorada)');
    return;
  }
  await snap.docs[0].ref.update({
    activa,
    activo: activa,
    estado: sub.status,
    fechaProximaRenovacion: sub.current_period_end
      ? Timestamp.fromDate(new Date(sub.current_period_end * 1000)) : null,
    updatedAt: FieldValue.serverTimestamp()
  });
  console.log('🔄 Suscripción actualizada:', snap.docs[0].id, '·', sub.status, '· activa:', activa);
}

// invoice.payment_succeeded → registra el cobro (solo si es miembro de Alintec Food)
async function onInvoicePaid(invoice) {
  if (!invoice.subscription) return;
  const snap = await db.collection('miembros')
    .where('stripeSubscriptionId', '==', invoice.subscription).limit(1).get();
  if (snap.empty) return; // suscripción de otro club → no registrar aquí
  try {
    await db.collection('pagos').doc(invoice.id).set({
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      customerId: invoice.customer,
      email: (invoice.customer_email || '').toLowerCase(),
      monto: (invoice.amount_paid || 0) / 100,
      moneda: (invoice.currency || 'mxn').toUpperCase(),
      estado: 'pagado',
      fechaPago: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('💰 Pago registrado:', invoice.id);
  } catch (e) {
    console.warn('⚠️  No se pudo registrar el pago:', e.message);
  }
}

// ════════════════════════════════════════════════════════════
//  CORREO DE BIENVENIDA · plantilla Alintec Food (vía Resend)
// ════════════════════════════════════════════════════════════
async function enviarBienvenida({ to, nombre, plan }) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY no configurada · correo de bienvenida no enviado');
    return false;
  }
  if (!to) { console.warn('⚠️  Bienvenida sin destinatario'); return false; }

  const saludo  = nombre ? ('Hola ' + nombre) : 'Hola';
  const planTxt = plan === 'anual' ? 'Plan VIP Anual'
    : plan === 'mensual' ? 'Plan VIP Mensual'
    : 'Membresía VIP';
  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bienvenido a Alintec Food VIP</title></head>
<body style="margin:0;padding:0;background:#0B0F14;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F14;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#11161D;border:1px solid #1E2730;border-radius:20px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#43A047,#6FB8B0);padding:36px 32px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:#0B0F14;letter-spacing:-.5px;">Alintec Food</div>
          <div style="font-size:13px;font-weight:600;color:#0B0F14;opacity:.85;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Club VIP · IPCI Latinoamericano</div>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 14px;font-size:23px;font-weight:800;color:#EAF2FA;letter-spacing:-.4px;">${saludo}, ¡bienvenido al Club VIP! 🎉</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#C3D2E0;">
            Tu <strong style="color:#7FC6BE;">${planTxt}</strong> ya está activa. Desde hoy tienes acceso completo a todo lo que Alintec Food tiene para ti.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">
            <tr><td style="padding:11px 0;border-bottom:1px solid #1E2730;font-size:14px;color:#C3D2E0;">🔬 &nbsp;Cursos de ciencia de alimentos con certificado oficial</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #1E2730;font-size:14px;color:#C3D2E0;">🛠️ &nbsp;Herramientas pro (NOM-051, HACCP, BPM y más)</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #1E2730;font-size:14px;color:#C3D2E0;">🎥 &nbsp;Casos del sector y webinars exclusivos</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #1E2730;font-size:14px;color:#C3D2E0;">💬 &nbsp;Comunidad y directorio profesional del sector alimentario</td></tr>
            <tr><td style="padding:11px 0;font-size:14px;color:#C3D2E0;">📄 &nbsp;Biblioteca de materiales descargables</td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
            <tr><td style="border-radius:12px;background:linear-gradient(135deg,#43A047,#6FB8B0);">
              <a href="${PANEL_URL}/vip-panel.html" target="_blank"
                 style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#0B0F14;text-decoration:none;">
                Entrar a mi panel VIP →
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #1E2730;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#7A8896;line-height:1.6;">
            Recibiste este correo porque activaste tu membresía en Alintec Food.
          </p>
          <p style="margin:0;font-size:12px;color:#5E6B78;">
            Alintec Food Consulting · Tehuacán, Puebla
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to,
        subject: '¡Bienvenido al Club VIP de Alintec Food! 🌿',
        html
      })
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error('⚠️  Resend error', r.status, '·', txt.slice(0, 200));
      return false;
    }
    console.log('📧 Bienvenida enviada a', to);
    return true;
  } catch (err) {
    console.error('⚠️  Error enviando bienvenida:', err.message);
    return false;
  }
}
