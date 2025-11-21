# WeCare

WeCare is a lightweight Express.js web application for booking nurses, managing patient appointments, and collecting patient feedback. It uses MongoDB (Mongoose) for persistence and EJS for server-side rendering.

## Tech stack

- Node.js + Express
- MongoDB (Mongoose)
- EJS templating
- express-session (with connect-mongo session store)
- Multer for file uploads
- Vanilla JavaScript for client interactivity

## Quick start (Windows PowerShell)

Prerequisites:
- Node.js (v16+ recommended)
- MongoDB (local or remote)

1. Install dependencies

```powershell
npm install
```

2. Create a `.env` file in the project root with the following variables (example):

```text
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/wecare
SESSION_SECRET=your_session_secret_here
```

3. Run the server

```powershell
node server.js
# or if package.json defines a start script
npm start
```

4. Open your browser

http://localhost:3000

## Key routes

- `/` - Home
- `/login` - Login page
- `/signup` - Sign up
- `/patientportal` - Patient dashboard (requires patient session)
- `/nurses` - Browse nurses
- `/booking` - Booking page (supports query param `?nurse=<id>` to prefill nurse)
- `/patient/prescriptions` - Prescriptions / rating page

## Environment variables

- `MONGODB_URI` - MongoDB connection string
- `PORT` - HTTP port (default 3000)
- `SESSION_SECRET` - Express session secret

## Addons

- `@vercel/speed-insights` may be optionally required; server will try to inject it if installed but will not fail if it's not available.

## Security & Git

- `.env` is included in `.gitignore`.
- If you previously committed sensitive secrets into git history, removing `.env` from the index (done via `git rm --cached .env`) only prevents future commits from including it. To fully remove it from git history you must rewrite history using tools such as `git filter-repo` or BFG. I can help with that if needed.

## Developer notes

- Views live in `views/` and are EJS templates.
- Public assets are in `public/` (styles in `public/css/`, scripts in `public/js/`).
- Models are in `models/` (User, Nurse, Appointment).
- Server entry point: `server.js`.

## Tests

There are no automated tests in this repo currently. You can manually test features by running the server and exercising UI flows.

## Troubleshooting

- "Server not starting" — check the console output, ensure `MONGODB_URI` is correct and MongoDB is reachable.
- "Static assets not loading" — ensure `app.use(express.static(path.join(__dirname, 'public')));` is present (it is by default).
- If you see template errors referencing missing variables, the route may not be supplying the expected data. Check the corresponding route handler in `server.js`.

## Next steps (optional enhancements)

- Add unit/integration tests
- Add CI configuration (GitHub Actions)
- Harden session cookies and add CSRF protection
- Add pagination and server-side filtering for `/nurses`

---

If you'd like I can also:
- Remove `.env` from git history (prepare `git filter-repo` or BFG commands)
- Add a `start` script to `package.json` if it's missing
- Add a small CONTRIBUTING.md
