# Student Nexus

**Student Nexus** is a comprehensive student organization management platform developed for Colegio De Montalban. It consists of three integrated systems:

- **Mobile Application** — A React Native (Expo) app for Student Leaders and Faculty to manage events, messages, and organization activities.
- **Website** — A public-facing React (Vite) portal that displays approved events and organization information.
- **Admin Dashboard** — An Electron-based desktop application for OSAS Administrators to manage users, events, organizations, compliance, and announcements.

All three systems are backed by a shared **Supabase** (PostgreSQL) database and authentication service.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
3. [Prerequisites](#prerequisites)
4. [Website Setup](#website-setup)
5. [Admin Dashboard Setup](#admin-dashboard-setup)
6. [Mobile Application Setup](#mobile-application-setup)
7. [Environment Variables](#environment-variables)
8. [Mobile: How to Publish an OTA Update](#mobile-how-to-publish-an-ota-update)
9. [Mobile: How to Build a New APK](#mobile-how-to-build-a-new-apk)
10. [Database Schema](#database-schema)
11. [Deployment](#deployment)

---

## Step-by-Step Setup Guide

Follow these sequential steps to get the entire Student Nexus platform running:

1. **Clone the Repository**: Download the source code to your local machine.
2. **Setup Supabase**: Create a Supabase project and apply the database schema from the `database/MASTER_SCHEMA.sql` file.
3. **Configure Environment Variables**: Set up the `.env` files for the Website, Admin Dashboard, and Mobile Application using your Supabase credentials (URL and Anon Key).
4. **Install Dependencies**: Open a terminal and run `npm install` in each of the three main directories: `website/`, `admin/`, and `mobile/`.
5. **Start the Website**: Run `npm run dev` in the `website/` directory to start the public portal.
6. **Start the Admin Dashboard**: Run `npm run electron-dev` in the `admin/` directory to start the management application.
7. **Start the Mobile App**: Run `npx expo start -c` in the `mobile/` directory and use the Expo Go app to scan the QR code.

---

## Project Structure

```
student nexus/
├── admin/          # Electron desktop app (OSAS Admin Dashboard)
├── mobile/         # Expo React Native app (Student Leader & Faculty)
├── website/        # Vite React website (Public portal)
└── database/       # SQL schema files for Supabase
```

---

## Prerequisites

Before setting up any of the three systems, ensure you have the following installed:

- **Node.js** v18 or later — https://nodejs.org
- **npm** v9 or later (included with Node.js)
- **Git** — https://git-scm.com
- A **Supabase** project — https://supabase.com
- For the mobile app: **Expo CLI** and an **EAS CLI** account — https://expo.dev

---

## Website Setup

The public website is built with React and Vite. It displays approved events, organization profiles, and announcements.

### Running Locally

```bash
cd website
npm install
npm run dev
```

The development server will start at `http://localhost:5173`.

### Building for Production

```bash
cd website
npm install
npm run build
```

The production-ready files will be placed in the `website/dist/` directory.

### Deploying to Vercel

The website is deployed on Vercel. Any push to the connected Git branch will trigger an automatic deployment. To deploy manually:

```bash
vercel --prod
```

### Environment Variables (website/.env)

Create a `.env` file in the `website/` directory with the following:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Admin Dashboard Setup

The Admin Dashboard is an Electron desktop application. It is intended for use by OSAS Administrators only.

### Running in Development

```bash
cd admin
npm install
npm run electron-dev
```

This starts both the React development server and the Electron window simultaneously.

### Building for Production (Windows)

```bash
cd admin
npm install
npm run build
npm run electron-pack
```

The packaged installer will be located in the `admin/dist/` directory.

### Environment Variables (admin/.env)

Create a `.env` file in the `admin/` directory with the following:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Mobile Application Setup

The mobile application is built with React Native using the Expo framework. It supports Android and iOS.

### Running in Development

```bash
cd mobile
npm install
npx expo start -c
```

Scan the QR code with the **Expo Go** app on your phone to preview the application instantly.

To run specifically on Android or iOS:

```bash
npx expo start --android
npx expo start --ios
```

### Environment Variables (mobile/.env)

Create a `.env` file in the `mobile/` directory with the following:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Environment Variables

All three applications share the same Supabase project. The keys are available in your **Supabase Dashboard** under **Project Settings > API**.

| Variable | Description |
|---|---|
| `SUPABASE_URL` | The URL of your Supabase project (e.g., `https://xyz.supabase.co`) |
| `SUPABASE_ANON_KEY` | The public anonymous key for client-side queries |

> **Note:** Never commit `.env` files to version control. They are excluded via `.gitignore` in each sub-project.

---

## Mobile: How to Publish an OTA Update

An **Over-The-Air (OTA) update** allows you to push JavaScript and asset changes to existing installed apps without requiring users to download a new APK. This is the recommended method for pushing bug fixes and UI changes.

### Requirements

- The **EAS CLI** must be installed: `npm install -g eas-cli`
- You must be logged in: `eas login`
- The update targets the `preview` channel, which corresponds to the current APK build.

### Steps

1. Make your code changes in the `mobile/src/` directory.
2. From the `mobile/` directory, run:

```bash
eas update --branch preview --message "Brief description of the changes"
```

3. Wait for the build and upload to complete (typically 1 to 3 minutes).
4. On the physical device, **force-close the app** and **reopen it**. The app will download the update in the background. Close and reopen one more time to apply the changes.

> **Important:** OTA updates only work if the native code (dependencies, native modules, app.json configuration) has not changed. If native changes are required, a full APK build is necessary.

---

## Mobile: How to Build a New APK

A full APK build is required when:

- A new native dependency has been added (e.g., a new `expo-` package)
- The `app.json` configuration has changed in a way that affects native code
- A new version is being released for the first time

### Requirements

- An active **Expo EAS** account linked to the project
- The `eas.json` file must be present (already configured in this project)

### Steps

1. Increment the `versionCode` and optionally the `version` in `mobile/app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

2. From the `mobile/` directory, run:

```bash
eas build -p android --profile preview
```

3. The build will be queued on Expo's servers. You can monitor progress at https://expo.dev.
4. Once complete, download the `.apk` file from the EAS Dashboard or share the download link directly.

### Build Profiles

The `eas.json` file defines the following build profiles:

| Profile | Description |
|---|---|
| `preview` | Internal distribution APK for testing. Used for all non-production builds. |
| `production` | Production AAB (Android App Bundle) for Google Play Store submission. |
| `development` | Development client build for testing with Expo Dev Client. |

---

## Database Schema

The database schema is maintained in the `database/MASTER_SCHEMA.sql` file. This file contains the full SQL required to set up all tables, indexes, row-level security (RLS) policies, and storage bucket configurations.

To apply the schema or any patches, run the SQL in your **Supabase Dashboard** under **SQL Editor**.

---

## Deployment

| System | Platform | Notes |
|---|---|---|
| Website | Vercel | Auto-deploys on Git push |
| Admin Dashboard | Windows Desktop | Packaged with Electron Builder |
| Mobile App | Android (APK) | Distributed via EAS Build |
| Database | Supabase (PostgreSQL) | Hosted on Supabase Cloud |

---

## Notes for Developers

- The Admin Dashboard is strictly for use by OSAS Administrators and should not be distributed to students.
- All user registration from the mobile app requires OSAS Admin approval before the account becomes active. This is enforced by the `is_active = false` default in the `users` table.
- The `student_leader` role is the only role that can register from the mobile app. Faculty accounts must also be approved by an admin.
- Firebase is used for push notification delivery on Android. The `google-services.json` file in the `mobile/` directory must correspond to the correct Firebase project.
