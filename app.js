'use strict';
/* ---------- config ---------- */
// Color follows the club (fixed order, validated palette slots s1..s7).
const CLUBS = [
  { id: 'yahad',     name: 'מועדון יחד',  color: 'var(--s1)', site: 'https://clubs.linkc.co.il/yahad' },
  { id: 'hever',     name: 'מועדון חבר',  color: 'var(--s2)', site: 'https://www.mcc.co.il/st_reshet_public.aspx' },
  { id: 'pais',      name: 'פיס פלוס',    color: 'var(--s3)', site: 'https://paisplus.co.il/' },
  { id: 'max',       name: 'max',          color: 'var(--s4)', site: 'https://www.max.co.il/benefits/lobby' },
  { id: 'cal',       name: 'כאל',          color: 'var(--s5)', site: 'https://www.cal-store.co.il/' },
  { id: 'isracard',  name: 'ישראכרט',     color: 'var(--s6)', site: 'https://benefits.isracard.co.il/' },
  { id: 'lifestyle', name: 'לייף סטייל',  color: 'var(--s7)', site: 'https://lifestyle.style.co.il/' },
  { id: 'htzone',    name: 'הייטקזון',     color: 'var(--s8)', site: 'https://www.htzone.co.il/' },
];
const CLUB = Object.fromEntries(CLUBS.map(c => [c.id, c]));
// data file -> club + kind of benefit
const FILES = {
  'yahad':              { club: 'yahad', kind: 'discount', label: 'מועדון יחד – בתי עסק', scraper: 'yahad' },
  'hever':              { club: 'hever', kind: 'discount', label: 'מועדון חבר – אינדקס בתי עסק', scraper: 'hever' },
  'htzone':             { club: 'htzone', kind: 'voucher', label: 'הייטקזון – הטבות ושוברים', scraper: 'htzone' },
  'pais':               { club: 'pais', kind: 'voucher', label: 'פיס פלוס – הטבות', scraper: 'pais' },
  'max':                { club: 'max', kind: 'voucher', label: 'max – עולם ההטבות', scraper: 'max' },
  'max-biz':            { club: 'max', kind: 'discount', label: 'max – הנחות במעמד החיוב', scraper: 'max-biz' },
  'cal':                { club: 'cal', kind: 'voucher', label: 'כאל – חנות החוויות', scraper: 'cal' },
  'isracard':           { club: 'isracard', kind: 'voucher', label: 'ישראכרט – הטבות', scraper: null },
  'lifestyle':          { club: 'lifestyle', kind: 'voucher', label: 'לייף סטייל – הטבות', scraper: 'lifestyle' },
  'lifestyle-discount': { club: 'lifestyle', kind: 'discount', label: 'לייף סטייל – הנחות במעמד החיוב', scraper: 'lifestyle' },
};

// Business type by keywords (first match wins; order matters).
const TYPES = [
  ['cinema',   'קולנוע',                 /קולנוע|סינמה|סינמטק|cinema|מובילנד|פלאנט|planet|רב[ -]חן|גבריאל|לב סמדר|כרטיס(?:ים)? לסרט|לסרט\b|הוט סינמה|yes planet|(?:^|[|>]\s)סרטים(?![,א-ת])/i],
  ['rest',     'מסעדות ובתי קפה',        /מסעד|שף|בית קפה|בתי קפה|קפה |ארוח(?:ת|ות)|בורגר|המבורגר|פיצ|סושי|אסי(?:י)?אתי|מזון מהיר|נשנוש|גלידה|מאפ(?:ה|יה|יות)|ביס|דומינו|מקדונלד|פאב|ברים|קולינרי|שווארמה|פלאפל|גריל|בשרים|wolt|וולט|משלוחה|10bis|תן ביס|cibus|סיבוס/i],
  ['food',     'סופר ומזון',             /סופר|מרקט|מכולת|מזון|מעדני|ירקות|פירות|קצב|יקב|יין|משקאות|שוק|ממתק|שוקולד|מאפים/i],
  ['travel',   'תיירות ונופש',           /נופש|מלון|מלונות|חופש|תיירות|טיס(?:ה|ות)|חו"ל|נתב"ג|צימר|אירוח|וילה|אילת|השכרת רכב|טיול/i],
  ['shows',    'מופעים ואטרקציות',       /אטרקצי|מופע|הצג|הופע|סטנד|פסטיבל|מוזיאון|תערוכ|פארק|תרבות|בידור|קונצרט|לונה|באולינג|אסקייפ|ספארי|חוויה|חוויות|כרטיס(?:ים)? ל/i],
  ['fashion',  'אופנה והנעלה',           /אופנ|הלבשה|נעל|ביגוד|תכשיט|שעונ|תיק|הנעלה|בגדי|לבוש|גרביים|הלבשה תחתונה/i],
  ['home',     'בית ועיצוב',             /לבית|ריהוט|רהיט|טקסטיל|מטבח|כלי בית|משתל|פרחים|עיצוב|מצעים|שטיח|תאורה|בית וגן|גינ/i],
  ['elec',     'חשמל ואלקטרוניקה',       /חשמל|אלקטרוני|סלולר|מחשב|טלוויזי|תקשורת|גאדג|מצלמ|אוזני|שואב/i],
  ['health',   'בריאות, יופי וספורט',    /ספא|קוסמטי|טיפוח|יופי|בריאות|רפוא|אופטיק|משקפ|שיניים|פארם|כושר|ספורט|מספרה|ציפורנ|קליניק|פיזיותרפ|אורתופד|טבע/i],
  ['car',      'רכב ודלק',               /רכב|דלק|מוסך|צמיג|תדלוק|חניה|חניון/i],
  ['kids',     'ילדים ומשפחה',           /ילדים|צעצוע|תינוק|משחק|יולדת|הורים/i],
  ['online',   'קניות אונליין ותווים',   /אונליין|online|תו(?:ו)? קני|תווי קני|גיפט|gift|שובר כספי|כסף בחזרה/i],
];
const OTHER = ['other', 'אחר'];
const TYPE_NAME = Object.fromEntries([...TYPES.map(t => [t[0], t[1]]), OTHER]);

// Chains for the comparison matrix: [display name, regex]
const CHAIN_GROUPS = {
  'בתי קולנוע': [
    ['סינמה סיטי', /סינמה סיטי|cinema city/i], ['יס פלאנט', /פלאנט|planet/i], ['רב חן', /רב[ -]?חן/i],
    ['הוט סינמה', /הוט סינמה|hot cinema/i], ['מובילנד', /מובילנד|movieland/i], ['לב', /לב סמדר|קולנוע לב(?![א-ת])|רשת לב(?![א-ת])|רשת בתי קולנוע לב(?![א-ת])|לב בבית/i],
    ['בית גבריאל', /בית גבריאל/i], ['סינמטק', /סינמטק/i]],
  'מסעדות ומזון מהיר': [
    ["מקדונלד'ס", /מקדונלד|mcdonald/i], ["בורגראנץ'", /בורגראנץ/i], ['ברגר קינג', /ברגר קינג|burger king/i],
    ["דומינו'ס", /דומינו/i], ['פיצה האט', /פיצה האט|pizza hut/i], ["פאפא ג'ונס", /פאפא ג/i], ['BBB', /\bBBB\b|בורגרים/i],
    ['אגאדיר', /אגאדיר/i], ['גוטה', /גוטה/i], ['שיפודי התקווה', /שיפודי התקווה/i], ['משלוחה', /משלוחה/i], ['וולט', /וולט|wolt/i]],
  'בתי קפה': [
    ['ארומה', /ארומה|aroma/i], ['קפה קפה', /קפה קפה/i], ['לנדוור', /לנדוור|landwer/i], ['גרג', /גרג\b|greg/i],
    ['קופי בין', /קופי בין|coffee bean/i], ['קפה ג\'ו', /קפה ג'ו|cafe joe/i], ['רולדין', /רולדין/i], ['ביסקוטי', /ביסקוטי/i]],
  'סופר ופארם': [
    ['שופרסל', /שופרסל/i], ['רמי לוי', /רמי לוי/i], ['ויקטורי', /ויקטורי/i], ['יוחננוף', /יוחננוף/i], ['קרפור', /קרפור|carrefour/i],
    ['אושר עד', /אושר עד/i], ['סופר-פארם', /סופר[ -]?פארם|super-?pharm/i], ['גוד פארם', /גוד פארם|good pharm/i], ['ניו פארם', /ניו פארם|new pharm/i]],
  'אופנה': [
    ['FOX', /\bfox\b|פוקס/i], ['קסטרו', /קסטרו|castro/i], ['גולף', /גולף|golf/i], ['רנואר', /רנואר|renuar/i],
    ['טרמינל X', /טרמינל|terminal ?x/i], ['אמריקן איגל', /אמריקן איגל|american eagle/i], ['מגה ספורט', /מגה ספורט/i],
    ['נייקי', /נייקי|nike/i], ['אדידס', /אדידס|adidas/i], ['זארה', /זארה|zara/i]],
  'בית וחשמל': [
    ['ACE', /\bace\b|אייס/i], ['הום סנטר', /הום סנטר|home center/i], ['איקאה', /איקאה|ikea/i], ['KSP', /\bksp\b/i],
    ['באג', /(?:^|[^א-ת])באג(?![א-ת])|\bbug\b/i], ['מחסני חשמל', /מחסני חשמל/i], ['ורדינון', /ורדינון/i], ['גולף אנד קו', /golf ?& ?co|גולף אנד קו/i], ['נעמן', /נעמן/i]],
};

/* ---------- state ---------- */
let ALL = [];
const sources = {};   // file -> {count, updated, size}
const state = { q: '', type: '', kind: '', city: '', sort: '', clubs: new Set(CLUBS.map(c => c.id)), shown: 60, chainGroup: Object.keys(CHAIN_GROUPS)[0], extraChains: [] };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n.toLocaleString('he-IL');

/* ---------- load ---------- */
let STATIC = false;   // true when served as a static site (GitHub Pages) without server.ps1
async function load() {
  let list;
  try {
    // the API only exists on the local server (server.ps1); on the public site go straight to the static manifest
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) throw new Error('static host');
    const r = await fetch('api/sources');
    if (!r.ok) throw new Error(r.status);
    list = await r.json();
  } catch (e) {
    STATIC = true;
    list = await fetch('data/sources.json', { cache: 'no-cache' }).then(r => r.json());
    document.body.classList.add('static');
    // offline support / "add to home screen" on the public site
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  await Promise.all(list.map(async f => {
    const key = f.file.replace(/\.json$/, '');
    const meta = FILES[key];
    if (!meta) return;
    try {
      const d = await fetch('data/' + f.file).then(r => r.json());
      sources[key] = { count: d.items.length, updated: d.updated || f.modified, size: f.size };
      for (const it of d.items) ALL.push(enrich(it, meta));
    } catch (e) { sources[key] = { error: String(e) }; }
  }));
  ALL.sort((a, b) => a._club.localeCompare(b._club));
}

function enrich(it, meta) {
  it._club = meta.club;
  // the published (slimmed) data omits fields that repeat on every row
  if (!it.url) it.url = CLUB[meta.club].site;
  if (!it.cats) it.cats = [it.cat, it.sub].filter(Boolean).join(' > ');
  it._kind = /במעמד החיוב/.test(it.cats || it.cat || '') ? 'discount' : meta.kind;
  const text = [it.cats, it.cat, it.sub, it.name, it.biz].filter(Boolean).join(' ');
  const catText = [it.cats, it.cat, it.sub].filter(Boolean).join(' ');
  // categories first (more reliable), then title/business
  let t = TYPES.find(([, , re]) => re.test(catText)) || TYPES.find(([, , re]) => re.test(text));
  it._type = t ? t[0] : 'other';
  it._pct = bestPct(it);
  it._hay = [it.name, it.biz, it.cats, it.city, it.area, it.addr, it.disc, it.desc].filter(Boolean).join(' ').toLowerCase();
  it._hayN = norm(it._hay);
  it._titleN = norm(`${it.name || ''} ${it.biz || ''}`);
  return it;
}
function bestPct(it) {
  let best = 0;
  const s = `${it.disc || ''} ${it.name || ''}`;
  for (const m of s.matchAll(/(\d{1,2}(?:\.\d+)?)\s*%/g)) best = Math.max(best, parseFloat(m[1]));
  if (it.price && it.orig && it.orig > it.price) best = Math.max(best, Math.round((1 - it.price / it.orig) * 100));
  if (!best && /1\s*\+\s*1/.test(s)) best = 50;
  return best;
}

/* ---------- overview ---------- */
function renderOverview() {
  const total = ALL.length;
  const discount = ALL.filter(i => i._kind === 'discount').length;
  const upd = Object.values(sources).map(s => s.updated).filter(Boolean).sort().pop() || '';
  $('#summaryLine').textContent = `${fmt(total)} הטבות · ${fmt(discount)} בתי עסק עם הנחה במעמד החיוב · ${fmt(total - discount)} שוברים/הטבות · עודכן ${upd.replace('T', ' ').slice(0, 16)}`;

  $('#clubTiles').innerHTML = CLUBS.map(c => {
    const items = ALL.filter(i => i._club === c.id);
    if (!items.length) return `<button class="tile nodata" data-club="${c.id}"><div class="name"><span class="dot" style="background:${c.color}"></span>${c.name}</div>
      <div class="big">אין נתונים עדיין</div><div class="meta">ראו „מקורות ועדכון"</div></button>`;
    const d = items.filter(i => i._kind === 'discount').length;
    const parts = [];
    if (d) parts.push(`${fmt(d)} בתי עסק בהנחה`);
    if (items.length - d) parts.push(`${fmt(items.length - d)} הטבות`);
    return `<button class="tile" data-club="${c.id}"><div class="name"><span class="dot" style="background:${c.color}"></span>${c.name}</div>
      <div class="big">${fmt(items.length)}</div><div class="meta">${parts.join(' · ')}</div></button>`;
  }).join('');
  document.querySelectorAll('#clubTiles .tile').forEach(b => b.onclick = () => {
    if (b.classList.contains('nodata')) return showView('sources');
    state.clubs = new Set([b.dataset.club]); resetListFilters(false); showView('list');
  });

  // heatmap: type x club
  const clubs = CLUBS.filter(c => ALL.some(i => i._club === c.id));
  const types = [...TYPES.map(t => t[0]), 'other'];
  const counts = {}; let max = 0;
  for (const i of ALL) { const k = i._type + '|' + i._club; counts[k] = (counts[k] || 0) + 1; }
  for (const k in counts) max = Math.max(max, counts[k]);
  const steps = 7;
  const level = n => n ? Math.min(steps, 1 + Math.floor(Math.log(n) / Math.log(max + 1) * steps)) : 0;
  let h = `<thead><tr><th class="rowh">סוג עסק</th>${clubs.map(c => `<th><span class="dot" style="background:${c.color}"></span> ${c.name}</th>`).join('')}<th>סה"כ</th></tr></thead><tbody>`;
  for (const t of types) {
    const row = clubs.map(c => counts[t + '|' + c.id] || 0);
    const sum = row.reduce((a, b) => a + b, 0);
    if (!sum) continue;
    h += `<tr><th class="rowh">${TYPE_NAME[t]}</th>` + row.map((n, idx) => {
      const lv = level(n);
      const ink = lv >= 4 ? '#fff' : 'var(--ink)';
      return n ? `<td style="background:var(--seq${lv});color:${ink}" data-type="${t}" data-club="${clubs[idx].id}" data-tip="${esc(TYPE_NAME[t])} · ${esc(clubs[idx].name)}: ${fmt(n)} הטבות">${fmt(n)}</td>` : `<td class="zero">–</td>`;
    }).join('') + `<td class="total">${fmt(sum)}</td></tr>`;
  }
  $('#heatmap').innerHTML = h + '</tbody>';
  $('#heatLegend').innerHTML = 'מעט' + Array.from({ length: steps }, (_, i) => `<span class="sw" style="background:var(--seq${i + 1})"></span>`).join('') + 'הרבה (סולם לוגריתמי)';
  $('#heatmap').querySelectorAll('td[data-type]').forEach(td => td.onclick = () => {
    state.clubs = new Set([td.dataset.club]); resetListFilters(false); state.type = td.dataset.type; $('#fType').value = state.type; showView('list');
  });
  bindTips($('#heatmap'));
}

/* ---------- list ---------- */
// Spelling-tolerant Hebrew: drop niqqud, punctuation and the vowel letters י/ו, unify final letters.
// So "סינימה" == "סינמה", "דומינוס" == "דומינו'ס", "קפה-קפה" == "קפה קפה".
const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, c => FINALS[c])
    .replace(/[יו"'`׳״’]/g, '')
    .replace(/[\-־–.,:;!?()/\\|&+]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function filtered() {
  const q = state.q.trim();
  const terms = norm(q).split(' ').filter(Boolean);
  // a query that names a known chain also finds its other spellings (e.g. "סינימה סיטי" -> "Cinema City")
  const qn = norm(q);
  // chain alias: only when the query and the chain name match as whole words
  // ("סינימה סיטי" -> Cinema City; but "Space" must NOT trigger ACE)
  const pad = s => ` ${s} `;
  const chainRes = qn.length >= 3 ? Object.values(CHAIN_GROUPS).flat()
    .filter(([name, re]) => { const n = norm(name); return pad(qn).includes(pad(n)) || pad(n).startsWith(pad(qn).trimEnd()) || re.test(q); })
    .map(c => c[1]) : [];
  const city = norm(state.city);
  const score = new Map();
  // term starts a word; a very short normalized term (e.g. "אייס" -> "אס") must be a whole word
  const atWord = (hay, t) => t.length < 3 ? pad(hay).includes(pad(t)) : pad(hay).includes(' ' + t);
  const qRaw = q.toLowerCase();
  // graded relevance (higher = better); +5 when the exact typed spelling appears in the name
  function relevance(i) {
    const s = baseRelevance(i);
    return s && `${i.name} ${i.biz || ''}`.toLowerCase().includes(qRaw) ? s + 5 : s;
  }
  function baseRelevance(i) {
    const nameN = norm(i.name), bizN = norm(i.biz), titleN = i._titleN, hayN = i._hayN;
    const has = (hay, t) => t.length < 3 ? pad(hay).includes(pad(t)) : hay.includes(t);
    if (nameN === qn || bizN === qn) return 100;                                   // exact name
    if (nameN.startsWith(qn) || bizN.startsWith(qn)) return 90;                     // name starts with query
    if (atWord(titleN, qn)) return 80;                                               // whole phrase in name
    if (has(titleN, qn)) return 70;
    if (terms.every(t => atWord(titleN, t))) return 60;                              // all words in name
    if (chainRes.some(re => re.test(`${i.name} ${i.biz || ''}`))) return 55;          // known chain, other spelling
    if (terms.every(t => has(titleN, t))) return 50;
    if (atWord(hayN, qn)) return 40;                                                 // phrase in description/address
    if (terms.every(t => atWord(hayN, t))) return 20;
    if (terms.every(t => has(hayN, t))) return 10;
    return 0;
  }
  let r = ALL.filter(i => {
    if (!state.clubs.has(i._club) || (state.type && i._type !== state.type) || (state.kind && i._kind !== state.kind)) return false;
    if (city && !norm(`${i.city || ''} ${i.addr || ''}`).includes(city)) return false;
    if (!terms.length) return true;
    const s = relevance(i);
    if (s) score.set(i, s);
    return s > 0;
  });
  // multi-word query: when the exact phrase / all words are found in some names, drop the loose matches
  if (terms.length > 1 && r.some(i => score.get(i) >= 40)) r = r.filter(i => score.get(i) >= 40);
  // best match first; ties -> bigger discount
  if (terms.length && !state.sort) r.sort((a, b) => score.get(b) - score.get(a) || b._pct - a._pct);
  if (state.sort === 'pct') r = r.slice().sort((a, b) => b._pct - a._pct);
  else if (state.sort === 'name') r = r.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  else if (state.sort === 'price') r = r.filter(i => i.price).sort((a, b) => a.price - b.price);
  return r;
}
function renderChips() {
  $('#clubChips').innerHTML = CLUBS.filter(c => ALL.some(i => i._club === c.id)).map(c =>
    `<button class="chip" data-club="${c.id}" aria-pressed="${state.clubs.has(c.id)}"><span class="dot" style="background:${c.color}"></span>${c.name}</button>`).join('')
    + `<button class="chip" id="chipAll" aria-pressed="true">כולם</button>`;
  $('#clubChips').querySelectorAll('.chip[data-club]').forEach(b => b.onclick = () => {
    const id = b.dataset.club;
    if (state.clubs.size === CLUBS.length) state.clubs = new Set([id]);
    else if (state.clubs.has(id)) { state.clubs.delete(id); if (!state.clubs.size) state.clubs = new Set(CLUBS.map(c => c.id)); }
    else state.clubs.add(id);
    state.shown = 60; renderList();
  });
  $('#chipAll').onclick = () => { state.clubs = new Set(CLUBS.map(c => c.id)); state.shown = 60; renderList(); };
}
function priceHtml(i) {
  if (!i.price) return '';
  return `<span class="price">₪${fmt(i.price)}</span>${i.orig && i.orig > i.price ? `<span class="orig">₪${fmt(i.orig)}</span>` : ''}`;
}
function cardHtml(i, idx) {
  const c = CLUB[i._club];
  const isLogo = /logo|Logos|Categories/i.test(i.img || '') || i._kind === 'discount';
  const title = i.name || i.biz;
  const biz = i.biz && i.biz !== i.name ? i.biz : '';
  const where = [i.city, i.area && !i.city ? i.area : ''].filter(Boolean).join(' ');
  return `<article class="card" data-idx="${idx}">
    <div class="img ${isLogo ? 'logo' : ''}" ${i.img ? `style="background-image:url('${esc(i.img)}')"` : ''}>
      <span class="club"><span class="dot" style="background:${c.color}"></span>${c.name}</span></div>
    <div class="body">
      <div class="title">${esc(title)}</div>
      ${biz ? `<div class="biz">${esc(biz)}</div>` : ''}
      ${i.disc && i.disc !== title ? `<div class="disc">${esc(i.disc)}</div>` : ''}
      <div class="row"><span>${esc(TYPE_NAME[i._type])}${where ? ' · ' + esc(where) : ''}</span><span>${priceHtml(i)}</span></div>
    </div></article>`;
}
let current = [];
function renderList() {
  renderChips();
  current = filtered();
  $('#resultCount').textContent = `${fmt(current.length)} תוצאות`;
  $('#cards').innerHTML = current.slice(0, state.shown).map((i, k) => cardHtml(i, k)).join('');
  $('#moreBtn').hidden = current.length <= state.shown;
  $('#cards').querySelectorAll('.card').forEach(el => el.onclick = () => openItem(current[+el.dataset.idx]));
}
function resetListFilters(clubsToo = true) {
  Object.assign(state, { q: '', type: '', kind: '', city: '', sort: '', shown: 60 });
  if (clubsToo) state.clubs = new Set(CLUBS.map(c => c.id));
  $('#q').value = ''; $('#fType').value = ''; $('#fKind').value = ''; $('#fCity').value = ''; $('#fSort').value = '';
}

/* ---------- drawer ---------- */
function openDrawer(html) { $('#drawerBody').innerHTML = html; $('#drawer').hidden = false; }
function openItem(i) {
  const c = CLUB[i._club];
  const rows = [
    ['מועדון', `<span class="dot" style="background:${c.color}"></span> ${c.name}`],
    ['בית עסק / רשת', esc(i.biz)], ['הטבה', esc(i.disc)], ['מחיר', priceHtml(i)],
    ['סוג', esc(TYPE_NAME[i._type]) + (i._kind === 'discount' ? ' · הנחה במעמד החיוב' : ' · שובר/הטבה')],
    ['קטגוריות באתר', esc((i.cats || i.cat || '').split(' | ').join(' · '))],
    ['עיר / אזור', esc([i.city, i.area].filter(Boolean).join(' · '))], ['כתובת', esc(i.addr)],
    ['סניפים', i.branches > 1 ? fmt(i.branches) : ''],
    ['טלפון', i.phone ? `<a href="tel:${esc(i.phone)}">${esc(i.phone)}</a>` : ''],
    ['אתר העסק', i.site ? `<a href="${esc(i.site)}" target="_blank" rel="noopener">${esc(i.site)}</a>` : ''],
  ].filter(r => r[1]);
  openDrawer(`<h2>${esc(i.name || i.biz)}</h2>${i.img ? `<img src="${esc(i.img)}" alt="">` : ''}
    <dl>${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>
    ${i.desc ? `<p>${esc(i.desc)}</p>` : ''}
    ${i.url ? `<p><a href="${esc(i.url)}" target="_blank" rel="noopener">לעמוד ההטבה באתר ${c.name} ↗</a></p>` : ''}`);
}

/* ---------- chains ---------- */
function chainList() {
  return [...CHAIN_GROUPS[state.chainGroup] || [], ...state.extraChains];
}
function renderChains() {
  $('#chainGroup').innerHTML = Object.keys(CHAIN_GROUPS).map(g => `<option ${g === state.chainGroup ? 'selected' : ''}>${g}</option>`).join('');
  const clubs = CLUBS.filter(c => ALL.some(i => i._club === c.id));
  let h = `<thead><tr><th class="rowh">רשת</th>${clubs.map(c => `<th><span class="dot" style="background:${c.color}"></span> ${c.name}</th>`).join('')}</tr></thead><tbody>`;
  for (const [name, re] of chainList()) {
    const per = clubs.map(c => ALL.filter(i => i._club === c.id && re.test(`${i.name} ${i.biz || ''}`)));
    const bests = per.map(arr => arr.reduce((m, i) => Math.max(m, i._pct), 0));
    const top = Math.max(...bests);
    h += `<tr><th class="rowh">${esc(name)}</th>` + per.map((arr, k) => {
      if (!arr.length) return `<td class="zero">–</td>`;
      const b = bests[k];
      return `<td class="has ${b && b === top ? 'best' : ''}" data-chain="${esc(name)}" data-club="${clubs[k].id}" data-tip="${esc(name)} ב${esc(clubs[k].name)}: ${arr.length} הטבות${b ? ', עד ' + b + '%' : ''}">
        <span class="pct">${b ? 'עד ' + b + '%' : '✓'}</span><span class="n">${arr.length} הטבות</span></td>`;
    }).join('') + '</tr>';
  }
  $('#chainMatrix').innerHTML = h + '</tbody>';
  $('#chainMatrix').querySelectorAll('td[data-chain]').forEach(td => td.onclick = () => {
    const [name, re] = chainList().find(c => c[0] === td.dataset.chain);
    const club = CLUB[td.dataset.club];
    const arr = ALL.filter(i => i._club === club.id && re.test(`${i.name} ${i.biz || ''}`)).sort((a, b) => b._pct - a._pct);
    openDrawer(`<h2>${esc(name)} · ${club.name}</h2><ul class="lst">${arr.map(i =>
      `<li><a href="${esc(i.url || '#')}" target="_blank" rel="noopener">${esc(i.name)}</a>${i.disc && i.disc !== i.name ? ' – ' + esc(i.disc) : ''} ${priceHtml(i)}${i.city ? ' · ' + esc(i.city) : ''}</li>`).join('')}</ul>`);
  });
  bindTips($('#chainMatrix'));
}

/* ---------- sources ---------- */
function renderSources() {
  $('#srcTable').innerHTML = `<tr><th>מקור</th><th>פריטים</th><th>עודכן</th><th></th></tr>` + Object.entries(FILES).map(([k, f]) => {
    const s = sources[k];
    const btn = STATIC ? '' : f.scraper ? `<button class="ghost small" data-scraper="${f.scraper}">עדכון</button>` : '<span class="hint">ידני (ראו למטה)</span>';
    return `<tr><td><span class="dot" style="background:${CLUB[f.club].color}"></span> ${f.label}</td><td>${s && s.count != null ? fmt(s.count) : '—'}</td>
      <td>${s && s.updated ? s.updated.replace('T', ' ').slice(0, 16) : '—'}</td><td>${btn}</td></tr>`;
  }).join('');
  $('#srcTable').querySelectorAll('button[data-scraper]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    await fetch('api/refresh/' + b.dataset.scraper, { method: 'POST' });
    $('#refreshMsg').textContent = `העדכון של "${b.dataset.scraper}" רץ בחלון PowerShell נפרד. בסיומו רעננו את הדף.`;
  });
}

/* ---------- tooltips ---------- */
function bindTips(root) {
  const tip = $('#tip');
  root.onmousemove = e => {
    const t = e.target.closest('[data-tip]');
    if (!t) { tip.hidden = true; return; }
    tip.textContent = t.dataset.tip; tip.hidden = false;
    const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
    tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px';
  };
  root.onmouseleave = () => { tip.hidden = true; };
}

/* ---------- views & events ---------- */
function showView(v) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  if (v === 'list') renderList();
  if (v === 'chains') renderChains();
  if (v === 'sources') renderSources();
  try { localStorage.setItem('view', v); } catch (e) {}
  scrollTo(0, 0);
}
function wire() {
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => showView(b.dataset.view));
  $('#fType').innerHTML += [...TYPES.map(t => [t[0], t[1]]), OTHER].map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  const cities = [...new Set(ALL.map(i => i.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he'));
  $('#cities').innerHTML = cities.map(c => `<option value="${esc(c)}">`).join('');
  let deb;
  $('#q').oninput = e => { clearTimeout(deb); deb = setTimeout(() => { state.q = e.target.value; state.shown = 60; renderList(); }, 180); };
  $('#fType').onchange = e => { state.type = e.target.value; state.shown = 60; renderList(); };
  $('#fKind').onchange = e => { state.kind = e.target.value; state.shown = 60; renderList(); };
  $('#fCity').oninput = e => { clearTimeout(deb); deb = setTimeout(() => { state.city = e.target.value; state.shown = 60; renderList(); }, 250); };
  $('#fSort').onchange = e => { state.sort = e.target.value; state.shown = 60; renderList(); };
  $('#clearFilters').onclick = () => { resetListFilters(); renderList(); };
  $('#moreBtn').onclick = () => { state.shown += 60; renderList(); };
  $('#drawerClose').onclick = () => $('#drawer').hidden = true;
  $('#drawer').onclick = e => { if (e.target.id === 'drawer') $('#drawer').hidden = true; };
  addEventListener('keydown', e => { if (e.key === 'Escape') $('#drawer').hidden = true; });
  $('#chainGroup').onchange = e => { state.chainGroup = e.target.value; renderChains(); };
  $('#chainAdd').onchange = e => {
    const v = e.target.value.trim(); if (!v) return;
    state.extraChains.push([v, new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')]); e.target.value = ''; renderChains();
  };
  if (/ingested=isracard/.test(location.search)) $('#isrStatus').textContent = `נתוני ישראכרט נשמרו (${fmt(sources.isracard?.count || 0)} הטבות).`;
}

(async () => {
  try { await load(); } catch (e) { $('#summaryLine').textContent = 'שגיאה בטעינת הנתונים – האם השרת (server.ps1) רץ?'; return; }
  wire();
  renderOverview();
  let v = 'overview'; try { v = localStorage.getItem('view') || v; } catch (e) {}
  showView(v);
})();
