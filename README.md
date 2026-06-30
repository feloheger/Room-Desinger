# AI Interior Designer 🛋️

Eine React Native (Expo) App, die ein Foto einer leeren Stelle im Raum
analysiert und passende, stilkonforme Einrichtungsvorschläge liefert —
inklusive realer (bzw. realitätsnah gemockter) IKEA-Produkte.

## Tech-Stack

| Bereich        | Technologie                                   |
| --------------- | ---------------------------------------------- |
| Framework       | Expo (Managed Workflow) + Expo Router          |
| Styling         | NativeWind (Tailwind CSS für React Native)     |
| KI-Analyse      | Google Gemini 1.5 Flash (Google AI Studio, Free Tier) |
| Möbel-Suche     | Mock-Service mit realistischer IKEA-Produktstruktur (austauschbar gegen echte API) |
| Build/Deploy    | EAS Build + EAS Update                         |
| CI/CD           | GitHub Actions                                 |

## Projektstruktur

```
ai-interior-designer/
├── .github/
│   └── workflows/
│       └── eas-build.yml        # CI/CD Pipeline (EAS Build & Update)
├── app/                          # Expo Router Screens
│   ├── _layout.tsx               # Root-Layout (Stack-Navigator)
│   ├── index.tsx                 # Welcome-Screen
│   ├── camera.tsx                # Kamera-Screen
│   └── result.tsx                # Ergebnis-Screen (AI + Produkte)
├── services/
│   ├── aiService.ts               # Gemini API Integration
│   └── furnitureSearchService.ts  # Möbel-Such-Service (Mock)
├── types/
│   └── index.ts                   # Geteilte TypeScript-Typen
├── assets/                        # Icons, Splash-Screen etc.
├── app.json                       # Expo-Konfiguration
├── eas.json                       # EAS Build-Profile
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── global.css
├── tsconfig.json
├── package.json
└── .env.example
```

## Lokales Setup

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. .env Datei anlegen
cp .env.example .env
# -> EXPO_PUBLIC_GEMINI_API_KEY in .env eintragen
#    (kostenlos erhältlich unter https://aistudio.google.com/app/apikey)

# 3. App starten
npm run start
```

Anschließend mit der Expo Go App (oder einem Dev-Client) den QR-Code
scannen, oder `npm run ios` / `npm run android` für einen Simulator.

> **Hinweis:** `expo-camera` benötigt ein echtes Gerät oder einen
> Simulator mit Kamera-Unterstützung — im Expo Go Sandbox-Modus auf
> iOS-Simulatoren ist die Kamera eingeschränkt. Am besten auf einem
> physischen Gerät testen.

## EAS Build Setup

```bash
# Einmalig: EAS CLI installieren & einloggen
npm install -g eas-cli
eas login

# Projekt mit EAS verknüpfen (erzeugt eine projectId)
eas init

# Build-Profile sind bereits in eas.json definiert:
eas build --profile development --platform ios
eas build --profile preview --platform android
eas build --profile production --platform all
```

Trage die generierte `projectId` anschließend in `app.json` unter
`extra.eas.projectId` und in der `updates.url` ein.

## CI/CD mit GitHub Actions

Die Pipeline (`.github/workflows/eas-build.yml`) macht zwei Dinge:

1. **Bei jedem Push auf `main`:** Ein `eas update` auf den `preview`-Branch,
   damit Tester sofort die neueste JS-Version über den Expo-Updates-Mechanismus
   erhalten (kein neuer Store-Build nötig).
2. **Bei manuellem Trigger (`workflow_dispatch`):** Ein vollständiger
   `eas build` für das gewählte Profil (`development`, `preview` oder
   `production`).

### Benötigte GitHub Secrets

Unter **Settings → Secrets and variables → Actions** anlegen:

| Secret              | Beschreibung                                                        |
| -------------------- | --------------------------------------------------------------------- |
| `EXPO_TOKEN`         | Persönlicher Access-Token von [expo.dev/accounts/[user]/settings/access-tokens](https://expo.dev) |
| `GEMINI_API_KEY`     | Dein Gemini API-Key (wird als `EXPO_PUBLIC_GEMINI_API_KEY` injiziert) |

## Möbel-Suche auf eine echte API umstellen

`services/furnitureSearchService.ts` ist aktuell ein deterministischer
Mock-Service (funktioniert offline, keine Rate-Limits). Zwei Wege zu
echten IKEA-Daten:

1. **SerpApi** (Google Shopping Engine, hat einen kostenlosen Test-Tarif):
   Suche nach `site:ikea.com <searchKeywords>` und mappe die Ergebnisse
   auf den `FurnitureProduct`-Typ.
2. **Eigener Scraper/Proxy**, der IKEAs interne Such-Vorschläge abfragt
   und normalisiert zurückgibt.

Die öffentliche Funktion `searchFurnitureProducts()` muss dabei nicht
verändert werden — nur die interne Implementierung.

## Lizenz

MIT
