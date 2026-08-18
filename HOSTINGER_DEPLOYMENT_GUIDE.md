# 🚀 Hostinger Deployment Guide - RedGifs Loop Platform

This guide explains step-by-step how to export this application from AI Studio to GitHub and deploy it directly onto **Hostinger** (via Hostinger Git Deployment, File Manager, or Hostinger VPS/Node.js).

---

## 🔑 1. Admin Portal & Default Credentials

- **Admin URL Path**: Access the admin portal directly at `https://your-domain.com/admin` or `https://your-domain.com/#admin` or via the **Admin Portal (/admin)** button in the side drawer.
- **Default Username**: `admin`
- **Default Password**: `admin`
- **Editing Credentials**: You can edit and update the admin username and password dynamically anytime right from the `/admin` login popup or inside the Admin Panel under **Editable Admin Credentials**. New credentials persist safely across sessions in browser storage and database JSON exports.

---

## 📦 2. Exporting to GitHub

1. Open the **Settings** menu at the top right of AI Studio.
2. Click **Export to GitHub**.
3. Select your GitHub repository or create a new public/private repository.
4. Push the code.

---

## 🌐 3. Hostinger hPanel Deployment Options

### Option A: Standard Web Hosting (Hostinger Shared Hosting) - Recommended & Fast

1. **Build the Production Dist**:
   - Run `npm run build` locally or let GitHub Actions build the `dist/` directory.
   - The build output will be created inside the `dist/` folder.
2. **Upload to Hostinger File Manager**:
   - Log in to your **Hostinger hPanel**.
   - Open **File Manager** -> `public_html`.
   - Upload all files from the `dist/` folder directly into `public_html`.
3. **Verify `.htaccess` SPA Routing**:
   - Make sure `.htaccess` is uploaded into `public_html` so that direct route visits (like `https://your-domain.com/admin`) automatically fallback to `index.html`.

### Option B: Hostinger Git Deployment (Automated Integration)

1. In **Hostinger hPanel**, go to **Git** under the Advanced section.
2. Enter your GitHub repository URL: `https://github.com/your-username/your-repo.git`.
3. Set the branch to `main`.
4. Click **Create Repository**.
5. Set up Auto-Deployment or click **Deploy** whenever you push updates to GitHub.

---

## 🗄️ 4. Database Backup, Restore & Persistence

- All video clips, paywalls, token balances, creator earnings, and admin credentials are automatically stored with instant persistence.
- To backup or migrate data to another site:
  1. Open `/admin` and log in with your admin credentials.
  2. Under **Hostinger Database Backup & Restore**, click **Export DB JSON** to download a single `.json` backup file.
  3. On a new site, click **Import DB JSON** to restore all clips, paywalls, and user data instantly.

---

## 🔒 5. Optional Firebase / Cloud Storage Setup

If you wish to upgrade from local persistence to Google Cloud Storage or Firebase Firestore in the future:
1. Copy `.env.example` to `.env`.
2. Add your Firebase keys (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.).
3. The app will automatically connect to live cloud Firestore.
