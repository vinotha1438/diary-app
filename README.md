# 📔 Pakkam: A Personal Diary App

A full-stack diary app that looks and feels like a real notebook. Write entries through the day, add emojis in the middle of a sentence, attach photos, and flip back to any past day.

**🔗 Live demo:** [YOUR_VERCEL_LINK](YOUR_VERCEL_LINK)

> The backend runs on a free tier, so the first request after a break can take up to a minute. Please wait a little on the first login.

## Screenshots

| Login | Notebook |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Notebook](docs/screenshots/notebook.png) |

| Dark mode | Mobile |
|---|---|
| ![Dark mode](docs/screenshots/dark.png) | ![Mobile](docs/screenshots/mobile.png) |

## Features

- **Secure accounts**: signup and login with JWT authentication and bcrypt password hashing
- **Timeline entries**: write many small entries in one day, each saved with its own time
- **Emoji anywhere**: quick emoji bar plus a full emoji picker that inserts at the cursor
- **Your day in emojis**: the emojis you wrote are collected in order into a mood trail
- **Photo moments**: upload up to 4 photos per entry, compressed in the browser and shown as polaroids with a full-size viewer
- **Write for past days**: forgot to write yesterday? Open that page and pick the time it happened
- **Streaks and monthly pages**: see how consistently you write
- **Notebook design**: leather cover, spiral binding, ruled paper, handwriting fonts and day tabs
- **Dark mode** and a **responsive layout** for phones

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, emoji-picker-react, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas with Mongoose |
| Auth | JWT, bcryptjs |
| Deployment | Vercel (frontend), Render (backend) |

## How It Works

- Each user only sees their own entries; every entries route is protected by JWT middleware
- Photos are resized to a maximum of 900px in the browser before upload, which keeps requests small
- Dates and times are stored as timestamps, so a single entry can be placed on any past day

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in and receive a token |
| GET | `/api/entries` | Get all entries of the logged-in user |
| POST | `/api/entries` | Add an entry (optional date, photos) |
| PUT | `/api/entries/:id` | Edit an entry |
| DELETE | `/api/entries/:id` | Delete an entry |

## Run Locally

```bash
git clone https://github.com/vinotha1438/diary-app.git
cd diary-app
```

**Backend**

```bash
cd server
npm install
```

Create `server/.env` (see `.env.example`):

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_text
```

```bash
npm run dev
```

**Frontend** (new terminal)

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## What I Learned

- Building a REST API with Express and securing routes with JWT
- Designing MongoDB schemas and handling timestamps across days
- Compressing images in the browser before uploading
- Deploying a full-stack app: Vercel for the frontend, Render for the API, Atlas for the database

## Future Improvements

- PIN lock for extra privacy
- Voice-to-text entries in Tamil and English
- Search, tags and "On this day" memories
- Export diary as PDF

## Author

**Vinotha**: [GitHub](https://github.com/vinotha1438)