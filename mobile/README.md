# TALABA phone app (iOS and Android)

Expo SDK 57 + Expo Router, TypeScript, Uzbek (Latin) UI. It talks to the same Flask backend as the website
and reuses the website's dependency-free logic (`../src/lib/toolkit`, `events.ts`, `guide-topics.ts`) as `@shared/...`.

## Run
```bash
cd mobile && npm install
cp .env.example .env            # set EXPO_PUBLIC_API_URL for anything but local development
npx expo start                  # scan the QR code with Expo Go (iPhone camera / Android Expo Go)
npx expo start --web            # quick preview in a browser
npx tsc --noEmit                # typecheck — must stay clean
```
In development the app finds your computer by itself (`http://<LAN-IP>:5001/api`), so start the backend with
`cd backend && python run.py` and keep phone and computer on the same Wi-Fi. The backend allows only the origin in
`FRONTEND_URL`; native apps are not subject to CORS, a browser preview is.

## What is inside
Tabs: Bosh sahifa · Ishlar · Klublar · Chat (savol-javob) · Hayot (qo'llanma, kundalik hayot, yangiliklar).
Header: Xabarlar (direct messages) and Profil. Tools: jadval, GPA, vazifalar/imtihonlar (cloud-synced with the site).
First run shows the welcome screens. Class reminders are local notifications; message/answer pushes need a
development build and `EXPO_PUBLIC_EAS_PROJECT_ID` (Expo Go on Android has no remote push).

## Release (needs your Apple / Google developer accounts)
`npx eas-cli@latest init` → `npx eas-cli@latest build --platform all` → `eas submit`. Bundle id / package: `uz.talaba.app`.
