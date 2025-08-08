# ProctorX - Comprehensive Quiz Management System

**Status: 🚧 In Progress**

**ProctorX** is a full-stack quiz application that provides a seamless experience for both students and administrators. Built with **Flask** and **Next.js (App Router)**, this system enables quiz creation, management, and performance analytics.

---

## ✨ Features

### 👩‍🎓 User Features
- Browse subjects, chapters, and quizzes
- Take **timed** quizzes with immediate feedback
- View historical quiz performance and analytics
- Get **daily reminders** and **monthly reports**
- Global search across subjects, chapters, and quizzes

### 👨‍💼 Admin Features
- Full CRUD for subjects, chapters, quizzes, and questions
- Analyze user performance, quiz engagement, and growth
- Export scores and analytics as CSV
- Monitor subject-level performance
- Full admin dashboard with real-time search

---

## 🧱 Technologies Used

### 🔙 Backend
- **Python Flask** – REST API framework
- **SQLAlchemy** – ORM
- **Celery + Redis** – Background task processing
- **SQLite** – Lightweight DB (easy to swap for PostgreSQL)
- **JWT** – Authentication and session management

### 🔜 Frontend (Migrated to Next.js)
- **Next.js 14+ (App Router)** – React framework
- **Tailwind CSS** – Utility-first CSS framework
- **Zustand** – Lightweight global state manager
- **Axios** – API client
- **ShadCN UI** – Headless accessible UI components
- **React Hook Form + Zod** – Form handling & validation

---

## 🚀 Installation

### 🔧 Prerequisites
- Python 3.9+
- Node.js 18+
- SQLite
- Redis
- Virtualenv (recommended)

---

## 🖥 Backend Setup (Flask)

1. Clone the repository and navigate to backend:
   ```bash
   git clone https://github.com/yourusername/ProctorX.git
   cd ProctorX/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   venv\Scripts\activate     # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env to include your config (see below)
   ```

5. Run database migrations (if using Alembic) or initialize manually.

---

## 🌐 Frontend Setup (Next.js App)

1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

---

## 🧵 Running the Application

Requires **4 terminals** (or use **supervisor** / **Docker Compose**)

### 1. Redis Server
```bash
redis-server
```

### 2. Celery Worker
```bash
cd backend
source venv/bin/activate
celery -A celery_worker.celery worker --loglevel=info
```

### 3. Celery Beat (for periodic tasks)
```bash
cd backend
source venv/bin/activate
celery -A celery_worker.celery beat --loglevel=info
```

### 4. Flask Server
```bash
cd backend
source venv/bin/activate
flask run
```

> On first run, the system auto-generates the admin account:
> - **Email:** `quizlytic.help@gmail.com`
> - **Password:** `adminpassword`

---

## 🔐 Environment Variables (`.env`)

| Variable Name         | Description                          |
|-----------------------|--------------------------------------|
| `SECRET_KEY`          | Flask secret                         |
| `DATABASE_URL`        | DB URL (e.g., `sqlite:///quiz.db`)   |
| `JWT_SECRET_KEY`      | JWT token secret                     |
| `REDIS_URL`           | Redis connection URL                 |
| `MAIL_SERVER`         | Email server (`smtp.gmail.com`)      |
| `MAIL_PORT`           | Mail port (587 for TLS)              |
| `MAIL_USE_TLS`        | TLS setting (`True`)                 |
| `MAIL_USERNAME`       | Sender email                         |
| `MAIL_PASSWORD`       | App password (if Gmail)              |
| `MAIL_DEFAULT_SENDER` | Default sender email                 |

---

## 🗂 Project Structure

```
ProctorX/
├── backend/                  # Flask backend
│   ├── controllers/          # REST API endpoints
│   ├── models/               # SQLAlchemy models
│   ├── celery_worker.py      # Celery config
│   ├── app.py                # Entry point
│   ├── .env                  # Environment config
│   └── requirements.txt      # Python deps
│
├── frontend/                 # Next.js frontend (App Router)
│   ├── app/                  # App router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── ...               # Other routes
│   ├── components/           # Reusable components
│   ├── lib/                  # API utils, helpers
│   ├── store/                # Zustand state management
│   ├── styles/               # Tailwind + global CSS
│   ├── public/               # Static assets
│   ├── tailwind.config.js    # Tailwind config
│   ├── tsconfig.json         # TypeScript config
│   └── package.json          # Node dependencies
│
└── README.md                 # This file
```

---

## 📊 Roadmap

- [x] Backend API for quiz operations
- [x] Admin and User roles with JWT auth
- [x] Email reminders via Celery
- [ ] 🌐 Migrate frontend to Next.js with App Router
- [ ] 📈 Admin dashboard with analytics
- [ ] ✅ Quiz timer + instant feedback
- [ ] 🔍 Global search across all content
- [ ] 📤 Export results and performance
- [ ] 🔔 Notification system (toasts + emails)

---

## 📄 License

MIT License – see the [LICENSE](LICENSE) file for full details.