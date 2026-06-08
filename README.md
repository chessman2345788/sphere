# SocialSphere - Premium Social Media Dashboard

SocialSphere is a feature-rich, high-aesthetic Social Media Dashboard application built using the MERN stack (MongoDB, Express, React, Node.js) with real-time Socket.IO communication and Redis for notification/message Pub/Sub and trending cache. It features full authentication, rich media uploads, interactive charts, and a content moderation panel.

---

## 🚀 Key Features

1. **Authentication & Session Security**
   - JWT Access tokens (15m expiry) and rotated long-lived Refresh tokens (7d expiry).
   - Password hashing via `bcryptjs`.
   - Role-based authorizations (`user` / `admin`).
2. **Social Feed & Interaction**
   - Infinite scroll social feed.
   - Post likes, shares/reposts, bookmarks/saved lists, and nested comments.
   - Auto-extracting hashtags (e.g. `#coding` becomes indexable).
3. **Real-Time Communication**
   - Peer-to-peer chats with online/offline indicators, typing bubbles, and read receipts.
   - Live system-wide push alerts (likes, comments, reposts, follows) using Redis Pub/Sub.
4. **Media Upload Integration**
   - Drag-and-drop media panel with file compression and preview.
   - Cloudinary integration for image and video hosting.
5. **Analytics & Mod Control Panels**
   - Dashboard stats (engagement rate, post counts, user listings) using Chart.js.
   - Admin Tab to delete posts, edit user roles, or purge user accounts entirely.
6. **Polished Splash Intro**
   - Clean, minimal, non-flashy startup loading screen with custom timing and transitions.

---

## 📁 Project Structure

```
sphere/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, Cloudinary, Socket.IO configurations
│   │   ├── controllers/     # MVC logic (auth, user, post, comment, chat, notif, analytics, admin)
│   │   ├── middleware/      # Auth security, upload memory, global error handlers
│   │   ├── models/          # Mongoose collections schemas
│   │   ├── routes/          # API route definitions
│   │   ├── utils/           # Token generation helpers
│   │   ├── app.js           # Express App setup
│   │   └── server.js        # Entry server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Common components (Navbar, Sidebar, PostCard, ProtectedRoute)
    │   ├── pages/           # Page containers (Login, Register, Feed, Profile, Chat, Analytics, Admin)
    │   ├── redux/           # Redux store and slices (auth, feed, chat, notification, admin)
    │   ├── utils/           # API request client, Socket connection manager
    │   ├── App.jsx          # Route structures
    │   ├── index.css        # Tailwind base styles and key shimmers
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🛠️ Configuration & Database Schemas

### 1. MongoDB Collections
- **User**: Hashed password, bio, location, avatar, cover image, skills/interests, and current active `refreshTokens` array (enables token rotation).
- **Post**: Text content, media details (image/video URL), likes list, original post reference (for reposting), and comments/shares counter.
- **Comment**: Reference to original post, parent comment reference (for infinite/nested replies tree), content, and likes.
- **Follower**: Unique composite index `{ follower: 1, following: 1 }` to handle relationships.
- **Message**: Sender, receiver, text, media, and read status markers (`isRead`, `readAt`).
- **Notification**: Target recipient, sender, event types (`like`, `comment`, `follow`, `repost`), and post/message/comment object IDs.
- **Analytics**: Historical date string (`YYYY-MM-DD`) storing aggregates like registration volume, platform interactions, and daily active user metrics.

### 2. Socket.IO Event Map
- **Connection Handshake**: Authenticates connection by reading JWT token from `socket.handshake.auth.token`.
- **Client to Server**:
  - `typing` / `stop_typing` with payload `{ receiverId }`.
- **Server to Client**:
  - `user_status` with payload `{ userId, status: 'online'|'offline' }`.
  - `new_message` delivering new direct message objects.
  - `messages_read` with payload `{ readerId }` to update ticks.
  - `typing` / `stop_typing` with payload `{ senderId }` to render bubbles.
  - `new_notification` to display pop-up alert items.

### 3. Redis Pub/Sub
- Subscribes to `notifications` and `chats` channels. 
- Distributes Socket emissions across multiple running servers.

---

## 💻 Installation & Quickstart

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally, or Atlas)
- Redis (running locally, or Redis Cloud)
- Cloudinary Account (optional, mock uploader operates by default)

### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Open .env and adjust MONGODB_URI and REDIS_URL if needed
npm run dev
```

### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎨 Design Theme System

Tailwind dark mode is configured using `class`. Base tokens are declared in `index.css`:
- **Light Theme**: `bg-slate-50 text-slate-900`
- **Dark Theme**: `bg-dark-950 text-slate-100` (deep slate aesthetics)
- **Primary Brand Theme**: Vibrant Indigo `#637eff` (with HSL shades)

---

## ☁️ Deployment Guidelines

### Backend (Render / Heroku)
1. Link your Github repo to **Render**.
2. Create a Web Service and select the `backend` folder as the root directory.
3. Configure the start command: `npm start`.
4. Add Environment variables:
   - `MONGODB_URI` (MongoDB Atlas Connection URI)
   - `REDIS_URL` (Redis Cloud Connection URI)
   - `JWT_SECRET` / `JWT_REFRESH_SECRET`
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
   - `FRONTEND_URL` (Vercel domain name)

### Frontend (Vercel)
1. Link the repository to **Vercel**.
2. Select the `frontend` folder as the root directory.
3. Vercel automatically detects Vite. Build settings: `npm run build` and output: `dist`.
4. Configure redirects in a `vercel.json` file inside `frontend/` to route all traffic to `/index.html` (resolves SPA reload 404s):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
