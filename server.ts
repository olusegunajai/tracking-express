import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3000;
const db = new Database("tokyo_express.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT UNIQUE,
    sender_name TEXT,
    receiver_name TEXT,
    origin TEXT,
    destination TEXT,
    status TEXT,
    weight REAL,
    estimated_delivery TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    origin TEXT,
    destination TEXT,
    distance REAL,
    estimated_time TEXT
  );

  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT UNIQUE,
    title TEXT,
    body TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
  
  // Initial content
  db.prepare("INSERT INTO content (section, title, body) VALUES (?, ?, ?)").run(
    "hero", 
    "Fast & Reliable Logistics", 
    "Tokyo Express provides seamless package delivery across the globe with real-time tracking."
  );
  
  // Initial settings
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("site_name", "Tokyo Express");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("contact_email", "support@tokyoexpress.com");
}

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "tokyo-secret-key";

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// API Routes
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, username: user.username } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Packages CRUD
app.get("/api/packages", (req, res) => {
  const packages = db.prepare("SELECT * FROM packages ORDER BY created_at DESC").all();
  res.json(packages);
});

app.get("/api/packages/:tracking", (req, res) => {
  const pkg = db.prepare("SELECT * FROM packages WHERE tracking_number = ?").get(req.params.tracking);
  if (pkg) res.json(pkg);
  else res.status(404).json({ error: "Package not found" });
});

app.post("/api/packages", authenticate, (req, res) => {
  const { tracking_number, sender_name, receiver_name, origin, destination, status, weight, estimated_delivery } = req.body;
  try {
    db.prepare(`
      INSERT INTO packages (tracking_number, sender_name, receiver_name, origin, destination, status, weight, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tracking_number, sender_name, receiver_name, origin, destination, status, weight, estimated_delivery);
    res.status(201).json({ message: "Package created" });
  } catch (err) {
    res.status(400).json({ error: "Tracking number must be unique" });
  }
});

app.put("/api/packages/:id", authenticate, (req, res) => {
  const { sender_name, receiver_name, origin, destination, status, weight, estimated_delivery } = req.body;
  db.prepare(`
    UPDATE packages SET sender_name = ?, receiver_name = ?, origin = ?, destination = ?, status = ?, weight = ?, estimated_delivery = ?
    WHERE id = ?
  `).run(sender_name, receiver_name, origin, destination, status, weight, estimated_delivery, req.params.id);
  res.json({ message: "Package updated" });
});

app.delete("/api/packages/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM packages WHERE id = ?").run(req.params.id);
  res.json({ message: "Package deleted" });
});

// Content CRUD
app.get("/api/content", (req, res) => {
  const content = db.prepare("SELECT * FROM content").all();
  res.json(content);
});

app.put("/api/content/:section", authenticate, (req, res) => {
  const { title, body } = req.body;
  db.prepare("UPDATE content SET title = ?, body = ? WHERE section = ?").run(title, body, req.params.section);
  res.json({ message: "Content updated" });
});

// Routes CRUD
app.get("/api/routes", (req, res) => {
  const routes = db.prepare("SELECT * FROM routes").all();
  res.json(routes);
});

app.post("/api/routes", authenticate, (req, res) => {
  const { name, origin, destination, distance, estimated_time } = req.body;
  db.prepare("INSERT INTO routes (name, origin, destination, distance, estimated_time) VALUES (?, ?, ?, ?, ?)").run(name, origin, destination, distance, estimated_time);
  res.status(201).json({ message: "Route created" });
});

// Settings CRUD
app.get("/api/settings", (req, res) => {
  const settings = db.prepare("SELECT * FROM settings").all();
  const settingsObj = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(settingsObj);
});

app.put("/api/settings", authenticate, (req, res) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
  }
  res.json({ message: "Settings updated" });
});

// Users CRUD
app.get("/api/users", authenticate, (req, res) => {
  const users = db.prepare("SELECT id, username, role FROM users").all();
  res.json(users);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
