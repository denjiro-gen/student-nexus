# 🚀 How to Run the Complete Student Nexus System

The Student Nexus platform consists of four distinct applications working together. To test the entire system, follow these instructions to start each application.

All systems are connected to the same shared **Supabase Database**.

---

### 1. Website (Public Portal)
The main public-facing website for OSAS and organizations.

1. Open a new terminal.
2. Navigate to the website folder:
   ```bash
   cd "c:\xampp\htdocs\student nexus\website"
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. **Access:** Open http://localhost:5173 in your browser.

---

### 2. Online Submission Portal (New!)
The standalone application for submitting Event Proposals, Venue Requests, and Accreditation Forms.

1. Open a new terminal.
2. Navigate to the submission-portal folder:
   ```bash
   cd "c:\xampp\htdocs\student nexus\submission-portal"
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. **Access:** Open http://localhost:5174 in your browser.

---

### 3. Admin Dashboard (Desktop App)
The Electron-based desktop application for OSAS administrators to review submissions and manage the system.

1. Open a new terminal.
2. Navigate to the admin folder:
   ```bash
   cd "c:\xampp\htdocs\student nexus\admin"
   ```
3. Start the desktop app:
   ```bash
   npm run electron-dev
   ```
4. **Access:** An application window will automatically pop up on your screen.

---

### 4. Mobile App (Expo)
The React Native app for Student Leaders and Faculty.

1. Open a new terminal.
2. Navigate to the mobile folder:
   ```bash
   cd "c:\xampp\htdocs\student nexus\mobile"
   ```
3. Start the Expo server:
   ```bash
   npx expo start -c
   ```
4. **Access:** Scan the QR code that appears in your terminal using the **Expo Go** app on your iOS or Android device.

---

## 🧪 Testing the Integration

To see how everything connects, try this flow:
1. Open the **Website** (Port 5173). Click "Submit Online" to be redirected to the **Submission Portal**.
2. On the **Submission Portal** (Port 5174), fill out and submit an *Event Proposal*.
3. Open the **Admin Dashboard**. Log in as an admin, and you will see your newly submitted Event Proposal appear in the dashboard in real-time.
4. Open the **Mobile App** as a Student Leader to see approved events and your organization's status.
