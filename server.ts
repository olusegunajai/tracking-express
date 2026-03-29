import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";

const app = express();
const PORT = 3000;
const db = new Database("tokyo_express.db");

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    origin TEXT,
    destination TEXT,
    distance REAL,
    estimated_time TEXT
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
    route_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(route_id) REFERENCES routes(id) ON DELETE SET NULL
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

  CREATE TABLE IF NOT EXISTS package_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER,
    status TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(package_id) REFERENCES packages(id) ON DELETE CASCADE
  );
`);

// Migration: Add route_id to packages if it doesn't exist
try {
  db.prepare("ALTER TABLE packages ADD COLUMN route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL").run();
} catch (e) {
  // Column already exists or other error
}

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
  db.prepare("INSERT INTO content (section, title, body) VALUES (?, ?, ?)").run(
    "features_title", 
    "Why Choose Tokyo Express?", 
    ""
  );
  db.prepare("INSERT INTO content (section, title, body) VALUES (?, ?, ?)").run(
    "feature_1", 
    "Global Reach", 
    "Connecting over 220 countries and territories with our extensive logistics network."
  );
  db.prepare("INSERT INTO content (section, title, body) VALUES (?, ?, ?)").run(
    "feature_2", 
    "Secure Handling", 
    "State-of-the-art security systems ensure your packages arrive safely and intact."
  );
  db.prepare("INSERT INTO content (section, title, body) VALUES (?, ?, ?)").run(
    "feature_3", 
    "Express Speed", 
    "Next-day delivery options for urgent shipments across major metropolitan areas."
  );
  
  // Initial settings
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("site_name", "Tokyo Express");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("contact_email", "support@tokyoexpress.com");
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

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
  const packages = db.prepare(`
    SELECT p.*, r.name as route_name 
    FROM packages p 
    LEFT JOIN routes r ON p.route_id = r.id 
    ORDER BY p.created_at DESC
  `).all();
  res.json(packages);
});

app.get("/api/packages/:tracking", (req, res) => {
  const pkg = db.prepare("SELECT * FROM packages WHERE tracking_number = ?").get(req.params.tracking);
  if (pkg) res.json(pkg);
  else res.status(404).json({ error: "Package not found" });
});

app.post("/api/packages", authenticate, (req, res) => {
  const { tracking_number, sender_name, receiver_name, origin, destination, status, weight, estimated_delivery, route_id } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO packages (tracking_number, sender_name, receiver_name, origin, destination, status, weight, estimated_delivery, route_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tracking_number, sender_name, receiver_name, origin, destination, status, weight, estimated_delivery, route_id || null);
    
    // Record initial status in history
    db.prepare("INSERT INTO package_history (package_id, status) VALUES (?, ?)").run(result.lastInsertRowid, status);
    
    res.status(201).json({ message: "Package created" });
  } catch (err) {
    res.status(400).json({ error: "Tracking number must be unique" });
  }
});

app.put("/api/packages/:id", authenticate, (req, res) => {
  const { sender_name, receiver_name, origin, destination, status, weight, estimated_delivery, route_id } = req.body;
  
  // Get current status to check for changes
  const currentPkg = db.prepare("SELECT status FROM packages WHERE id = ?").get(req.params.id) as any;
  
  db.prepare(`
    UPDATE packages SET sender_name = ?, receiver_name = ?, origin = ?, destination = ?, status = ?, weight = ?, estimated_delivery = ?, route_id = ?
    WHERE id = ?
  `).run(sender_name, receiver_name, origin, destination, status, weight, estimated_delivery, route_id || null, req.params.id);
  
  // Record in history if status changed
  if (currentPkg && currentPkg.status !== status) {
    db.prepare("INSERT INTO package_history (package_id, status) VALUES (?, ?)").run(req.params.id, status);
  }
  
  res.json({ message: "Package updated" });
});

app.get("/api/packages/:id/history", authenticate, (req, res) => {
  const history = db.prepare("SELECT * FROM package_history WHERE package_id = ? ORDER BY timestamp DESC").all(req.params.id);
  res.json(history);
});

app.delete("/api/packages/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM packages WHERE id = ?").run(req.params.id);
  res.json({ message: "Package deleted" });
});

app.post("/api/packages/bulk-delete", authenticate, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
  
  const stmt = db.prepare("DELETE FROM packages WHERE id = ?");
  const transaction = db.transaction((packageIds) => {
    for (const id of packageIds) stmt.run(id);
  });
  
  transaction(ids);
  res.json({ message: `${ids.length} packages deleted successfully` });
});

app.post("/api/packages/bulk-status", authenticate, (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
  if (!status) return res.status(400).json({ error: "status is required" });
  
  const updateStmt = db.prepare("UPDATE packages SET status = ? WHERE id = ?");
  const historyStmt = db.prepare("INSERT INTO package_history (package_id, status) VALUES (?, ?)");
  
  const transaction = db.transaction((packageIds, newStatus) => {
    for (const id of packageIds) {
      // Get current status to check for changes
      const currentPkg = db.prepare("SELECT status FROM packages WHERE id = ?").get(id) as any;
      if (currentPkg && currentPkg.status !== newStatus) {
        updateStmt.run(newStatus, id);
        historyStmt.run(id, newStatus);
      }
    }
  });
  
  transaction(ids, status);
  res.json({ message: `${ids.length} packages updated successfully` });
});

// Content CRUD
app.get("/api/content", (req, res) => {
  const content = db.prepare("SELECT * FROM content").all();
  res.json(content);
});

app.post("/api/content", authenticate, (req, res) => {
  const { section, title, body } = req.body;
  try {
    db.prepare("INSERT INTO content (section, title, body) VALUES (?, ?, ?)").run(section, title, body);
    res.status(201).json({ message: "Content created" });
  } catch (err) {
    res.status(400).json({ error: "Section name must be unique" });
  }
});

app.put("/api/content/:section", authenticate, (req, res) => {
  const { title, body } = req.body;
  db.prepare("UPDATE content SET title = ?, body = ? WHERE section = ?").run(title, body, req.params.section);
  res.json({ message: "Content updated" });
});

app.delete("/api/content/:section", authenticate, (req, res) => {
  db.prepare("DELETE FROM content WHERE section = ?").run(req.params.section);
  res.json({ message: "Content deleted" });
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

app.put("/api/routes/:id", authenticate, (req, res) => {
  const { name, origin, destination, distance, estimated_time } = req.body;
  db.prepare("UPDATE routes SET name = ?, origin = ?, destination = ?, distance = ?, estimated_time = ? WHERE id = ?").run(name, origin, destination, distance, estimated_time, req.params.id);
  res.json({ message: "Route updated" });
});

app.delete("/api/routes/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM routes WHERE id = ?").run(req.params.id);
  res.json({ message: "Route deleted" });
});

app.get("/api/routes/:id/packages", authenticate, (req, res) => {
  const packages = db.prepare("SELECT * FROM packages WHERE route_id = ?").all(req.params.id);
  res.json(packages);
});

app.get("/api/routes/:id/available-packages", authenticate, (req, res) => {
  const route = db.prepare("SELECT origin, destination FROM routes WHERE id = ?").get(req.params.id) as any;
  if (!route) return res.status(404).json({ error: "Route not found" });
  
  const packages = db.prepare(`
    SELECT * FROM packages 
    WHERE origin = ? AND destination = ? AND route_id IS NULL
  `).all(route.origin, route.destination);
  res.json(packages);
});

app.post("/api/routes/:id/packages/assign", authenticate, (req, res) => {
  const { packageIds } = req.body;
  if (!Array.isArray(packageIds)) return res.status(400).json({ error: "packageIds must be an array" });
  
  const stmt = db.prepare("UPDATE packages SET route_id = ? WHERE id = ?");
  const transaction = db.transaction((ids) => {
    for (const id of ids) stmt.run(req.params.id, id);
  });
  
  transaction(packageIds);
  res.json({ message: "Packages assigned successfully" });
});

app.delete("/api/routes/:id/packages/:packageId", authenticate, (req, res) => {
  db.prepare("UPDATE packages SET route_id = NULL WHERE id = ? AND route_id = ?").run(req.params.packageId, req.params.id);
  res.json({ message: "Package unassigned successfully" });
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

app.post("/api/settings/upload", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ filePath });
});

// Users CRUD
app.get("/api/users", authenticate, (req, res) => {
  const users = db.prepare("SELECT id, username, role FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticate, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hashedPassword, role);
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(400).json({ error: "Username already exists" });
  }
});

app.delete("/api/users/:id", authenticate, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
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
