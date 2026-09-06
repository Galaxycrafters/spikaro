/* =========================================================================
   SPIKARÖ — butikslogik
   Varukorg, prisvisning (privat / återförsäljare), filter och sortering.

   ARKITEKTUR
   Detta är ett skyltfönster med lokal varukorg. Betalning och order sker
   ännu inte här — se `checkout()` längst ned, som är den enda punkt där en
   riktig handelsplattform kopplas in. Allt ovanför den punkten är färdigt.
   ========================================================================= */

/* Alla sökvägar härleds ur modulens egen plats (…/assets/js/butik.js), så
   samma kod fungerar från startsidan, butiken och produktsidorna i /produkt/
   — och lika bra när siten ligger under ett underkatalog som /spikaro/.      */
export const ROT = new URL('../../', import.meta.url);
export const url = sokvag => new URL(sokvag, ROT).href;
const bild = fil => url(`assets/img/produkt/${fil}`);

const KATALOG_URL = url('data/katalog.json');
const LAGER_NYCKEL = 'spikaro.varukorg.v1';
const LAGE_NYCKEL  = 'spikaro.lage.v1';

/* ---------- Tillstånd ---------------------------------------------------- */
export const butik = {
  produkter: [],
  frakt: 79,
  fraktfriGrans: 800,     // affärsregel — justeras av Spikarö
  rader: new Map(),       // slug -> antal
  aterforsaljare: false,
};

/* ---------- Beständighet ------------------------------------------------- */
function las() {
  try {
    const r = JSON.parse(localStorage.getItem(LAGER_NYCKEL) || '[]');
    if (Array.isArray(r)) r.forEach(([s, n]) => butik.rader.set(s, n));
  } catch { /* privat läge eller rensad lagring — tom varukorg är rätt */ }
  try {
    butik.aterforsaljare = localStorage.getItem(LAGE_NYCKEL) === 'ater';
  } catch { /* ignoreras */ }
}
function spara() {
  try { localStorage.setItem(LAGER_NYCKEL, JSON.stringify([...butik.rader])); } catch { /* ignoreras */ }
  try { localStorage.setItem(LAGE_NYCKEL, butik.aterforsaljare ? 'ater' : 'privat'); } catch { /* ignoreras */ }
}

/* ---------- Pris --------------------------------------------------------- */
export const kr = n =>
  new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' kr';

/** Priset som ska visas i nuvarande läge. Privat = inkl. moms, ÅF = exkl. */
export const pris = p => (butik.aterforsaljare ? p.priceExVat : p.price);
export const prisSuffix = () => (butik.aterforsaljare ? 'exkl. moms' : 'inkl. moms');

export function summering() {
  let netto = 0, moms = 0, antal = 0;
  for (const [slug, n] of butik.rader) {
    const p = butik.produkter.find(x => x.slug === slug);
    if (!p) continue;
    antal += n;
    netto += p.priceExVat * n;
    moms  += (p.price - p.priceExVat) * n;
  }
  const varor = butik.aterforsaljare ? netto : netto + moms;
  const frakt = antal === 0 || varor >= butik.fraktfriGrans ? 0 : butik.frakt;
  return { antal, netto, moms, varor, frakt, total: varor + frakt };
}

/* ---------- Varukorg ----------------------------------------------------- */
export function lagg(slug, n = 1) {
  butik.rader.set(slug, Math.min(999, (butik.rader.get(slug) || 0) + n));
  spara(); sand();
}
export function satt(slug, n) {
  if (n <= 0) butik.rader.delete(slug); else butik.rader.set(slug, Math.min(999, n));
  spara(); sand();
}
export function tom() { butik.rader.clear(); spara(); sand(); }
export function sattLage(ater) { butik.aterforsaljare = !!ater; spara(); sand(); }

const sand = () => document.dispatchEvent(new CustomEvent('spikaro:andrad'));

/* ---------- Katalog ------------------------------------------------------ */
export async function ladda() {
  if (butik.produkter.length) return butik.produkter;
  const r = await fetch(KATALOG_URL);
  if (!r.ok) throw new Error(`Katalogen kunde inte läsas (${r.status})`);
  const d = await r.json();
  butik.produkter = d.products;
  if (typeof d.shippingFlat === 'number') butik.frakt = d.shippingFlat;
  return butik.produkter;
}

export const KATEGORIER = [
  { id: 'alla',     namn: 'Allt' },
  { id: 'kola',     namn: 'Kola & Karameller' },
  { id: 'choklad',  namn: 'Choklad' },
  { id: 'mandlar',  namn: 'Brända mandlar' },
  { id: 'present',  namn: 'Presentaskar' },
  { id: 'jul',      namn: 'Jul' },
];

export function filtrera(produkter, kategori, sortering) {
  let ut = produkter.filter(p =>
    kategori === 'alla' ? true : kategori === 'jul' ? p.seasonal : p.category === kategori
  );
  const collator = new Intl.Collator('sv');
  const sorterare = {
    namn:      (a, b) => collator.compare(a.name, b.name),
    prisUpp:   (a, b) => a.price - b.price || collator.compare(a.name, b.name),
    prisNed:   (a, b) => b.price - a.price || collator.compare(a.name, b.name),
    artnr:     (a, b) => collator.compare(a.artnr, b.artnr),
  };
  return ut.sort(sorterare[sortering] || sorterare.namn);
}

/* ---------- Vy: produktkort ---------------------------------------------- */
const SIGILL = `<svg class="card__seal" viewBox="0 0 60 60" aria-hidden="true">
  <ellipse cx="30" cy="30" rx="28" ry="21" fill="#f3e4bd" stroke="#a87c33" stroke-width="1.2"/>
  <ellipse cx="30" cy="30" rx="24.5" ry="17.5" fill="none" stroke="#a87c33" stroke-width=".6"/>
  <path d="M30 18v18M30 20l9 15H21z" fill="none" stroke="#5e4530" stroke-width="1.1"/>
  <path d="M20 37h20l-2.5 4h-15z" fill="#5e4530"/>
</svg>`;

export function kort(p) {
  const el = document.createElement('article');
  el.className = 'card reveal';
  el.dataset.slug = p.slug;
  const meta = [p.artnr && `Art. ${p.artnr}`, p.weight].filter(Boolean)
    .map(t => `<span>${t}</span>`).join('');
  el.innerHTML = `
    <a class="card__media" href="${url(`produkt/${p.slug}.html`)}" aria-label="${esc(p.name)}">
      <img src="${bild(`${p.image}@440.webp`)}" width="440" height="440" loading="lazy" decoding="async"
           alt="${esc(p.name)} från Spikarö">
      ${p.seasonal ? '<span class="card__tag card__tag--jul">Jul</span>' : ''}
      ${SIGILL}
    </a>
    <div class="card__body">
      <h3 class="card__name"><a href="${url(`produkt/${p.slug}.html`)}" style="text-decoration:none;color:inherit">${esc(p.name)}</a></h3>
      <div class="card__meta">${meta}</div>
      <div class="card__foot">
        <span class="card__price" data-pris>${kr(pris(p))} <small>${prisSuffix()}</small></span>
        <button class="card__add" type="button" data-lagg="${p.slug}">Lägg i korg</button>
      </div>
    </div>`;
  return el;
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Vy: varukorgslåda -------------------------------------------- */
export function kopplaLada() {
  const lada  = document.querySelector('[data-drawer]');
  const scrim = document.querySelector('[data-scrim]');
  if (!lada) return;

  const oppna = () => {
    lada.classList.add('is-on'); scrim.classList.add('is-on');
    lada.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lada.querySelector('[data-stang]')?.focus();
  };
  const stang = () => {
    lada.classList.remove('is-on'); scrim.classList.remove('is-on');
    lada.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.addEventListener('click', e => {
    if (e.target.closest('[data-oppna-korg]')) { e.preventDefault(); oppna(); }
    if (e.target.closest('[data-stang]') || e.target === scrim) stang();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') stang(); });
  document.addEventListener('spikaro:oppna', oppna);
  return { oppna, stang };
}

export function ritaLada() {
  const kropp = document.querySelector('[data-korg-kropp]');
  const fot   = document.querySelector('[data-korg-fot]');
  if (!kropp) return;

  const s = summering();

  if (s.antal === 0) {
    kropp.innerHTML = `<div class="empty">
      <span class="emblem-mark" aria-hidden="true"></span>
      <p>Varukorgen är tom. Skärgårdsgodiset väntar i butiken.</p>
    </div>`;
    fot.innerHTML = `<a class="btn btn--wide btn--ghost" href="${url('butik.html')}">Till butiken</a>`;
    return;
  }

  kropp.innerHTML = [...butik.rader].map(([slug, n]) => {
    const p = butik.produkter.find(x => x.slug === slug);
    if (!p) return '';
    return `<div class="line">
      <img src="${bild(`${p.image}@440.webp`)}" alt="" width="62" height="62" loading="lazy">
      <div>
        <div class="line__name">${esc(p.name)}</div>
        <div class="line__meta">Art. ${esc(p.artnr)}${p.weight ? ' · ' + esc(p.weight) : ''} · ${kr(pris(p))}</div>
        <div class="stepper">
          <button type="button" data-minska="${slug}" aria-label="Minska antal">−</button>
          <span class="num">${n}</span>
          <button type="button" data-oka="${slug}" aria-label="Öka antal">+</button>
        </div>
      </div>
      <div class="line__price num">${kr(pris(p) * n)}</div>
    </div>`;
  }).join('');

  const kvar = butik.fraktfriGrans - s.varor;
  fot.innerHTML = `
    ${s.frakt > 0 && kvar > 0 ? `<div class="ship-hint">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>
      <span>Handla för ${kr(kvar)} till så bjuder vi på frakten.</span></div>` : ''}
    <div class="sums">
      <div><span>Varor</span><span class="num">${kr(s.varor)}</span></div>
      <div class="muted"><span>${butik.aterforsaljare ? 'Moms tillkommer (12 %)' : 'Varav moms (12 %)'}</span><span class="num">${kr(s.moms)}</span></div>
      <div><span>Frakt${s.frakt === 0 ? ' (fri)' : ' · DHL'}</span><span class="num">${s.frakt === 0 ? '0,00 kr' : kr(s.frakt)}</span></div>
      <div class="total"><span>Att betala</span><span class="num">${kr(s.total)}</span></div>
    </div>
    <button class="btn btn--wide" type="button" data-kassa>Till kassan</button>
    <button class="btn btn--wide btn--ghost" type="button" data-tom style="margin-top:.5rem">Töm varukorgen</button>`;
}

/* ---------- Bindningar --------------------------------------------------- */
export function kopplaHandelser() {
  document.addEventListener('click', e => {
    const l = e.target.closest('[data-lagg]');
    if (l) {
      lagg(l.dataset.lagg, Number(l.dataset.antal || 1));
      l.classList.add('is-added');
      const org = l.textContent;
      l.textContent = 'Tillagd ✓';
      setTimeout(() => { l.classList.remove('is-added'); l.textContent = org; }, 1400);
    }
    const o = e.target.closest('[data-oka]');    if (o) satt(o.dataset.oka, (butik.rader.get(o.dataset.oka) || 0) + 1);
    const m = e.target.closest('[data-minska]'); if (m) satt(m.dataset.minska, (butik.rader.get(m.dataset.minska) || 0) - 1);
    if (e.target.closest('[data-tom]'))   tom();
    if (e.target.closest('[data-kassa]')) checkout();
  });

  document.addEventListener('spikaro:andrad', () => {
    ritaLada();
    ritaRaknare();
    document.querySelectorAll('[data-pris]').forEach(el => {
      const slug = el.closest('[data-slug]')?.dataset.slug;
      const p = butik.produkter.find(x => x.slug === slug);
      if (p) el.innerHTML = `${kr(pris(p))} <small>${prisSuffix()}</small>`;
    });
  });
}

export function ritaRaknare() {
  const s = summering();
  document.querySelectorAll('[data-korg-antal]').forEach(el => {
    const forra = el.textContent;
    el.textContent = s.antal;
    el.classList.toggle('is-on', s.antal > 0);
    if (forra !== String(s.antal) && s.antal > 0) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  });
}

/* ---------- Kassan — inkopplingspunkten ---------------------------------- *
 * Här, och bara här, tar en riktig handelsplattform över. Varukorgen är
 * redan en ren lista av { artnr, slug, antal } vilket är allt en
 * Checkout Session behöver.
 *
 *   const svar = await fetch('/api/checkout', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ rader: raderForKassa(), lage: butik.aterforsaljare ? 'ater' : 'privat' })
 *   });
 *   location.href = (await svar.json()).url;   // Stripe / Klarna / Swish
 * ------------------------------------------------------------------------ */
export function raderForKassa() {
  return [...butik.rader].map(([slug, antal]) => {
    const p = butik.produkter.find(x => x.slug === slug);
    return { slug, artnr: p?.artnr, namn: p?.name, antal, styckpris: p?.price, momssats: p?.vatRate };
  });
}

function checkout() {
  const s = summering();
  console.info('[spikaro] Order redo för betalning:', { rader: raderForKassa(), summering: s });
  const ruta = document.querySelector('[data-kassa-info]');
  if (ruta) { ruta.hidden = false; ruta.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

/* ---------- Uppstart ----------------------------------------------------- */
las();
