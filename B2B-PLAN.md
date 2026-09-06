# Spikarö — återförsäljarportal

Grossist är 99 % av affären. Den här delen är alltså inte ett tillägg till
butiken, den *är* butiken; skyltfönstret utåt är den mindre halvan.

Dokumentet beskriver vad som ska byggas, i vilken ordning, och två saker som
måste avgöras innan bygget börjar.

---

## 1. Två saker att reda ut först

### Organisationsnummer kan inte ersätta ett godkännande

Uppdraget beskrev godkännande *eller* registrering med organisationsnummer som
två vägar till konto. Det går inte att ställa dem mot varandra, för
**organisationsnumret är en offentlig uppgift**. Vem som helst slår upp vilket
företag som helst på allabolag.se på tio sekunder. Att någon kan skriva in ett
giltigt nummer säger ingenting om att personen får handla i det företagets namn.

Skulle numret ensamt öppna kontot innebär det i praktiken att
Spikarös nettopriser — den känsligaste uppgiften i hela verksamheten — ligger
öppna för vem som helst som känner till en konkurrents organisationsnummer.

Godkännandet är dessutom redan Spikarös egen rutin. Köpvillkoren för
återförsäljare säger ordagrant att *sedvanlig kreditprövning sker* och att *nya
kunder betalar mot förskott*. Kreditprövningen **är** godkännandesteget. Det är
inte byråkrati som lagts på, det är den befintliga affärsprocessen.

Så här hänger de ihop i stället för att utesluta varandra:

| Steg | Vad det avgör | Vem gör det |
|---|---|---|
| Organisationsnummer | Att numret är korrekt uppbyggt och tillhör ett företag | Automatiskt, direkt i formuläret |
| Företagsuppslag | Att företaget finns och är aktivt, samt dess registrerade namn | Automatiskt, mot register |
| Godkännande | Att personen får företräda företaget, och att företaget är kreditvärdigt | Spikarö, för hand |

Numret sållar bort felskrivningar och kortar ansökan. Det ersätter inte det sista
steget, och det steget kan inte automatiseras bort.

### En statisk sajt kan inte ha inloggning

Det som finns i `public/` i dag är filer utan server. Riktig inloggning kräver
någonstans att köra kod: lösenord som hashas, sessioner som utfärdas, behörighet
som prövas vid varje anrop.

Ett inloggningsformulär i JavaScript mot en lista i en JSON-fil vore inte en
förenklad inloggning utan en attrapp — alla konton, och framför allt alla
nettopriser, skulle ligga öppna för var och en som trycker på F12. **Den vägen
byggs inte**, oavsett hur mycket snabbare den ser ut.

Val av var backend ska köra är därför nästa beslut, och det avgör allt annat.
Alternativen står i §6.

---

## 2. Vad en återförsäljare ska kunna göra

Ordnat efter hur ofta det används, vilket är samma ordning som det bör byggas i.

1. **Beställa igen.** Handlaren beställer i stort sett samma sortiment varje
   gång. En "beställ om"-knapp på en tidigare order sparar mer tid än något
   annat i portalen.
2. **Se sina nettopriser.** Avtalade, per kund. Aldrig synliga före godkännande.
3. **Lägga en order** med eget referensnummer eller inköpsordernummer. B2B-kunder
   behöver det för sin egen bokföring — utan referensfältet blir fakturan svår
   att stämma av hos dem.
4. **Se orderhistorik och status** — mottagen, packad, skickad, fakturerad.
5. **Hämta prislista som PDF.** Efterfrågas alltid; ligger ofta i pärm hos kunden.
6. **Sköta sina uppgifter** — leveransadresser, kontaktpersoner, fler
   användarkonton på samma företag.

Och för Spikarö:

7. **Ta ställning till ansökningar** — godkänn, avslå, pausa.
8. **Sätta prislista och betalningsvillkor** per kund.
9. **Se inkomna ordrar** och ändra status.

---

## 3. Datamodell

Sju tabeller. Namnen är på svenska, som resten av koden.

```
foretag
  id, orgnr (unikt, tio siffror), namn, status,
  prislista_id, betalningsvillkor (dagar), kreditgräns,
  faktura_adress, godkand_av, godkand_datum, anteckning

  status: ansökt | godkänd | pausad | avvisad
          Ansökt ser inga priser. Pausad kan logga in men inte beställa —
          används vid utebliven betalning, i stället för att radera kontot.

anvandare
  id, foretag_id, namn, epost (unikt), telefon, roll, status
  roll: bestallare | foretagsadmin
  Lösenord lagras ALDRIG här — det sköts av inloggningstjänsten.
  Ett företag kan ha flera användare; butikschefen och den som packar upp.

leveransadress
  id, foretag_id, namn, gata, postnr, ort, ar_standard
  Kedjor levererar till flera butiker på en faktura.

prislista
  id, namn, beskrivning
  En per kund där det behövs, annars delade nivåer.

prisrad
  prislista_id, artnr, nettopris
  Artnr pekar mot katalog.json. Saknas raden gäller inget pris —
  varan är helt enkelt inte säljbar för den kunden.

order
  id, foretag_id, anvandare_id, ordernummer, status,
  kundreferens, leveransadress_id, onskad_leverans,
  summa_netto, summa_moms, skapad

  status: mottagen | bekräftad | packad | skickad | fakturerad | annullerad

orderrad
  order_id, artnr, benamning, antal, nettopris_styck, momssats
```

Två saker i modellen som är lätta att göra fel och dyra att rätta i efterhand:

**Orderraden fryser priset.** `nettopris_styck` skrivs in när ordern läggs och
läses aldrig från prislistan igen. Ändras prislistan i mars får inte en order
från januari nya siffror — då stämmer inte fakturan med vad kunden såg.

**Konton avslutas inte, de pausas.** Ordrar måste gå att följa i sju år enligt
bokföringslagen. Ett raderat företag tar orderhistoriken med sig.

---

## 4. Vägen in för en ny återförsäljare

```
  Ansökan                    org.nr, företagsnamn, kontaktperson,
     │                       leveransadress, ungefärlig volym
     ▼
  Kontroll av numret         Luhn + bolagsform. Direkt i formuläret,
     │                       innan något skickas. (orgnr.js — klar)
     ▼
  Uppslag i företagsregister  finns företaget? är det aktivt?
     │                        stämmer namnet? (valfritt, se §6)
     ▼
  status = ansökt            Kvitto på skärmen och i mejl:
     │                       "vi hör av oss inom två arbetsdagar"
     │                       Spikarö får en avisering.
     ▼
  Kreditprövning             Spikarö, för hand. Redan deras rutin.
     │
     ├── avslag ──────────►  status = avvisad, artigt mejl
     │
     ▼
  Godkännande                Prislista och betalningsvillkor sätts.
     │                       Nya kunder: förskott. Etablerade: faktura 20 dagar.
     ▼
  Inbjudan                   Engångslänk på mejl där användaren sätter
     │                       sitt eget lösenord. Vi skickar aldrig lösenord.
     ▼
  status = godkänd           Nettopriser syns. Beställning möjlig.
```

Ansökningsformuläret är en publik skrivpunkt och måste ha spärr mot
massinskickning — annars fylls inkorgen av skräp första veckan.

---

## 5. Säkerhetskrav som inte är förhandlingsbara

- **Lösenord hanteras av inloggningstjänsten.** Aldrig i det här repot, aldrig i
  `localStorage`, aldrig i ett mejl.
- **Nettopriser lämnar aldrig servern oautentiserat.** De får inte ligga i
  `katalog.json` eller någon annan publik fil. Konsumentpriser är offentliga,
  nettopriser är det inte.
- **Behörighet prövas per rad, inte i gränssnittet.** En inloggad användare ska
  bara kunna läsa sitt eget företags ordrar — och det ska gälla även om någon
  ändrar ett id i adressfältet. Att dölja knappen räcker inte.
- **Organisationsnummer är personuppgift när det gäller enskild firma** — då är
  numret personnumret. GDPR gäller för hela registret.
- **Loggför godkännanden och prisändringar** med vem och när. Det är den enda
  vägen att i efterhand svara på varför en kund fick ett visst pris.

---

## 6. Var ska det köra? — beslut som behövs

Tre rimliga vägar. Skillnaden ligger inte i vad kunden ser, utan i vem som får
underhålla det om tre år.

### A. Supabase bakom nuvarande sajt

Postgres med inbyggd inloggning och radnivåbehörighet. Frontend som redan är
byggd behålls; en `/konto`-del läggs till.

- Radnivåbehörigheten passar problemet ovanligt väl — "se bara ditt eget
  företag" blir en regel i databasen, inte något som kan glömmas bort i koden.
- Gratis upp till en nivå Spikarö inte kommer i närheten av; därefter ca 25 USD/mån.
- Spikarö äger sina data. Ingen inlåsning.
- **Priset:** varje ändring kräver en utvecklare. Margareth och Christer kan
  inte lägga till ett fält själva.

### B. Handelsplattform med färdig B2B-modul

Konton, godkännande, prislistor, orderhistorik och ofta koppling till Fortnox
eller Visma finns redan, testat av tusentals butiker.

- Inget av §3–§5 behöver byggas eller underhållas.
- Ägarna klarar vardagen själva.
- **Priset:** månadsavgift, mindre kontroll över formen, och sajten som byggts
  här får antingen anpassas till plattformens mallar eller köras som skyltfönster
  mot plattformens kassa.

### C. Affärssystem först

Odoo eller motsvarande, med B2B-portalen som en del av ett system som också
sköter fakturering och lager.

- Löser fakturering och order i samma rörelse.
- **Priset:** stort och tungt för fyra personer. Sannolikt fel storlek här.

**Min rekommendation, med reservation för svaren nedan:** genomgången av gamla
sajten visade ett bolag med 1,16 MSEK i omsättning, en till fyra anställda och
förlust två år i rad. Det talar för **B** — lägre risk, ingen utvecklare i
vardagen, och sådant som kreditgränser och fakturaunderlag är redan löst av
någon annan. **A** blir rätt val om du själv tänker förvalta systemet, för då
behålls allt som redan är byggt och den löpande kostnaden går mot noll.

### Frågor som avgör

1. **Vem underhåller portalen om två år?** Avgör A mot B.
2. **Vilket bokföringssystem används i dag?** Fortnox och Visma är de vanliga i
   Sverige och båda har färdiga kopplingar hos de flesta plattformar. Ska ordern
   bli en faktura automatiskt, eller knappas den in för hand som i dag?
3. **Ska företagsuppslag mot register ingå?** Ett API som bekräftar att
   organisationsnumret finns och är aktivt kostar en liten summa per uppslag och
   sparar handpåläggning. Utan det får Spikarö slå upp företaget själv vid
   kreditprövningen — vilket de ändå gör.

---

## 7. Vad som redan är gjort

- `public/assets/js/orgnr.js` — validering av organisationsnummer: Luhn,
  bolagsform, och eget besked när någon skrivit personnummer i stället.
  Ren modul utan beroenden, körs både i webbläsaren och på servern.
- `build/prova-orgnr.mjs` — 25 prov, inklusive Spikarös eget nummer.
  Kör med `node build/prova-orgnr.mjs`.
- `butik.html` har redan ett återförsäljarläge som växlar prisvisningen och
  säger ifrån att avtalade nettopriser kräver inloggning. Den växeln blir
  överflödig när riktig inloggning finns — då styr kontot vad som visas.

## 8. Ordning att bygga i

När §6 är avgjord:

1. Ansökningsformulär med kvitto och avisering till Spikarö *(kan byggas nu —
   fungerar likadant oavsett plattform)*
2. Konton, inloggning, lösenordsåterställning
3. Godkännandevy för Spikarö
4. Prislistor och nettopriser bakom inloggning
5. Order och orderbekräftelse
6. Orderhistorik och beställ-om
7. Prislista som PDF
8. Fakturakoppling
