# Reels mens Claude tænker

En browserudvidelse til Chrome og andre Chromium-browsere. Når du har sendt en prompt til Claude på claude.ai, og Claude har arbejdet i 3 sekunder, åbner den Instagram Reels i en ny fane. Så snart Claude er færdig, lukker den fanen igen og sætter dig tilbage i Claude-fanen.

Det virker både i den almindelige chat på claude.ai og i Claude Code på nettet (claude.ai/code).

## Installation (Chrome, Edge, Brave, Arc, Opera, Vivaldi)

1. Hent mappen `claude-reels` til din computer: klon repoet, eller vælg **Code → Download ZIP** på GitHub og pak filen ud.
2. Åbn `chrome://extensions` (i Edge: `edge://extensions`).
3. Slå **Udviklertilstand** til (kontakten øverst til højre).
4. Klik **Indlæs upakket** og vælg mappen `claude-reels`.
5. Genindlæs de claude.ai-faner, du allerede har åbne. Nye faner virker med det samme.
6. Sørg for at være logget ind på instagram.com i samme browser.

Tip: Klik på puslespilsikonet i værktøjslinjen og fastgør udvidelsen, så du kan nå indstillingerne med ét klik.

## Sådan opfører den sig

| Situation | Hvad der sker |
| --- | --- |
| Du sender en prompt, og Claude arbejder mere end 3 sek. | Reels åbner i en ny fane lige ved siden af Claude og kommer forrest. |
| Claude bliver færdig | Efter 1 sek. lukkes Reels, og Claude-fanen og -vinduet kommer forrest. |
| Claude svarer på under 3 sek. | Der sker ingenting. |
| Claude holder en kort pause mellem to trin (under 1 sek.) | Reels bliver ved med at køre. |
| Du lukker selv Reels undervejs | Du bliver, hvor du er; den hiver dig ikke tilbage. |
| Claude går i gang, mens du kigger på en anden fane | Der sker ingenting. Reels åbner kun, hvis du kigger på Claude, når arbejdet starter. |

## Indstillinger

Klik på udvidelsens ikon:

- **Aktiv**: slå det hele til og fra.
- **Åbn Reels når Claude har arbejdet … sek.**: standard 3. Sæt til 0 for at åbne med det samme.
- **Luk Reels når Claude har været færdig … sek.**: standard 1. Sæt til 0 for at lukke i samme øjeblik, svaret er færdigt.
- **Åbn som**: en almindelig fane eller et lille, højt vindue, der passer til lodret video.
- **Avanceret**: en anden adresse end Reels (fx `https://www.youtube.com/shorts`) og en ekstra CSS-selector for Claudes stop-knap.

Øverst viser popup'en live, om udvidelsen kan se, at Claude arbejder i den aktive fane.

## Hvordan den ved, at Claude arbejder

Den kigger efter to ting, og én af dem er nok:

1. **Svar-strømmen**: Claude-chatten henter hvert svar som en strøm fra en `.../completion`-adresse. Strømmen slutter i det øjeblik, svaret er færdigt. Udvidelsen læser sin egen kopi af strømmen til ende for at se, hvornår den slutter; den gemmer og sender intet.
2. **Stop-knappen**: mens Claude arbejder, viser både chatten og Claude Code en knap til at stoppe svaret. Når den forsvinder, er Claude færdig.

Mens Reels spiller, ligger Claude-fanen i baggrunden, og Chrome kører kun timere i skjulte faner én gang i sekundet ([Chrome for Developers](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)). Derfor reagerer udvidelsen direkte på ændringen i siden, og selve lukke-forsinkelsen tælles i udvidelsens baggrundsproces. Målt i en rigtig Chromium lukker Reels 1,05 sek. efter, at Claude er færdig, med standardindstillingen, og 0,05 sek. efter, med lukke-forsinkelsen sat til 0.

## Hvis den ikke reagerer

1. **Genindlæs Claude-fanen.** Faner, der var åbne, før udvidelsen blev installeret eller opdateret, skal genindlæses én gang.
2. **Kig på status i popup'en**, mens Claude svarer. Står der ikke "Claude arbejder", kan Anthropic have ændret navnet på stop-knappen. Højreklik på stop-knappen, vælg **Inspicér**, find knappens `aria-label`, og skriv fx `button[aria-label="Stop response"]` i feltet under **Avanceret**.
3. **Chromes hukommelses- og energisparer** kan lægge faner i dvale. Åbn `chrome://settings/performance` og tilføj `claude.ai` under **Hold altid disse websites aktive**.

## Begrænsninger

- Virker kun i browseren. Claude-appen til skrivebordet kan ikke køre udvidelser.
- Firefox og Safari understøttes ikke, som den er nu.
- Chrome kan starte Reels uden lyd, indtil du har brugt Instagram lidt i browseren; det styres af Chromes regler for automatisk afspilning ([Chrome for Developers](https://developer.chrome.com/blog/autoplay)).

## Tilladelser og privatliv

- Kører kun på `claude.ai`. Den har ingen adgang til andre sider, din historik eller indholdet af andre faner.
- Den eneste ekstra tilladelse er `storage` til at huske dine indstillinger.
- Intet sendes nogen steder hen.

## Filer

```
manifest.json   Udvidelsens opsætning (Manifest V3)
net-hook.js     Kører i claude.ai og melder, når en svar-strøm starter og slutter
detect.js       Samler signalerne og fortæller baggrunden, når Claude starter og stopper
background.js   Åbner og lukker Reels og sætter Claude-fanen forrest igen
popup.html/js   Indstillinger og live status
icons/          Ikoner
```
