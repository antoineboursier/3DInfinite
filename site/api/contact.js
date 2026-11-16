// Formulaire de contact : reçoit un message du site ou de l'appli et l'envoie par e-mail à l'auteur.
// L'adresse de destination n'est écrite nulle part dans le code (le dépôt est public) :
// elle vient des variables d'environnement du projet Vercel.
//   CONTACT_TO      adresse qui reçoit les messages
//   RESEND_API_KEY  clé du service d'envoi Resend (https://resend.com)
//   CONTACT_FROM    facultatif : expéditeur affiché (par défaut l'adresse de test de Resend)

const MAX_FILES = 3;
const MAX_BYTES = 3 * 1024 * 1024;          // total des pièces jointes (limite de Vercel : 4,5 Mo par requête)
const MAX_MESSAGE = 5000;
const EXT_OK = /\.(3di|json|stl|3mf|svg|png|jpe?g|webp|gif|txt|log|pdf|zip)$/i;
const RATE = { max: 5, windowMs: 10 * 60 * 1000 };   // par adresse IP, pour freiner les envois en rafale
const hits = new Map();

const oneLine = (s, n) => String(s || '').replace(/[\r\n\t]+/g, ' ').replace(/[<>]/g, '').trim().slice(0, n);
const b64Bytes = (s) => Math.floor((s.length * 3) / 4) - (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0);

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  if (list.length >= RATE.max) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < RATE.windowMs)) hits.delete(k);
  return false;
}

// Vérifie la demande. Renvoie { error } ou { mail } prêt à envoyer.
function prepare(body) {
  if (!body || typeof body !== 'object') return { error: 'invalid' };
  if (body.website) return { spam: true };                       // champ piège, invisible pour un humain
  const message = String(body.message || '').replace(/\r/g, '').trim();
  if (message.length < 10 || message.length > MAX_MESSAGE) return { error: 'message' };
  const name = oneLine(body.name, 80);
  const email = oneLine(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'email' };

  const files = Array.isArray(body.attachments) ? body.attachments : [];
  if (files.length > MAX_FILES) return { error: 'files' };
  let total = 0;
  const attachments = [];
  for (const f of files) {
    const filename = oneLine(f && f.name, 100).replace(/[\\/:*?"|]/g, '_');
    const content = String((f && f.data) || '');
    if (!filename || !EXT_OK.test(filename) || !content || !/^[A-Za-z0-9+/]+=*$/.test(content)) return { error: 'files' };
    total += b64Bytes(content);
    if (total > MAX_BYTES) return { error: 'too_large' };
    attachments.push({ filename, content });
  }

  const fromApp = body.source === 'app';
  const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};
  const origin = fromApp
    ? `l'appli 3DInfinite ${oneLine(meta.version, 20) || '?'} (${oneLine(meta.platform, 20) || '?'})`
    : 'le site';
  const text = [
    `Message envoyé depuis ${origin}`,
    `Nom : ${name || 'non renseigné'}`,
    `E-mail : ${email || 'non renseigné (pas de réponse possible)'}`,
    `Pièces jointes : ${attachments.length ? attachments.map((a) => a.filename).join(', ') : 'aucune'}`,
    '',
    message,
  ].join('\n');
  const subject = `[3DInfinite] ${fromApp ? 'Appli' : 'Site'} : ${oneLine(message, 60)}`;
  return { mail: { subject, text, attachments, replyTo: email || null } };
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, data) => res.status(status).json(data);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(405, { ok: false, error: 'method' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const p = prepare(body);
  if (p.spam) return send(200, { ok: true });
  if (p.error) return send(p.error === 'too_large' ? 413 : 400, { ok: false, error: p.error });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
  if (limited(ip)) return send(429, { ok: false, error: 'rate' });

  const to = process.env.CONTACT_TO, key = process.env.RESEND_API_KEY;
  if (!to || !key) return send(503, { ok: false, error: 'config' });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || '3DInfinite <onboarding@resend.dev>',
        to: [to],
        subject: p.mail.subject,
        text: p.mail.text,
        ...(p.mail.replyTo ? { reply_to: p.mail.replyTo } : {}),
        ...(p.mail.attachments.length ? { attachments: p.mail.attachments } : {}),
      }),
    });
    if (!r.ok) { console.error('Resend', r.status, await r.text()); return send(502, { ok: false, error: 'send' }); }
    return send(200, { ok: true });
  } catch (e) {
    console.error(e);
    return send(502, { ok: false, error: 'send' });
  }
}

module.exports = handler;
module.exports.prepare = prepare;
