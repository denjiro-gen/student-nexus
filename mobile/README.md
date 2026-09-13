# 📱 Student Nexus Mobile App

Modern React Native mobile application for managing student organizations, events, and achievements with Supabase backend.

## ✅ Installation Complete!

Dependencies installed successfully. Now follow these steps:

### Next Steps:

1. **Configure Supabase** (Required before running)
   - Go to https://app.supabase.com
   - Create a project or select existing one
   - Go to Settings → API
   - Copy your **Project URL** and **anon public key**
   - Edit `mobile/src/config/supabase.js`:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-actual-anon-key-here';
   ```

2. **Set Up Database**
   - In Supabase Dashboard → SQL Editor
   - Run `../database/supabase_schema.sql` (creates tables)
   - Run `../database/seed_data.sql` (adds test data with 57 users)

3. **Run the App**
   ```bash
   npm start
   ```
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

4. **Login with Demo Account**
   - Email: `student@example.com`
   - Password: `password123`

---

## ⚡ Quick Start (Already Done!)

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Configure Supabase (edit src/config/supabase.js)
# Add your SUPABASE_URL and SUPABASE_ANON_KEY

# 3. Run app
npm start
```

Press `a` for Android, `i` for iOS, or scan QR code with Expo Go.

---

## 🐛 Dependency Fix (If Install Fails)

The package.json is already configured for Expo SDK 54 compatibility.

If you see ERESOLVE errors, run:

```bash
rm -rf node_modules package-lock.json
npm install
```

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## ✨ Features

- 🔐 **Authentication** - Email/password login with persistent sessions
- 🏠 **Dashboard** - Stats, upcoming events, quick actions
- 📅 **Events** - Create, view, filter events (pending/approved/rejected)
- 🏢 **Organizations** - Manage orgs, members, compliance
- 🏆 **Portfolio** - Track achievements and certificates
- 💬 **Messages** - User-to-user messaging
- 🔔 **Notifications** - Real-time system notifications

---

## 🛠️ Tech Stack

- React Native 0.81.5 + Expo SDK 54
- React Navigation v6
- Supabase (PostgreSQL + Auth)
- AsyncStorage
- Custom UI components with theme system

---

## 📋 Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (https://supabase.com)
- Android Studio (Android) or Xcode (iOS)

---

## 🔧 Configuration

### 1. Supabase Setup

Get credentials from https://app.supabase.com → Your Project → Settings → API

Edit `src/config/supabase.js`:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 2. Database Setup

In Supabase Dashboard → SQL Editor, run:
1. `../database/supabase_schema.sql` - Creates all tables
2. `../database/seed_data.sql` - Adds test data

---

## 🧪 Demo Accounts

**Student:**
- Email: `student@example.com`
- Password: `password123`

**Admin:**
- Email: `admin@osas.com`
- Password: `admin123`

**President:**
- Email: `president@css.com`
- Password: `president123`

---

## 📁 Project Structure

```
mobile/
├── src/
│   ├── components/          # Button, Card
│   ├── screens/             # Login, Home, Events
│   ├── services/            # api.js (48 database functions)
│   ├── context/             # AuthContext
│   ├── config/              # supabase.js (configure here!)
│   └── styles/              # theme.js
├── App.js                   # Main app + navigation
└── package.json             # Dependencies
```

---

## 📡 API Services (48 Functions)

All in `src/services/api.js`:

- **Authentication** (5) - signIn, signUp, signOut, getSession, getCurrentUser
- **Users** (3) - getProfile, updateProfile, getUserWithOrg
- **Events** (8) - getAllEvents, createEvent, updateEvent, deleteEvent, etc.
- **Organizations** (5) - getAllOrganizations, getOrgMembers, etc.
- **Portfolio** (5) - getUserPortfolio, addAchievement, etc.
- **Messages** (4) - getUserMessages, sendMessage, markAsRead, etc.
- **Notifications** (4) - getUserNotifications, markNotificationRead, etc.
- **Compliance** (3) - getAllRequirements, getOrgCompliance, etc.
- **Dashboard** (2) - getUserStats, getOrgStats
- **Reports** (2) - getAllReports, generateReport

---

## 🏃 Running the App

```bash
npm start              # Start dev server
npm run android        # Run on Android
npm run ios           # Run on iOS (Mac only)
npm run web           # Run in browser
```

**Clear cache if needed:**
```bash
npx expo start -c
```

---

## 🐛 Troubleshooting

### "Network request failed"
- Check `src/config/supabase.js` has correct credentials
- Verify internet connection
- Check Supabase project is active

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Metro bundler issues"
```bash
npx expo start -c
```

### "RLS policy violation"
- Rerun `database/supabase_schema.sql`
- Verify user is logged in
- Check RLS policies in Supabase

---

## 📱 Platform Support

| Platform | Status | Min Version |
|----------|--------|-------------|
| Android  | ✅ Ready | API 21 (Android 5.0) |
| iOS      | ✅ Ready | iOS 13.0 |
| Web      | ✅ Ready | Modern browsers |

---

## 🎨 Customization

### Change Primary Color
Edit `src/styles/theme.js`:
```javascript
colors: {
  primary: '#4a8c66',  // Change to your color
}
```

### Add New Screen
1. Create `src/screens/NewScreen.js`
2. Add to navigation in `App.js`
3. Use existing screens as template

---

## 📦 Dependencies

Compatible with Expo SDK 54:
- `@react-navigation/native: ^6.1.9`
- `@react-navigation/bottom-tabs: ^6.5.11`
- `@react-navigation/stack: ^6.3.20`
- `react-native-screens: ~3.29.0`
- `react-native-safe-area-context: 4.8.2`
- `react-native-gesture-handler: ~2.14.0`
- `@supabase/supabase-js: ^2.39.0`
- `@react-native-async-storage/async-storage: 1.21.0`

---

## ✅ Installation Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Supabase credentials configured
- [ ] Database schema run
- [ ] Seed data loaded
- [ ] App runs (`npm start`)
- [ ] Login works with demo account

---

## 🆘 Get Help

1. Check terminal for errors
2. Check Supabase dashboard logs
3. Clear cache: `npx expo start -c`
4. Reinstall: `rm -rf node_modules && npm install`
5. Check Node.js version: `node --version` (need v16+)

---

## 📄 License

Proprietary - Student Nexus Platform

---

**Version 1.0.0** | **Expo SDK 54** | **React Native 0.81.5**

🚀 Ready to go! Install, configure, and run!
