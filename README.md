<<<<<<< HEAD
# DRF Gemini Chatbot

A Django + React chatbot scaffold powered by the Google Gemini API.

## Architecture

- `backend/`: Django + Django REST Framework API
- `frontend/`: React + Vite chat UI
- Gemini calls stay on the backend so the API key is never exposed to the browser

## Quick Start

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Environment

### Backend

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `CORS_ALLOWED_ORIGINS`

### Frontend

- `VITE_API_BASE_URL`

## API

- `GET /api/health/`
- `GET /api/conversations/`
- `POST /api/conversations/`
- `GET /api/conversations/<uuid>/`
- `POST /api/conversations/<uuid>/messages/`

## Notes

- The default Gemini model is configurable through `GEMINI_MODEL`.
- The scaffold keeps conversation history in the database and only sends the recent transcript to Gemini.
- For production, swap SQLite for PostgreSQL and place secrets in your deployment environment.
=======
# ChatBot_Gemini
>>>>>>> 20c1d68a51476e13d8854431fa3b9beaa8e26dff
