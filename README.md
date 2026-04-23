# Live Polling App (Next.js + Firebase)

Nowoczesna aplikacja webowa do głosowań na żywo podczas prezentacji, wykładów i eventów.

## 1. Architektura aplikacji

**Stack:**
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Firebase Auth (logowanie prowadzącego)
- Firestore (sesje, pytania, głosy + realtime onSnapshot)
- Recharts (wizualizacja wyników)
- Framer Motion (animacje)
- React Hook Form + Zod (formularze)
- Lucide React (ikony)
- qrcode.react (QR)

**Warstwy:**
- `src/app` — routing i widoki (public/admin/presentation)
- `src/components` — UI i komponenty domenowe
- `src/lib` — Firebase, walidacja, logika Firestore, utilsy
- `src/hooks` — realtime i auth state
- `src/types` — modele TypeScript

## 2. Struktura folderów

```txt
src/
  app/
    page.tsx
    admin/
      login/page.tsx
      dashboard/page.tsx
    s/[sessionId]/
      vote/page.tsx
      present/page.tsx
      history/page.tsx
      q/[questionId]/page.tsx
  components/
    layout/page-shell.tsx
    ui/{button,card,input,select,badge}.tsx
    presenter/{question-form,question-list}.tsx
    participant/vote-form.tsx
    presentation/{qr-stage,results-chart}.tsx
  hooks/{use-auth,use-session-data}.ts
  lib/{firebase,firestore,results,utils,validation}.ts
  types/domain.ts
```

## 3. Model danych Firestore

`sessions/{sessionId}`
```ts
{
  title: string,
  hostUid: string,
  status: "draft" | "live" | "ended",
  activeQuestionId: string | null,
  presentationMode: "qr" | "results",
  createdAt: number,
  updatedAt: number
}
```

`sessions/{sessionId}/questions/{questionId}`
```ts
{
  id: string,
  sessionId: string,
  title: string,
  type: "single" | "multiple" | "yes_no" | "survey",
  options: [{ id: string, label: string }],
  status: "draft" | "open" | "closed",
  allowRevoteUntilClosed: boolean,
  createdAt: number,
  updatedAt: number
}
```

`sessions/{sessionId}/questions/{questionId}/votes/{voterToken}`
```ts
{
  id: string,
  sessionId: string,
  questionId: string,
  voterToken: string,
  answers: string[],
  updatedAt: number
}
```

## 4. Flow użytkownika i prowadzącego

**Prowadzący:**
1. Loguje się przez Firebase Auth (Google)
2. Tworzy pytania (single/multiple/yes-no/survey)
3. Ustawia aktywne pytanie i otwiera głosowanie
4. Pokazuje ekran prezentacyjny: tryb QR lub wyniki
5. Zamyka głosowanie, resetuje wyniki, przegląda historię

**Uczestnik:**
1. Skanuje QR / otwiera publiczny link
2. Widzi pytanie i duże przyciski odpowiedzi
3. Wysyła głos i dostaje potwierdzenie
4. Jeśli pytanie zamknięte — widzi komunikat o zamknięciu

## 5. Podstawowe widoki i komponenty

- `/` — landing
- `/admin/login` — logowanie prowadzącego
- `/admin/dashboard` — zarządzanie sesją, pytaniami, aktywnym głosowaniem
- `/s/[sessionId]/vote` — publiczny widok uczestnika (aktywne pytanie)
- `/s/[sessionId]/q/[questionId]` — publiczny link do konkretnego pytania
- `/s/[sessionId]/present` — ekran prezentacyjny (QR/results, format: słupkowy/poziomy/liniowy/kołowy/donut/histogram)
- `/s/[sessionId]/history` — historia pytań i wyników

## 6. Przykładowe reguły Firestore

Plik: `firestore.rules`

- publiczny odczyt sesji, pytań i głosów
- tworzenie/edycja sesji i pytań tylko przez hosta (`hostUid == auth.uid`)
- zapis głosu bez logowania, ale tylko:
  - dla otwartego pytania
  - do dokumentu `votes/{voterToken}`
  - z poprawnym `sessionId`, `questionId`, `answers`

## 7. Kod startowy projektu

To repo zawiera gotowy starter MVP foundation:
- czysty podział na public/admin/presentation
- realtime updates (`onSnapshot`)
- formy z RHF + Zod
- wykresy wyników (bar + donut)
- przełączane formaty wykresów (bar/horizontal bar/line/pie/donut/histogram)
- QR i publiczny link pytania
- obsługa otwierania/zamykania głosowań i resetu wyników

## 8. Uruchomienie lokalnie

1. Zainstaluj zależności:
```bash
npm install
```
2. Skopiuj env:
```bash
cp .env.example .env.local
```
3. Uzupełnij `.env.local` danymi projektu Firebase.
4. Uruchom:
```bash
npm run dev
```
5. Otwórz `http://localhost:3000`

## 9. Wdrożenie na Vercel

1. Push repo do GitHub.
2. Import projektu w Vercel.
3. Dodaj wszystkie zmienne z `.env.example` jako Environment Variables.
4. Build command: `npm run build`
5. Output: domyślny dla Next.js.
6. Po deployu ustaw reguły Firestore (`firestore.rules`) w Firebase Console lub przez Firebase CLI.

## 10. Propozycje dalszej rozbudowy

- role i ACL (kilku prowadzących na sesję)
- timer odliczający do zamknięcia pytania
- anonimowe segmenty uczestników (np. sala A/B)
- eksport wyników CSV/PDF
- ranking aktywności i quiz punktowany
- websocket fallback + cache warstwy statystyk
- dedykowany tryb fullscreen z pilotem klawiaturowym
