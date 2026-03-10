import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("creatorforge.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    subscription_status TEXT DEFAULT 'free',
    profile_pic TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'thumbnail', 'title', 'script', 'hashtags'
    title TEXT,
    description TEXT,
    content_data TEXT, -- JSON blob for scripts/hashtags/etc
    image_url TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'published'
    platform TEXT, -- 'youtube', 'tiktok', 'instagram'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    account_name TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Add sample admin if not exists
const adminEmail = "admin@creatorforge.com";
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
    adminEmail,
    hashedPassword,
    "Admin User",
    "admin"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: "creatorforge-secret-key",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for secure cookies behind proxy
    cookie: {
      secure: true, // Always true for iframe compatibility
      sameSite: "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth API
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed: users.email")) {
        res.status(400).json({ error: "An account with this email already exists." });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && bcrypt.compareSync(password, user.password)) {
      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any).userId;
    if (userId) {
      const user: any = db.prepare("SELECT id, email, name, role, subscription_status FROM users WHERE id = ?").get(userId);
      res.json({ user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Content API
  app.get("/api/content", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const content = db.prepare("SELECT * FROM content WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json({ content });
  });

  app.post("/api/content", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { type, title, description, content_data, image_url, platform } = req.body;
    const result = db.prepare(`
      INSERT INTO content (user_id, type, title, description, content_data, image_url, platform)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, type, title, description, content_data, image_url, platform);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  // Payments API
  app.post("/api/payments/paypal-success", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { plan, orderId } = req.body;
    
    try {
      // In a real production app, you would verify the orderId with PayPal API here
      db.prepare("UPDATE users SET subscription_status = ? WHERE id = ?").run(plan, userId);
      res.json({ success: true, plan });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin API
  app.get("/api/admin/stats", (req, res) => {
    const role = (req.session as any).role;
    if (role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const contentCount = db.prepare("SELECT COUNT(*) as count FROM content").get() as any;
    const recentUsers = db.prepare("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5").all();
    
    res.json({
      totalUsers: userCount.count,
      totalContent: contentCount.count,
      recentUsers
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
