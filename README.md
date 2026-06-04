# Serverless Project management Admin dashboard & Admin Dashboard

![Project management Admin dashboard Status](https://img.shields.io/badge/Status-Active-success)
![Architecture](https://img.shields.io/badge/Architecture-Serverless-blue)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Firebase%20%7C%20Tailwind-teal)

A beautiful, fully dynamic, and serverless Project management Admin dashboard dashboard built to let you manage and showcase your projects with ease. The project features a premium glassmorphism design, real-time updates, and a secure Admin panel.

## ✨ Features

### Public Project management Admin dashboard
- **Dynamic Categories**: Projects are categorized under dynamic sections (e.g., "Featured", "Recent") controlled entirely by the admin.
- **Glassmorphism Design**: Modern, premium aesthetics with blurred backgrounds, gradients, and subtle hover animations.
- **Responsive & Fast**: Fully responsive layout optimized for all screen sizes, built with React and Vite.
- **Real-time Synchronization**: Uses Firestore snapshot listeners to update the Project management Admin dashboard the instant a change is made by the admin.

### Secure Admin Dashboard
- **Authentication**: Protected `/admin` route requiring secure email/password login via Firebase Auth.
- **Project Management**: 
  - Add new projects with rich descriptions, external links, and tags.
  - Upload multiple high-resolution images directly to Firebase Cloud Storage.
  - Toggle project status (Active, Inactive, Completed).
- **Section Management**:
  - Create, rename, or delete project categories/sections.
  - Reorder sections to change how they appear on the main page.
  - Toggle visibility of entire sections instantly.

---

## 🏗️ Architecture

This project recently migrated from a hybrid PHP backend to a **100% Serverless Architecture** within the Firebase ecosystem, eliminating the need for external server hosting and simplifying deployment.

- **Frontend**: React.js, Vite, Tailwind CSS, React Router.
- **Database**: Firebase Firestore (NoSQL).
- **Storage**: Firebase Cloud Storage (Images/Media).
- **Backend API**: Firebase Cloud Functions (Node.js) handling REST operations and Admin validations.
- **Auth**: Firebase Authentication.

---

## 🚀 Setup & Deployment

### 1. Prerequisites
- Node.js (v18+)
- A Firebase Project (with Firestore, Storage, Auth, and Functions enabled).
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Environment Variables
Create a `.env` file in the `frontend` directory using the provided `frontend/.env.example` (if applicable) and populate your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Your deployed Cloud Functions Base URL
VITE_FUNCTIONS_URL=https://us-central1-your-project.cloudfunctions.net
```

### 3. Local Development

**Run the Backend (Firebase Emulators):**
```bash
cd backend/functions
npm install
npm run serve
```

**Run the Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Deployment

**Deploying the Backend (Firebase):**
From the `backend/` directory, deploy your security rules and Cloud Functions:
```bash
# Deploy security rules
firebase deploy --only firestore:rules,storage

# Deploy Cloud Functions
cd functions
npm run deploy
```

**Deploying the Frontend (Netlify/Vercel):**
Simply link your GitHub repository to Netlify or Vercel. 
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- *Make sure to add your `VITE_` variables into the environment variable settings of your hosting provider!*
