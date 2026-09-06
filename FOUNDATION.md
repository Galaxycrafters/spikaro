# Spikarö — grunden för den nya plattformen

Detta är fundamentet för Spikarö Karamell & Pralins nya sajt: designsystem,
skyltfönster, butik och 38 riktiga produktsidor. Allt innehåll, alla priser
och alla bilder kommer från företagets egen verksamhet — ingenting är påhittat.

Utgångspunkten är genomgången av den gamla sajten. De tre allvarligaste
felen där — butiken i en frameset, ingen kassa, och produkter som var
osynliga för Google — är åtgärdade i grunden här.

---

## 1. Varumärket — varifrån formspråket kommer

Ingen del av designen är påhittad. Varje val är mätt eller läst ur Spikarös
faktiska förpackningar och logotyp.

| Element | Källa |
|---|---|
| Graverad skärgårdsslup | Logotypen (`littlelogo2.png` från gamla sajten) |
| Sepiabläck `#391505` | Uppmätt ur logotypens ordbild |
| Salviagrön `#7e8f58` | Presentaskens randiga etikett (`#899d63` i foto, korrigerad för ljus) |
| Markisranden | Den gröna/krämvita randen på presentaskarnas etikett |
| Kraftpapper `#f2ead9` | Displayaskar, strutar och presentaskar |
| Mässing `#a87c33` | De ovala guldsigillen på de svarta kolapappren |
| Spärrade versaler | Ordbilden `SPIKARÖ / KARAMELL & PRALIN / FABRIKS AKTIEBOLAG` |
| Historiska fotografier | Carl Lindvalls speceriaffär, Södermalm i Sundsvall, ca 1910 |

### Varumärkeslåset

Låset är delat i två delar, och det är avsiktligt:

- **Slupen** är en bild, vektoriserad ur graveringen.
- **SPIKARÖ / KARAMELL & PRALIN** är **levande text** satt i Cinzel.

Ordbilden är alltså inte längre inbränd i en PNG. Den är knivskarp i alla
storlekar, följer temat, går att markera, söka i och läsa upp — och kan sättas
om utan att någon rör en bildfil.

Emblemet läggs på som CSS-mask med `background-color: currentColor`, så slupen
tar färg av texten omkring sig. Därför behövs **en enda fil** för både ljust och
mörkt läge och för den mörkgröna sidfoten. Inga filter, inga inverterade kopior.

Slupen finns i **två utföranden**, som gör olika jobb:

| Fil | Storlek | Används |
|---|---|---|
| `emblem-slup.svg` | 128 kB (49 kB gzip) | Fartyget — skrov, master, segel, rigg, besättning. Startsidans **rörliga** lager. |
| `emblem-sjo.svg` | 45 kB (17 kB gzip) | Himmel, vatten och konstnärens signatur. Ligger **stilla** bakom fartyget. |
| `emblem-mark.svg` | 72 kB (29 kB gzip) | Hela fartyget i ett, hårdare förenklat. Litet i sidhuvud, sidfot och varukorg — på varje sida. |

Två skäl till uppdelningen.

**Rörelsen.** Ett skrov gungar; havet gör det inte. Låg allt i en enda fil
vaggade hela världen med när slupen rörde sig. Nu ligger sjön still och bara
fartyget rullar, kring vattenlinjen där ett skrov faktiskt vrider sig.

**Vikten.** Teckningen är omkring 1 050 separata penndrag. I sidhuvudet visas
den i 56 px, där all skraffering ändå bara blir grå gröt. Märket ger samma
silhuett för en tredjedel av vikten, och det är den fil varje sida betalar för —
scenens två lager laddas bara på startsidan.

Originalen ligger i `brand-source/` — utanför `public/`, så de versionshanteras
men skickas aldrig till besökaren. `logo-sailboat.png` (1945 × 2037) är källan
allt annat genereras ur.

---

## 2. Filer

```
public/
  index.html                 startsidan
  butik.html                 butiken: filter, sortering, prisläge, varukorg
  produkt/<slug>.html        38 genererade produktsidor — RÖR EJ, se §5
  sitemap.xml                genererad
  robots.txt                 genererad
  data/katalog.json          hela sortimentet — den enda sanningskällan
  assets/
    css/spikaro.css          designsystemet, ett enda ark, numrerade avsnitt
    js/butik.js              varukorg, priser, filter, kassans inkopplingspunkt
    js/rorelse.js            rörelse, tema, meny
    img/brand/               emblem-slup.svg, emblem-mark.svg, favikon.png
    img/arkiv/               historiska fotografier
    img/produkt/             38 produktbilder, 800 px och 440 px i WebP
build/
  generera.mjs               bygger produktsidor + sitemap + robots.txt
  vektorisera.sh             gör om graverad bild till SVG + favikon
brand-source/                original, versionshanteras men publiceras inte
  logo-sailboat.png          1945 × 2037, källan till slupen
  spikaro-logotyp-original.png  gamla sajtens inbrända ordbild, för referens
```

---

## 3. Katalogen

`public/data/katalog.json` är den enda sanningskällan. Allt — startsidans urval,
butiken, varukorgen och de genererade produktsidorna — läser därifrån.

```json
{
  "slug": "kolastanger-salt-lakrits",
  "artnr": "1056",
  "name": "Kolastänger Salt-Lakrits",
  "category": "kola",
  "seasonal": false,
  "price": 19.0,            // kr inkl. 12 % moms — som privatkund ser det
  "priceExVat": 16.96,      // härlett, visas i återförsäljarläget
  "vatRate": 0.12,
  "weight": "50 g",
  "description": "En gammaldags kola som inte fastnar i tänderna …",
  "ingredients": "Socker Stärkelsesirap Veg. fett (kokos) …",
  "nutrition": "Energi 1595 kJ/381 kcal, Fett 11,5 gr. …",
  "traces": "Kan innehålla spår av jordnötter.",
  "flags": ["Glutenfri"],
  "image": "131000",        // filnamn i assets/img/produkt/
  "legacyPid": "131000"     // id i den gamla ASP-butiken, för spårbarhet
}
```

**Kategorierna är omgjorda.** På gamla sajten låg allt utom en enda vara under
*Godis och Kola*; kategorin *Choklad* innehöll en (1) produkt trots att texten
lovade chokladdoppade mandlar. Nu:

| Kategori | Artiklar | Innehåll |
|---|---|---|
| `kola` | 14 | Kolastänger, 19 kr |
| `choklad` | 10 | Chokladdoppad kola och mörk choklad |
| `mandlar` | 5 | Brända mandlar, strut till lösvikt |
| `present` | 9 | Presentaskar |
| `jul` | 4 | Säsongsflagga, korsar kategorierna |

### Att rätta i datat

Detta är fel som finns i källdatat och som bör åtgärdas hos Spikarö:

- **Ingredienserna saknar kommatecken.** De ligger som `Socker Stärkelsesirap
  Veg. fett (kokos)` — separatorerna gick förlorade i den gamla butiken. EU:s
  livsmedelsinformationsförordning kräver avgränsad lista. De går inte att dela
  maskinellt utan att gissa (`Emulg. medel E471` är en post, inte tre), så de
  behöver skrivas om en gång för hand.
- **Fyra presentaskar heter alla "Kolablandning".** De skiljs bara av artikelnummer
  (1145, 1146, 1147, 1148) och innehåll. De behöver egna namn.
- **Sylten finns inte.** Gamla sajtens metabeskrivning och butikstext lovar
  *sylt på norrländska bär*. Ingen sylt finns i sortimentet. Lägg till eller stryk.
- **Bumlingar och Strandbönor** nämndes i kategoritexten men finns inte som artiklar.
- **Vikt saknas på 10 artiklar**, främst presentaskarna.

---

## 4. Vektorisera om slupen

Kommer en ny eller skarpare skanning — lägg den i `brand-source/` och kör:

```bash
build/vektorisera.sh brand-source/logo-sailboat.png
```

Skriptet plattar ut genomskinlighet, delar teckningen i fartyg och bakgrund,
trösklar och kör `potrace`. Ut kommer `emblem-slup.svg`, `emblem-sjo.svg`,
`emblem-mark.svg` och `favikon.png`, med `fill="currentColor"` på banorna.
Tar under tio sekunder. Kräver `potrace` och `ffmpeg`
(`sudo apt install potrace ffmpeg`).

**Så delas fartyget från bakgrunden** (`build/separera.py`): fartyget är en
sammanhängande massa — skrov, mast, bom, segelkanter, vant och stag hänger ihop
hela vägen, medan himmels- och vågstrecken är fristående penndrag som inte rör
vid skrovet. Skriptet etiketterar sammanhängande områden och tar det största som
fartyg. Skraffering *inuti* seglen ligger som lösa streck som inte nuddar
segelkanten; de fångas av ett omslutningstest — har en punkt fartygsbläck åt
alla fyra håll ligger den innanför fartyget och hör dit. Utfallet på nuvarande
källa: 1 019 områden, varav 471 omslutna, 87 % av bläcket till fartyget.

Beskärningen till märket anges i andelar av originalets mått, så den följer med
även om en ny skanning har andra pixelmått.

Vektorisering är rätt väg för en pennteckning — bättre än att skala upp ett
raster, eftersom strecken blir riktiga kurvor i stället för utsmetade pixlar.
Vill man skruva: `--turdsize` slänger småprickar, `-a` jämnar hörn och `-O`
styr hur hårt kurvorna förenklas. Högre värden ger mindre fil och grövre streck.

## 5. Bygga om produktsidorna

Produktsidorna är **genererade**. Redigera dem inte för hand — ändringarna
skrivs över. Ändra `katalog.json` och kör om:

```bash
node build/generera.mjs
```

Det skriver `public/produkt/<slug>.html` (en per artikel), `sitemap.xml` och
`robots.txt`, och städar bort sidor för artiklar som tagits ur katalogen.

Varje sida får det den gamla butiken saknade:

- egen adress, delbar och länkbar
- ett riktigt `<h1>` med produktnamnet
- unik `<title>`, metabeskrivning, canonical och Open Graph
- `schema.org/Product` med pris, valuta, lagerstatus, artikelnummer, frakt,
  `NutritionInformation` per 100 g och `GlutenFreeDiet` där det gäller
- `BreadcrumbList`
- beskrivande `alt`-text på bilden

---

## 6. Butiken

**Prisläge.** Växeln *Återförsäljare* i butiken slår om hela sajten mellan
privatpris (inkl. 12 % moms) och pris exkl. moms. Valet sparas per besökare.

Ett förtydligande som är viktigt att inte tappa bort: den exkl.-moms-siffran är
konsumentpriset utan moms — **inte** ett nettopris. Spikarös verkliga
återförsäljarpriser är avtalade per kund och finns inte i det här datat. Därför
säger notisen i återförsäljarläget uttryckligen att avtalade nettopriser visas
efter inloggning. Bygg inte om detta till att låtsas vara grossistprislista
förrän riktiga nettopriser finns.

**Varukorgen** ligger i `localStorage` och överlever sidbyten. Summeringen
räknar varor, moms och frakt (79 kr, fri från 800 kr — justera `fraktfriGrans`
i `butik.js`).

**Kassan är inte inkopplad.** Det är avsiktligt och det är den enda punkt som
återstår innan sajten kan ta betalt:

```js
// public/assets/js/butik.js
function checkout() { … }        // ← här tar betaltjänsten över
export function raderForKassa()  // ← ger { slug, artnr, namn, antal, styckpris, momssats }
```

Allt ovanför den funktionen är färdigt. Att koppla in Stripe, Klarna eller
Swish Handel är ett anrop till en endpoint som returnerar en betallänk.

---

## 7. Designsystemet

`spikaro.css` är ett ark med numrerade avsnitt (§1 tokens … §20 kassamodal).

**Färgerna sätts som tokens i tre lägen** — `:root` (ljust), systemets mörka
läge, och explicit valt mörkt läge. Ingen färg definieras bara inuti en
mediefråga; då hade sidan renderat ena temats text på det andras botten.

Två fällor värda att känna till. Den första: fristående bilder måste ha
`height: auto` när bredden sätts i CSS — annars använder webbläsaren
`height`-attributet bokstavligt och bilden sträcks ut. Det gäller globalt via
`img`-regeln i §2. Den andra: `--deep-bg` / `--deep-fg` är egna tokens för de
gröna panelerna (ticker, arvsektionen, sidfoten). De får **aldrig** härledas ur
`--paper`/`--ink`, eftersom de då kastas om i mörkt läge och panelen blir ljus
mitt på en mörk sida. Det felet fanns i första utkastet och är rättat.

**Typsnitt:** Cinzel (spärrade versaler, ekar ordbilden), Cormorant Garamond
(rubriker) och Karla (brödtext och gränssnitt).

**Rörelse.** Allt innehåll är synligt utan JavaScript. Klassen `js` sätts först
när skriptet kör, och det är den som aktiverar döljandet före avslöjandet.
`prefers-reduced-motion` stänger av allt. Animationerna är:
slupen som guppar, tre vågskikt som driver i olika takt, markisranden som
sveper in, vindrosen som snurrar, textbandet, sigillet på produktkort vid hover,
sidhuvudet som krymper och varukorgen som glider in.

---

## 8. Prestanda

Bilderna var det största enskilda problemet på gamla sajten: miniatyrbilden
`/tn/…jpg` var **byte för byte identisk** med originalet, så en kategorisida
laddade 29 bilder på 5,73 MB för att visa ett rutnät av småbilder.

Här är varje produktbild genererad i två storlekar som WebP:

| | Gamla sajten | Nu |
|---|---|---|
| Rutnätsbild | 202 kB (i praktiken originalet) | **25 kB** |
| Detaljbild | 202 kB | 43 kB |
| Hela sortimentet i rutnät | 5,73 MB för 29 st | **0,95 MB för 38 st** |

Alla bilder har `width`/`height` (ingen layoutförskjutning), `loading="lazy"`
utom den första på produktsidan, och beskrivande `alt`.

---

## 9. Vad som återstår

I ungefärlig ordning:

1. **Koppla in betalning.** Se §6. Utan den kan sajten inte ta emot order.
2. **Reda ut exporten från LAN Konsult.** Det här bygget läser 38 artiklar som
   hämtats från den publika sajten. Order- och kundhistorik, återförsäljarkonton
   och bilder i originalupplösning finns bara i den gamla plattformen.
3. **Riktiga nettopriser för återförsäljare**, bakom inloggning. Grossist är
   huvudaffären och förtjänar mer än en prisväxel.
4. **Rätta katalogdatat** enligt listan i §3 — särskilt ingredienserna.
5. **Återförsäljarkarta.** Spikarö säljs hos handlare runt Sundsvall och hos
   flera nätbutiker. Ingen av dem nämns på sajten idag.
6. **Recept.** Sidan låg i huvudmenyn på gamla sajten och var tom. Recept med
   Spikarös egen kola och choklad är bra innehåll för en konfektyrtillverkare.
7. **Samtyckesbanner** innan analys sätts på. Den gamla sajten laddade Google
   Analytics före allt samtycke. Ingen spårning finns i det här bygget.
8. **Köpvillkor, integritetspolicy och cookies** som egna sidor. Texterna
   finns på gamla sajten och är i huvudsak användbara — rubriken på
   integritetspolicyn var dock felstavad ("INTERGTETS POLICY").

---

## 10. Köra lokalt

```bash
cd public && python3 -m http.server 8099
```

Sajten ligger under `/spikaro/` på Tailscale-värden. Alla sökvägar är
relativa och `butik.js` härleder sina adresser ur modulens egen plats, så
den fungerar lika bra i en underkatalog som i roten.
