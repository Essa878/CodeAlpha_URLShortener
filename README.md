# CodeAlpha_URLShortener

A simple URL shortener built with **Express.js** and **SQLite** for the CodeAlpha Backend Development internship.

## Features

- `POST /api/shorten` — accepts a long URL and returns a unique short code/URL
- `GET /:code` — redirects a short URL to the original long URL (and counts clicks)
- `GET /api/urls` — lists all shortened URLs
- `GET /api/urls/:code` — returns details/click stats for a single short code
- Basic frontend to shorten URLs and view recent links
- Duplicate URLs reuse the existing short code

## Tech Stack

- Node.js + Express 5
- SQLite via `better-sqlite3`
- `nanoid` for short-code generation
- `dotenv` for configuration

## Getting Started

```bash
npm install
cp .env.example .env   # optional; sensible defaults are built in
npm start
```

Then open <http://localhost:3000>.

For auto-reload during development:

```bash
npm run dev
```

## API Examples

Create a short URL:

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://www.example.com/some/very/long/path"}'
```

Response:

```json
{
  "shortCode": "a1B2c3D",
  "shortUrl": "http://localhost:3000/a1B2c3D",
  "longUrl": "https://www.example.com/some/very/long/path",
  "clicks": 0,
  "createdAt": "2026-01-01 12:00:00"
}
```

Use the short URL: opening `http://localhost:3000/a1B2c3D` redirects to the original URL.

## Project Structure

```
CodeAlpha_URLShortener/
├── public/
│   └── index.html      # optional frontend
├── src/
│   ├── db.js           # SQLite setup
│   ├── routes.js       # API + redirect routes
│   └── server.js       # Express app entry point
├── .env.example
└── package.json
```

## License

MIT
