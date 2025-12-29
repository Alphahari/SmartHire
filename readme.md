# 🚀 SmartHire – AI Interview Coach

SmartHire is an **AI-powered interview mentoring and assessment platform** designed to simulate real-world interviews using **audio, video, text, and coding-based evaluations**. It delivers personalized feedback, adaptive questioning, and detailed performance analytics to help candidates improve interview readiness.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Development Workflow](#-development-workflow)
- [API Endpoints](#-api-endpoints)
- [Testing & Validation](#-testing--validation)
- [Challenges & Limitations](#-challenges--limitations)
- [Future Scope](#-future-scope)
- [Contributors](#-contributors)
- [Acknowledgements](#-acknowledgements)
- [License](#-license)

---

## 🎯 Project Overview

**SmartHire** is a full-stack AI interview coaching system that leverages:

- Natural Language Processing (NLP)
- Deep Learning & Neural Networks
- Speech-to-Text (STT)
- Computer Vision
- Secure Code Execution

### Problems Addressed
- ❌ Generic mock interviews  
- ❌ Subjective feedback  
- ❌ No adaptive questioning  
- ❌ Incomplete interview simulations  

### Solution
SmartHire delivers **personalized, unbiased, and adaptive interview assessments** with real-time feedback and analytics.

---

## ✨ Key Features

### 🎙️ Multi-Modal Assessment
- **Audio**: Whisper AI + Gemini LLM for transcription & evaluation
- **Video**: OpenCV + MediaPipe for posture, gaze & emotion detection
- **Text**: NLP-based relevance and coherence analysis

### 💻 Coding Assessment
- Multi-language execution (Python, Java, C++)
- Docker-based sandboxed execution
- Automated test case validation

### 📊 Aptitude Testing
- MCQ-based aptitude rounds
- Auto scoring & progress tracking

### 🤖 AI-Powered Interviews
- Dynamic question generation
- Adaptive follow-ups
- Real-time scoring
- Final interview summary

### 📈 Analytics & Reporting
- Performance dashboards
- AI-generated monthly reports
- Exportable score reports (CSV)

---

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- React
- Tailwind CSS
- Chart.js

### Backend
- Flask (Python)
- Golang (Code Execution Server)
- Celery
- Redis

### AI / ML
- OpenAI Whisper (STT)
- Google Gemini (LLM)
- Sentence-BERT
- OpenCV & MediaPipe
- DeepFace

### Database
- PostgreSQL
- Redis

### Infrastructure
- Docker & Docker Compose
- AWS EC2 / RDS
- Vercel (Frontend)
- Railway (Backend)

---

## 📁 Project Structure

```text
SmartHire/
├── AI-Interview-Backend/
│   ├── app.py
│   ├── audio_module.py
│   ├── video_module.py
│   ├── session_manager.py
│   └── .env
├── ProctorX-executor/
│   ├── server.go
│   ├── utils.go
│   └── Dockerfiles/
├── server/
│   ├── app.py
│   ├── celery_worker.py
│   ├── models.py
│   ├── controllers/
│   ├── docker-compose.yml
│   └── .env
├── client-side/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── .env.local
├── tasks.json
├── LICENSE
└── README.md
````

---

## 📦 Installation & Setup

### Prerequisites

* Node.js 18+
* Python 3.10+
* Go 1.21+
* Docker & Docker Compose
* PostgreSQL 14+
* Redis 7+

---

## 🔧 Environment Variables

### AI-Interview-Backend/.env

```env
GOOGLE_API_KEY=your_gemini_api_key
```

### server/.env

```env
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:password@localhost/smarthire
JWT_SECRET_KEY=your_jwt_secret
REDIS_URL=redis://localhost:6379
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=noreply@smarthire.com
```

### ProctorX-executor/.env

```env
DOCKER_HOST=unix:///var/run/docker.sock
REDIS_HOST_ADDRESS=localhost:6379
SOURCE_MOUNT=/path/to/source
DESTINATION_MOUNT=/executions
```

### client-side/.env.local

```env
NEXT_PUBLIC_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5054
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

---

## 🚀 Running the Application

### Recommended (VS Code Tasks)

* `start-all`
* `start-services`

### Manual Startup

```bash
# Backend
cd server && python app.py

# AI Interview Backend
cd AI-Interview-Backend && python app.py

# Go Executor
cd ProctorX-executor && go run .

# Celery Worker
celery -A celery_worker.celery worker --loglevel=info

# Frontend
cd client-side && npm run dev
```

### Application Ports

| Service              | Port |
| -------------------- | ---- |
| Frontend             | 3000 |
| Main Backend         | 5000 |
| AI Interview Backend | 5054 |
| Go Executor          | 8080 |
| PostgreSQL           | 5432 |
| Redis                | 6379 |

---

## 🔄 Development Workflow

### Database Migration

```bash
flask db migrate -m "message"
flask db upgrade
```

### Docker Build (Code Executor)

```bash
docker build -f Dockerfile.python -t python_proctorx .
docker build -f Dockerfile.java -t java_proctorx .
docker build -f Dockerfile.cpp -t cpp_proctorx .
```

---

## 📚 Acknowledgements

* OpenAI Whisper
* Google Gemini
* MediaPipe
* OpenCV
* Flask & Next.js Communities

---

## 📄 License

MIT License – see the [LICENSE](LICENSE) file for full details.

---

### 🚀 Quick Start

```bash
git clone https://github.com/yourusername/SmartHire.git
cd SmartHire
docker-compose up -d
npm run dev
```

**SmartHire – Bridging the gap between interview theory and real-world performance through AI.**