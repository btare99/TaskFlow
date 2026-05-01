# 🚀 TaskFlow - Next-Generation SaaS Task Management

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

TaskFlow is a high-performance, real-time SaaS platform designed to streamline team collaboration and task management. Built with a robust MERN stack and featuring a seamless drag-and-drop experience, TaskFlow empowers teams to organize, track, and execute projects with unprecedented efficiency.

---

## ✨ Core Features

### 🏢 Workspace & Collaboration
- **Dynamic Workspaces**: Create and manage multiple environments for different teams or projects.
- **Interactive Kanban Boards**: Advanced drag-and-drop task management powered by `@dnd-kit`.
- **Real-time Sync**: Instant updates across all clients using **Socket.io**.
- **User Dashboard**: Comprehensive overview of personal tasks, deadlines, and project health.

### 🔐 Security & Access
- **Multi-Auth System**: Secure login via JWT or **Google OAuth 2.0**.
- **Role-Based Access**: Granular control over workspace permissions and board visibility.
- **Protected API**: Rate-limited and secured endpoints using Helmet and custom middleware.

### 💰 Monetization & Growth
- **Stripe Integration**: Built-in subscription management and pricing plans.
- **Automated Emails**: Transactional emails and notifications via Nodemailer.
- **SEO Optimized Landing**: High-conversion landing page with modern aesthetics.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Zustand, DND-kit, Socket.io-client, React Router, React Hot Toast |
| **Backend** | Node.js, Express.js, Socket.io, Passport.js, Stripe SDK, Multer |
| **Database** | MongoDB (Mongoose), Atlas |
| **DevOps** | JWT, BcryptJS, Morgan, Helmet, Express-Rate-Limit |

---

## 📁 Project Structure

```text
taskflow/
├── backend/                # SaaS API Service
│   ├── models/             # Data Schemas (Task, Board, Workspace, User)
│   ├── routes/             # API Endpoints & Business Logic
│   ├── services/           # External Integrations (Stripe, Email)
│   ├── config/             # Passport & DB Configuration
│   └── server.js           # Real-time WebSocket & API Server
├── frontend/               # React Interface
│   ├── src/
│   │   ├── pages/          # Auth, Board, Dashboard, Landing, Pricing
│   │   ├── components/     # Reusable UI Elements
│   │   ├── store/          # Zustand State Management
│   │   └── services/       # API & Socket Clients
│   └── vite.config.js      # Build Optimization
└── .gitignore              # Multi-layer exclusion rules
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [MongoDB](https://www.mongodb.com/) account
- [Stripe](https://stripe.com/) Developer account (for payments)

### 1. Installation
```bash
git clone https://github.com/btare99/TaskFlow.git
cd taskflow
# Install dependencies for both parts
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup
Create a `.env` in the `backend/` directory based on the `.env.example` provided. Ensure you have your `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, and `GOOGLE_CLIENT_ID` ready.

### 3. Launch
**Start Development Servers:**
```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

---

## 🛡️ Security Note
This repository uses automated secret scanning. Ensure that no real secrets are committed. Use `.env` files for all sensitive credentials.

---

## 📜 License
Distributed under the MIT License.

---

<p align="center">
  Empowering productivity with <b>TaskFlow</b>.
</p>
