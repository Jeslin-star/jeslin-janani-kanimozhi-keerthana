# AI StudyBuddy

AI assistant for smarter learning and study support — Node.js + Express + MongoDB
backend with JWT auth, RBAC, and Google Gemini AI for summaries, flashcards,
quizzes, and personalized study plans.

## Software Requirements
- Node.js v16+, npm v8+
- MongoDB (local or Atlas)
- Postman / Thunder Client
- VS Code (or similar)

## Project Structure
```
AI-STUDYBUDDY/
├── src/
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   └── materialController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Material.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   └── materials.js
│   └── utils/
│       ├── db.js
│       ├── gemini.js
│       └── tokens.js
├── uploads/
├── .env.example
├── .gitignore
├── index.js
├── package.json
└── README.md
```

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, GEMINI_API_KEY
npm run dev             # http://localhost:5000
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ name, email, password, role? }` |
| POST | `/api/auth/login` | Public | `{ email, password }` |

Both return `{ message, accessToken, refreshToken, user }`.

### Study Materials (`/api/materials`) — all require `Authorization: Bearer <accessToken>`
| Method | Route | Body |
|---|---|---|
| POST | `/api/materials/upload` | multipart form: `file` and/or `title`, `content` |
| GET | `/api/materials` | — |
| GET | `/api/materials/:id` | — |
| POST | `/api/materials/:id/summarize` | — |
| POST | `/api/materials/:id/flashcards` | — |
| POST | `/api/materials/:id/quiz` | — |
| POST | `/api/materials/:id/study-plan` | `{ goal, hoursPerDay, days }` |

### Admin (`/api/admin`) — requires an admin-role token
| Method | Route |
|---|---|
| GET | `/api/admin/users` |
| DELETE | `/api/admin/users/:id` |
| GET | `/api/admin/materials` |

## Notes on fixes applied to match the PDF's actual code
The source PDF had a few internal inconsistencies between its prose/install
commands and its code screenshots. To make the project actually runnable while
keeping every file's code identical to what was pictured, the following were
reconciled:
- **AI SDK package**: the install command lists `@google/genai`, but
  `src/utils/gemini.js` (as pictured) `require`s `@google/generative-ai`.
  `package.json` installs `@google/generative-ai` to match the code that
  actually runs.
- **`express-async-errors`**: `index.js` requires this package (it's what lets
  controllers `throw` errors instead of using try/catch) but it wasn't in the
  documented `npm install` line. It's included in `package.json`.
- **JWT secrets**: the `.env` example only lists `JWT_SECRET`, but
  `src/middleware/auth.js` reads `process.env.JWT_ACCESS_SECRET`, and issuing
  both an `accessToken` and `refreshToken` (as shown in the register/login
  Postman screenshots) implies a second secret. `.env.example` defines
  `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, generated in `src/utils/tokens.js`
  (not pictured in the PDF, but required for the auth flow shown to work).
