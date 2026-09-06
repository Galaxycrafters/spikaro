/* =========================================================================
   SPIKARÖ — rörelse
   Allt innehåll är synligt utan JavaScript. Klassen `js` sätts först när
   skriptet kör, och det är den som aktiverar döljandet före avslöjandet —
   så sidan är fullt läsbar även om skriptet aldrig laddas.
   ========================================================================= */

const stillsam = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Markera att JS finns — först nu får .reveal döljas (se CSS §17) */
if (!stillsam) document.documentElement.classList.add('js');

/* ---------- Avslöjande vid scroll ---------------------------------------- */
export function avsloja() {
  const mal = document.querySelectorAll('.reveal, .stripe[data-reveal]');
  if (!mal.length) return;

  if (stillsam || !('IntersectionObserver' in window)) {
    mal.forEach(el => el.classList.add('is-in'));
    return;
  }

  // Allt som redan syns i första bildrutan visas direkt, utan animering.
  const obs = new IntersectionObserver((poster, o) => {
    poster.forEach(p => {
      if (p.isIntersecting) { p.target.classList.add('is-in'); o.unobserve(p.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  mal.forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
    else obs.observe(el);
  });

  // Skyddsnät: om observatören aldrig utlöses visas allt ändå.
  setTimeout(() => mal.forEach(el => el.classList.add('is-in')), 4000);
}

/* Varje bindning sker en enda gång, även om start() anropas flera gånger
   (startsidan gör det: en gång direkt, en gång när korten är på plats).     */
const bundet = new Set();
const enGang = namn => (bundet.has(namn) ? true : (bundet.add(namn), false));

/* ---------- Sidhuvud som krymper ----------------------------------------- */
export function sidhuvud() {
  const h = document.querySelector('.masthead');
  if (!h || enGang('sidhuvud')) return;
  const uppdatera = () => h.classList.toggle('is-stuck', window.scrollY > 24);
  uppdatera();
  addEventListener('scroll', uppdatera, { passive: true });
}

/* ---------- Mobilmeny ---------------------------------------------------- */
export function meny() {
  const knapp = document.querySelector('[data-nav-toggle]');
  const nav   = document.querySelector('.nav');
  if (!knapp || !nav || enGang('meny')) return;
  knapp.addEventListener('click', () => {
    const pa = nav.classList.toggle('is-on');
    knapp.setAttribute('aria-expanded', String(pa));
  });
  nav.addEventListener('click', e => {
    if (e.target.tagName === 'A') { nav.classList.remove('is-on'); knapp.setAttribute('aria-expanded', 'false'); }
  });
}

/* ---------- Ljust / mörkt ------------------------------------------------ */
export function tema() {
  if (enGang('tema')) return;
  const NYCKEL = 'spikaro.tema';
  let val = null;
  try { val = localStorage.getItem(NYCKEL); } catch { /* ignoreras */ }
  if (val === 'dark' || val === 'light') document.documentElement.dataset.theme = val;

  document.querySelectorAll('[data-tema]').forEach(k => {
    k.addEventListener('click', () => {
      const nu = document.documentElement.dataset.theme
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const nytt = nu === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nytt;
      try { localStorage.setItem(NYCKEL, nytt); } catch { /* ignoreras */ }
    });
  });
}

/* ---------- Ticker: dubblera spåret så slingan blir sömlös --------------- */
export function ticker() {
  document.querySelectorAll('.ticker__track').forEach(t => {
    if (t.dataset.klonad) return;
    t.innerHTML += t.innerHTML;
    t.dataset.klonad = '1';
  });
}

export function start() { sidhuvud(); meny(); tema(); ticker(); avsloja(); }
