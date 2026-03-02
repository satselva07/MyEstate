# SeRa Properties

A React Native + Expo app for browsing SeRa group properties, viewing details, booking stay slots, and contacting support.

## Features

- Browse all properties or filter by city
- Property details with:
  - photo gallery
  - facilities
  - exact map location (Google Maps)
- Booking flow with:
  - slot selection
  - guest details
  - nights-based total amount
- My Bookings section with:
  - check-in date
  - calculated check-out date
  - booking timestamp
- Contact panel:
  - phone call
  - WhatsApp chat
  - Instagram profile
- FAQ section for common booking questions
- Local persistence using AsyncStorage

## Tech Stack

- Expo SDK 55
- React Native 0.83
- TypeScript
- AsyncStorage (`@react-native-async-storage/async-storage`)

## Project Structure

- `App.tsx` – main app UI and logic
- `assets/` – app icons and property images
- `assets/radha-illam/` – local photos used for Radha Illam
- `scripts/android-start.ps1` – local Android emulator helper script
- `eas.json` – EAS build profiles

## Prerequisites

- Node.js 18+
- npm
- Expo-compatible environment
- (Optional) Android Studio for local emulator
- (Optional) Apple Developer account for iOS production distribution

## Setup

```bash
npm install
```

## Run the App

### Start Expo dev server

```bash
npm start
```

### Run on web

```bash
npm run web
```

### Run on Android (Expo)

```bash
npm run android
```

### Run on iOS (Expo)

```bash
npm run ios
```

## Android Local Script (Windows)

This project includes a PowerShell helper to verify/start Android emulator and launch Expo:

```bash
npm run android:check
npm run android:local
```

## EAS Build (APK/AAB/IPA)

### Configure once

```bash
npm run eas:configure
```

### Build Android APK (internal/preview)

```bash
npm run build:android
```

### Build Android production

```bash
npm run build:android:prod
```

### Build iOS production

```bash
npm run build:ios
```

### Submit builds

```bash
npm run submit:android
npm run submit:ios
```

## App Configuration

Configured in `app.json`:

- Android package: `com.sera.properties`
- iOS bundle identifier: `com.sera.properties`
- Scheme: `seraproperties`

## Data Storage

The app stores local data on device/browser using AsyncStorage:

- properties list
- bookings list
- selected city filter
- selected property detail view

## Screenshots / Demo

Add app images/GIFs under a folder like `docs/images/` and reference them below.

Suggested files:

- `docs/images/home.png`
- `docs/images/property-details.png`
- `docs/images/booking-flow.png`
- `docs/images/contact-faq.png`
- `docs/images/demo.gif`

Example markdown (already ready, replace files with your real captures):

```md
### App Preview

![Home](docs/images/home.png)
![Property Details](docs/images/property-details.png)
![Booking Flow](docs/images/booking-flow.png)
![Contact & FAQ](docs/images/contact-faq.png)

### Demo GIF

![Demo](docs/images/demo.gif)
```

Optional side-by-side layout:

```md
| Home | Property Details |
|------|------------------|
| ![Home](docs/images/home.png) | ![Details](docs/images/property-details.png) |
```

## Repository

GitHub: https://github.com/satselva07/MyEstate
