# 📔 My Diary

A full-stack personal diary web app where users can sign up, write daily entries, attach photos, and even type using their voice. Installable on your phone like a native app (PWA).

**🔗 Live Demo:** https://diary-app-one-phi.vercel.app

> Note: The backend runs on a free Render plan, so the first request after inactivity may take 30-60 seconds.

---

## ✨ Features

- 🔐 Secure signup and login with JWT authentication
- 📝 Create, view, edit and delete diary entries
- 📷 Photo upload with Cloudinary
- 🎙️ Voice typing to write entries by speaking
- 🌙 Light and dark mode
- 📱 Installable on mobile (Add to Home Screen)
- 🔒 Each user's entries are private

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Image Storage | Cloudinary |
| Auth | JSON Web Tokens (JWT) |
| Deployment | Vercel (frontend), Render (backend) |

## 📸 Screenshots

Add your screenshots here (create a `screenshots` folder in the repo):

| Login | Entries | Dark Mode |
|---|---|---|
| ![Login](screenshots/login.png) | ![Entries](screenshots/entries.png) | ![Dark](screenshots/dark.png) |

## 🚀 Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/vinotha1438/diary-app.git
cd diary-app
```

### 2. Setup the backend

```bash
cd server
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the server:

```bash
npm start
```

### 3. Setup the frontend

```bash
cd client
npm install
```

Create a `.env` file inside the client folder:

```env
VITE_API_URL=http://localhost:5000
```

Start the app:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 🌐 Deployment

- **Frontend:** Vercel (auto deploys on push to `main`)
- **Backend:** Render Web Service
- Set `CLIENT_URL` on Render to the Vercel production URL and `VITE_API_URL` on Vercel to the Render URL.

## 🔮 Future Improvements

- Mood tracker
- Search and tags for entries
- Export entries as PDF
- Daily reminder notifications

## 👩‍💻 Author

**Vinotha**
- GitHub: [@vinotha1438](https://github.com/vinotha1438)

---

⭐ If you like this project, give it a star!