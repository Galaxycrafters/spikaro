# spikaro

Ny webbplats och butik för **Spikarö Karamell & Pralin Fabriks AB** — skärgårdsgodis
från Alnö utanför Sundsvall, tillverkat efter gamla recept sedan 1992.

## Vad som finns här

En statisk sajt i `public/`: startsida, butik med varukorg och
återförsäljarläge, och 38 genererade produktsidor med fullständig
`schema.org/Product`-uppmärkning.

**Läs [FOUNDATION.md](FOUNDATION.md) först.** Där står varifrån formspråket
kommer, hur katalogen är uppbyggd, hur produktsidorna genereras och vad som
återstår innan sajten kan ta betalt.

## Återförsäljarportalen

Grossist är 99 % av affären. [B2B-PLAN.md](B2B-PLAN.md) beskriver datamodell,
godkännandeflöde, säkerhetskrav och de beslut som behövs innan bygget startar.

## Köra lokalt

```bash
cd public && python3 -m http.server 8099
```

Sajten serveras från den här värden under `/spikaro/`.

## Bygga om produktsidorna

Produktsidorna, `sitemap.xml` och `robots.txt` är genererade ur
`public/data/katalog.json`. Redigera dem inte för hand:

```bash
node build/generera.mjs
```

## Arbeta med Claude

1. Öppna eller kommentera ett GitHub-ärende som beskriver ändringen.
2. Nämn **`@claude`** så plockar Claude Code-workflowen upp det.
3. Granska pull requesten och merga när den är klar.

Kräver org/repo-hemligheten **`ANTHROPIC_API_KEY`**.

## Lokal klon

```
/home/peeth/projects/spikaro
```
