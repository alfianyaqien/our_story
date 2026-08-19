/**
 * End-to-end regression across every feature, driven through the real HTTP API
 * with a real session cookie. Reports pass/fail per step.
 */
const BASE = process.env.REGRESSION_BASE_URL || 'http://localhost:3000';

let cookie = '';
const results = [];
let created = { note: null, travel: null, wish: null, culinary: null, album: null };

function rec(feature, step, ok, detail = '') {
  results.push({ feature, step, ok, detail });
  const mark = ok ? '  PASS' : '  FAIL';
  console.log(`${mark}  ${feature} :: ${step}${detail ? ' — ' + detail : ''}`);
}

async function req(method, path, body, isForm = false) {
  const opts = { method, headers: {} };
  if (cookie) opts.headers['Cookie'] = cookie;
  if (body && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body) {
    opts.body = body;
  }
  const res = await fetch(BASE + path, opts);
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { json = { _raw: text.slice(0, 120) }; }
  return { status: res.status, ok: res.ok, json };
}

const U = 'regr_' + Date.now().toString(36);

/**
 * The harness drives the real HTTP API, so it needs the app running. Fail with
 * an instruction rather than an undici stack trace when nothing is listening.
 */
async function preflight() {
  try {
    await fetch(BASE + '/api/auth/session');
  } catch (e) {
    if (e?.cause?.code === 'ECONNREFUSED' || e?.code === 'ECONNREFUSED') {
      console.error(`\nCannot reach the app at ${BASE}\n`);
      console.error('This harness tests the running app, so start it first:\n');
      console.error('  in one terminal:   npm run dev');
      console.error('  in another:        npm run test:regression\n');
      console.error('Point it elsewhere with REGRESSION_BASE_URL=https://... npm run test:regression\n');
      process.exit(2);
    }
    throw e;
  }
}

(async () => {
  await preflight();
  console.log('\n=== AUTH ===');
  let r = await req('POST', '/api/auth/signup', {
    username: U, email: `${U}@example.com`, password: 'TestPass123!', displayName: 'Regression User',
  });
  rec('auth', 'signup', r.status === 201, `HTTP ${r.status}`);

  // verify via token straight from the DB (email delivery is out of scope here)
  const mysql = require('mysql2/promise');
  require('dotenv').config({ quiet: true });
  let db;
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER,
      password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    });
  } catch (e) {
    console.error(`\nCannot reach MySQL (${e.code}).`);
    console.error('The harness reads the verification token directly, so it needs DB access.');
    console.error('Check DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME in .env\n');
    process.exit(2);
  }
  const [[row]] = await db.query('SELECT id, verification_token FROM users WHERE username = ?', [U]);
  const userId = row?.id;

  r = await req('GET', `/api/auth/verify-email?token=${encodeURIComponent(row.verification_token)}`);
  rec('auth', 'verify email', r.ok, `HTTP ${r.status}`);

  r = await req('POST', '/api/auth/login', { username: U, password: 'TestPass123!' });
  rec('auth', 'login', r.ok, `HTTP ${r.status}`);

  r = await req('GET', '/api/auth/session');
  rec('auth', 'session', r.ok && r.json.user?.username === U, `HTTP ${r.status}`);

  r = await req('POST', '/api/auth/login', { username: U, password: 'WrongPass!' });
  rec('auth', 'rejects wrong password', r.status === 401, `HTTP ${r.status}`);

  // re-login (the failed attempt does not clear the cookie, but be explicit)
  await req('POST', '/api/auth/login', { username: U, password: 'TestPass123!' });

  console.log('\n=== NOTES ===');
  r = await req('POST', '/api/notes', { title: 'Regression note', content: 'line one\nline two' });
  rec('notes', 'create', r.ok, `HTTP ${r.status}`);
  r = await req('GET', '/api/notes');
  const note = (r.json.notes || []).find(n => n.title === 'Regression note');
  created.note = note?.id;
  rec('notes', 'list contains created', !!note, `${(r.json.notes || []).length} rows`);
  if (note) {
    r = await req('PUT', '/api/notes', { id: note.id, title: 'Regression note v2', content: 'edited' });
    rec('notes', 'update', r.ok, `HTTP ${r.status}`);
    r = await req('GET', '/api/notes');
    const upd = (r.json.notes || []).find(n => n.id === note.id);
    rec('notes', 'update persisted', upd?.title === 'Regression note v2', upd?.title);
  }

  console.log('\n=== LOVE LETTERS (recipients + encryption round-trip) ===');
  // The compose form used to hardcode recipient ids 1 and 2, so this exercises
  // the id the dropdown actually supplies rather than one the test invents.
  r = await req('GET', '/api/users');
  const recips = r.json.users || [];
  rec('love-letters', 'recipients endpoint', r.ok, `HTTP ${r.status}, ${recips.length} recipient(s)`);
  rec('love-letters', 'recipients exclude self', !recips.some(u => u.id === userId));
  rec('love-letters', 'recipients expose no credentials',
      recips.every(u => !('password' in u) && !('email' in u)),
      Object.keys(recips[0] || {}).join(','));

  const badSend = await req('POST', '/api/love-letters', { toUserId: 999999, subject: 'nope', content: 'x' });
  rec('love-letters', 'unknown recipient rejected with 400', badSend.status === 400, `HTTP ${badSend.status}`);

  const secret = 'secret body ' + Math.random().toString(36).slice(2);
  const toId = recips.length ? recips[0].id : userId;
  r = await req('POST', '/api/love-letters', { toUserId: toId, subject: 'Regression letter', content: secret });
  rec('love-letters', 'create', r.ok, `HTTP ${r.status}`);
  r = await req('GET', '/api/love-letters');
  const letter = (r.json.letters || []).find(l => l.subject === 'Regression letter');
  rec('love-letters', 'list + decrypt matches plaintext', letter?.content === secret,
      letter ? (letter.content === secret ? 'round-trip ok' : 'MISMATCH') : 'not found');
  if (letter) {
    const [[stored]] = await db.query('SELECT encrypted_content FROM love_letters WHERE id = ?', [letter.id]);
    rec('love-letters', 'stored ciphertext != plaintext',
        stored && stored.encrypted_content !== secret, 'at-rest encrypted');
  }

  console.log('\n=== TRAVEL ===');
  r = await req('POST', '/api/travel', { destination: 'Kyoto', startDate: '2026-11-02', budget: 25000000, notes: 'blossoms', status: 'planning' });
  rec('travel', 'create', r.ok, `HTTP ${r.status}`);
  r = await req('GET', '/api/travel');
  const trip = (r.json.plans || []).find(p => p.destination === 'Kyoto');
  created.travel = trip?.id;
  rec('travel', 'list contains created', !!trip, `${(r.json.plans || []).length} rows`);
  rec('travel', 'startDate round-trips as YYYY-MM-DD', trip?.startDate === '2026-11-02', `got ${trip?.startDate}`);
  if (trip) {
    r = await req('PUT', '/api/travel', { ...trip, status: 'booked' });
    rec('travel', 'update status', r.ok, `HTTP ${r.status}`);
    r = await req('GET', '/api/travel');
    const after = (r.json.plans || []).find(p => p.id === trip.id);
    rec('travel', 'update persisted + date unchanged',
        after?.status === 'booked' && after?.startDate === '2026-11-02',
        `status=${after?.status} date=${after?.startDate}`);
    r = await req('DELETE', `/api/travel?id=${trip.id}`);
    rec('travel', 'delete', r.ok, `HTTP ${r.status}`);
  }

  console.log('\n=== WISHLIST ===');
  r = await req('POST', '/api/wishlist', { title: 'Espresso machine', description: 'slow mornings', category: 'Kitchen', priority: 'high', price: 7500000, link: 'https://example.com', status: 'wished' });
  rec('wishlist', 'create', r.ok, `HTTP ${r.status}`);
  r = await req('GET', '/api/wishlist');
  const wish = (r.json.items || []).find(i => i.title === 'Espresso machine');
  created.wish = wish?.id;
  rec('wishlist', 'list contains created', !!wish, `${(r.json.items || []).length} rows`);
  rec('wishlist', 'joins userName', wish?.userName === 'Regression User', wish?.userName);
  if (wish) {
    r = await req('PUT', '/api/wishlist', { ...wish, status: 'purchased' });
    rec('wishlist', 'update status', r.ok, `HTTP ${r.status}`);
    r = await req('DELETE', `/api/wishlist?id=${wish.id}`);
    rec('wishlist', 'delete', r.ok, `HTTP ${r.status}`);
  }

  console.log('\n=== CULINARY ===');
  r = await req('POST', '/api/culinary', { placeName: 'Sushi Regression', location: 'Ginza', cuisineType: 'Japanese', priceRange: '$$$', recommendedMenu: 'Omakase', status: 'visited', rating: 5, isFavorite: false, visitDate: '2026-07-14' });
  rec('culinary', 'create', r.ok, `HTTP ${r.status}`);
  r = await req('GET', '/api/culinary');
  const plan = (r.json.recipes || []).find(p => p.placeName === 'Sushi Regression');
  created.culinary = plan?.id;
  rec('culinary', 'list contains created', !!plan, `${(r.json.recipes || []).length} rows`);
  rec('culinary', 'rating persisted', plan?.rating === 5, `rating=${plan?.rating}`);
  rec('culinary', 'visitDate round-trips as YYYY-MM-DD', plan?.visitDate === '2026-07-14', `got ${plan?.visitDate}`);
  if (plan) {
    r = await req('PUT', '/api/culinary', { ...plan, isFavorite: true });
    rec('culinary', 'toggle favourite', r.ok, `HTTP ${r.status}`);
    r = await req('GET', '/api/culinary');
    const fav = (r.json.recipes || []).find(p => p.id === plan.id);
    rec('culinary', 'favourite persisted', !!fav?.isFavorite, `isFavorite=${fav?.isFavorite}`);
    rec('culinary', 'visitDate unchanged after edit', fav?.visitDate === '2026-07-14', `got ${fav?.visitDate}`);
    r = await req('GET', `/api/culinary/photos?culinaryId=${plan.id}`);
    rec('culinary', 'photos endpoint', r.ok, `HTTP ${r.status}`);
    r = await req('DELETE', `/api/culinary?id=${plan.id}`);
    rec('culinary', 'delete', r.ok, `HTTP ${r.status}`);
  }

  console.log('\n=== GALLERY ===');
  r = await req('GET', '/api/albums');
  rec('gallery', 'albums list', r.ok, `HTTP ${r.status}, ${(r.json.albums || []).length} albums`);
  r = await req('POST', '/api/albums', { name: 'Regression Album', description: 'temp' });
  rec('gallery', 'album create', r.ok, `HTTP ${r.status}`);
  r = await req('GET', '/api/albums');
  const album = (r.json.albums || []).find(a => a.name === 'Regression Album');
  created.album = album?.id;
  rec('gallery', 'album list contains created', !!album);
  r = await req('GET', '/api/photos');
  rec('gallery', 'photos list', r.ok, `HTTP ${r.status}, ${(r.json.photos || []).length} photos`);
  if (album) {
    r = await req('DELETE', `/api/albums?id=${album.id}`);
    rec('gallery', 'album delete', r.ok, `HTTP ${r.status}`);
  }

  console.log('\n=== LETTER TEMPLATES ===');
  r = await req('GET', '/api/letter-templates');
  const tpls = r.json.templates || [];
  rec('letter-maker', 'templates list', r.ok, `HTTP ${r.status}, ${tpls.length} templates`);
  rec('letter-maker', 'placeholders are arrays',
      tpls.length > 0 && tpls.every(t => Array.isArray(t.placeholders)),
      tpls[0] ? JSON.stringify(tpls[0].placeholders) : 'none');

  console.log('\n=== QUOTE ===');
  r = await req('GET', '/api/quote');
  rec('dashboard', 'quote endpoint', r.ok && !!r.json.quote?.text, `HTTP ${r.status}`);

  console.log('\n=== AUTH GUARD (unauthenticated) ===');
  const saved = cookie; cookie = '';
  for (const p of ['/api/notes', '/api/travel', '/api/wishlist', '/api/culinary', '/api/photos', '/api/albums', '/api/love-letters']) {
    const g = await req('GET', p);
    rec('auth-guard', `${p} rejects anon`, g.status === 401, `HTTP ${g.status}`);
  }
  cookie = saved;

  console.log('\n=== LOGOUT ===');
  r = await req('POST', '/api/auth/logout');
  rec('auth', 'logout', r.ok, `HTTP ${r.status}`);

  // cleanup
  if (created.note) await req('DELETE', `/api/notes?id=${created.note}`).catch(() => {});
  await db.query('DELETE FROM love_letters WHERE from_user_id = ? OR to_user_id = ?', [userId, userId]);
  await db.query('DELETE FROM notes WHERE created_by = ?', [userId]);
  await db.query('DELETE FROM users WHERE username = ?', [U]);
  await db.end();

  const failed = results.filter(x => !x.ok);
  console.log('\n==================================================');
  console.log(`TOTAL: ${results.length}   PASS: ${results.length - failed.length}   FAIL: ${failed.length}`);
  if (failed.length) {
    console.log('\nFAILURES:');
    failed.forEach(f => console.log(`  - ${f.feature} :: ${f.step} (${f.detail})`));
  }
  console.log('==================================================\n');
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
