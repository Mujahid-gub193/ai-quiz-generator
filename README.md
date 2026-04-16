# Online Learning Portal - AI Quiz Generator

Backend API for a learning portal where users can register, save study materials, generate quizzes from content, submit answers, and track progress.

## Run

1. Make sure PostgreSQL is running.
2. Confirm `.env` values are correct.
3. If you want real AI quiz generation, set `OPENAI_API_KEY` in `.env`.
3. Start the server:

```powershell
npm start
```

The API runs at:

```text
http://127.0.0.1:5002
```

If `OPENAI_API_KEY` is empty, the app uses the built-in local quiz generator fallback.

## Core Flow

1. Register a user
2. Login and copy the JWT token
3. Create a learning material
4. Generate a quiz from that material
5. Submit quiz answers
6. View dashboard progress

## API Testing

Use `Authorization: Bearer <token>` for protected routes.

### 1. Register

`POST /api/auth/register`

```json
{
  "name": "Mujahid",
  "email": "mujahid@example.com",
  "password": "password123"
}
```

### 2. Login

`POST /api/auth/login`

```json
{
  "email": "mujahid@example.com",
  "password": "password123"
}
```

### 3. Get Current User

`GET /api/auth/me`

### 4. Create Material

`POST /api/materials`

```json
{
  "title": "JavaScript Basics Note",
  "topic": "JavaScript Basics",
  "type": "note",
  "content": "JavaScript is a programming language used to build interactive web applications. Variables store values, functions group reusable logic, and arrays hold collections of items. Developers use conditionals and loops to control program flow. Understanding syntax, data types, and functions is essential for beginners.",
  "summary": "Introductory JavaScript note."
}
```

### 5. List Materials

`GET /api/materials`

### 6. Generate Quiz From Material

`POST /api/quizzes/generate`

```json
{
  "title": "JavaScript Basics Quiz",
  "topic": "JavaScript Basics",
  "materialId": 1,
  "questionCount": 5
}
```

### 7. Generate Quiz From Direct Text

`POST /api/quizzes/generate`

```json
{
  "title": "Physics Quiz",
  "topic": "Physics",
  "sourceText": "Physics studies matter, energy, force, and motion. Newton described laws of motion that explain how objects move and react to forces. Velocity measures speed with direction, while acceleration describes change in velocity over time.",
  "questionCount": 5
}
```

### 8. List Quizzes

`GET /api/quizzes`

### 9. Get Quiz By Id

`GET /api/quizzes/1`

### 10. Submit Quiz

`POST /api/quizzes/1/submit`

```json
{
  "answers": {
    "1": "javascript",
    "2": "functions",
    "3": "arrays",
    "4": "conditionals",
    "5": "syntax"
  }
}
```

### 11. List Attempts

`GET /api/quizzes/attempts`

### 12. Dashboard Overview

`GET /api/dashboard/overview`

### 13. Protected Test Route

`GET /api/test/protected`

## Main Files

- `server.js`: server startup
- `app.js`: Express app
- `config/`: env and DB config
- `models/`: Sequelize models
- `controllers/`: request handlers
- `routes/`: API route definitions
- `services/`: quiz generation and scoring
- `middleware/`: auth and error handling
