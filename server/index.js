import express from 'express';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

function requireGroqConfig(res) {
  if (!GROQ_API_KEY) {
    res.status(500).json({ error: 'Missing GROQ_API_KEY. Add it to .env.local and restart the server.' });
    return false;
  }
  return true;
}

app.post('/api/groq/generate', async (req, res) => {
  if (!requireGroqConfig(res)) return;

  try {
    const { prompt } = req.body;
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json({ response: data.choices?.[0]?.message?.content || '' });
  } catch (err) {
    console.error('Groq generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groq/stream', async (req, res) => {
  if (!requireGroqConfig(res)) return;

  try {
    const { prompt } = req.body;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.write(`data: ${JSON.stringify({ error: `Groq error: ${response.status} ${errorText}` })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        try {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice(5).trim();
          if (!payload) continue;
          if (payload === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }

          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        } catch {
          // Ignore malformed stream lines.
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Groq stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

const dbPath = path.join(__dirname, 'chainguard.db');
const db = new Database(dbPath);

// Create table if fresh
db.exec(`
  CREATE TABLE IF NOT EXISTS simulations (
    id TEXT PRIMARY KEY, attack_type TEXT NOT NULL, scenario_name TEXT NOT NULL,
    risk_score INTEGER NOT NULL, nodes_affected INTEGER NOT NULL, gemini_summary TEXT,
    graph_snapshot TEXT, created_at TEXT NOT NULL, duration_seconds INTEGER DEFAULT 0,
    total_nodes INTEGER DEFAULT 0, attack_path TEXT DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS sbom_analyses (
    id TEXT PRIMARY KEY, sbom_content TEXT NOT NULL, gemini_analysis TEXT,
    critical_count INTEGER DEFAULT 0, high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0, created_at TEXT NOT NULL
  );
`);

// Graceful schema migration for existing instances
try { db.exec(`ALTER TABLE simulations ADD COLUMN total_nodes INTEGER DEFAULT 0`); } catch (e) { /* ignores if exists */ }
try { db.exec(`ALTER TABLE simulations ADD COLUMN attack_path TEXT DEFAULT '[]'`); } catch (e) { /* ignores if exists */ }

app.get('/api/simulations', (req, res) => {
  try {
    const { search, attack_type, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM simulations WHERE 1=1';
    const params = [];
    if (search) { query += ' AND (scenario_name LIKE ? OR attack_type LIKE ? OR gemini_summary LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (attack_type) { query += ' AND attack_type = ?'; params.push(attack_type); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const rows = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM simulations').get();
    res.json({ simulations: rows, total: total.count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/simulations', (req, res) => {
  try {
    const { id, attack_type, scenario_name, risk_score, nodes_affected, gemini_summary, graph_snapshot, duration_seconds, total_nodes, attack_path } = req.body;
    
    // Check for duplicate to prevent data collision and corruption
    const existing = db.prepare('SELECT id FROM simulations WHERE id = ?').get(id);
    if (existing) {
      return res.json({ success: true, id, message: 'Duplicate safely ignored' });
    }

    const created_at = new Date().toISOString();
    db.prepare(`INSERT INTO simulations (id, attack_type, scenario_name, risk_score, nodes_affected, gemini_summary, graph_snapshot, created_at, duration_seconds, total_nodes, attack_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, attack_type, scenario_name, risk_score, nodes_affected, gemini_summary, JSON.stringify(graph_snapshot), created_at, duration_seconds || 0, total_nodes || 0, JSON.stringify(attack_path || []));
    res.json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/simulations/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM simulations WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (row.graph_snapshot) row.graph_snapshot = JSON.parse(row.graph_snapshot);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/simulations/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM simulations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM simulations').get();
    const avgRisk = db.prepare('SELECT AVG(risk_score) as avg FROM simulations').get();
    const maxRisk = db.prepare('SELECT MAX(risk_score) as max FROM simulations').get();
    const byType = db.prepare('SELECT attack_type, COUNT(*) as count, AVG(risk_score) as avg_risk FROM simulations GROUP BY attack_type ORDER BY count DESC').all();
    const recent = db.prepare('SELECT id, created_at, scenario_name, attack_type, risk_score, nodes_affected, duration_seconds FROM simulations ORDER BY created_at DESC LIMIT 15').all();
    res.json({ total: total.count, avgRisk: avgRisk.avg || 0, maxRisk: maxRisk.max || 0, byType, recent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sbom', (req, res) => {
  try {
    const { id, sbom_content, gemini_analysis, critical_count, high_count, medium_count } = req.body;
    const created_at = new Date().toISOString();
    db.prepare(`INSERT INTO sbom_analyses (id, sbom_content, gemini_analysis, critical_count, high_count, medium_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, sbom_content, gemini_analysis, critical_count || 0, high_count || 0, medium_count || 0, created_at);
    res.json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ChainGuard API running on port ${PORT}`));
