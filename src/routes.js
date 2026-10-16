import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import { getDb } from './db.js';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET, 7);
const CODE_PATTERN = /^[0-9a-zA-Z]{4,12}$/;

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function buildRouter(BASE_URL) {
  const router = Router();

  router.post('/api/shorten', (req, res, next) => {
    try {
      const { longUrl } = req.body;
      if (!longUrl || typeof longUrl !== 'string' || !isValidHttpUrl(longUrl.trim())) {
        return res.status(400).json({ error: 'A valid http(s) URL is required' });
      }
      const cleanUrl = longUrl.trim();
      const db = getDb();

      const existing = db
        .prepare('SELECT code, long_url, clicks, created_at FROM urls WHERE long_url = ?')
        .get(cleanUrl);
      if (existing) {
        return res.status(200).json({
          shortCode: existing.code,
          shortUrl: `${BASE_URL}/${existing.code}`,
          longUrl: existing.long_url,
          clicks: existing.clicks,
          createdAt: existing.created_at,
          reused: true,
        });
      }

      let code;
      const insert = db.prepare(
        'INSERT INTO urls (code, long_url) VALUES (?, ?) RETURNING code, long_url, clicks, created_at'
      );
      for (let attempt = 0; attempt < 5; attempt += 1) {
        code = nanoid();
        try {
          const row = insert.get(code, cleanUrl);
          return res.status(201).json({
            shortCode: row.code,
            shortUrl: `${BASE_URL}/${row.code}`,
            longUrl: row.long_url,
            clicks: row.clicks,
            createdAt: row.created_at,
          });
        } catch (err) {
          if (!String(err.message).includes('UNIQUE')) throw err;
        }
      }
      return res.status(500).json({ error: 'Could not generate a unique code' });
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/urls', (req, res) => {
    const rows = getDb()
      .prepare('SELECT code, long_url, clicks, created_at FROM urls ORDER BY id DESC')
      .all();
    res.json(
      rows.map((row) => ({
        shortCode: row.code,
        shortUrl: `${BASE_URL}/${row.code}`,
        longUrl: row.long_url,
        clicks: row.clicks,
        createdAt: row.created_at,
      }))
    );
  });

  router.get('/api/urls/:code', (req, res) => {
    const { code } = req.params;
    if (!CODE_PATTERN.test(code)) {
      return res.status(400).json({ error: 'Invalid short code' });
    }
    const row = getDb()
      .prepare('SELECT code, long_url, clicks, created_at FROM urls WHERE code = ?')
      .get(code);
    if (!row) return res.status(404).json({ error: 'Short code not found' });
    res.json({
      shortCode: row.code,
      shortUrl: `${BASE_URL}/${row.code}`,
      longUrl: row.long_url,
      clicks: row.clicks,
      createdAt: row.created_at,
    });
  });

  router.get('/:code', (req, res) => {
    const { code } = req.params;
    if (!CODE_PATTERN.test(code)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const db = getDb();
    const row = db.prepare('SELECT long_url FROM urls WHERE code = ?').get(code);
    if (!row) return res.status(404).json({ error: 'Short code not found' });

    db.prepare('UPDATE urls SET clicks = clicks + 1 WHERE code = ?').run(code);
    res.redirect(302, row.long_url);
  });

  return router;
}
