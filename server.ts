import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "creatorforge.db");
const db = new Database(dbPath);

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
    console.log("Seeding admin user...");
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      adminEmail,
      hashedPassword,
      "Admin User",
      "admin"
    );
    console.log("Admin user seeded.");
  } else {
    console.log("Admin user already exists.");
  }

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", true);
  app.use(express.json());
  app.use(session({
    name: "cf_session_id",
    secret: "creatorforge-super-secret-key-2026",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    }
  }));

  // Health check
  app.get("/api/health", (req, res) => {
    try {
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
      res.json({ status: "ok", database: "connected", users: userCount.count });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  app.get("/api/bcrypt-test", (req, res) => {
    const pass = "admin123";
    const hash = bcrypt.hashSync(pass, 10);
    const match = bcrypt.compareSync(pass, hash);
    res.json({ pass, hash, match });
  });

  app.get("/api/db-test", (req, res) => {
    try {
      db.exec("CREATE TABLE IF NOT EXISTS _test (id INTEGER PRIMARY KEY)");
      db.exec("INSERT INTO _test DEFAULT VALUES");
      const count = db.prepare("SELECT COUNT(*) as count FROM _test").get() as any;
      res.json({ success: true, count: count.count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google OAuth API
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "Google Client ID not configured" });
    }

    let baseUrl = process.env.APP_URL || 'http://localhost:3000';
    // Remove trailing slash if present to avoid double slashes
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    console.log("Constructed Google Redirect URI:", redirectUri);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account"
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, redirectUri });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code missing");

    try {
      let baseUrl = process.env.APP_URL || 'http://localhost:3000';
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      const redirectUri = `${baseUrl}/api/auth/google/callback`;
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      const tokens: any = await tokenResponse.json();
      if (!tokens.access_token) throw new Error("Failed to get access token");

      const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const googleUser: any = await userResponse.json();

      // Find or create user
      let user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(googleUser.email);
      if (!user) {
        // Create user with a random password since they use Google
        const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);
        const result = db.prepare("INSERT INTO users (email, password, name, profile_pic) VALUES (?, ?, ?, ?)").run(
          googleUser.email,
          randomPassword,
          googleUser.name,
          googleUser.picture
        );
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      }

      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;
      req.session.save(() => {
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      });
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      res.status(500).send("Authentication failed: " + error.message);
    }
  });

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
    let { email, password } = req.body;
    email = email?.trim();
    password = password?.trim();
    console.log(`Login attempt for: ${email}`);
    
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) {
        console.log(`User not found: ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (isMatch) {
        console.log(`Password match for: ${email}`);
        (req.session as any).userId = user.id;
        (req.session as any).role = user.role;
        
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ error: "Session save failed" });
          }
          console.log(`Session saved for: ${email}, userId: ${user.id}`);
          res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        });
      } else {
        console.log(`Password mismatch for: ${email}`);
        res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any).userId;
    console.log(`Auth check (/api/auth/me) - Session ID: ${req.sessionID}, User ID: ${userId}, Cookies: ${req.headers.cookie}`);
    
    if (userId) {
      const user: any = db.prepare("SELECT id, email, name, role, subscription_status FROM users WHERE id = ?").get(userId);
      if (user) {
        res.json({ user });
      } else {
        console.log(`User ID ${userId} in session but not found in DB`);
        res.status(401).json({ error: "User not found" });
      }
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/user/profile", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const { name } = req.body;
    try {
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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

  app.delete("/api/content/:id", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    
    const result = db.prepare("DELETE FROM content WHERE id = ? AND user_id = ?").run(id, userId);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Content not found or unauthorized" });
    }
  });

  app.get("/api/user/stats", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const totalAssets = db.prepare("SELECT COUNT(*) as count FROM content WHERE user_id = ?").get(userId) as any;
    const platformStats = db.prepare("SELECT platform, COUNT(*) as count FROM content WHERE user_id = ? GROUP BY platform").all(userId);
    const typeStats = db.prepare("SELECT type, COUNT(*) as count FROM content WHERE user_id = ? GROUP BY type").all(userId);
    
    res.json({
      totalAssets: totalAssets.count,
      platformStats,
      typeStats
    });
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
