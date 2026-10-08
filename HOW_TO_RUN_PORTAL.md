# Online Submission Portal - Setup & Instructions

This document explains how to run and manage the newly added **Online Submission Portal**.

## What is this?
The Online Submission Portal is a standalone web application (built with Vite + React) where students and external users can submit:
1. Event Proposals
2. Venue Requests
3. Accreditation Applications

It replaces the old "Online Submissions" section that used to be embedded in the main website's homepage, providing a dedicated, premium user experience.

---

## 🚀 How to Run the Portal

The portal has been configured to run on port `5174` to avoid conflicting with the main website (which runs on port `5173`).

1. Open your terminal or command prompt.
2. Navigate to the `submission-portal` directory:
   ```bash
   cd "c:\xampp\htdocs\student nexus\submission-portal"
   ```
3. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to: **http://localhost:5174**

---

## 🔗 Integration with the Main Website

The main website has been updated to seamlessly link to this new portal:
- A **"Submit Online"** button is in the top Header navigation.
- A **"Submit Online →"** button is in the Welcome Section of the homepage.
- The **Footer Quick Links** now point to the portal.
- The **Mobile Bottom Navigation Menu** (under "Menu") now includes the portal link.

## 🗄️ Database & Submissions (Supabase)

All form submissions go directly to your existing Supabase project, matching the behavior of the old integrated forms:

- **Event Proposals:** Saved directly to the `event_proposals` table (linked to the correct organization if found).
- **Venue Requests & Accreditation:** Saved to the `contact_messages` table with a clearly formatted message so OSAS admins can read them in the Admin Dashboard.

The database configuration is located at `submission-portal/src/config/supabase.js`.
