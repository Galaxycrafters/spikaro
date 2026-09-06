/* =========================================================================
   SPIKARÖ — organisationsnummer

   Validering och formatering av svenska organisationsnummer. Ren funktion
   utan beroenden, som ES-modul — samma fil används i registreringsformuläret
   i webbläsaren och i backend när ansökan tas emot.

   VIKTIGT OM VAD DET HÄR *INTE* ÄR
   Ett organisationsnummer är offentlig uppgift. Det går att slå upp på
   allabolag.se för vilket företag som helst i landet. Att någon skriver in ett
   giltigt nummer bevisar därför ingenting om att personen får företräda
   företaget — det är en uppgift, inte ett lösenord.

   Kontrollen här säger tre saker och inte mer:
     · numret är korrekt uppbyggt (Luhn stämmer)
     · det ser ut som ett företag och inte en privatperson
     · vilken bolagsform siffrorna anger

   Behörigheten att handla i företagets namn måste avgöras någon annanstans:
   av Spikarö, när ansökan godkänns. Se B2B-PLAN.md §3.
   ========================================================================= */

/** Bolagsformer enligt gruppnumret, alltså numrets första siffra. */
const GRUPPER = {
  1: 'Dödsbo',
  2: 'Stat, landsting, kommun eller församling',
  3: 'Utländskt företag med svensk filial',
  5: 'Aktiebolag',
  6: 'Enkelt bolag',
  7: 'Ekonomisk förening eller bostadsrättsförening',
  8: 'Ideell förening eller stiftelse',
  9: 'Handelsbolag, kommanditbolag eller enskild firma',
};

/**
 * Plockar fram de tio siffrorna ur vad användaren än skrivit.
 * Tål mellanslag, bindestreck och sekelprefixet 16.
 * @returns {string|null} tio siffror, eller null om det inte går att tyda
 */
export function normalisera(inmatning) {
  if (typeof inmatning !== 'string' && typeof inmatning !== 'number') return null;
  let s = String(inmatning).replace(/[\s\-–—]/g, '');
  if (!/^\d+$/.test(s)) return null;
  if (s.length === 12 && s.startsWith('16')) s = s.slice(2);
  return s.length === 10 ? s : null;
}

/** Luhns algoritm (modulus 10), räknad över alla tio siffrorna. */
export function luhn(tioSiffror) {
  let summa = 0;
  for (let i = 0; i < tioSiffror.length; i++) {
    let d = Number(tioSiffror[i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    summa += d;
  }
  return summa % 10 === 0;
}

/**
 * Granskar ett organisationsnummer.
 * @returns {{giltigt: boolean, fel?: string, nummer?: string, formaterat?: string, bolagsform?: string}}
 */
const PERSONNUMMER_BESKED =
  'Det här ser ut som ett personnummer. Driver du enskild firma använder du det som organisationsnummer, '
  + 'men då behöver vi ta emot ansökan manuellt — mejla maggan@spikaro.se.';

export function granska(inmatning) {
  // Tolv siffror som börjar på 19 eller 20 är ett personnummer med sekel,
  // inte ett organisationsnummer. Fånga det före normaliseringen, annars
  // faller det igenom till det intetsägande "tio siffror"-beskedet.
  const siffror = String(inmatning ?? '').replace(/[\s\-–—]/g, '');
  if (/^(19|20)\d{10}$/.test(siffror)) {
    return { giltigt: false, fel: PERSONNUMMER_BESKED };
  }

  const n = normalisera(inmatning);
  if (!n) {
    return { giltigt: false, fel: 'Ett organisationsnummer består av tio siffror, till exempel 556443-7431.' };
  }
  // Tredje siffran är minst 2 för en juridisk person. Är den lägre har någon
  // skrivit sitt personnummer — vanligt misstag, och värt ett eget besked.
  if (Number(n[2]) < 2) {
    return { giltigt: false, fel: PERSONNUMMER_BESKED };
  }
  if (!GRUPPER[n[0]]) {
    return { giltigt: false, fel: 'Numret börjar på en siffra som inte hör till någon svensk bolagsform.' };
  }
  if (!luhn(n)) {
    return { giltigt: false, fel: 'Kontrollsiffran stämmer inte. Kontrollera att alla tio siffror är rätt.' };
  }
  return {
    giltigt: true,
    nummer: n,
    formaterat: formatera(n),
    bolagsform: GRUPPER[n[0]],
  };
}

/** Skriver numret som 556443-7431. */
export function formatera(inmatning) {
  const n = normalisera(inmatning);
  return n ? `${n.slice(0, 6)}-${n.slice(6)}` : null;
}
