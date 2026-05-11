import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(firebaseConfig.firestoreDatabaseId || '(default)');

export const app = express();
const PORT = 3000;

// Export the app for serverless use
export { app as expressApp };

// Initialize Server
async function startServer() {
  // Ensure uploads directory exists (safe for serverless)
  const uploadsDir = path.join(process.cwd(), "uploads");
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {
    console.warn("Could not create uploads directory (expected in serverless):", e);
  }

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

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

  // Email Notification Bridge
  app.post("/api/notify/status", async (req, res) => {
    const { tracking_number, status, receiver_email, receiver_name, origin, destination } = req.body;
    
    if (!receiver_email) {
      return res.status(400).json({ error: "Receiver email is required" });
    }

    try {
      // Fetch SMTP settings from Firestore
      const settingsSnap = await db.collection("settings").doc("global").get();
      if (!settingsSnap.exists) {
        console.log("⚠️ Global settings not found in Firestore.");
        return res.status(500).json({ error: "SMTP settings not configured" });
      }

      const config = settingsSnap.data() as any;

      if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
        console.log("⚠️ SMTP settings incomplete in Firestore. Skipping email.");
        return res.status(500).json({ error: "SMTP settings incomplete" });
      }

      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: config.smtp_port === "465",
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });

      const mailOptions = {
        from: config.smtp_from || config.smtp_user,
        to: receiver_email,
        subject: `Package Update: ${tracking_number} is ${status}`,
        text: `Hello ${receiver_name || "Valued Customer"},\n\nYour package with tracking number ${tracking_number} is now ${status.toUpperCase()}.\n\nOrigin: ${origin || "Unknown"}\nDestination: ${destination || "Unknown"}\n\nThank you for choosing ${config.site_name || "Tokyo Express"}.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #1c1917;">Package Status Update</h2>
            <p>Hello <strong>${receiver_name || "Valued Customer"}</strong>,</p>
            <p>Your package with tracking number <span style="font-family: monospace; background: #f5f5f4; padding: 2px 4px; border-radius: 4px;">${tracking_number}</span> is now <strong>${status.toUpperCase()}</strong>.</p>
            <div style="background: #f5f5f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #78716c;">Origin: ${origin || "Unknown"}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #78716c;">Destination: ${destination || "Unknown"}</p>
            </div>
            <p>Thank you for choosing <strong>${config.site_name || "Tokyo Express"}</strong>.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${receiver_email} for package ${tracking_number}`);
      res.json({ message: "Email notification sent" });
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Settings File Upload
  app.post("/api/settings/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ filePath });
  });
  
  // Admin Password Reset Endpoint
  app.get("/api/settings", async (req, res) => {
    try {
      const settingsSnap = await db.collection("settings").doc("global").get();
      if (settingsSnap.exists) {
        res.json(settingsSnap.data());
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("❌ Failed to fetch settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Support email is required to trigger reset" });
    }

    try {
      const settingsSnap = await db.collection("settings").doc("global").get();
      if (!settingsSnap.exists) {
        return res.status(500).json({ error: "System settings not found" });
      }

      const config = settingsSnap.data() as any;

      if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
        return res.status(500).json({ error: "SMTP/Email settings incomplete in Admin Settings" });
      }

      const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: config.smtp_port === "465",
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });

      const resetLink = `https://${req.get('host')}/admin/forgot-password/reset?email=${encodeURIComponent(email)}`;

      const mailOptions = {
        from: config.smtp_from || config.smtp_user,
        to: email,
        subject: `[SECURE] Admin Password Reset Triggered`,
        text: `A password reset was triggered for the Admin account at ${config.site_name || 'Tokyo Express'}.\n\nPlease follow this link to reset your password: ${resetLink}\n\nIf you did not initiate this request, please investigate your system security.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 2px solid #ef4444; border-radius: 15px;">
            <h2 style="color: #ef4444; margin-top: 0;">Admin Security Alert</h2>
            <p style="color: #444; line-height: 1.6;">A system-wide admin password reset process has been initiated for <strong>${config.site_name || 'Tokyo Express'}</strong>.</p>
            <p style="color: #444; line-height: 1.6;">Click the button below to proceed with resetting your administrator credentials:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">RESET ADMIN PASSWORD</a>
            </div>
            <p style="font-size: 12px; color: #999;">Security warning: If you did not request this, please review your admin panel logs immediately.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: "Admin reset link sent successfully" });
    } catch (error) {
      console.error("❌ Reset password failed:", error);
      res.status(500).json({ error: "Failed to process reset request" });
    }
  });

  // Vite middleware for development
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

  if (process.env.NODE_ENV !== "test" && !process.env.NETLIFY_DEV && !process.env.FUNCTIONS_EVENT_NAME) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
}

startServer().catch(console.error);
